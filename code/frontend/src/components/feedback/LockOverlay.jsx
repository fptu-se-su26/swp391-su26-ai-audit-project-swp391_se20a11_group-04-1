import React, { useState, useEffect } from 'react';
import useAuthStore from '@store/useAuthStore';
import axiosInstance from '@api/axiosConfig';
import toast from 'react-hot-toast';

const LockOverlay = ({ lockReason, isInitiallyPending }) => {
  const logout = useAuthStore((state) => state.logout);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const [appealReason, setAppealReason] = useState('');
  const [isPending, setIsPending] = useState(isInitiallyPending);
  const [loading, setLoading] = useState(false);
  
  // Simulated file upload state
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // Handle actual file upload to Cloudinary via backend
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosInstance.post('/v1/auth/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data && response.data.success) {
        setEvidenceUrl(response.data.data);
        toast.success('Tải lên tài liệu minh chứng thành công!');
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
      toast.error(err.response?.data?.message || 'Tải lên tài liệu minh chứng thất bại.');
      setFileName('');
      setEvidenceUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!appealReason.trim()) {
      toast.error('Vui lòng nhập lý do kháng cáo!');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/v1/auth/appeal', {
        reason: appealReason,
        evidenceUrl: evidenceUrl || null,
        evidenceName: fileName || null
      });

      if (response.data && response.data.success) {
        toast.success('Gửi đơn kháng cáo thành công! Đang chờ Admin xét duyệt.');
        setIsPending(true);
        // Refresh auth state to sync with DB
        fetchMe();
      }
    } catch (err) {
      console.error('Failed to submit appeal:', err);
      toast.error(err.response?.data?.message || 'Gửi đơn kháng cáo thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-red-100 max-w-lg w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Decorative Top Accent */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-600"></div>

        <div className="p-6 md:p-8 flex flex-col items-center text-center">
          {/* Glowing Lock Icon */}
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-6 shadow-inner animate-bounce duration-1000">
            <span className="material-symbols-outlined text-4xl">gavel</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tài khoản đã bị khóa</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Tài khoản của bạn tạm thời ngừng hoạt động do quyết định từ ban quản trị hệ thống.
          </p>

          {/* Admin Lock Reason */}
          <div className="w-full mt-6 bg-red-50/70 border border-red-100 rounded-xl p-4 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5">
              <span className="material-symbols-outlined text-sm">info</span>
              Lý do từ Admin
            </div>
            <p className="text-sm text-red-900 leading-relaxed italic font-medium">
              "{lockReason || 'Vi phạm chính sách bảo mật hệ thống hoặc spam dữ liệu.'}"
            </p>
          </div>

          {/* Appeal Section */}
          <div className="w-full mt-6 border-t border-slate-100 pt-6 text-left">
            {isPending ? (
              /* Appeal Submitted & Waiting Status */
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3 animate-in fade-in duration-300">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
                </div>
                <h4 className="font-bold text-amber-900 text-base">Đơn kháng cáo đang được xử lý</h4>
                <p className="text-xs text-amber-800 leading-relaxed max-w-xs mx-auto">
                  Hệ thống đã ghi nhận đơn giải trình của bạn. Ban quản trị đang tiến hành xác minh minh chứng và sẽ phản hồi sớm nhất qua email.
                </p>
              </div>
            ) : (
              /* Appeal Form */
              <form onSubmit={handleSubmitAppeal} className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#1E707D]">edit_document</span>
                  Gửi đơn giải trình & kháng cáo
                </h4>
                
                <div>
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Vui lòng giải trình rõ lý do hoặc cung cấp thông tin đối chứng để Admin xem xét mở khóa tài khoản cho bạn..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] focus:border-transparent transition-all h-28 resize-none"
                    required
                  />
                </div>

                {/* Simulated File Upload Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tài liệu minh chứng đính kèm (Tùy chọn)
                  </label>
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-[#1E707D] rounded-xl p-4 transition-colors bg-slate-50/50">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.zip"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={uploading}
                    />
                    
                    {fileName ? (
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold truncate">
                          <span className="material-symbols-outlined text-[#1E707D]">description</span>
                          <span className="truncate">{fileName}</span>
                        </div>
                        {uploading ? (
                          <span className="text-xs text-slate-400 shrink-0 font-medium">Đang tải... {uploadProgress}%</span>
                        ) : (
                          <span className="text-xs text-green-600 shrink-0 font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-sm">check_circle</span> Đã đính kèm
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                        <span className="text-xs font-bold text-slate-600">Chọn file hoặc kéo thả vào đây</span>
                        <span className="text-[10px] text-slate-400">Chấp nhận PDF, PNG, JPG, ZIP (Tối đa 10MB)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {uploading && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-[#1E707D] h-full rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full py-3 bg-[#1E707D] hover:bg-[#154f59] text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang gửi đơn...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      Gửi đơn kháng cáo
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Logout Button */}
          <div className="w-full mt-6 pt-4 border-t border-slate-100 flex justify-center">
            <button
              onClick={logout}
              className="px-6 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Đăng xuất khỏi hệ thống
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LockOverlay;
