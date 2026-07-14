/**
 * Sinh Playwright script từ steps_structured
 * Không cần AI, không tốn token
 */
function generateFromTemplate(testCase, runId) {
  const { title, base_url, steps_structured } = testCase;

  if (!Array.isArray(steps_structured) || steps_structured.length === 0) {
    throw new Error(`Cannot generate template: steps_structured is ${steps_structured === null ? 'null' : 'empty'}. Test case "${title}" has no automation steps configured.`);
  }

  const stepCode = [...steps_structured]
    .sort((a, b) => {
      // Fallback về index gốc nếu order không tồn tại — tránh NaN sort
      const orderA = (a.order !== undefined && a.order !== null) ? a.order : 0;
      const orderB = (b.order !== undefined && b.order !== null) ? b.order : 0;
      return orderA - orderB;
    })
    .map((step, index) => {
      const stepNum = index + 1;
      let code = '';

      const escapeJs = (s) => (s || '').replace(/\\"/g, '"').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const sel = escapeJs(step.selector);
      let val = escapeJs(step.value);
      let exp = escapeJs(step.expected);
      const pth = escapeJs(step.path);

      // Xử lý Macro Variables cho Data Dependency
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      if (val.includes('{{RANDOM_EMAIL}}')) val = val.replace('{{RANDOM_EMAIL}}', `test_${timestamp}@example.com`);
      if (val.includes('{{RANDOM_TEXT}}')) val = val.replace('{{RANDOM_TEXT}}', `text_${randomStr}`);
      if (val.includes('{{TIMESTAMP}}')) val = val.replace('{{TIMESTAMP}}', `${timestamp}`);

      if (exp.includes('{{RANDOM_EMAIL}}')) exp = exp.replace('{{RANDOM_EMAIL}}', `test_${timestamp}@example.com`);
      if (exp.includes('{{RANDOM_TEXT}}')) exp = exp.replace('{{RANDOM_TEXT}}', `text_${randomStr}`);
      if (exp.includes('{{TIMESTAMP}}')) exp = exp.replace('{{TIMESTAMP}}', `${timestamp}`);

      switch (step.action) {
        case 'goto': {
          // Fix docker networking to access localhost on host machine
          const isDockerGoto = process.env.RUNNING_IN_DOCKER === 'true';
          const rawGotoUrl = (base_url || '') + (step.path || '');
          const dockerSafeUrl = isDockerGoto
            ? rawGotoUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal')
            : rawGotoUrl;
          // Local URLs (localhost/127.0.0.1) dùng timeout dài hơn vì app có thể cần warm-up
          const isLocalUrl = dockerSafeUrl.includes('localhost') || dockerSafeUrl.includes('127.0.0.1') || dockerSafeUrl.includes('host.docker.internal');
          const gotoTimeout = isLocalUrl ? 30000 : 15000;
          code = `await page.goto("${escapeJs(dockerSafeUrl)}", { timeout: ${gotoTimeout}, waitUntil: 'domcontentloaded' });\n    await page.waitForTimeout(800);`;
          break;
        }
        case 'fill':
          if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            code = `await highlight("${sel}", "Chọn ngày: ${val}");\n    await page.fill("${sel}", "${val}", { timeout: 5000 });\n    await page.waitForTimeout(200);`;
          } else {
            // page.fill() triggers full input/change/focus events — đủ cho React controlled inputs
            // pressSequentially chỉ dùng làm fallback vì đôi khi React cần key events
            code = `await highlight("${sel}", "Gõ: ${val}");\n    await page.fill("${sel}", "${val}", { timeout: 5000 });\n    await page.dispatchEvent("${sel}", 'input');\n    await page.dispatchEvent("${sel}", 'change');\n    await page.waitForTimeout(300);`;
          }
          break;
        case 'click':
          code = `await highlight("${sel}", "Click");\n    await page.click("${sel}", { timeout: 5000 });\n    await page.waitForTimeout(1000);`;
          break;
        case 'wait_for':
          code = `await page.waitForSelector("${sel}", { timeout: 5000 });`;
          break;
        case 'select':
          code = `await highlight("${sel}", "Chọn: ${val}");\n    await page.selectOption("${sel}", "${val}", { timeout: 5000 });\n    await page.waitForTimeout(500);`;
          break;
        case 'expect_url': {
          const isDockerExpect = process.env.RUNNING_IN_DOCKER === 'true';
          // Use raw (unescaped) values for URL construction, then escape the final result for embedding in JS string
          const rawExp = step.expected || '';
          const rawBaseUrl = base_url || '';
          let fullExpectedUrl = rawExp;
          if (!fullExpectedUrl.startsWith('http://') && !fullExpectedUrl.startsWith('https://')) {
            fullExpectedUrl = rawBaseUrl.replace(/\/$/, '') + '/' + rawExp.replace(/^\//, '');
          }
          const dockerSafeExpectUrl = isDockerExpect
            ? fullExpectedUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal')
            : fullExpectedUrl;
          const safeExpectUrl = escapeJs(dockerSafeExpectUrl);
          code = `await expect(page).toHaveURL("${safeExpectUrl}", { timeout: 10000, message: "Lỗi URL: Trang hiện tại không khớp. Bạn có quên bước Đăng nhập không?" });`;
          break;
        }
        case 'expect_text':
          code = `await highlight("${sel}", "Check Text: ${exp}");\n    await expect(page.locator("${sel}"), "Lỗi Text: Không tìm thấy nội dung. Giao diện có thể bị sai hoặc chưa Đăng nhập.").toContainText("${exp}", { timeout: 5000 });`;
          break;
        case 'expect_visible':
          code = `await highlight("${sel}", "Check Visible");\n    await expect(page.locator("${sel}"), "Lỗi Hiển thị: Không thấy element. Giao diện có thể bị sai hoặc chưa Đăng nhập.").toBeVisible({ timeout: 5000 });`;
          break;
        case 'expect_hidden':
          code = `await expect(page.locator("${sel}")).toBeHidden({ timeout: 5000 });`;
          break;
        default:
          code = `// [UNKNOWN ACTION] ${step.action}`;
      }

      const autoScreenshot = ['goto', 'click', 'fill', 'select', 'expect_url', 'expect_text', 'expect_visible', 'expect_hidden'].includes(step.action)
        ? `\n    await page.screenshot({ path: 'step-${stepNum}-after.png' });`
        : '';

      const stepDesc = escapeJs(step.description || step.action);
      return `  // Step ${stepNum}
  await test.step("${stepDesc}", async () => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: ${index}, title: "${stepDesc}" })); } catch(e){}
    }
    ${code}${autoScreenshot}
  });`;
    })
    .join('\n\n');

  return `
const { test, expect } = require('@playwright/test');
const WebSocket = require('ws');

test("${title}", async ({ page }) => {
  // Auto-generated by DevTrack Template Engine
  // Generated at: ${new Date().toISOString()}

  // Setup CDP Screencast WebSocket Stream
  const wsUrl = process.env.WS_URL || "ws://localhost:4001";
  const ws = new WebSocket(\`\${wsUrl}/?runId=${runId}&role=provider\`);
  
  // Wait for WebSocket to be fully connected before starting CDP screencast
  // This prevents early frames from being silently dropped
  await new Promise((resolve) => {
    if (ws.readyState === WebSocket.OPEN) return resolve();
    ws.on('open', resolve);
    ws.on('error', (e) => { console.warn('[WS] Screencast connection failed, continuing without live stream:', e.message); resolve(); });
    setTimeout(resolve, 3000); // Safety timeout
  });

  const client = await page.context().newCDPSession(page);
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 50, everyNthFrame: 1 });
  client.on('Page.screencastFrame', async (frameObject) => {
      if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'frame', data: frameObject.data }));
      }
      try { await client.send('Page.screencastFrameAck', { sessionId: frameObject.sessionId }); } catch(e){}
  });

  // Buffer wait: cho frontend client WS kịp kết nối trước khi bắt đầu các step
  // Cần ít nhất 1 polling cycle (2s) + WS handshake để frontend kịp connect
  await page.waitForTimeout(3000);

  // Inject a highlighter function
  async function highlight(selector, text) {
    try {
      await page.evaluate(({sel, txt}) => {
        const el = document.querySelector(sel);
        if (el) {
          document.querySelectorAll('.playwright-highlight').forEach(e => e.remove());
          const rect = el.getBoundingClientRect();
          const box = document.createElement('div');
          box.className = 'playwright-highlight';
          box.style.position = 'absolute';
          box.style.border = '3px solid red';
          box.style.boxShadow = '0 0 15px red';
          box.style.top = (rect.top + window.scrollY - 4) + 'px';
          box.style.left = (rect.left + window.scrollX - 4) + 'px';
          box.style.width = (rect.width + 8) + 'px';
          box.style.height = (rect.height + 8) + 'px';
          box.style.zIndex = '999999';
          box.style.pointerEvents = 'none';
          
          const tooltip = document.createElement('div');
          tooltip.style.position = 'absolute';
          tooltip.style.background = 'red';
          tooltip.style.color = 'white';
          tooltip.style.padding = '4px 8px';
          tooltip.style.fontSize = '12px';
          tooltip.style.top = '-25px';
          tooltip.style.left = '0';
          tooltip.style.borderRadius = '4px';
          tooltip.style.fontWeight = 'bold';
          tooltip.innerText = txt;
          box.appendChild(tooltip);
          
          document.body.appendChild(box);
        }
      }, { sel: selector, txt: text });
      await page.waitForTimeout(400);
    } catch(e) {}
  }

${stepCode}

  // Close WS at the end
  try { ws.close(); } catch(e){}
});
  `.trim();
}

module.exports = { generateFromTemplate };