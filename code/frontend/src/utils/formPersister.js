/**
 * ====================================================================
 * FormPersister - Giải pháp Lưu trữ Trạng thái Form chuyên nghiệp (Production-Ready)
 * Chống mất dữ liệu khi F5 (Refresh), quay lại (Back/Forward) hoặc chuyển trang.
 *
 * Tiêu chuẩn kỹ thuật:
 * 1. Lưu trữ: Sử dụng sessionStorage (tự dọn dẹp khi đóng tab/tắt trình duyệt).
 * 2. Bảo mật: Loại trừ tuyệt đối các trường nhạy cảm (Password, Confirm, OTP).
 * 3. Hiệu suất: Sử dụng Event Delegation (Ủy quyền sự kiện) trên thẻ form.
 * 4. Khôi phục thông minh: Chỉ điền vào ô trống, KHÔNG đè lên dữ liệu mặc định của Server.
 * 5. Tự dọn dẹp: Xóa dữ liệu khi Submit thành công hoặc dọn dẹp chủ động qua URL.
 * ====================================================================
 */

class FormPersister {
    /**
     * Khởi tạo FormPersister cho một Form cụ thể
     * @param {string|HTMLFormElement} formSelector - Selector CSS hoặc thẻ Form Element
     * @param {string} storageKey - Khóa duy nhất để lưu trữ trong sessionStorage (tránh xung đột)
     * @param {Object} options - Cấu hình tùy chọn bổ sung
     */
    constructor(formSelector, storageKey, options = {}) {
        this.form = typeof formSelector === 'string' ? document.querySelector(formSelector) : formSelector;
        this.storageKey = storageKey;
        
        // Cấu hình mặc định
        this.options = Object.assign({
            excludeTypes: ['password', 'file', 'hidden'], // Các loại input bỏ qua không lưu
            excludeNames: ['password', 'confirm', 'otp', 'captcha', 'csrf'], // Chứa các từ khóa nhạy cảm trong name
            excludeIds: ['password', 'confirm', 'otp', 'captcha'], // Chứa các từ khóa nhạy cảm trong id
            debug: false // Bật log khi phát triển
        }, options);

        if (!this.form || this.form.tagName !== 'FORM') {
            this._log('Cảnh báo: Không tìm thấy thẻ <form> phù hợp với selector được cung cấp.', 'warn');
            return;
        }

        this._init();
    }

    /**
     * Khởi tạo các sự kiện và tự động khôi phục dữ liệu nháp
     * @private
     */
    _init() {
        this._log('Đang khởi tạo FormPersister cho form:', this.form);

        // 1. Tự động Khôi phục dữ liệu nháp khi tải trang xong
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.hydrate());
        } else {
            this.hydrate();
        }

        // 2. Tối ưu Hiệu suất: Ủy quyền sự kiện (Event Delegation) duy nhất trên thẻ <form>
        // Lắng nghe sự kiện 'input' (cho textbox, textarea) và 'change' (cho select, checkbox, radio)
        this.form.addEventListener('input', (e) => this._handleFormChange(e));
        this.form.addEventListener('change', (e) => this._handleFormChange(e));

        // 3. Tự động Dọn dẹp (Self-Cleaning): Xóa nháp khi người dùng submit gửi form thành công
        this.form.addEventListener('submit', () => this.clear());
    }

    /**
     * Xử lý lưu trạng thái khi người dùng nhập liệu hoặc thay đổi tùy chọn
     * @param {Event} event 
     * @private
     */
    _handleFormChange(event) {
        const target = event.target;

        // Chỉ xử lý các thẻ nhập liệu thuộc form
        if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

        // Bảo mật: Bỏ qua tuyệt đối các trường nhạy cảm
        if (this._isSensitiveField(target)) return;

        this.saveState();
    }

    /**
     * Kiểm tra xem trường nhập liệu có chứa thông tin nhạy cảm hay không
     * @param {HTMLElement} element - Thẻ input/select/textarea cần kiểm tra
     * @returns {boolean}
     * @private
     */
    _isSensitiveField(element) {
        const type = (element.type || '').toLowerCase();
        const name = (element.name || '').toLowerCase();
        const id = (element.id || '').toLowerCase();

        // 1. Loại trừ theo kiểu input (type="password", type="file")
        if (this.options.excludeTypes.includes(type)) return true;

        // 2. Loại trừ theo tên thuộc tính (name chứa 'password', 'otp',...)
        const matchName = this.options.excludeNames.some(keyword => name.includes(keyword));
        if (matchName) return true;

        // 3. Loại trừ theo ID thuộc tính (id chứa 'password', 'otp',...)
        const matchId = this.options.excludeIds.some(keyword => id.includes(keyword));
        if (matchId) return true;

        return false;
    }

    /**
     * Lưu trạng thái hiện tại của form vào sessionStorage
     */
    saveState() {
        try {
            const formData = {};
            const elements = this.form.elements;

            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                const key = el.id || el.name; // Hỗ trợ ánh xạ linh hoạt theo ID hoặc Name

                if (!key || this._isSensitiveField(el)) continue;

                if (el.tagName === 'INPUT') {
                    if (el.type === 'checkbox') {
                        formData[key] = el.checked;
                    } else if (el.type === 'radio') {
                        if (el.checked) formData[key] = el.value;
                    } else {
                        formData[key] = el.value;
                    }
                } else if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                    formData[key] = el.value;
                }
            }

            sessionStorage.setItem(this.storageKey, JSON.stringify(formData));
            this._log('Đã lưu trạng thái form nháp vào sessionStorage.');
        } catch (error) {
            this._log('Lỗi khi lưu trạng thái form:', 'error', error);
        }
    }

    /**
     * Khôi phục dữ liệu nháp từ sessionStorage (Smart Hydration)
     * Chỉ khôi phục vào các trường ĐANG TRỐNG, không đè lên dữ liệu render mặc định từ Server
     */
    hydrate() {
        try {
            const savedDataRaw = sessionStorage.getItem(this.storageKey);
            if (!savedDataRaw) {
                this._log('Không tìm thấy dữ liệu nháp cũ để khôi phục.');
                return;
            }

            const savedData = JSON.parse(savedDataRaw);
            const elements = this.form.elements;

            this._log('Đang khôi phục dữ liệu nháp...', savedData);

            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                const key = el.id || el.name; // Ánh xạ theo ID hoặc Name linh hoạt

                // Bỏ qua nếu trường không nằm trong dữ liệu lưu hoặc là trường nhạy cảm
                if (!key || !(key in savedData) || this._isSensitiveField(el)) continue;

                const savedValue = savedData[key];

                if (el.tagName === 'INPUT') {
                    if (el.type === 'checkbox') {
                        // Chỉ khôi phục checkbox nếu nó chưa được chọn mặc định từ Server
                        if (!el.checked && savedValue === true) {
                            el.checked = true;
                            // Kích hoạt sự kiện change để các script xử lý logic khác nhận diện được
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    } else if (el.type === 'radio') {
                        // Đối với radio, chỉ chọn nếu chưa có radio nào cùng nhóm được check
                        const radioGroup = this.form.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
                        const isAnyChecked = Array.from(radioGroup).some(r => r.checked);
                        
                        if (!isAnyChecked && el.value === savedValue) {
                            el.checked = true;
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    } else {
                        // 🌟 TIÊU CHUẨN VÀNG: Chỉ khôi phục nếu ô nhập liệu ĐANG TRỐNG
                        if (el.value.trim() === '') {
                            el.value = savedValue;
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                } else if (el.tagName === 'TEXTAREA') {
                    // Chỉ khôi phục textarea nếu đang trống
                    if (el.value.trim() === '') {
                        el.value = savedValue;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                } else if (el.tagName === 'SELECT') {
                    // Chỉ khôi phục select option nếu giá trị hiện tại là trống hoặc là tùy chọn đầu tiên (rỗng)
                    if (!el.value || el.value.trim() === '' || el.selectedIndex <= 0) {
                        el.value = savedValue;
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }

            this._log('Khôi phục trạng thái form thành công!');
        } catch (error) {
            this._log('Lỗi khi khôi phục trạng thái form:', 'error', error);
        }
    }

    /**
     * Dọn dẹp chủ động: Xóa dữ liệu nháp của form này khỏi sessionStorage
     */
    clear() {
        try {
            sessionStorage.removeItem(this.storageKey);
            this._log(`Đã xóa dữ liệu nháp của key [${this.storageKey}] thành công.`);
        } catch (error) {
            this._log('Lỗi khi dọn dẹp bộ nhớ nháp:', 'error', error);
        }
    }

    /**
     * Dọn dẹp chủ động theo tham số trên URL (Ví dụ: kiểm tra URL chứa '?success=true' để xóa nháp)
     * @param {string} paramName - Tên tham số URL cần kiểm tra (ví dụ: 'success')
     * @param {string} expectedValue - Giá trị mong muốn của tham số để dọn dẹp (ví dụ: 'true')
     */
    clearOnUrlParam(paramName = 'success', expectedValue = 'true') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get(paramName) === expectedValue) {
            this.clear();
        }
    }

    /**
     * Ghi nhận log phục vụ Debug
     * @private
     */
    _log(message, type = 'log', data = '') {
        if (!this.options.debug) return;
        const prefix = `[FormPersister - ${this.storageKey}]`;
        if (type === 'error') {
            console.error(prefix, message, data);
        } else if (type === 'warn') {
            console.warn(prefix, message, data);
        } else {
            console.log(prefix, message, data);
        }
    }
}

// Xuất module để hỗ trợ cả ES Module và tải trực tiếp qua script tag
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = FormPersister;
} else {
    window.FormPersister = FormPersister;
}
