import React, { useState, useEffect } from 'react';
import SystemAdminLayout from '../layouts/SystemAdminLayout';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosConfig';

const MentorVerificationPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Expanded users state (tracks which username's history is expanded)
  const [expandedUsers, setExpandedUsers] = useState({});

  // Modals / Lightbox state
  const [selectedImage, setSelectedImage] = useState(null);
  const [requestToReject, setRequestToReject] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Fetch all requests from backend
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/v1/mentor-verifications');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
      setError('Không thể tải danh sách yêu cầu xác minh từ hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  // Helper to toggle expand/collapse for a user
  const toggleExpandUser = (username) => {
    setExpandedUsers(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  // Stats calculation based on raw requests
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  // Handle Approve via API
  const handleApprove = async (id) => {
    const confirmApprove = window.confirm(`Bạn có chắc chắn muốn PHÊ DUYỆT yêu cầu #${id}? Người dùng sẽ được cấp quyền tạo lớp học ngay lập tức.`);
    if (!confirmApprove) return;

    try {
      await axiosInstance.post(`/v1/mentor-verifications/${id}/approve`);
      toast.success(`Đã phê duyệt thành công yêu cầu #${id}!`);
      fetchRequests();
    } catch (err) {
      console.error('Approve request error:', err);
      toast.error(err.response?.data?.error || 'Phê duyệt yêu cầu thất bại.');
    }
  };

  // Handle Reject Submit via API
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReasonInput.trim()) {
      toast.error('Vui lòng nhập lý do từ chối yêu cầu xác minh.');
      return;
    }

    try {
      await axiosInstance.post(`/v1/mentor-verifications/${requestToReject.id}/reject`, {
        reason: rejectReasonInput.trim()
      });
      toast.success(`Đã từ chối yêu cầu #${requestToReject.id} thành công.`);
      setRequestToReject(null);
      setRejectReasonInput('');
      fetchRequests();
    } catch (err) {
      console.error('Reject request error:', err);
      toast.error(err.response?.data?.error || 'Từ chối yêu cầu thất bại.');
    }
  };

  // Securely load and preview card image as Blob
  const handleViewCard = async (relativeUrl) => {
    const loadingToast = toast.loading('Đang tải ảnh thẻ bảo mật...');
    try {
      const cleanUrl = relativeUrl.startsWith('/api') 
        ? relativeUrl.substring(4) 
        : relativeUrl;
        
      const res = await axiosInstance.get(cleanUrl, {
        responseType: 'blob'
      });
      
      const blobUrl = URL.createObjectURL(res.data);
      setSelectedImage(blobUrl);
      toast.dismiss(loadingToast);
    } catch (err) {
      console.error('Load card image error:', err);
      toast.dismiss(loadingToast);
      toast.error('Không thể tải ảnh thẻ bảo mật. Vui lòng thử lại.');
    }
  };

  // Group requests by user (username)
  const getGroupedUsers = () => {
    const groups = {};
    
    requests.forEach(req => {
      const key = req.username;
      if (!groups[key]) {
        groups[key] = {
          username: req.username,
          email: req.email,
          fullName: req.fullName,
          avatarUrl: req.avatarUrl,
          requests: []
        };
      }
      groups[key].requests.push(req);
    });

    // Sort requests within each group by createdAt desc and determine latest
    const userGroups = Object.values(groups).map(group => {
      const sortedReqs = [...group.requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return {
        ...group,
        requests: sortedReqs,
        latestRequest: sortedReqs[0]
      };
    });

    // Sort groups by latest request's createdAt desc
    userGroups.sort((a, b) => new Date(b.latestRequest.createdAt) - new Date(a.latestRequest.createdAt));
    
    return userGroups;
  };

  // Filter groups based on search terms and status filters
  const groupedUsers = getGroupedUsers();
  const filteredGroups = groupedUsers.filter(group => {
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = group.fullName.toLowerCase().includes(searchLower);
      const matchesEmail = group.email.toLowerCase().includes(searchLower);
      const matchesUsername = group.username.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesEmail && !matchesUsername) return false;
    }

    // Banner filter override (Pending only)
    if (showPendingOnly) {
      return group.latestRequest.status === 'PENDING';
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      return group.latestRequest.status === statusFilter;
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

  // Status Badge Renderer Helper
  const renderStatusBadge = (status, message) => {
    let bgClass = '';
    let dotClass = '';
    let text = '';

    switch (status) {
      case 'APPROVED':
        bgClass = 'bg-green-100 text-green-800';
        dotClass = 'bg-green-500';
        text = 'Đã xác minh';
        break;
      case 'REJECTED':
        bgClass = 'bg-red-100 text-red-800';
        dotClass = 'bg-red-500';
        text = 'Bị từ chối';
        break;
      case 'CANCELLED':
        bgClass = 'bg-gray-100 text-gray-700 border border-gray-255';
        dotClass = 'bg-gray-400';
        text = 'Đã hết hạn';
        break;
      case 'PENDING':
      default:
        bgClass = 'bg-amber-100 text-amber-800 animate-pulse';
        dotClass = 'bg-amber-500';
        text = 'Đang chờ duyệt';
        break;
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${bgClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
          {text}
        </span>
        {status === 'REJECTED' && message && (
          <span className="text-xxs text-red-500 max-w-xs truncate block" title={message}>
            Lý do: {message}
          </span>
        )}
      </div>
    );
  };

  // Card view button helper
  const renderCardButton = (status, cardImageUrl) => {
    if (status === 'CANCELLED') {
      return (
        <span 
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xxs font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none select-none"
          title="Tài liệu đính kèm đã tự động xóa để bảo vệ quyền riêng tư."
        >
          <span className="material-symbols-outlined text-sm">no_photography</span>
          Ảnh đã bị xóa
        </span>
      );
    }

    return (
      <div 
        onClick={() => handleViewCard(cardImageUrl)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xxs font-semibold bg-teal-50 text-teal-800 border border-teal-100 hover:bg-teal-100 hover:border-teal-300 transition-all cursor-pointer shadow-sm"
      >
        <span className="material-symbols-outlined text-sm">badge</span>
        Xem ảnh thẻ
      </div>
    );
  };

  // Action column helper
  const renderActionColumn = (req) => {
    if (req.status === 'PENDING') {
      return (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApprove(req.id);
            }}
            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xxs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[10px] font-bold">done</span>
            Duyệt
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRequestToReject(req);
            }}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xxs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[10px] font-bold">close</span>
            Từ chối
          </button>
        </div>
      );
    }

    let text = '';
    let colorClass = '';
    let icon = '';

    if (req.status === 'APPROVED') {
      text = 'Đã phê duyệt';
      colorClass = 'text-green-600';
      icon = 'check_circle';
    } else if (req.status === 'REJECTED') {
      text = 'Đã từ chối';
      colorClass = 'text-red-600';
      icon = 'cancel';
    } else if (req.status === 'CANCELLED') {
      text = 'Đã hết hạn';
      colorClass = 'text-gray-500';
      icon = 'history';
    }

    return (
      <div className={`text-xxs ${colorClass} font-semibold flex items-center gap-1 justify-end`}>
        <span className="material-symbols-outlined text-xs">{icon}</span>
        {text}
      </div>
    );
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
                  Hệ thống ghi nhận có <span className="font-bold text-amber-950">{pendingCount}</span> yêu cầu đang đợi phê duyệt.
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
                <span className="font-bold">Chỉ những tài khoản có yêu cầu mới nhất đang chờ phê duyệt</span>
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
                setShowPendingOnly(false);
              }}
              className="px-2.5 py-1.5 border border-gray-350 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E707D] bg-white text-gray-700 font-medium"
            >
              <option value="ALL">Tất cả trạng thái gần nhất</option>
              <option value="PENDING">Đang chờ duyệt</option>
              <option value="APPROVED">Đã xác minh (Thành công)</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="CANCELLED">Đã hết hạn</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium text-gray-600 mt-2 text-xs">Đang tải danh sách yêu cầu xác minh...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-500">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p className="font-medium text-xs">{error}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="w-10 px-4 py-4"></th>
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Trạng thái gần nhất</th>
                    <th className="px-6 py-4">Ảnh thẻ gần nhất</th>
                    <th className="px-6 py-4">Cập nhật cuối</th>
                    <th className="px-6 py-4 text-right">Hành động nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => {
                      const isExpanded = !!expandedUsers[group.username];
                      const latest = group.latestRequest;
                      
                      return (
                        <React.Fragment key={group.username}>
                          {/* Main Row */}
                          <tr 
                            onClick={() => toggleExpandUser(group.username)}
                            className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                          >
                            {/* Collapse/Expand toggle button */}
                            <td className="px-4 py-4 text-center">
                              <span className={`material-symbols-outlined text-gray-400 text-lg transition-transform duration-200 inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                                keyboard_arrow_down
                              </span>
                            </td>

                            {/* User details */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={group.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'}
                                  alt={group.fullName}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                                />
                                <div>
                                  <div className="font-semibold text-gray-900 flex items-center gap-1.5 text-xs">
                                    {group.fullName}
                                    <span className="text-xxs font-normal text-gray-400">(@{group.username})</span>
                                  </div>
                                  <div className="text-xxs text-gray-500">{group.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Latest Status */}
                            <td className="px-6 py-4">
                              {renderStatusBadge(latest.status, latest.message)}
                            </td>

                            {/* Latest Attachment */}
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              {renderCardButton(latest.status, latest.cardImageUrl)}
                            </td>

                            {/* Last Updated Date */}
                            <td className="px-6 py-4 text-gray-500 text-xs">
                              {formatDate(latest.createdAt)}
                            </td>

                            {/* Quick Actions */}
                            <td className="px-6 py-4 text-right">
                              {renderActionColumn(latest)}
                            </td>
                          </tr>

                          {/* Expanded History Row */}
                          {isExpanded && (
                            <tr className="bg-gray-50/30">
                              <td colSpan="6" className="px-8 py-3 border-t border-b border-gray-100">
                                <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 shadow-inner">
                                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-600">
                                    <span className="material-symbols-outlined text-sm">history</span>
                                    Lịch sử xác minh của {group.fullName} ({group.requests.length} yêu cầu)
                                  </div>
                                  <table className="w-full text-left border-collapse bg-white rounded-lg border border-gray-150 overflow-hidden text-xs shadow-sm">
                                    <thead>
                                      <tr className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-4 py-2.5">ID Yêu cầu</th>
                                        <th className="px-4 py-2.5">Trạng thái</th>
                                        <th className="px-4 py-2.5">Ảnh đính kèm</th>
                                        <th className="px-4 py-2.5">Ngày gửi</th>
                                        <th className="px-4 py-2.5 text-right">Xử lý</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {group.requests.map((hist) => (
                                        <tr key={hist.id} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="px-4 py-2.5 font-mono font-bold text-gray-500">#{hist.id}</td>
                                          <td className="px-4 py-2.5">{renderStatusBadge(hist.status, hist.message)}</td>
                                          <td className="px-4 py-2.5">{renderCardButton(hist.status, hist.cardImageUrl)}</td>
                                          <td className="px-4 py-2.5 text-gray-500">{formatDate(hist.createdAt)}</td>
                                          <td className="px-4 py-2.5 text-right">{renderActionColumn(hist)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
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
            )}
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
