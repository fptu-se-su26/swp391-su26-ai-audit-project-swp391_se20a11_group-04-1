import React, { useState, useEffect } from 'react';
import SystemAdminLayout from '../layouts/SystemAdminLayout';
import axiosInstance from '@api/axiosConfig';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [statsUsers, setStatsUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appealFilter, setAppealFilter] = useState('ALL');
  
  // Detail views and modal states
  const [selectedUserForAppeal, setSelectedUserForAppeal] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState('');

  // Banner state management
  const [dismissedAppealBanner, setDismissedAppealBanner] = useState(false);
  const [dismissedInactiveBanner, setDismissedInactiveBanner] = useState(false);
  
  // Custom filter states activated by clicking the action button on the banner
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [showAppealsOnly, setShowAppealsOnly] = useState(false);

  // Helper to check if user has been inactive for > 2 years
  const isInactiveOver2Years = (lastActiveDateString) => {
    if (!lastActiveDateString) return true;
    const lastActive = new Date(lastActiveDateString);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return lastActive < twoYearsAgo;
  };

  // Fetch all users once (or on major updates) to keep statistics cards stable
  const fetchStatsUsers = async () => {
    try {
      const response = await axiosInstance.get('/v1/admin/users');
      if (response.data && response.data.success) {
        setStatsUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats users:', err);
    }
  };

  // Fetch filtered users for the table
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/v1/admin/users', {
        params: {
          search: searchTerm || undefined,
          role: roleFilter,
          status: statusFilter,
          appealFilter: showAppealsOnly ? 'PENDING' : appealFilter,
          showInactiveOnly: showInactiveOnly ? true : undefined
        }
      });
      if (response.data && response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and filter changes
  useEffect(() => {
    fetchStatsUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter, appealFilter, showInactiveOnly, showAppealsOnly]);

  // Toggle active/inactive status (Lock/Unlock)
  const handleToggleLock = async (id) => {
    try {
      const response = await axiosInstance.put(`/v1/admin/users/${id}/toggle-lock`);
      if (response.data && response.data.success) {
        fetchUsers();
        fetchStatsUsers();
      }
    } catch (err) {
      console.error('Error toggling lock status:', err);
      alert('Thay đổi trạng thái khóa tài khoản thất bại.');
    }
  };

  // Resolve appeal directly from Modal (Approve / Reject)
  const handleResolveAppeal = async (userId, approve) => {
    try {
      const response = await axiosInstance.put(`/v1/admin/users/appeals/${userId}/resolve`, {
        approve,
        feedback: adminFeedback
      });
      if (response.data && response.data.success) {
        setSelectedUserForAppeal(null);
        setAdminFeedback('');
        fetchUsers();
        fetchStatsUsers();
      }
    } catch (err) {
      console.error('Error resolving appeal:', err);
      alert('Giải quyết đơn kháng cáo thất bại.');
    }
  };

  // Format Date for Last Active column
  const formatLastActive = (dateString) => {
    if (!dateString) return 'Chưa từng hoạt động';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa mới hoạt động';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics for banners from stable statsUsers list
  const pendingAppealsCount = statsUsers.filter(u => u.appealStatus === 'PENDING').length;
  const inactiveCount = statsUsers.filter(u => isInactiveOver2Years(u.lastActive)).length;

  // Determine active banner based on priority: Pending Appeals > Inactive over 2 years
  let activeBanner = 'NONE';
  if (pendingAppealsCount > 0 && !dismissedAppealBanner) {
    activeBanner = 'APPEAL';
  } else if (inactiveCount > 0 && !dismissedInactiveBanner) {
    activeBanner = 'INACTIVE';
  }

  // Reset banner filters and return to normal view
  const handleResetBannerFilter = () => {
    setShowInactiveOnly(false);
    setShowAppealsOnly(false);
  };

  return (
    <SystemAdminLayout>
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1E707D] text-3xl">people</span>
              Quản lý người dùng
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Xem, tìm kiếm, lọc và kiểm soát trạng thái hoạt động cùng các đơn kháng cáo của tài khoản.
            </p>
          </div>
        </div>

        {/* Dynamic Priority Banners */}
        {activeBanner === 'APPEAL' && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <span className="material-symbols-outlined text-2xl">gavel</span>
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-base">Đơn kháng cáo mới đang chờ duyệt</h4>
                <p className="text-sm text-amber-800 mt-0.5">
                  Phát hiện có <span className="font-bold">{pendingAppealsCount}</span> tài khoản đã gửi đơn kháng cáo gần đây nhất.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  handleResetBannerFilter();
                  setShowAppealsOnly(true);
                }}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-950 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                Xem đơn kháng cáo
              </button>
              <button
                onClick={() => {
                  setDismissedAppealBanner(true);
                  if (showAppealsOnly) setShowAppealsOnly(false);
                }}
                className="px-4 py-2 bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        {activeBanner === 'INACTIVE' && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
                <span className="material-symbols-outlined text-2xl">history_toggle_off</span>
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 text-base">Tài khoản lâu ngày không sử dụng</h4>
                <p className="text-sm text-indigo-800 mt-0.5">
                  Phát hiện có <span className="font-bold">{inactiveCount}</span> tài khoản đã không hoạt động trên 2 năm. Bạn có muốn dọn dẹp không?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  handleResetBannerFilter();
                  setShowInactiveOnly(true);
                }}
                className="px-4 py-2 bg-indigo-800 hover:bg-indigo-950 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                Xem danh sách
              </button>
              <button
                onClick={() => {
                  setDismissedInactiveBanner(true);
                  if (showInactiveOnly) setShowInactiveOnly(false);
                }}
                className="px-4 py-2 bg-white hover:bg-indigo-100 border border-indigo-300 text-indigo-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        {/* Banner Active Filtering Indicator */}
        {(showInactiveOnly || showAppealsOnly) && (
          <div className="mb-6 bg-teal-50 border border-teal-200 rounded-xl p-4 flex justify-between items-center animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-teal-800 text-sm font-medium">
              <span className="material-symbols-outlined text-lg">filter_alt</span>
              <span>
                Đang hiển thị bộ lọc thông minh: {' '}
                <span className="font-bold">
                  {showAppealsOnly ? 'Tài khoản nộp đơn kháng cáo gần đây nhất' : 'Tài khoản ngừng hoạt động trên 2 năm'}
                </span>
              </span>
            </div>
            <button
              onClick={handleResetBannerFilter}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-950 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Đặt lại mặc định
            </button>
          </div>
        )}


        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            {/* Filter by Role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] bg-white text-gray-700 font-medium"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="MENTOR">Giảng viên</option>
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] bg-white text-gray-700 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>

            {/* Filter by Appeal */}
            <select
              value={appealFilter}
              onChange={(e) => setAppealFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] bg-white text-gray-700 font-medium"
            >
              <option value="ALL">Kháng cáo: Tất cả</option>
              <option value="PENDING">Chờ duyệt kháng cáo</option>
              <option value="NONE">Không có kháng cáo</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium text-gray-600 mt-2">Đang tải danh sách người dùng...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-500">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p className="font-medium">{error}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Đơn kháng cáo</th>
                    <th className="px-6 py-4">Lần cuối hoạt động</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        {/* User Info with Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'}
                              alt={user.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                            />
                            <div>
                              <div className="font-semibold text-gray-900">{user.fullName}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* ID only */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-500">#{user.id}</div>
                        </td>

                        {/* Active Status Badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              (user.isActive ?? user.active)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                (user.isActive ?? user.active) ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></span>
                            {(user.isActive ?? user.active) ? 'Đang hoạt động' : 'Bị khóa'}
                          </span>
                        </td>

                        {/* Appeal Column */}
                        <td className="px-6 py-4">
                          {user.appealStatus ? (
                            user.appealStatus === 'PENDING' ? (
                              <button
                                onClick={() => setSelectedUserForAppeal(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer animate-pulse"
                              >
                                <span className="material-symbols-outlined text-xs">gavel</span>
                                Xem đơn kháng cáo
                              </button>
                            ) : user.appealStatus === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Đã phê duyệt
                              </span>
                            ) : user.appealStatus === 'REJECTED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Đã từ chối
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Đã giải quyết</span>
                            )
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4 text-gray-500">
                          {formatLastActive(user.lastActive)}
                        </td>

                        {/* Lock / Unlock Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleLock(user.id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                (user.isActive ?? user.active)
                                  ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                                  : 'border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {(user.isActive ?? user.active) ? 'lock' : 'lock_open'}
                              </span>
                              {(user.isActive ?? user.active) ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-gray-300">
                            person_search
                          </span>
                          <p className="font-medium text-gray-600">Không tìm thấy người dùng phù hợp</p>
                          <p className="text-xs text-gray-400">
                            Thử thay đổi từ khóa hoặc bộ lọc của bạn.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Appeal Detail Modal */}
      {selectedUserForAppeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">gavel</span>
                Chi tiết đơn kháng cáo
              </h3>
              <button 
                onClick={() => {
                  setSelectedUserForAppeal(null);
                  setAdminFeedback('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <img
                  src={selectedUserForAppeal.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'}
                  alt={selectedUserForAppeal.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <div className="font-bold text-gray-950">{selectedUserForAppeal.fullName}</div>
                  <div className="text-xs text-gray-500">{selectedUserForAppeal.email}</div>
                  <div className="text-xs font-semibold text-[#1E707D] mt-0.5">
                    Tài khoản ID: #{selectedUserForAppeal.id}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Lý do kháng cáo</span>
                <div className="p-4 bg-amber-50/50 border border-amber-100 text-gray-700 text-sm rounded-lg leading-relaxed italic">
                  "{selectedUserForAppeal.appealReason}"
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Tài liệu đính kèm (Minh chứng)</span>
                {selectedUserForAppeal.appealEvidenceUrl ? (
                  <a
                    href={selectedUserForAppeal.appealEvidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">description</span>
                    {selectedUserForAppeal.appealEvidenceName || 'Xem tài liệu minh chứng'}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 italic">Không có tài liệu đính kèm</span>
                )}
              </div>

              {/* Admin Feedback Input */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Phản hồi của Admin</span>
                <textarea
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="Nhập lý do phê duyệt hoặc từ chối để phản hồi lại cho người dùng..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] focus:border-transparent transition-all h-20 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => handleResolveAppeal(selectedUserForAppeal.id, false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                Từ chối đơn
              </button>
              
              <button
                onClick={() => handleResolveAppeal(selectedUserForAppeal.id, true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">lock_open</span>
                Duyệt & Mở khóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </SystemAdminLayout>
  );
};

export default UserManagementPage;
