// Simulate templateEngine với đúng steps từ test case
const steps = [
  { order: 1, action: "goto", path: "", description: "goto" },
  { order: 2, action: "fill", selector: "#usernameOrEmail", value: "admin@test.com", description: "fill (#usernameOrEmail)" },
  { order: 3, action: "fill", selector: "#password", value: "password123", description: "fill (#password)" },
  { order: 4, action: "click", selector: 'button[type="submit"]', description: "click button[type=\"submit\"]" },
  { order: 5, action: "expect_url", expected: "/dashboard", description: "expect_url" },
  { order: 6, action: "click", selector: "div.w-8\\/9.rounded-full", description: "click div.w-8/9.rounded-full" },
  { order: 7, action: "expect_url", expected: "/projects/new", description: "expect_url" }
];

const base_url = "http://localhost:5173";
const title = "create project";
const runId = "84-84";

const stepCode = [...steps].sort((a,b) => a.order - b.order).map((step, index) => {
  const stepNum = index + 1;
  let code = '';
  const sel = (step.selector || '').replace(/"/g, '\\"');
  let val = (step.value || '').replace(/"/g, '\\"');
  let exp = (step.expected || '').replace(/"/g, '\\"');
  const pth = (step.path || '').replace(/"/g, '\\"');

  switch(step.action) {
    case 'goto':
      code = `await page.goto("${base_url + pth}", { timeout: 15000 });\n    await page.waitForTimeout(800);`;
      break;
    case 'fill':
      code = `await highlight("${sel}", "Go: ${val}");\n    await page.fill("${sel}", "", { timeout: 5000 });\n    await page.locator("${sel}").pressSequentially("${val}", { delay: 50, timeout: 5000 });\n    await page.waitForTimeout(200);`;
      break;
    case 'click':
      code = `await highlight("${sel}", "Click");\n    await page.click("${sel}", { timeout: 5000 });\n    await page.waitForTimeout(500);`;
      break;
    case 'expect_url':
      code = `await expect(page, "Loi URL").toHaveURL("${base_url + exp}", { timeout: 5000 });`;
      break;
  }
  
  const autoScreenshot = ['click','fill','expect_url'].includes(step.action) 
    ? `\n    await page.screenshot({ path: 'step-${stepNum}-after.png' });` 
    : '';
  const stepDesc = (step.description || step.action).replace(/"/g, '\\"');
  
  return `  await test.step("${stepDesc}", async () => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: ${index} })); } catch(e){}
    }
    ${code}${autoScreenshot}
  });`;
}).join('\n\n');

console.log("=== GENERATED stepCode ===");
console.log(stepCode);
console.log("=== END ===");

// Check syntax của full script
const fullScript = `
const { test, expect } = require('@playwright/test');
const WebSocket = require('ws');
test("${title}", async ({ page }) => {
  const wsUrl = process.env.WS_URL || "ws://localhost:4001";
  const ws = new WebSocket(\`\${wsUrl}/?runId=${runId}&role=provider\`);
  await new Promise((resolve) => {
    ws.on('error', () => resolve());
    ws.on('open', resolve);
    setTimeout(resolve, 3000);
  });
  async function highlight(selector, text) {}
${stepCode}
  ws.close();
});
`.trim();

try {
  require('vm').Script && new require('vm').Script(fullScript);
  console.log("\n✅ Full script syntax OK");
} catch(e) {
  console.log("\n❌ Full script SYNTAX ERROR:", e.message);
  // Find the line with error
  const lines = fullScript.split('\n');
  lines.forEach((line, i) => {
    console.log(`${i+1}: ${line}`);
  });
}
