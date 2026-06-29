import { useEffect } from 'react'

/**
 * Custom React hook để lưu trữ và phục hồi dữ liệu form tự động
 * @param {string} key - Khóa lưu trữ trong storage (sessionStorage/localStorage)
 * @param {Object} params
 * @param {Object} params.data - State chứa dữ liệu form hiện tại
 * @param {Function} params.setData - Hàm để cập nhật state dữ liệu form
 * @param {Array<string>} [params.exclude=[]] - Danh sách các trường không lưu (ví dụ: password)
 * @param {'session' | 'local'} [params.storageType='session'] - Loại storage sử dụng
 */
export function useFormPersist(key, { data, setData, exclude = [], storageType = 'session' }) {
  const storage = storageType === 'local' ? localStorage : sessionStorage

  // 1. Phục hồi dữ liệu nháp khi Component mount
  useEffect(() => {
    try {
      const savedDataRaw = storage.getItem(key)
      if (savedDataRaw) {
        const savedData = JSON.parse(savedDataRaw)
        setData((prev) => ({
          ...prev,
          ...savedData,
        }))
      }
    } catch (err) {
      console.error(`[useFormPersist] Lỗi khi phục hồi dữ liệu nháp cho ${key}:`, err)
    }
  }, [key, storage, setData])

  // 2. Tự động lưu nháp dữ liệu form khi thay đổi
  useEffect(() => {
    try {
      const dataToSave = { ...data }
      
      // Loại bỏ các trường nhạy cảm
      exclude.forEach((field) => {
        delete dataToSave[field]
      })

      storage.setItem(key, JSON.stringify(dataToSave))
    } catch (err) {
      console.error(`[useFormPersist] Lỗi khi lưu dữ liệu nháp cho ${key}:`, err)
    }
  }, [key, storage, data, exclude])
}

export default useFormPersist
