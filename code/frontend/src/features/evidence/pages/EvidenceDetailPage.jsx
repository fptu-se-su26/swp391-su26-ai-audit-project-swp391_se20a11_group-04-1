import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evidenceService } from '../services/evidenceService';
import EvidenceDetailHeader from '../components/EvidenceDetailHeader';
import EvidencePreview from '../components/EvidencePreview';
import EvidenceLinkedEntities from '../components/EvidenceLinkedEntities';
import EvidenceReviewPanel from '../components/EvidenceReviewPanel';
import EvidenceFormModal from '../components/EvidenceFormModal';
import EvidenceDeleteConfirmModal from '../components/EvidenceDeleteConfirmModal';
import toast from 'react-hot-toast';

/**
 * EvidenceDetailPage — Trang chi tiết Evidence
 * Hiển thị preview, metadata, linked entities, review panel
 */
const EvidenceDetailPage = () => {
  const { id, projectId } = useParams();
  const navigate = useNavigate();

  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // Fetch evidence detail
  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const data = await evidenceService.getEvidenceById(id, projectId);
      setEvidence(data);
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
      toast.error('Không thể tải chi tiết Evidence');
      // Clear on error
      setEvidence(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEvidence();
    }
  }, [id]);

  // Handlers
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData) => {
    try {
      await evidenceService.updateEvidence(id, formData, projectId);
      toast.success('Evidence updated successfully');
      fetchEvidence();
    } catch (error) {
      console.error('Failed to update evidence:', error);
      toast.error('Failed to update evidence');
      throw error;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await evidenceService.deleteEvidence(id, projectId);
      toast.success('Evidence deleted successfully');
      navigate(`/projects/${projectId}/evidence`);
    } catch (error) {
      console.error('Failed to delete evidence:', error);
      toast.error('Failed to delete evidence');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReview = async (status, comment) => {
    setIsReviewing(true);
    try {
      await evidenceService.updateEvidenceStatus(id, status, comment, projectId);
      toast.success(`Evidence ${status.toLowerCase().replace('_', ' ')} successfully`);
      fetchEvidence();
    } catch (error) {
      console.error('Failed to review evidence:', error);
      toast.error('Failed to update evidence status');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleUnlink = async (linkId) => {
    try {
      await evidenceService.unlinkEvidence(id, linkId, projectId);
      toast.success('Link removed');
      fetchEvidence();
    } catch (error) {
      console.error('Failed to unlink:', error);
      toast.error('Failed to remove link');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 md:p-10 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[36px] animate-spin">progress_activity</span>
          <span className="text-secondary font-medium font-body-md text-body-md">Loading evidence details...</span>
        </div>
      </div>
    );
  }

  // Not found state
  if (!evidence) {
    return (
      <div className="p-6 md:p-10 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-outline text-[48px]">search_off</span>
          <span className="text-on-surface font-medium font-headline-sm text-headline-sm">Evidence not found</span>
          <span className="text-on-surface-variant font-body-md text-body-md">
            The evidence you're looking for doesn't exist or has been deleted.
          </span>
          <button
            onClick={() => navigate(`/projects/${projectId}/evidence`)}
            className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors font-body-md text-body-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Evidence Vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 z-10 h-full">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <EvidenceDetailHeader
          evidence={evidence}
          onEdit={handleEdit}
          onDelete={() => setShowDeleteModal(true)}
          onReview={handleReview}
        />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column — Preview */}
          <div className="lg:col-span-2">
            <EvidencePreview evidence={evidence} />

            {/* Description Card */}
            {evidence.description && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">notes</span>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Description</span>
                </div>
                <div className="p-4">
                  <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">
                    {evidence.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            {/* Review Panel */}
            <EvidenceReviewPanel
              evidence={evidence}
              onReview={handleReview}
              isSubmitting={isReviewing}
            />

            {/* Linked Entities */}
            <EvidenceLinkedEntities
              links={evidence.evidenceLinks || []}
              onUnlink={handleUnlink}
            />

            {/* Metadata Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">info</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">Details</span>
              </div>
              <div className="p-4 space-y-3">
                <MetaRow label="Evidence ID" value={`EV-${String(evidence.id).padStart(3, '0')}`} />
                <MetaRow label="Project ID" value={evidence.projectId || evidence.project_id || '—'} />
                {evidence.fileUrl && (
                  <MetaRow
                    label="File URL"
                    value={
                      <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[13px] break-all">
                        {evidence.fileUrl.length > 40 ? evidence.fileUrl.slice(0, 40) + '...' : evidence.fileUrl}
                      </a>
                    }
                  />
                )}
                {(evidence.externalUrl || evidence.external_url) && (
                  <MetaRow
                    label="External URL"
                    value={
                      <a href={evidence.externalUrl || evidence.external_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[13px] break-all">
                        {(evidence.externalUrl || evidence.external_url).length > 40
                          ? (evidence.externalUrl || evidence.external_url).slice(0, 40) + '...'
                          : evidence.externalUrl || evidence.external_url}
                      </a>
                    }
                  />
                )}
                <MetaRow
                  label="Created At"
                  value={
                    evidence.createdAt
                      ? new Date(evidence.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'
                  }
                />
                {evidence.reviewedAt && (
                  <MetaRow
                    label="Reviewed At"
                    value={new Date(evidence.reviewedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EvidenceFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(formData) => handleUpdate(formData)}
        editData={evidence}
      />

      {/* Delete Confirm Modal */}
      <EvidenceDeleteConfirmModal
        isOpen={showDeleteModal}
        evidence={evidence}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

/**
 * Helper component for metadata rows
 */
const MetaRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-2">
    <span className="font-body-md text-[13px] text-on-surface-variant flex-shrink-0">{label}</span>
    <span className="font-body-md text-[13px] text-on-surface text-right">
      {typeof value === 'string' || typeof value === 'number' ? value : value}
    </span>
  </div>
);

export default EvidenceDetailPage;
