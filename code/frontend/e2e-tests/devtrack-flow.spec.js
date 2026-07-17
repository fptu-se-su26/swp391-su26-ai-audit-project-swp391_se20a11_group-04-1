import { test, expect } from '@playwright/test';
import path from 'path';

// Helper function to select an option by a substring of its visible text, waiting for it to load
async function selectOptionBySubstring(page, selectSelector, substring) {
  const selectLocator = page.locator(selectSelector);
  
  // 1. Chờ cho thẻ select xuất hiện trên giao diện
  await selectLocator.waitFor({ state: 'visible', timeout: 10000 });

  // 2. Chờ cho đến khi có ít nhất một option chứa substring xuất hiện (tránh API chậm)
  await expect(async () => {
    const hasMatch = await selectLocator.evaluate((select, text) => {
      return Array.from(select.options).some(opt => opt.text.includes(text));
    }, substring);
    expect(hasMatch).toBe(true);
  }).toPass({ timeout: 10000 });

  // 3. Lấy value của option khớp với substring
  const value = await selectLocator.evaluate((select, text) => {
    const option = Array.from(select.options).find(opt => opt.text.includes(text));
    return option ? option.value : null;
  }, substring);
  
  if (value) {
    await selectLocator.selectOption(value);
  } else {
    throw new Error(`Option containing "${substring}" not found in select "${selectSelector}"`);
  }
}

// Variables with timestamps to prevent duplicate data issues
const timestamp = Date.now();
const projectTitle = `Project E2E - ${timestamp}`;
const reqCode = `REQ-${timestamp}`;
const reqTitle = `Yêu cầu hệ thống đăng nhập - ${timestamp}`;
const useCaseTitle = `Use Case Đăng nhập Email - ${timestamp}`;
const sprintTitle = `Sprint 1 - Phát triển Auth - ${timestamp}`;
const taskTitle = `Task Thiết kế API Login - ${timestamp}`;
const bugTitle = `Bug không hiển thị nút Submit - ${timestamp}`;

// Thư mục lưu ảnh minh chứng
const evidenceDir = 'test-results/evidence';

test.describe('DevTrack E2E Test Suite', () => {

  test('Kiểm thử luồng liên thông 5 chức năng: Requirement -> Use Case -> Sprint -> Task -> Issue', async ({ page }) => {
    // Increase test timeout since this script performs multiple sequential actions
    test.setTimeout(120000);

    // --- BƯỚC 0: ĐĂNG NHẬP VỚI TÀI KHOẢN LEADER ---
    console.log('Bắt đầu kịch bản đăng nhập...');
    await page.goto('/login');
    
    // Đăng nhập bằng ID usernameOrEmail và password thực tế từ form
    await page.fill('#usernameOrEmail', 'leader@devtrack.local');
    await page.fill('#password', 'User@123');
    await page.click('button[type="submit"]');

    // Chờ điều hướng vào trang Dashboard
    await expect(page).toHaveURL(/.*dashboard|.*workspace/);
    console.log('Đăng nhập thành công với tài khoản leader@devtrack.local');

    // --- BƯỚC 0.1: TẠO DỰ ÁN MỚI ĐỂ TRÁNH TRÙNG LẶP SPRINT VÀ DỮ LIỆU CŨ ---
    console.log('Bắt đầu kịch bản tạo dự án mới...');
    // Đợi nút Create Project ở dashboard hiển thị và click
    await page.waitForSelector('button:has-text("Create Project")', { timeout: 10000 });
    await page.click('button:has-text("Create Project")', { force: true });
    
    // Đợi form modal hiện ra
    await page.waitForSelector('input#projName', { timeout: 5000 });
    
    // Điền thông tin dự án mới (Dùng mốc thời gian bắt đầu từ 2026-07-01 để khớp với ngày hiện tại của hệ thống là 2026-07-16)
    await page.fill('input#projName', projectTitle);
    await page.fill('input#projMajor', 'Software Engineering');
    await page.selectOption('select#projType', 'RESEARCH'); // Chọn RESEARCH để không cần tích hợp GitHub repo
    await page.fill('input#projStartDate', '2026-07-01');
    await page.fill('input#projDeadline', '2026-08-31');
    await page.fill('textarea#projDesc', 'Dự án tạo tự động để phục vụ kiểm thử E2E.');
    
    // Submit form tạo dự án
    await page.click('form button[type="submit"]:has-text("Create Project")', { force: true });
    console.log('Đã gửi yêu cầu tạo dự án mới...');

    // Đợi dự án mới được tạo và hiển thị trên danh sách dashboard, sau đó click vào nó
    await page.waitForSelector(`text=${projectTitle}`, { timeout: 15000 });
    await page.click(`text=${projectTitle}`);
    console.log(`Đã tạo và truy cập thành công vào dự án mới: ${projectTitle}`);

    // Chờ 2 giây để toàn bộ React State & Transition tải xong hoàn toàn
    await page.waitForTimeout(2000);

    // --- BƯỚC 1: KIỂM THỬ TẠO REQUIREMENT ---
    console.log('Bắt đầu kiểm thử Module: Requirement');
    // Click vào item Requirements trong thanh nav sidebar
    await page.locator('nav div:has-text("Requirements")').last().click({ force: true });
    
    // Chờ và click nút "Tạo mới" / "Add" trên trang Requirement
    await page.waitForSelector('button:has-text("Add"), button:has-text("Tạo mới")', { timeout: 10000 });
    await page.click('button:has-text("Add"), button:has-text("Tạo mới")', { force: true });
    
    // Nhập Tiêu đề bằng placeholder thực tế trong component
    await page.fill('input[placeholder="e.g., User Authentication via SSO"]', reqTitle);
    
    // Chọn loại Requirement FUNCTIONAL
    await page.selectOption('select:has(option[value="FUNCTIONAL"])', 'FUNCTIONAL');
    
    // Điền mô tả chi tiết vào Rich Text Editor (ReactQuill)
    await page.locator('.ql-editor').fill('Mô tả yêu cầu đăng nhập bằng Email và Password.');
    
    // Click nút "Save Requirement" trong Action Bar
    await page.click('button:has-text("Save Requirement")', { force: true });
    
    // Xác nhận Requirement mới đã hiển thị trên bảng
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(reqTitle);
    console.log(`Tạo Requirement thành công: ${reqTitle}`);
    
    // Tự động chụp ảnh minh chứng cho Requirement (Slide 6)
    await page.screenshot({ path: path.join(evidenceDir, 'step1_requirement.png') });

    // --- BƯỚC 2: KIỂM THỬ TẠO USE CASE LIÊN KẾT VỚI REQUIREMENT ---
    console.log('Bắt đầu kiểm thử Module: Use Case');
    await page.locator('nav div:has-text("Use Cases")').last().click({ force: true });
    await page.waitForSelector('button:has-text("Add"), button:has-text("Tạo mới")', { timeout: 10000 });
    await page.click('button:has-text("Add"), button:has-text("Tạo mới")', { force: true });
    
    // Điền form Use Case sử dụng thuộc tính name thực tế
    await page.fill('input[name="name"]', useCaseTitle);
    await page.fill('input[name="actorsText"]', 'Khách truy cập, Hệ thống');
    
    // Chọn Requirement vừa tạo từ dropdown (sử dụng helper tìm kiếm và chờ tải xong)
    await selectOptionBySubstring(page, 'select[name="requirementId"]', reqTitle);
    await page.fill('textarea[name="mainFlowText"]', '1. Nhập email\n2. Bấm nút đăng nhập');
    
    // Click nút "Save Use Case"
    await page.click('button:has-text("Save Use Case")', { force: true });

    // Xác nhận Use Case được tạo và hiển thị
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(useCaseTitle);
    console.log(`Tạo Use Case thành công: ${useCaseTitle}`);

    // Tự động chụp ảnh minh chứng cho Use Case (Slide 6)
    await page.screenshot({ path: path.join(evidenceDir, 'step2_usecase.png') });

    // --- BƯỚC 3: KIỂM THỬ TẠO SPRINT ---
    console.log('Bắt đầu kiểm thử Module: Sprint');
    await page.locator('nav div:has-text("Sprints")').last().click({ force: true });
    await page.waitForSelector('button:has-text("New Sprint"), button:has-text("Create Sprint"), button:has-text("Tạo mới")', { timeout: 10000 });
    await page.click('button:has-text("New Sprint"), button:has-text("Create Sprint"), button:has-text("Tạo mới")', { force: true });
    
    // Điền tên Sprint vào input nằm trong label 'Name' (Sử dụng các ngày trong tháng 7 khớp với lịch dự án mới)
    await page.fill('label:has-text("Name") input', sprintTitle);
    await page.fill('label:has-text("Start Date") input', '2026-07-16');
    await page.fill('label:has-text("End Date") input', '2026-07-30');
    
    // Click nút "Save Sprint"
    await page.click('button:has-text("Save Sprint")', { force: true });

    // Chờ drawer chi tiết Sprint hiển thị chứa tên Sprint vừa tạo để đồng bộ hóa
    await page.waitForSelector(`aside.shadow-2xl:has-text("${sprintTitle}")`, { timeout: 10000 });
    console.log(`Tạo Sprint thành công và hiển thị trong Drawer: ${sprintTitle}`);

    // Tự động chụp ảnh minh chứng cho Sprint (Slide 7)
    await page.screenshot({ path: path.join(evidenceDir, 'step3_sprint.png') });

    // Click nút thứ 3 (Close Button) trong header của Drawer để đóng lại
    await page.locator('aside.shadow-2xl button').nth(2).click({ force: true });
    // Bấm phím Escape làm phương án dự phòng
    await page.keyboard.press('Escape');
    
    // Chờ drawer đóng hẳn (trạng thái detached khỏi DOM)
    await page.waitForSelector('aside.shadow-2xl', { state: 'detached', timeout: 10000 });
    console.log('Đã đóng drawer Sprint thành công.');

    // --- BƯỚC 4: KIỂM THỬ TẠO TASK TRONG SPRINT ---
    console.log('Bắt đầu kiểm thử Module: Task');
    await page.locator('nav div:has-text("Task Board")').last().click({ force: true });
    await page.waitForSelector('button:has-text("New Task"), button:has-text("Create Task"), button:has-text("Tạo Task")', { timeout: 10000 });
    await page.click('button:has-text("New Task"), button:has-text("Create Task"), button:has-text("Tạo Task")', { force: true });
    
    // Điền tiêu đề Task bằng placeholder thực tế
    await page.fill('input[placeholder="Implement task feature"]', taskTitle);
    
    // Chọn Sprint vừa tạo ở dropdown tương ứng (sử dụng helper chờ tải xong với selector sibling duy nhất)
    await selectOptionBySubstring(page, 'form label:has-text("Sprint") + select', sprintTitle);
    await page.selectOption('form label:has-text("Type") + select', 'DEVELOPMENT');
    
    // Điền Start Date & Deadline trong Task Form (Sử dụng chỉ mục DOM nth(0) và nth(1) của type="date" trong form)
    await page.locator('form input[type="date"]').nth(0).fill('2026-07-16');
    await page.locator('form input[type="date"]').nth(1).fill('2026-07-30');
    
    // Click nút "Create Task"
    await page.click('button:has-text("Create Task")', { force: true });

    // Xác nhận Task hiển thị trên Kanban board
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(taskTitle);
    console.log(`Tạo Task thành công: ${taskTitle}`);

    // Tự động chụp ảnh minh chứng cho Kanban Board (Slide 7)
    await page.screenshot({ path: path.join(evidenceDir, 'step4_task.png') });

    // --- BƯỚC 5: KIỂM THỬ TẠO ISSUE (BUG REPORT) ---
    console.log('Bắt đầu kiểm thử Module: Bug');
    await page.locator('nav div:has-text("Bugs")').last().click({ force: true });
    await page.waitForSelector('button:has-text("Report Bug"), button:has-text("Báo lỗi")', { timeout: 10000 });
    await page.click('button:has-text("Report Bug"), button:has-text("Báo lỗi")', { force: true });
    
    // Điền form báo lỗi bằng placeholder thực tế
    await page.fill('form input[placeholder="Brief description of the bug"]', bugTitle);
    await page.fill('form textarea[placeholder="Detailed description..."]', 'Bấm Submit bị đơ, không phản hồi.');
    await page.selectOption('form label:has-text("Severity") + select', 'HIGH');
    
    // Click nút "Create Bug Report"
    await page.click('button:has-text("Create Bug Report")', { force: true });

    // Xác nhận Bug đã hiển thị trong danh sách Issues
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(bugTitle);
    console.log(`Tạo Issue thành công: ${bugTitle}`);

    // Tự động chụp ảnh minh chứng cho Bug Tracker (Slide 7)
    await page.screenshot({ path: path.join(evidenceDir, 'step5_bug.png') });
  });
});
