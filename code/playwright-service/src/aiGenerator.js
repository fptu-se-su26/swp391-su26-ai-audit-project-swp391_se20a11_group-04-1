const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

async function generateWithAI(testCase) {
  console.log(`[AI Generator] Gọi Claude API cho "${testCase.title}"...`);

  const prompt = `
Bạn là Playwright test automation engineer.
Viết một Playwright test script hoàn chỉnh và chạy được.

Test case: ${testCase.title}
Base URL: ${testCase.base_url}
Expected result: ${testCase.expected_result}

Các bước:
${Array.isArray(testCase.steps_structured) && testCase.steps_structured.length > 0 ? testCase.steps_structured.map((s, i) => `${i + 1}. ${s.description}`).join('\n') : '(No steps defined)'}

Yêu cầu bắt buộc:
- Dùng @playwright/test (const { test, expect } = require('@playwright/test'))
- BẮT BUỘC: Trước mỗi thao tác quan trọng, bạn phải chèn dòng code này để báo cáo tiến độ về frontend:
  try { if (typeof ws !== 'undefined' && ws.readyState === 1) { ws.send(JSON.stringify({ type: 'step_started', stepIndex: INDEX_CỦA_BƯỚC, title: 'Mô tả ngắn gọn thao tác' })); } } catch(e){}
- Đảm bảo INDEX_CỦA_BƯỚC tăng dần từ 0.
- Sau mỗi action quan trọng: await page.screenshot({ path: 'step-N.png' })
- Timeout cho waitForSelector: 5000ms
- Chỉ trả về JavaScript code thuần, KHÔNG có markdown, KHÔNG có giải thích
  `.trim();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  // Bỏ markdown fence nếu AI trả về có bọc
  const script = message.content[0].text
    .replace(/^```javascript\n?/m, '')
    .replace(/^```js\n?/m, '')
    .replace(/^```\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();

  return script;
}

module.exports = { generateWithAI };