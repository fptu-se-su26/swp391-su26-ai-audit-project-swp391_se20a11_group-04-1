# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: temp\91\test.spec.js >> Tạo dự án mới thành công
- Location: temp\91\test.spec.js:4:1

# Error details

```
Error: Lỗi Text: Không tìm thấy nội dung. Giao diện có thể bị sai hoặc chưa Đăng nhập.

expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "jhhjkjh"
Received string:    "My Projects"
Timeout: 5000ms

Call log:
  - Lỗi Text: Không tìm thấy nội dung. Giao diện có thể bị sai hoặc chưa Đăng nhập. with timeout 5000ms
  - waiting for locator('h1')
    14 × locator resolved to <h1 class="text-3xl font-extrabold text-on-surface tracking-tight">My Projects</h1>
       - unexpected value "My Projects"

```

```yaml
- heading "My Projects" [level=1]
```

# Test source

```ts
  100 |     await page.locator("#password").pressSequentially("111111", { delay: 50, timeout: 5000 });
  101 |     await page.waitForTimeout(200);
  102 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-3-after.png' });
  103 |   });
  104 | 
  105 |   // Step 4
  106 |   await test.step("Click nút đăng nhập", async () => {
  107 |     if (ws.readyState === WebSocket.OPEN) {
  108 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 3 })); } catch(e){}
  109 |     }
  110 |     await highlight("button[type='submit']", "Click");
  111 |     await page.click("button[type='submit']", { timeout: 5000 });
  112 |     await page.waitForTimeout(500);
  113 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-4-after.png' });
  114 |   });
  115 | 
  116 |   // Step 5
  117 |   await test.step("Kiểm tra redirect về Dashboard", async () => {
  118 |     if (ws.readyState === WebSocket.OPEN) {
  119 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 4 })); } catch(e){}
  120 |     }
  121 |     await expect(page, "Lỗi URL: Trang hiện tại không khớp. Bạn có quên bước Đăng nhập không?").toHaveURL("http://localhost:5173/dashboard", { timeout: 5000 });
  122 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-5-after.png' });
  123 |   });
  124 | 
  125 |   // Step 6
  126 |   await test.step("Click nút Create Project", async () => {
  127 |     if (ws.readyState === WebSocket.OPEN) {
  128 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 5 })); } catch(e){}
  129 |     }
  130 |     await highlight("button:has-text('Create Project')", "Click");
  131 |     await page.click("button:has-text('Create Project')", { timeout: 5000 });
  132 |     await page.waitForTimeout(500);
  133 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-6-after.png' });
  134 |   });
  135 | 
  136 |   // Step 7
  137 |   await test.step("Nhập tên dự án", async () => {
  138 |     if (ws.readyState === WebSocket.OPEN) {
  139 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 6 })); } catch(e){}
  140 |     }
  141 |     await highlight("#projName", "Gõ: huncu");
  142 |     await page.fill("#projName", "", { timeout: 5000 });
  143 |     await page.locator("#projName").pressSequentially("huncu", { delay: 50, timeout: 5000 });
  144 |     await page.waitForTimeout(200);
  145 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-7-after.png' });
  146 |   });
  147 | 
  148 |   // Step 8
  149 |   await test.step("Nhập chuyên ngành", async () => {
  150 |     if (ws.readyState === WebSocket.OPEN) {
  151 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 7 })); } catch(e){}
  152 |     }
  153 |     await highlight("#projMajor", "Gõ: Software Engineering");
  154 |     await page.fill("#projMajor", "", { timeout: 5000 });
  155 |     await page.locator("#projMajor").pressSequentially("Software Engineering", { delay: 50, timeout: 5000 });
  156 |     await page.waitForTimeout(200);
  157 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-8-after.png' });
  158 |   });
  159 | 
  160 |   // Step 9
  161 |   await test.step("Nhập hạn chót", async () => {
  162 |     if (ws.readyState === WebSocket.OPEN) {
  163 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 8 })); } catch(e){}
  164 |     }
  165 |     await highlight("#projDeadline", "Chọn ngày: 2026-08-30");
  166 |     await page.fill("#projDeadline", "2026-08-30", { timeout: 5000 });
  167 |     await page.waitForTimeout(200);
  168 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-9-after.png' });
  169 |   });
  170 | 
  171 |   // Step 10
  172 |   await test.step("Nhập mô tả dự án", async () => {
  173 |     if (ws.readyState === WebSocket.OPEN) {
  174 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 9 })); } catch(e){}
  175 |     }
  176 |     await highlight("#projDesc", "Gõ: Đây là dự án test tự động bởi DevTrack AI");
  177 |     await page.fill("#projDesc", "", { timeout: 5000 });
  178 |     await page.locator("#projDesc").pressSequentially("Đây là dự án test tự động bởi DevTrack AI", { delay: 50, timeout: 5000 });
  179 |     await page.waitForTimeout(200);
  180 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-10-after.png' });
  181 |   });
  182 | 
  183 |   // Step 11
  184 |   await test.step("Click nút Create Project trong modal", async () => {
  185 |     if (ws.readyState === WebSocket.OPEN) {
  186 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 10 })); } catch(e){}
  187 |     }
  188 |     await highlight("button[type='submit']:has-text('Create Project')", "Click");
  189 |     await page.click("button[type='submit']:has-text('Create Project')", { timeout: 5000 });
  190 |     await page.waitForTimeout(500);
  191 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-11-after.png' });
  192 |   });
  193 | 
  194 |   // Step 12
  195 |   await test.step("expect_text", async () => {
  196 |     if (ws.readyState === WebSocket.OPEN) {
  197 |       try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: 11 })); } catch(e){}
  198 |     }
  199 |     await highlight("h1", "Check Text: jhhjkjh");
> 200 |     await expect(page.locator("h1"), "Lỗi Text: Không tìm thấy nội dung. Giao diện có thể bị sai hoặc chưa Đăng nhập.").toContainText("jhhjkjh", { timeout: 5000 });
      |                                                                                                                         ^ Error: Lỗi Text: Không tìm thấy nội dung. Giao diện có thể bị sai hoặc chưa Đăng nhập.
  201 |     await page.screenshot({ path: 'D:\\FPTU\\semeter_5\\DevTrackAI\\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\\code\\playwright-service\\temp\\91\\screenshots\\step-12-after.png' });
  202 |   });
  203 | 
  204 |   // Close WS at the end
  205 |   try { ws.close(); } catch(e){}
  206 | });
```