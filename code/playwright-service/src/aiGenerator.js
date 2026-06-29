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
${testCase.steps_structured.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

Yêu cầu bắt buộc:
- Dùng @playwright/test (const { test, expect } = require('@playwright/test'))
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