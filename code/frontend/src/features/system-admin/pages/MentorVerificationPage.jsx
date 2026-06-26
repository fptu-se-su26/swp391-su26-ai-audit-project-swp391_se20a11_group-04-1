import React, { useState, useEffect } from 'react';
import SystemAdminLayout from '../layouts/SystemAdminLayout';
import toast from 'react-hot-toast';

// Mock Data representing verification requests
const INITIAL_MOCK_REQUESTS = [
  {
    id: 1001,
    userId: 12,
    username: 'nguyenvan_a',
    email: 'nva@fpt.edu.vn',
    fullName: 'Nguyễn Văn A',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'PENDING',
    createdAt: '2026-06-25T08:30:00Z',
    cardImageUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80', // professional ID mockup
    message: null
  },
  {
    id: 1002,
    userId: 15,
    username: 'tran_thi_b',
    email: 'ttb@gmail.com',
    fullName: 'Trần Thị B',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'PENDING',
    createdAt: '2026-06-26T02:15:00Z',
    cardImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    message: null
  },
  {
    id: 1003,
    userId: 22,
    username: 'le_hoang_c',
    email: 'lhc@fpt.edu.vn',
    fullName: 'Lê Hoàng C',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'APPROVED',
    createdAt: '2026-06-20T09:00:00Z',
    cardImageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    message: null
  },
  {
    id: 1004,
    userId: 29,
    username: 'pham_minh_d',
    email: 'pmd@enterprise.com',
    fullName: 'Phạm Minh D (Doanh nghiệp)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'REJECTED',
    createdAt: '2026-06-18T14:20:00Z',
    cardImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    message: 'Ảnh chụp thẻ bị mờ phần họ tên và không thấy rõ dấu giáp lai đỏ của đơn vị.'
  }
];

const MentorVerificationPage = () => {
  const [requests, setRequests] = useState(INITIAL_MOCK_REQUESTS);
  
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Modals / Lightbox state
  const [selectedImage, setSelectedImage] = useState(null);
  const [requestToReject, setRequestToReject] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Stats calculation
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  // Handle Approve
  const handleApprove = (id) => {
    const confirmApprove = window.confirm(`Bạn có chắc chắn muốn PHÊ DUYỆT yêu cầu #${id}? Người dùng sẽ được cấp quyền tạo lớp học ngay lập tức.`);
    if (!confirmApprove) return;

    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, status: 'APPROVED', message: null };
      }
      return req;
    }));
    toast.success(`Đã phê duyệt thành công yêu cầu #${id}!`);
  };

  // Handle Reject Submit
  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectReasonInput.trim()) {
      toast.error('Vui lòng nhập lý do từ chối yêu cầu xác minh.');
      return;
    }

    setRequests(prev => prev.map(req => {
      if (req.id === requestToReject.id) {
        return { ...req, status: 'REJECTED', message: rejectReasonInput };
      }
      return req;
    }));

    toast.success(`Đã từ chối yêu cầu #${requestToReject.id} thành công.`);
    setRequestToReject(null);
    setRejectReasonInput('');
  };

  // Filter requests based on search, status filter and banner filter
  const filteredRequests = requests.filter(req => {
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = req.fullName.toLowerCase().includes(searchLower);
      const matchesEmail = req.email.toLowerCase().includes(searchLower);
      const matchesUsername = req.username.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesEmail && !matchesUsername) return false;
    }

    // Banner filter override
    if (showPendingOnly) {
      return req.status === 'PENDING';
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      return req.status === statusFilter;
    }

    return true;
  });

  // Date formatter helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SystemAdminLayout>
      <div className="p-1 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3.5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1E707D] text-2xl">supervisor_account</span>
              Quản lý xác minh Giảng viên
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Phê duyệt tài khoản giảng viên/đối tác để cấp phép quyền tạo Classroom và thiết lập các khóa học.
            </p>
          </div>
        </div>

        {/* Dynamic Priority Banner */}
        {pendingCount > 0 && !dismissedBanner && (
          <div className="mb-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl py-3 px-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">notifications_active</span>
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Yêu cầu xác minh tài khoản mới đang chờ duyệt</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Hệ thống ghi nhận có <span className="font-bold text-amber-950">{pendingCount}</span> tài khoản đã gửi ảnh xác minh giảng viên gần đây và đang đợi phê duyệt.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  setShowPendingOnly(true);
                }}
                className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-950 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                Lọc yêu cầu chờ duyệt
              </button>
              <button
                onClick={() => {
                  setDismissedBanner(true);
                  if (showPendingOnly) setShowPendingOnly(false);
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        {/* Filter Indicator when Active */}
        {showPendingOnly && (
          <div className="mb-3.5 bg-teal-50 border border-teal-200 rounded-xl p-3 flex justify-between items-center animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-medium">
              <span className="material-symbols-outlined text-base">filter_alt</span>
              <span>
                Đang hiển thị bộ lọc thông minh:{' '}
                <span className="font-bold">Chỉ những tài khoản đang chờ phê duyệt</span>
              </span>
            </div>
            <button
              onClick={() => setShowPendingOnly(false)}
              className="px-2.5 py-1 bg-teal-800 hover:bg-teal-950 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
              <span className="material-symbols-outlined text-lg">search</span>
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, email, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E707D] focus:border-transparent transition-all"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setShowPendingOnly(false); // reset banner filter if manual status selected
              }}
              className="px-2.5 py-1.5 border border-gray-350 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E707D] bg-white text-gray-700 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Đang chờ duyệt</option>
              <option value="APPROVED">Đã xác minh (Thành công)</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Thẻ giảng viên (Tài liệu)</th>
                  <th className="px-6 py-4">Ngày gửi yêu cầu</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Request ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-500">#{req.id}</span>
                      </td>

                      {/* User details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={req.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'}
                            alt={req.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                          />
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              {req.fullName}
                              <span className="text-xs font-normal text-gray-400">(@{req.username})</span>
                            </div>
                            <div className="text-xs text-gray-500">{req.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              req.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : req.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                req.status === 'APPROVED'
                                  ? 'bg-green-500'
                                  : req.status === 'REJECTED'
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                              }`}
                            ></span>
                            {req.status === 'APPROVED'
                              ? 'Đã xác minh'
                              : req.status === 'REJECTED'
                              ? 'Bị từ chối'
                              : 'Đang chờ duyệt'}
                          </span>
                          {req.status === 'REJECTED' && req.message && (
                            <span className="text-xs text-red-500 max-w-xs truncate" title={req.message}>
                              Lý do: {req.message}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lecturer Card Attachment */}
                      <td className="px-6 py-4">
                        <div 
                          onClick={() => setSelectedImage(req.cardImageUrl)}
                          className="relative group w-20 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-pointer bg-gray-50"
                        >
                          <img
                            src={req.cardImageUrl}
                            alt="Thẻ giảng viên"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold"
                          >
                            Xem ảnh
                          </div>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(req.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">done</span>
                              Duyệt
                            </button>
                            <button
                              onClick={() => setRequestToReject(req)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 font-medium">
                            {req.status === 'APPROVED' ? (
                              <span className="text-green-600 flex items-center gap-1 justify-end">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Đã phê duyệt
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center gap-1 justify-end">
                                <span className="material-symbols-outlined text-xs">cancel</span>
                                Đã từ chối
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">inbox</span>
                      Không tìm thấy yêu cầu xác minh nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lightbox / Secure Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 text-white hover:bg-white/25 hover:text-white rounded-full transition-colors cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Main Image */}
            <div className="bg-white p-2 rounded-xl border border-white/20 shadow-2xl overflow-hidden max-h-[75vh] w-auto">
              <img
                src={selectedImage}
                alt="Thẻ giảng viên chi tiết"
                className="max-h-[72vh] max-w-full object-contain rounded-lg"
              />
            </div>
            
            {/* Subtext info */}
            <div className="mt-3 text-white/70 text-xs font-medium text-center">
              Nhấp vào biểu tượng nút đóng hoặc click ra ngoài để thoát. Ảnh được mã hóa và hiển thị trực tuyến an toàn.
            </div>
          </div>
          {/* Click overlay to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedImage(null)}></div>
        </div>
      )}

      {/* Rejection Modal */}
      {requestToReject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">cancel</span>
                Từ chối xác minh tài khoản
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setRequestToReject(null);
                  setRejectReasonInput('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRejectSubmit}>
              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                  <img
                    src={requestToReject.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'}
                    alt={requestToReject.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                  />
                  <div>
                    <div className="font-bold text-gray-950">{requestToReject.fullName}</div>
                    <div className="text-xs text-gray-500">Yêu cầu ID: #{requestToReject.id}</div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="Nhập lý do chi tiết từ chối xác minh (ví dụ: ảnh thẻ bị mờ, thông tin không trùng khớp, hết hạn...)"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all h-28 resize-none"
                    required
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRequestToReject(null);
                    setRejectReasonInput('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SystemAdminLayout>
  );
};

export default MentorVerificationPage;
