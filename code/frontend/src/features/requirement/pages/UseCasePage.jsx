import React, { useState, useEffect } from 'react';
import UseCaseStats from '../components/UseCaseStats';
import UseCaseToolbar from '../components/UseCaseToolbar';
import UseCaseTable from '../components/UseCaseTable';
import UseCasePagination from '../components/UseCasePagination';
import Button from '../../../components/ui/Button';
import UseCaseFormModal from '../components/UseCaseFormModal';
import { useCaseService } from '../services/useCaseService';
import useProjectStore from '../../../store/useProjectStore';
import toast from 'react-hot-toast';

const UseCasePage = () => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const [useCases, setUseCases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUseCases = async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const params = {
        projectId: activeProject.id,
        page: currentPage,
        size: pageSize,
      };
      if (searchTerm) params.keyword = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const data = await useCaseService.searchUseCases(params);
      console.log('API response data:', data);
      
      // Handle both SB3 (flat) and SB4 (nested page) formats
      setUseCases(data.content || []);
      const pageInfo = data.page || data;
      setTotalPages(pageInfo.totalPages || 0);
      setTotalElements(pageInfo.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch use cases', error);
      toast.error('Không thể tải danh sách Use Case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUseCases();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, pageSize, searchTerm, statusFilter, activeProject?.id]);

  useEffect(() => {
    // Reset page and filters when project changes
    setCurrentPage(0);
    setSearchTerm('');
    setStatusFilter('');
    setUseCases([]);
  }, [activeProject?.id]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(0);
  };

  return (
    <div className="p-6 md:p-10 z-10 h-full">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-stack_lg">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Use Cases</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage and track system interactions and actor goals.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>filter_list</span>
              <span>Filter</span>
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              <span>Add Use Case</span>
            </Button>
          </div>
        </div>

        <UseCaseStats />

        {/* Main Data Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col min-h-[400px]">
          <UseCaseToolbar 
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
          />
          {loading ? (
            <div className="flex items-center justify-center flex-1 p-10">
              <span className="text-secondary font-medium">Đang tải dữ liệu...</span>
            </div>
          ) : useCases.length === 0 ? (
            <div className="flex items-center justify-center flex-1 p-10 flex-col">
              <span className="material-symbols-outlined text-outline text-[48px] mb-2">inbox</span>
              <span className="text-on-surface-variant">Chưa có Use Case nào. Hãy tạo mới!</span>
            </div>
          ) : (
            <UseCaseTable useCases={useCases} />
          )}
          <UseCasePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
      
      {/* Modal */}
      <UseCaseFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchUseCases} 
      />
    </div>
  );
};

export default UseCasePage;
