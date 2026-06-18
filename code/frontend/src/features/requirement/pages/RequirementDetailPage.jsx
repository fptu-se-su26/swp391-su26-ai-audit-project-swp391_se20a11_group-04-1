import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import RequirementDetailHeader from '../components/RequirementDetailHeader';
import RequirementDetailDescription from '../components/RequirementDetailDescription';
import RequirementDetailCriteria from '../components/RequirementDetailCriteria';
import RequirementDetailRelationships from '../components/RequirementDetailRelationships';
import RequirementDetailTraceability from '../components/RequirementDetailTraceability';
import RequirementDetailAIActions from '../components/RequirementDetailAIActions';
import UseCaseFormModal from '../components/UseCaseFormModal';
import TestCaseFormModal from '../../testing/components/TestCaseFormModal';
import { requirementApi } from '../services/requirementApi';

const RequirementDetailPage = () => {
  const { projectId, id } = useParams();

  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUseCaseModalOpen, setIsUseCaseModalOpen] = useState(false);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);

  const fetchRequirement = useCallback(async () => {
    try {
      setLoading(true);
      if (!id) return;
      const numericId = id.replace('REQ-', '');
      const data = await requirementApi.getRequirementById(numericId);
      
      try {
        if (projectId) {
          const [
            { useCaseService },
            { taskService },
            { testCaseService },
            { evidenceService }
          ] = await Promise.all([
            import('../services/useCaseService'),
            import('../../kanban/services/taskService'),
            import('../../testing/services/testCaseService'),
            import('../../evidence/services/evidenceService')
          ]);

          const [ucs, tasks, testRes, evRes] = await Promise.all([
            useCaseService.getAllUseCases(projectId).catch(() => []),
            taskService.getProjectTasks(projectId).catch(() => []),
            testCaseService.getTestCases(projectId, { size: 1000 }).catch(() => ({ content: [] })),
            evidenceService.searchEvidence({ projectId, size: 1000 }).catch(() => ({ content: [] }))
          ]);

          data.useCases = (ucs || []).filter(uc => String(uc.requirementId) === String(data.id));
          
          data.tasks = (tasks || []).filter(t => 
            String(t.requirementId) === String(data.id) ||
            (t.useCaseId && data.useCases.some(uc => String(uc.id) === String(t.useCaseId))) ||
            (t.useCaseCode && data.useCases.some(uc => String(uc.code) === String(t.useCaseCode)))
          );
          
          const tests = testRes?.content || testRes?.data || testRes || [];
          data.tests = (Array.isArray(tests) ? tests : []).filter(t => 
            String(t.requirement?.id) === String(data.id) || String(t.requirementId) === String(data.id)
          );

          const evidences = evRes?.content || evRes?.data || evRes || [];
          data.evidences = (Array.isArray(evidences) ? evidences : []).filter(e => {
            if (!e.evidenceLinks || !Array.isArray(e.evidenceLinks)) return false;
            return e.evidenceLinks.some(link => {
              const type = link.entityType?.toUpperCase();
              if (type === 'REQUIREMENT' && String(link.entityId) === String(data.id)) return true;
              if (type === 'USE_CASE' && data.useCases.some(uc => String(uc.id) === String(link.entityId))) return true;
              if (type === 'TASK' && data.tasks.some(t => String(t.id) === String(link.entityId))) return true;
              if (type === 'TEST_CASE' && data.tests.some(t => String(t.id) === String(link.entityId))) return true;
              return false;
            });
          });
        } else {
          data.useCases = [];
          data.tasks = [];
          data.tests = [];
          data.evidences = [];
        }
      } catch (e) {
        console.error("Lỗi lấy dữ liệu liên kết", e);
        data.useCases = [];
        data.tasks = [];
        data.tests = [];
        data.evidences = [];
      }
      
      setRequirement(data);
    } catch (error) {
      console.error("Lỗi khi tải Requirement:", error);
    } finally {
      setLoading(false);
    }
  }, [id, projectId]);

  useEffect(() => {
    if (id) {
      fetchRequirement();
    }
  }, [id, fetchRequirement]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-secondary">Đang tải dữ liệu...</div>;
  }

  if (!requirement) {
    return <div className="flex justify-center items-center h-screen text-error">Không tìm thấy Requirement!</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-32">

      <RequirementDetailHeader requirement={requirement} onRefresh={fetchRequirement} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-stack_md">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          <RequirementDetailDescription requirement={requirement} />
          <RequirementDetailCriteria requirement={requirement} />
          <RequirementDetailRelationships 
            requirement={requirement} 
            onOpenUseCaseModal={() => setIsUseCaseModalOpen(true)}
            onOpenTestCaseModal={() => setIsTestCaseModalOpen(true)}
          />
        </div>

        {/* Right Column: Sidebar Panels */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <RequirementDetailAIActions requirement={requirement} />
          <RequirementDetailTraceability requirement={requirement} />
        </div>
      </div>

      <UseCaseFormModal 
        isOpen={isUseCaseModalOpen} 
        onClose={() => setIsUseCaseModalOpen(false)}
        onSuccess={fetchRequirement}
        requirementId={requirement.id}
      />

      <TestCaseFormModal 
        isOpen={isTestCaseModalOpen} 
        onClose={() => setIsTestCaseModalOpen(false)}
        onSubmit={fetchRequirement}
        testCase={{ requirementId: requirement.id }}
      />
    </div>
  );
};

export default RequirementDetailPage;
