import React, { useState } from 'react';
import SystemAdminLayout from '../layouts/SystemAdminLayout';

// Mock data for users based on the application's domain (FPT University style)
const INITIAL_MOCK_USERS = [
  {
    id: 1,
    username: 'binhnv',
    fullName: 'Nguyễn Văn Bình',
    email: 'binhnvse170123@fpt.edu.vn',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80',
    isActive: true,
    lastActive: '2026-06-25T09:45:00Z',
    code: 'QE170123',
    subject: 'SWP391',
    appeal: null
  },
  {
    id: 2,
    username: 'khanhld',
    fullName: 'Lê Đình Khánh',
    email: 'khanhld@fe.edu.vn',
    role: 'MENTOR',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    isActive: true,
    lastActive: '2026-06-25T08:30:00Z',
    code: 'KHANHLD4',
    subject: 'Software Engineering',
    appeal: null
  },
  {
    id: 3,
    username: 'dungpt',
    fullName: 'Phạm Tiến Dũng',
    email: 'dungptse160554@fpt.edu.vn',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    isActive: false, // Locked
    lastActive: '2026-06-20T15:10:00Z',
    code: 'SE160554',
    subject: 'SWP391',
    appeal: {
      id: 101,
      status: 'PENDING',
      reason: 'Tài khoản của em bị khóa nhầm trong đợt quét trùng lặp mã nguồn vừa rồi. Em xin cam đoan đây là code do nhóm tự viết, em có gửi kèm file PDF chụp lịch sử git commit của nhóm để làm minh chứng ạ.',
      createdAt: '2026-06-21T08:15:00Z',
      evidenceUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      evidenceName: 'minh_chung_git_commit_history.pdf'
    }
  },
  {
    id: 4,
    username: 'hantn',
    fullName: 'Trần Nguyễn Nam Hà',
    email: 'hantn2@fe.edu.vn',
    role: 'MENTOR',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    isActive: true,
    lastActive: '2026-06-25T09:12:00Z',
    code: 'HANTN2',
    subject: 'IT Project Management',
    appeal: null
  },
  {
    id: 5,
    username: 'maith',
    fullName: 'Trần Thị Hồng Mai',
    email: 'maithse170982@fpt.edu.vn',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80',
    isActive: true,
    lastActive: '2023-03-15T10:00:00Z', // > 2 years ago (Current year is 2026)
    code: 'SE170982',
    subject: 'SWP391',
    appeal: null
  },
  {
    id: 6,
    username: 'tunglam',
    fullName: 'Phạm Tùng Lâm',
    email: 'lamptse150234@fpt.edu.vn',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80',
    isActive: true,
    lastActive: '2022-01-10T11:00:00Z', // > 2 years ago
    code: 'SE150234',
    subject: 'SWP391',
    appeal: null
  }
];

const UserManagementPage = () => {
  const [users, setUsers] = useState(INITIAL_MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appealFilter, setAppealFilter] = useState('ALL');
  const [selectedUserForAppeal, setSelectedUserForAppeal] = useState(null);

  // Banner state management
  const [dismissedAppealBanner, setDismissedAppealBanner] = useState(false);
  const [dismissedInactiveBanner, setDismissedInactiveBanner] = useState(false);
  
  // Custom filter states activated by clicking the action button on the banner
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [showAppealsOnly, setShowAppealsOnly] = useState(false);

  // Toggle active/inactive status (Lock/Unlock)
  const handleToggleLock = (id) => {
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === id) {
          const updatedAppeal = user.appeal && !user.isActive 
            ? { ...user.appeal, status: 'RESOLVED' } 
            : user.appeal;
          return { ...user, isActive: !user.isActive, appeal: updatedAppeal };
        }
        return user;
      })
    );
    if (selectedUserForAppeal && selectedUserForAppeal.id === id) {
      setSelectedUserForAppeal(null);
    }
  };

  // Resolve appeal directly from Modal
  const handleResolveAppeal = (userId, approve) => {
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            isActive: approve ? true : user.isActive,
            appeal: { ...user.appeal, status: approve ? 'APPROVED' : 'REJECTED' }
          };
        }
        return user;
      })
    );
    setSelectedUserForAppeal(null);
  };

  // Helper to check if user has been inactive for > 2 years
  const isInactiveOver2Years = (lastActiveDateString) => {
    if (!lastActiveDateString) return true;
    const lastActive = new Date(lastActiveDateString);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return lastActive < twoYearsAgo;
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

  // Filtered users list
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && user.isActive) ||
      (statusFilter === 'LOCKED' && !user.isActive);

    // Apply standard appeal filter or showAppealsOnly (from the banner)
    const matchesAppeal = showAppealsOnly 
      ? user.appeal?.status === 'PENDING'
      : (appealFilter === 'ALL' ||
         (appealFilter === 'PENDING' && user.appeal?.status === 'PENDING') ||
         (appealFilter === 'NONE' && !user.appeal));

    // Apply inactive filter if activated by the banner
    const matchesInactiveFilter = !showInactiveOnly || isInactiveOver2Years(user.lastActive);

    return matchesSearch && matchesRole && matchesStatus && matchesAppeal && matchesInactiveFilter;
  });

  // Calculate statistics for banners
  const pendingAppealsCount = users.filter(u => u.appeal?.status === 'PENDING').length;
  const inactiveCount = users.filter(u => isInactiveOver2Years(u.lastActive)).length;

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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng người dùng</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{users.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đang hoạt động</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {users.filter(u => u.isActive).length}
              </h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <span className="material-symbols-outlined">person_check</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đơn kháng cáo mới</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {users.filter(u => u.appeal?.status === 'PENDING').length}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <span className="material-symbols-outlined">gavel</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài khoản bị khóa</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">
                {users.filter(u => !u.isActive).length}
              </h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <span className="material-symbols-outlined">person_cancel</span>
            </div>
          </div>
        </div>

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
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* User Info with Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl}
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
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          ></span>
                          {user.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                        </span>
                      </td>

                      {/* Appeal Column */}
                      <td className="px-6 py-4">
                        {user.appeal ? (
                          user.appeal.status === 'PENDING' ? (
                            <button
                              onClick={() => setSelectedUserForAppeal(user)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer animate-pulse"
                            >
                              <span className="material-symbols-outlined text-xs">gavel</span>
                              Xem đơn kháng cáo
                            </button>
                          ) : user.appeal.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Đã phê duyệt
                            </span>
                          ) : user.appeal.status === 'REJECTED' ? (
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
                              user.isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                                : 'border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {user.isActive ? 'lock' : 'lock_open'}
                            </span>
                            {user.isActive ? 'Khóa' : 'Mở khóa'}
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
          </div>
        </div>
      </div>

      {/* Appeal Detail Modal */}
      {selectedUserForAppeal && selectedUserForAppeal.appeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">gavel</span>
                Chi tiết đơn kháng cáo
              </h3>
              <button 
                onClick={() => setSelectedUserForAppeal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <img
                  src={selectedUserForAppeal.avatarUrl}
                  alt={selectedUserForAppeal.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <div className="font-bold text-gray-950">{selectedUserForAppeal.fullName}</div>
                  <div className="text-xs text-gray-500">{selectedUserForAppeal.email}</div>
                  <div className="text-xs font-semibold text-[#1E707D] mt-0.5">
                    Mã số: {selectedUserForAppeal.code} | Môn: {selectedUserForAppeal.subject}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Thời gian gửi</span>
                <span className="text-sm text-gray-800 font-medium">
                  {new Date(selectedUserForAppeal.appeal.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Lý do kháng cáo</span>
                <div className="p-4 bg-amber-50/50 border border-amber-100 text-gray-700 text-sm rounded-lg leading-relaxed italic">
                  "{selectedUserForAppeal.appeal.reason}"
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Tài liệu đính kèm (Minh chứng)</span>
                {selectedUserForAppeal.appeal.evidenceUrl ? (
                  <a
                    href={selectedUserForAppeal.appeal.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">description</span>
                    {selectedUserForAppeal.appeal.evidenceName || 'Xem tài liệu minh chứng'}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 italic">Không có tài liệu đính kèm</span>
                )}
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
