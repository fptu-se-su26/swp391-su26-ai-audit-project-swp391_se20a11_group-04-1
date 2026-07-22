import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCaseService } from '../services/useCaseService';
import { requirementApi } from '../services/requirementApi';
import CreateRequirementModal from './CreateRequirementModal';
import { FiCheck, FiPlus, FiCpu, FiLoader, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ApproveUseCaseModal = ({ isOpen, onClose, useCaseId, projectId, onSuccess }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [allReqs, setAllReqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !useCaseId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setSelectedReqId('');
      try {
        const reqsData = await requirementApi.getAllRequirements({ projectId, size: 1000 });
        setAllReqs(reqsData.content || reqsData.items || (Array.isArray(reqsData) ? reqsData : []));
        
        const suggData = await useCaseService.suggestRequirements(useCaseId, projectId);
        setSuggestions(suggData || []);
        
        if (suggData && suggData.length > 0) {
          setSelectedReqId(suggData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
        toast.error("Không thể lấy đề xuất từ AI");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, useCaseId, projectId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!selectedReqId) {
      toast.error("Vui lòng chọn 1 Requirement");
      return;
    }
    setSubmitting(true);
    try {
      await useCaseService.approveUseCase(useCaseId, projectId, selectedReqId);
      toast.success("Use Case đã được duyệt và gán thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi duyệt Use Case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewSuccess = async (newReq) => {
    setSubmitting(true);
    try {
      await useCaseService.approveUseCase(useCaseId, projectId, newReq.id);
      toast.success("Tạo Requirement mới và duyệt Use Case thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Duyệt Use Case thất bại");
    } finally {
      setSubmitting(false);
      setShowCreateModal(false);
    }
  };

  if (showCreateModal) {
    return (
      <CreateRequirementModal
        isOpen={true}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateNewSuccess}
        projectId={projectId}
      />
    );
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-[#1E707D]/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1E707D]/10 rounded-lg text-[#1E707D]">
              <FiCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Duyệt Use Case</h2>
              <p className="text-sm text-text-secondary">Chọn Requirement phù hợp để gán</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg text-text-secondary">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#1E707D]">
              <FiLoader className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium animate-pulse">AI đang phân tích và tìm Requirement phù hợp...</p>
            </div>
          ) : (
            <>
              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#1E707D]">
                    <FiCpu className="w-4 h-4" />
                    <span>Đề xuất thông minh từ AI</span>
                  </div>
                  <div className="grid gap-2">
                    {suggestions.map(req => (
                      <label 
                        key={req.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedReqId === req.id 
                            ? 'border-[#1E707D] bg-[#1E707D]/5 shadow-sm' 
                            : 'border-border hover:bg-black/5'
                        }`}
                        onClick={() => setSelectedReqId(req.id)}
                      >
                        <input 
                          type="radio" 
                          name="requirement" 
                          className="mt-1"
                          checked={selectedReqId === req.id}
                          onChange={() => setSelectedReqId(req.id)}
                        />
                        <div>
                          <div className="font-medium text-text">{req.reqCode}: {req.title}</div>
                          {req.description && (
                            <div className="text-xs text-text-secondary line-clamp-1 mt-1">{req.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* All Requirements Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text">Hoặc chọn Requirement khác trong dự án</label>
                <select 
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-[#1E707D]/20 focus:border-[#1E707D]"
                  value={selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Chọn Requirement --</option>
                  {allReqs.map(req => (
                    <option key={req.id} value={req.id}>{req.reqCode}: {req.title}</option>
                  ))}
                </select>
              </div>

              {/* Create New Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface px-2 text-xs text-text-secondary uppercase tracking-wider">Hoặc</span>
                </div>
              </div>

              {/* Create New Button */}
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-[#1E707D]/50 rounded-lg text-[#1E707D] hover:bg-[#1E707D]/5 transition-colors font-medium"
              >
                <FiPlus className="w-4 h-4" />
                Tạo Requirement Mới
              </button>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-3 bg-black/5">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-text-secondary hover:bg-black/5 transition-colors"
            disabled={submitting}
          >
            Hủy
          </button>
          <button 
            onClick={handleApprove}
            disabled={loading || submitting || !selectedReqId}
            className="px-4 py-2 rounded-lg font-medium text-white bg-[#1E707D] hover:bg-[#1E707D]-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting && <FiLoader className="w-4 h-4 animate-spin" />}
            Xác nhận Duyệt
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ApproveUseCaseModal;
