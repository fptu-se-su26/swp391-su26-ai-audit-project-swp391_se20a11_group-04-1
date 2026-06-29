import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import RequirementDetailHeader from '../components/RequirementDetailHeader';
import RequirementDetailDescription from '../components/RequirementDetailDescription';
import RequirementDetailCriteria from '../components/RequirementDetailCriteria';
import RequirementDetailRelationships from '../components/RequirementDetailRelationships';
import RequirementDetailTraceability from '../components/RequirementDetailTraceability';
import RequirementDetailAIActions from '../components/RequirementDetailAIActions';
import { requirementApi } from '../services/requirementApi';

const RequirementDetailPage = () => {
  const { id } = useParams();

  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRequirement = useCallback(async () => {
    try {
      setLoading(true);
      const numericId = id.replace('REQ-', '');
      const data = await requirementApi.getRequirementById(numericId);
      setRequirement(data);
    } catch (error) {
      console.error("Lỗi khi tải Requirement:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
      <RequirementDetailHeader requirement={requirement} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-stack_md">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          <RequirementDetailDescription requirement={requirement} />
          <RequirementDetailCriteria requirement={requirement} />
          <RequirementDetailRelationships requirement={requirement} />
        </div>

        {/* Right Column: Sidebar Panels */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <RequirementDetailAIActions requirement={requirement} />
          <RequirementDetailTraceability requirement={requirement} />
        </div>
      </div>

    </div>
  );
};

export default RequirementDetailPage;
