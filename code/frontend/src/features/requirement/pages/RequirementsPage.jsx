import React, { useState, useEffect } from 'react';
import RequirementHeader from '../components/RequirementHeader';
import RequirementFilters from '../components/RequirementFilters';
import RequirementList from '../components/RequirementList';
import CreateRequirementModal from '../components/CreateRequirementModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { requirementApi } from '../services/requirementApi';

const RequirementsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lưu Requirement đang cần Edit (nếu có)
  const [editingReq, setEditingReq] = useState(null);

  const [filters, setFilters] = useState({ status: null, priority: null, tag: null });
  
  // State cho Confirm Delete Modal
  const [reqToDelete, setReqToDelete] = useState(null);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const data = await requirementApi.getAllRequirements();
      data.sort((a, b) => b.id - a.id); // Sort descending to keep newest at top, but stable
      setRequirements(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách requirement:", error);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh — updates data without showing loading spinner (used for owner assignment)
  const silentFetchRequirements = async () => {
    try {
      const data = await requirementApi.getAllRequirements();
      data.sort((a, b) => b.id - a.id);
      setRequirements(data);
    } catch (error) {
      console.error("Lỗi khi cập nhật danh sách:", error);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const initiateDelete = (id) => {
    setReqToDelete(id);
  };

  const confirmDelete = async () => {
    if (!reqToDelete) return;
    try {
      await requirementApi.deleteRequirement(reqToDelete);
      fetchRequirements(); // Load lại danh sách sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa requirement:", error);
      alert("Xóa thất bại!");
    } finally {
      setReqToDelete(null);
    }
  };

  const handleEdit = (req) => {
    setEditingReq(req);
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingReq(null);
  };

  const filteredRequirements = requirements.filter(req => {
    if (filters.status) {
      // e.g. "In Review" -> "IN_REVIEW"
      const formattedStatus = filters.status.replace(' ', '_').toUpperCase();
      if (req.status?.toUpperCase() !== formattedStatus) return false;
    }
    if (filters.priority) {
      if (req.priority?.toUpperCase() !== filters.priority.toUpperCase()) return false;
    }
    if (filters.tag) {
      if (!req.tags || !req.tags.includes(filters.tag)) return false;
    }
    return true;
  });

  return (
    <>
      <RequirementHeader onOpenCreateModal={() => { setEditingReq(null); setIsCreateModalOpen(true); }} />
      <RequirementFilters onFilterChange={setFilters} resultCount={filteredRequirements.length} />
      
      {loading ? (
        <div className="flex justify-center items-center py-10 text-secondary">
          Đang tải dữ liệu...
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="flex justify-center items-center py-10 text-secondary">
          Chưa có Requirement nào phù hợp hoặc danh sách trống.
        </div>
      ) : (
        <RequirementList 
          requirements={filteredRequirements} 
          onDelete={initiateDelete}
          onEdit={handleEdit}
          onRefresh={silentFetchRequirements}
        />
      )}

      {/* Render the Create/Edit Modal */}
      {isCreateModalOpen && (
        <CreateRequirementModal 
          isOpen={isCreateModalOpen} 
          onClose={handleModalClose} 
          onSuccess={fetchRequirements}
          editingData={editingReq}
        />
      )}

      {/* Render the Confirm Delete Modal */}
      <ConfirmModal 
        isOpen={!!reqToDelete}
        title="Xóa Requirement?"
        message="Bạn có chắc chắn muốn xóa Requirement này không? Dữ liệu bị xóa sẽ không thể khôi phục."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setReqToDelete(null)}
      />
    </>
  );
};

export default RequirementsPage;
