import React, { useState, useEffect } from 'react';
import SystemAdminLayout from '../layouts/SystemAdminLayout';
import MetricCard from '../components/metrics/MetricCard';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';

const ProjectManagementPage = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, academic: 0, suspended: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination, search & filters
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 15;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [suspendedFilter, setSuspendedFilter] = useState('ALL');

  // Modals state
  const [projectToSuspend, setProjectToSuspend] = useState(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await adminService.getProjectStats();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching project stats:', err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const isSuspended = suspendedFilter === 'SUSPENDED' ? true : (suspendedFilter === 'ACTIVE' ? false : undefined);
      const res = await adminService.getAdminProjects(page, size, searchTerm, statusFilter, isSuspended);
      if (res.data?.success) {
        setProjects(res.data.data.content || []);
        setTotalPages(res.data.data.totalPages || 0);
      }
    } catch (err) {
      console.error('Error fetching admin projects:', err);
      setError('Không thể tải danh sách dự án. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [page, searchTerm, statusFilter, suspendedFilter]);

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!suspendReasonInput.trim()) {
      toast.error('Vui lòng nhập lý do đình chỉ dự án.');
      return;
    }
    const loadingToast = toast.loading('Đang đình chỉ dự án...');
    try {
      const res = await adminService.suspendProject(projectToSuspend.id, suspendReasonInput.trim());
      if (res.data?.success) {
        toast.success('Đình chỉ dự án thành công!', { id: loadingToast });
        setProjectToSuspend(null);
        setSuspendReasonInput('');
        fetchProjects();
        fetchStats();
      }
    } catch (err) {
      console.error('Error suspending project:', err);
      toast.error(err.response?.data?.message || 'Đình chỉ dự án thất bại.', { id: loadingToast });
    }
  };

  const handleReactivate = async (id) => {
    const confirmReactivate = window.confirm('Bạn có chắc chắn muốn kích hoạt lại dự án này?');
    if (!confirmReactivate) return;

    const loadingToast = toast.loading('Đang mở khóa dự án...');
    try {
      const res = await adminService.reactivateProject(id);
      if (res.data?.success) {
        toast.success('Kích hoạt lại dự án thành công!', { id: loadingToast });
        fetchProjects();
        fetchStats();
      }
    } catch (err) {
      console.error('Error reactivating project:', err);
      toast.error(err.response?.data?.message || 'Mở khóa dự án thất bại.', { id: loadingToast });
    }
  };

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA MỀM dự án "${name}" không? Dự án sẽ bị ẩn hoàn toàn khỏi hệ thống.`);
    if (!confirmDelete) return;

    const loadingToast = toast.loading('Đang xóa dự án...');
    try {
      const res = await adminService.softDeleteProject(id);
      if (res.data?.success) {
        toast.success('Xóa dự án thành công!', { id: loadingToast });
        fetchProjects();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error(err.response?.data?.message || 'Xóa dự án thất bại.', { id: loadingToast });
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(0);
  };

  const getStatusBadgeClass = (status, isSuspended) => {
    if (isSuspended) {
      return 'bg-red-100 text-red-850 border border-red-200';
    }
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'IN_REVIEW':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-500 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const getStatusText = (status, isSuspended) => {
    if (isSuspended) return 'Đã đình chỉ';
    switch (status) {
      case 'ACTIVE': return 'Đang hoạt động';
      case 'PLANNING': return 'Đang lập kế hoạch';
      case 'IN_REVIEW': return 'Đang đánh giá';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'ARCHIVED': return 'Đã lưu trữ';
      default: return status;
    }
  };

  return (
    <SystemAdminLayout>
      <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1E707D] text-3xl">folder_shared</span>
            Quản lý dự án
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi danh sách toàn bộ dự án trên hệ thống, quản lý đình chỉ hoạt động hoặc xóa bỏ dự án vi phạm.
          </p>
        </div>

        {/* Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <MetricCard 
            label="Tổng số dự án" 
            value={stats.total?.toLocaleString() || '0'} 
            icon="folder_open" 
            iconColor="text-[#1E707D]"
            iconBg="bg-[#1E707D]/10"
          />
          <MetricCard 
            label="Đang hoạt động" 
            value={stats.active?.toLocaleString() || '0'} 
            icon="check_circle" 
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
          />
          <MetricCard 
            label="Dự án Học thuật" 
            value={stats.academic?.toLocaleString() || '0'} 
            icon="school" 
            iconColor="text-purple-500"
            iconBg="bg-purple-500/10"
          />
          <MetricCard 
            label="Đã đình chỉ" 
            value={stats.suspended?.toLocaleString() || '0'} 
            icon="pause_circle" 
            iconColor="text-red-500"
            iconBg="bg-red-500/10"
            valueColor="text-red-600"
          />
        </section>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên dự án hoặc người tạo..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PLANNING">Lập kế hoạch</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="IN_REVIEW">Đang đánh giá</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>

            {/* Filter by Suspended */}
            <select
              value={suspendedFilter}
              onChange={(e) => handleFilterChange(setSuspendedFilter, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E707D] bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="ALL">Bộ lọc đình chỉ: Tất cả</option>
              <option value="ACTIVE">Đang hoạt động bình thường</option>
              <option value="SUSPENDED">Đã bị đình chỉ</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium text-gray-600 mt-2">Đang tải danh sách dự án...</p>
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
                    <th className="px-6 py-4">Dự án</th>
                    <th className="px-6 py-4">Lớp học</th>
                    <th className="px-6 py-4">Người tạo</th>
                    <th className="px-6 py-4">Thành viên</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {projects.length > 0 ? (
                    projects.map((project) => {
                      const isSuspended = !!project.closedAt;
                      return (
                        <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                          {/* Project Info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm" style={{ background: '#1E707D' }}>
                                {project.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="max-w-xs md:max-w-sm truncate">
                                <div className="font-bold text-gray-900 truncate hover:text-[#1E707D] cursor-pointer" onClick={() => setSelectedProjectDetails(project)}>
                                  {project.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{project.description || 'Không có mô tả.'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Academic Context */}
                          <td className="px-6 py-4">
                            {project.academicContextName ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                {project.academicContextName}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Dự án cá nhân</span>
                            )}
                          </td>

                          {/* Creator */}
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{project.createdByFullName}</div>
                              <div className="text-xs text-gray-500">@{project.createdByUsername}</div>
                            </div>
                          </td>

                          {/* Members count */}
                          <td className="px-6 py-4 font-semibold text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">group</span>
                              {project.membersCount}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(project.status, isSuspended)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-current'}`}></span>
                              {getStatusText(project.status, isSuspended)}
                            </span>
                          </td>

                          {/* Timeline */}
                          <td className="px-6 py-4 text-xs text-gray-500 leading-relaxed">
                            <div>Bắt đầu: {project.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : '-'}</div>
                            <div className="font-semibold text-gray-700">Hạn cuối: {project.deadline ? new Date(project.deadline).toLocaleDateString('vi-VN') : '-'}</div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {isSuspended ? (
                                <button
                                  onClick={() => handleReactivate(project.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 text-xs font-medium transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">play_circle</span>
                                  Mở khóa
                                </button>
                              ) : (
                                <button
                                  onClick={() => setProjectToSuspend(project)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-medium transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">pause_circle</span>
                                  Đình chỉ
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(project.id, project.name)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-250 text-gray-500 hover:bg-gray-50 hover:text-red-600 hover:border-red-300 text-xs font-medium transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-gray-300">folder_open</span>
                          <p className="font-medium text-gray-600">Không tìm thấy dự án phù hợp</p>
                          <p className="text-xs text-gray-400">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">Trang {page + 1} / {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suspend Project Modal */}
      {projectToSuspend && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSuspend} className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">pause_circle</span>
                Yêu cầu đình chỉ dự án
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setProjectToSuspend(null);
                  setSuspendReasonInput('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                <div className="font-bold text-gray-950">{projectToSuspend.name}</div>
                <div className="text-xs text-gray-500 mt-1">Được tạo bởi: {projectToSuspend.createdByFullName} (@{projectToSuspend.createdByUsername})</div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Lý do đình chỉ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={suspendReasonInput}
                  onChange={(e) => setSuspendReasonInput(e.target.value)}
                  placeholder="Nhập lý do chi tiết đình chỉ dự án này để lưu vết và hiển thị lý do cho thành viên..."
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
                  setProjectToSuspend(null);
                  setSuspendReasonInput('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">pause_circle</span>
                Xác nhận đình chỉ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProjectDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1E707D]">info</span>
                Chi tiết dự án
              </h3>
              <button 
                onClick={() => setSelectedProjectDetails(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ background: '#1E707D' }}>
                  {selectedProjectDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-gray-950">{selectedProjectDetails.name}</div>
                  <div className="text-xs text-gray-500">Phân loại: {selectedProjectDetails.type}</div>
                  <div className="text-xs text-gray-500">Trạng thái: {getStatusText(selectedProjectDetails.status, !!selectedProjectDetails.closedAt)}</div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Mô tả dự án</span>
                <div className="p-3 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-100 leading-relaxed whitespace-pre-wrap">
                  {selectedProjectDetails.description || 'Không có mô tả.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Người tạo</span>
                  <div className="text-sm font-semibold text-gray-800">{selectedProjectDetails.createdByFullName} (@{selectedProjectDetails.createdByUsername})</div>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Ngày tạo</span>
                  <div className="text-sm font-semibold text-gray-800">{selectedProjectDetails.createdAt ? new Date(selectedProjectDetails.createdAt).toLocaleString('vi-VN') : '-'}</div>
                </div>
              </div>

              {selectedProjectDetails.closedAt && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-lg">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-1">Thông tin đình chỉ</span>
                  <div className="text-sm text-red-900 leading-relaxed">
                    <strong>Thời gian:</strong> {new Date(selectedProjectDetails.closedAt).toLocaleString('vi-VN')}
                  </div>
                  <div className="text-sm text-red-950 mt-1 italic leading-relaxed">
                    <strong>Lý do:</strong> "{selectedProjectDetails.closedReason}"
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedProjectDetails(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-250 text-gray-700 font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </SystemAdminLayout>
  );
};

export default ProjectManagementPage;
