import React, { useState, useEffect } from 'react';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiRefreshCw, FiAlertTriangle, FiXCircle, FiCheckCircle, FiEdit2, FiFileText } from 'react-icons/fi';
import { BsStars, BsArrowUpRight } from 'react-icons/bs';
import RequirementInlineEdit from '../components/RequirementInlineEdit';

const renderHighlightedText = (text, excerpt) => {
  if (!text) return "No original document text available.";
  if (!excerpt) return text;

  // Remove surrounding quotes if AI added them
  let normalizedExcerpt = excerpt.replace(/^["']|["']$/g, '').trim();
  normalizedExcerpt = normalizedExcerpt.replace(/\s+/g, ' ').trim();
  if (!normalizedExcerpt) return text;

  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escapeRegExp(normalizedExcerpt).replace(/\\ /g, '\\s+');
  
  try {
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    
    // If exact match fails, try matching just the first 20 characters as a fallback
    if (parts.length === 1 && normalizedExcerpt.length > 20) {
      const shortExcerpt = normalizedExcerpt.substring(0, 20);
      const shortPattern = escapeRegExp(shortExcerpt).replace(/\\ /g, '\\s+');
      const shortRegex = new RegExp(`(${shortPattern})`, 'gi');
      const shortParts = text.split(shortRegex);
      if (shortParts.length > 1) {
        return shortParts.map((part, i) => 
          (i % 2 !== 0) ? <mark key={i} id="highlighted-excerpt" className="bg-[#FEF08A] text-gray-900 px-1 rounded shadow-sm transition-all duration-300">{part}</mark> : part
        );
      }
    }

    return parts.map((part, i) => 
      (i % 2 !== 0) ? <mark key={i} id="highlighted-excerpt" className="bg-[#FEF08A] text-gray-900 px-1 rounded shadow-sm transition-all duration-300">{part}</mark> : part
    );
  } catch (e) {
    return text;
  }
};

const AiStagingReviewPage = () => {
  const { activeProject } = useProjectStore();
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [filter, setFilter] = useState('ALL'); // ALL, OK, Warning, Error
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [previousPayload, setPreviousPayload] = useState(null);
  const [localPayload, setLocalPayload] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [hoveredExcerpt, setHoveredExcerpt] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleProgress = (event) => {
      const { step, message } = event.detail;
      setProgressStep(step);
      setProgressMessage(message);
    };
    window.addEventListener('AI_PROGRESS', handleProgress);
    return () => window.removeEventListener('AI_PROGRESS', handleProgress);
  }, []);

  useEffect(() => {
    if (activeProject?.id) {
      fetchStagingData();
    }
  }, [activeProject?.id]);

  const fetchStagingData = async () => {
    try {
      setLoading(true);
      const data = await requirementApi.getStagingRequirements(activeProject.id);
      const dataArray = Array.isArray(data) ? data : (data?.data || []);
      setGenerations(dataArray);
      
      if (dataArray && dataArray.length > 0 && dataArray[0]?.payload) {
        let payloadData = [];
        if (Array.isArray(dataArray[0].payload)) {
          payloadData = dataArray[0].payload;
        } else if (typeof dataArray[0].payload === 'string') {
          payloadData = JSON.parse(dataArray[0].payload);
        }
        setLocalPayload(payloadData);
        const initialIndices = new Set();
        payloadData.forEach((item, i) => {
          if (!item.isDuplicate) {
            initialIndices.add(i);
          }
        });
        setSelectedIndices(initialIndices);
      }
    } catch (error) {
      console.error('Error fetching staging data:', error);
      toast.error('Lỗi khi tải dữ liệu nháp từ AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (generationId) => {
    if (selectedIndices.size === 0) return;
    try {
      setApproving(true);
      const indicesArray = Array.from(selectedIndices);
      await requirementApi.approveStagingRequirements(generationId, indicesArray, localPayload);
      toast.success('Duyệt thành công! Đã lưu vào dự án.');
      navigate(`/projects/${activeProject.id}/requirements`);
    } catch (error) {
      console.error('Error approving staging data:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt Requirement.');
    } finally {
      setApproving(false);
    }
  };

  const handleRegenerate = async (generationId) => {
    if (!currentGen) return;
    try {
      setIsRegenerating(true);
      setProgressStep(0);
      setProgressMessage('Bắt đầu phân tích lại...');
      
      // Save old payload to compute diff later
      setPreviousPayload(localPayload);
      
      await requirementApi.regenerateRequirementsWithAi(generationId);
      toast.success('Đã chạy lại AI thành công!');
      
      // Fetch new data
      await fetchStagingData();
    } catch (error) {
      console.error('Error regenerating:', error);
      toast.error(error.response?.data?.error || 'Lỗi khi chạy lại AI.');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185FA5]"></div>
      </div>
    );
  }

  const currentGen = generations[0];

  if (!Array.isArray(localPayload) || localPayload.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-gray-500 font-sans">
        <p className="text-[14px]">No pending generations to review.</p>
        <button 
          onClick={() => navigate(`/projects/${activeProject.id}/requirements`)}
          className="mt-4 px-4 py-2 bg-[#185FA5] text-white text-[13px] rounded-[6px] hover:bg-[#124d87]"
        >
          Back to list
        </button>
      </div>
    );
  }

  // Pre-process data and compute diff
  const requirements = localPayload.map((r, idx) => {
    const status = r.quality_status || 'OK';
    const isOk = status === 'OK' || status === 'ok';
    const isWarning = status === 'Warning' || status === 'warning';
    const isError = status === 'Error' || status === 'error';
    
    let normalizedStatus = 'OK';
    if (isWarning) normalizedStatus = 'Warning';
    if (isError) normalizedStatus = 'Error';

    let diffStatus = 'UNCHANGED';
    if (previousPayload) {
      const oldItem = previousPayload.find(old => old.title === r.title);
      if (!oldItem) {
        diffStatus = 'NEW';
      }
    } else {
      diffStatus = 'UNCHANGED';
    }

    return {
      ...r,
      _idx: idx,
      _status: normalizedStatus,
      _diffStatus: diffStatus
    };
  });

  // Handle removed items
  let removedItems = [];
  if (previousPayload) {
    previousPayload.forEach((oldItem, idx) => {
      const stillExists = localPayload.some(newReq => newReq.title === oldItem.title);
      if (!stillExists) {
        removedItems.push({
          ...oldItem,
          _idx: `removed_${idx}`,
          _status: 'REMOVED',
          _diffStatus: 'REMOVED'
        });
      }
    });
  }

  const countAll = requirements.length;
  const countOk = requirements.filter(r => r._status === 'OK').length;
  const countWarning = requirements.filter(r => r._status === 'Warning').length;
  const countError = requirements.filter(r => r._status === 'Error').length;
  const countDuplicates = requirements.filter(r => r.isDuplicate).length;
  const allDuplicates = countAll > 0 && countAll === countDuplicates;

  const filteredReqs = requirements.filter(r => {
    if (filter === 'ALL') return true;
    return r._status === filter;
  });

  const toggleSelection = (idx) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(idx)) {
      newSelection.delete(idx);
    } else {
      newSelection.add(idx);
    }
    setSelectedIndices(newSelection);
  };

  const handleSelectAll = () => {
    const visibleIndices = filteredReqs.filter(r => !r.isDuplicate).map(r => r._idx);
    const allVisibleSelected = visibleIndices.length > 0 && visibleIndices.every(idx => selectedIndices.has(idx));
    
    const newSelection = new Set(selectedIndices);
    if (allVisibleSelected) {
      visibleIndices.forEach(idx => newSelection.delete(idx));
    } else {
      visibleIndices.forEach(idx => newSelection.add(idx));
    }
    setSelectedIndices(newSelection);
  };

  const isAllVisibleSelected = filteredReqs.filter(r => !r.isDuplicate).length > 0 && 
    filteredReqs.filter(r => !r.isDuplicate).every(r => selectedIndices.has(r._idx));

  // Compute Overall Score visually based on statuses
  const totalScore = (countOk * 100) + (countWarning * 60) + (countError * 30);
  const avgScore = countAll > 0 ? Math.round(totalScore / countAll) : 0;

  return (
    <div className="h-[calc(100vh-64px)] bg-[#F8FAFC] font-sans flex flex-col overflow-hidden">
      {/* HEADER (Full Width) */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[#E5E7EB] bg-white flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
            <BsStars size={20} className="text-[#185FA5]" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900 leading-tight">AI Gen Requirement — Review & Confirm</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Found <span className="font-bold text-[#185FA5]">{countAll} requirements</span>. Review and confirm to save.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <button 
            onClick={() => navigate(`/projects/${activeProject.id}/requirements`)}
            className="h-[36px] px-[14px] text-[13px] font-medium text-gray-600 bg-transparent border-[0.5px] border-transparent hover:bg-gray-100 rounded-[6px] flex items-center gap-[6px] transition-colors"
          >
            <FiX size={14} /> Discard
          </button>
          <button 
            onClick={() => handleRegenerate(currentGen.generationId)}
            disabled={isRegenerating || approving}
            className="h-[36px] px-[14px] text-[13px] font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-[6px] flex items-center gap-[6px] transition-colors shadow-sm disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} /> Re-generate
          </button>
          <button 
            onClick={() => handleApprove(currentGen.generationId)}
            disabled={approving || selectedIndices.size === 0}
            className="h-[36px] px-[16px] text-[13px] font-medium text-white bg-[#185FA5] hover:bg-[#124d87] rounded-[6px] flex items-center gap-[6px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <FiCheck size={14} /> {approving ? 'Approving...' : `Confirm Selected ↗`}
          </button>
        </div>
      </div>

      {/* SPLIT VIEW */}
      <div className="flex-1 flex overflow-hidden">
         {/* LEFT PANEL: Original Text */}
         <div className="w-1/2 border-r border-[#E5E7EB] bg-white flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
            <div className="p-[14px_16px] border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <FiFileText className="text-[#6B7280]" /> 
                 <span className="font-semibold text-[13px] text-gray-700">Original Document Source</span>
               </div>
               <span className="text-[12px] text-gray-500 italic">Hover over requirement to highlight source</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-[14.5px] leading-[1.8] text-gray-800 whitespace-pre-wrap font-serif">
               {renderHighlightedText(currentGen.documentText, hoveredExcerpt)}
            </div>
         </div>

         {/* RIGHT PANEL: Requirements */}
         <div className="w-1/2 flex flex-col bg-[#F3F4F6] relative">
            
            {/* CONTEXT WARNING BANNER */}
            {currentGen.contextWarning && (
              <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex items-start gap-2 shadow-sm z-10">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-[13px]">Document Context Warning!</h3>
                  <p className="text-[12px] mt-1">{currentGen.contextWarning}</p>
                </div>
              </div>
            )}

            {/* ALL DUPLICATES BANNER */}
            {allDuplicates && (
              <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md flex items-start gap-2 shadow-sm z-10">
                <span className="text-xl">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-[13px]">No New Requirements Found</h3>
                  <p className="text-[12px] mt-1">All {countAll} extracted requirements already exist in this project. There is nothing new to save.</p>
                </div>
              </div>
            )}

            {/* FILTER ROW */}
            <div className="p-[14px_16px] border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between z-10">
              <div className="flex items-center gap-[8px]">
                <button 
                  onClick={() => setFilter('ALL')}
                  className={`h-[28px] px-[12px] text-[12px] font-medium rounded-full border-[0.5px] transition-colors ${filter === 'ALL' ? 'bg-[#185FA5] text-white border-[#185FA5]' : 'bg-[#FFFFFF] text-gray-600 border-[#E5E7EB] hover:bg-gray-50 shadow-sm'}`}
                >
                  All ({countAll})
                </button>
                <button 
                  onClick={() => setFilter('OK')}
                  className={`h-[28px] px-[12px] text-[12px] font-medium rounded-full border-[0.5px] transition-colors flex items-center gap-1 ${filter === 'OK' ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'bg-[#FFFFFF] text-gray-600 border-[#E5E7EB] hover:bg-gray-50 shadow-sm'}`}
                >
                  ✓ OK ({countOk})
                </button>
                <button 
                  onClick={() => setFilter('Warning')}
                  className={`h-[28px] px-[12px] text-[12px] font-medium rounded-full border-[0.5px] transition-colors flex items-center gap-1 ${filter === 'Warning' ? 'bg-[#EF9F27] text-white border-[#EF9F27]' : 'bg-[#FFFFFF] text-gray-600 border-[#E5E7EB] hover:bg-gray-50 shadow-sm'}`}
                >
                  ⚠ Warning ({countWarning})
                </button>
                <button 
                  onClick={() => setFilter('Error')}
                  className={`h-[28px] px-[12px] text-[12px] font-medium rounded-full border-[0.5px] transition-colors flex items-center gap-1 ${filter === 'Error' ? 'bg-[#E24B4A] text-white border-[#E24B4A]' : 'bg-[#FFFFFF] text-gray-600 border-[#E5E7EB] hover:bg-gray-50 shadow-sm'}`}
                >
                  ⊗ Error ({countError})
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-gray-500 italic">Click to select</span>
                <label className="flex items-center gap-[6px] cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={isAllVisibleSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#185FA5] border-gray-300 rounded focus:ring-[#185FA5] accent-[#185FA5] cursor-pointer"
                  />
                  <span className="text-[13px] text-gray-600 group-hover:text-gray-900 select-none font-medium">Select all</span>
                </label>
              </div>
            </div>

            {/* REQUIREMENT CARDS */}
            <div className="flex-1 overflow-y-auto p-4 pb-[80px]">
              <div className="flex flex-col gap-3">
                {filteredReqs.map((req) => {
                  const isSelected = selectedIndices.has(req._idx);
                  
                  // Colors based on status
                  let topBarColor = '#1D9E75';
                  let borderColor = '#E5E7EB';
                  let hoverBorder = '#A7F3D0';
                  let activeBorder = '#1D9E75';
                  
                  if (req._status === 'Warning') {
                    topBarColor = '#EF9F27';
                    borderColor = '#FDE68A';
                    hoverBorder = '#FCD34D';
                    activeBorder = '#EF9F27';
                  } else if (req._status === 'Error') {
                    topBarColor = '#E24B4A';
                    borderColor = '#FECACA';
                    hoverBorder = '#FCA5A5';
                    activeBorder = '#E24B4A';
                  }
                  
                  let diffWrapperClass = "";
                  let diffBadge = null;
                  if (req._diffStatus === 'NEW' && previousPayload) {
                    diffWrapperClass = "border-l-4 border-l-[#1D9E75] bg-[#E8F5E9]/30";
                    diffBadge = <span className="text-[10px] bg-[#1D9E75]/10 text-[#1D9E75] px-2 py-0.5 rounded-full font-bold ml-2">NEW</span>;
                  }

                  let boxStyle = {};
                  if (isSelected && editingIndex !== req._idx) {
                    boxStyle = { borderColor: activeBorder, boxShadow: `0 0 0 1px ${activeBorder}` };
                  } else {
                    boxStyle = { borderColor: borderColor };
                  }

                  return (
                    <div 
                      key={req._idx}
                      onClick={() => { if (editingIndex !== req._idx) toggleSelection(req._idx); }}
                      className={`relative flex flex-col bg-white rounded-[10px] border-[0.5px] p-4 cursor-pointer transition-all hover:shadow-md ${diffWrapperClass}`}
                      style={boxStyle}
                      onMouseEnter={(e) => { 
                        if (!isSelected && editingIndex !== req._idx) e.currentTarget.style.borderColor = hoverBorder; 
                      }}
                      onMouseLeave={(e) => { 
                        if (!isSelected && editingIndex !== req._idx) e.currentTarget.style.borderColor = borderColor; 
                      }}
                    >
                      {req.isDuplicate && (
                        <div className="absolute inset-0 bg-gray-50/50 z-10 pointer-events-none rounded-[10px]"></div>
                      )}
                      {/* Top colored strip for visual status */}
                      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[10px]" style={{ backgroundColor: topBarColor, opacity: 0.8 }}></div>

                      {editingIndex === req._idx ? (
                        <RequirementInlineEdit 
                          requirement={req}
                          onSave={(editedReq) => {
                            const newPayload = [...localPayload];
                            newPayload[req._idx] = { ...newPayload[req._idx], ...editedReq };
                            setLocalPayload(newPayload);
                            setEditingIndex(null);
                          }}
                          onCancel={() => setEditingIndex(null)}
                        />
                      ) : (
                        <>
                        <div className={`flex items-start gap-[12px] ${req.isDuplicate ? 'opacity-70' : ''}`}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            disabled={req.isDuplicate}
                            onChange={() => !req.isDuplicate && toggleSelection(req._idx)}
                            className="mt-[2px] w-[18px] h-[18px] text-[#185FA5] border-gray-300 rounded focus:ring-[#185FA5] accent-[#185FA5] cursor-pointer shrink-0 disabled:cursor-not-allowed"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-[8px] min-w-0">
                                <span className="bg-[#EEEDFE] text-[#6366F1] px-[6px] py-[2px] rounded-[4px] text-[11px] font-bold shrink-0">
                                  REQ-{(req._idx + 1).toString().padStart(3, '0')}
                                </span>
                                {req.isDuplicate && (
                                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 z-20">DUPLICATE</span>
                                )}
                                <h3 className={`text-[14.5px] font-bold truncate ${req.isDuplicate ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {req.title || 'Untitled Requirement'}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {diffBadge}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setEditingIndex(req._idx); }}
                                  className="text-gray-400 hover:text-[#185FA5] transition-colors p-1 flex items-center justify-center rounded hover:bg-blue-50"
                                  title="Edit Requirement"
                                >
                                  <FiEdit2 size={13} />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-[13px] text-gray-600 leading-[20px] mb-3">
                              {req.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`px-[8px] py-[2px] rounded-[6px] text-[11px] font-bold uppercase ${req.type === 'NON_FUNCTIONAL' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>
                                {req.type === 'NON_FUNCTIONAL' ? 'Non-Functional' : 'Functional'}
                              </span>
                              
                              {(() => {
                                let prioColor = 'bg-gray-100 text-gray-600';
                                const p = (req.priority || '').toUpperCase();
                                if (p === 'CRITICAL' || p === 'HIGH') prioColor = 'bg-[#FEF2F2] text-[#DC2626]';
                                else if (p === 'MEDIUM') prioColor = 'bg-[#FFFBEB] text-[#D97706]';
                                else if (p === 'LOW') prioColor = 'bg-[#EFF6FF] text-[#2563EB]';
                                
                                return (
                                  <span className={`px-[8px] py-[2px] rounded-[6px] text-[11px] font-bold uppercase ${prioColor}`}>
                                    {req.priority || 'Medium'}
                                  </span>
                                );
                              })()}
                              
                              <span className={`px-[8px] py-[2px] rounded-[6px] text-[11px] font-bold flex items-center gap-1 ${req._status === 'Warning' ? 'bg-[#FFFBEB] text-[#D97706]' : req._status === 'Error' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'}`}>
                                {req._status === 'Warning' && <FiAlertTriangle size={12} />}
                                {req._status === 'Error' && <FiXCircle size={12} />}
                                {req._status === 'OK' && <FiCheckCircle size={12} />}
                                {req._status}
                              </span>
                            </div>

                            {/* Warnings/Errors Section */}
                            {(req.warnings?.length > 0 || req.errors?.length > 0) && (
                              <div className="mt-2 flex flex-col gap-2 mb-3">
                                {req.errors?.map((err, i) => (
                                  <div key={`err-${i}`} className="bg-[#FCEBEB] rounded-[6px] p-[8px_10px] flex items-start gap-[8px] border border-[#FECACA]">
                                    <FiXCircle size={14} className="text-[#E24B4A] mt-[2px] shrink-0" />
                                    <div>
                                      <p className="text-[12px] font-bold text-[#E24B4A] leading-tight mb-1">Critical Error found</p>
                                      <p className="text-[12px] text-[#C23A3A] leading-snug">{err}</p>
                                    </div>
                                  </div>
                                ))}
                                {req.warnings?.map((warn, i) => (
                                  <div key={`warn-${i}`} className="bg-[#FAEEDA] rounded-[6px] p-[8px_10px] flex items-start gap-[8px] border border-[#FDE68A]">
                                    <FiAlertTriangle size={14} className="text-[#EF9F27] mt-[2px] shrink-0" />
                                    <div>
                                      <p className="text-[12px] font-bold text-[#D97706] leading-tight mb-1">Needs Review</p>
                                      <p className="text-[12px] text-[#B45309] leading-snug">{warn}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* SOURCE EXCERPT HIGHLIGHT BUTTON */}
                            {req.source_excerpt && (
                              <div className="mt-3 inline-flex">
                                <button
                                  type="button"
                                  className="group flex items-center gap-[6px] bg-white text-[#185FA5] px-[12px] py-[6px] rounded-[6px] text-[12px] font-medium hover:bg-[#EFF6FF] transition-colors border border-[#BFDBFE] shadow-sm"
                                  onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setHoveredExcerpt(req.source_excerpt);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    setHoveredExcerpt('');
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const el = document.getElementById('highlighted-excerpt');
                                    if (el) {
                                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }}
                                >
                                  <FiFileText size={13} />
                                  <span className="flex items-center gap-1">
                                    View in source <BsArrowUpRight size={12} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                </button>
                              </div>
                            )}
                            
                          </div>
                        </div>
                        </>
                      )}
                    </div>
                  );
                })}
                
                {removedItems.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-[14px] font-semibold text-gray-500 mb-4 flex items-center gap-2">
                      <FiXCircle size={16} /> Requirements Removed by AI
                    </h3>
                    <div className="flex flex-col gap-[8px] opacity-60">
                      {removedItems.map(req => (
                        <div key={req._idx} className="relative flex flex-col bg-gray-50 rounded-[8px] border-[0.5px] border-gray-200 p-[16px] border-l-4 border-l-red-400">
                          <span className="absolute top-2 right-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">REMOVED</span>
                          <h3 className="text-[14.5px] font-semibold text-gray-500 mb-[4px] line-through decoration-red-400">{req.title || 'Untitled Requirement'}</h3>
                          <p className="text-[13.5px] text-gray-400 leading-relaxed line-through">{req.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredReqs.length === 0 && (
                  <div className="py-10 text-center text-gray-400 text-[13px]">
                    No requirements match this filter.
                  </div>
                )}
              </div>
            </div>

            {/* FIXED SUMMARY BAR AT BOTTOM OF RIGHT PANEL */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#FFFFFF] border-t-[0.5px] border-[#E5E7EB] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-10">
              <div className="h-[60px] px-6 flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className="flex items-center gap-[6px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#1D9E75]"></div>
                    <span className="text-[12px] font-medium text-gray-700">OK <span className="text-gray-400 font-normal">{countOk}</span></span>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#EF9F27]"></div>
                    <span className="text-[12px] font-medium text-gray-700">Warning <span className="text-gray-400 font-normal">{countWarning}</span></span>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#E24B4A]"></div>
                    <span className="text-[12px] font-medium text-gray-700">Error <span className="text-gray-400 font-normal">{countError}</span></span>
                  </div>
                </div>
                
                <div className="flex items-center gap-[12px]">
                  <span className="text-[12px] text-gray-500">AI quality score</span>
                  <div className="w-[80px] h-[6px] bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#185FA5] transition-all duration-1000 ease-out"
                      style={{ width: `${avgScore}%` }}
                    ></div>
                  </div>
                  <span className="text-[13px] font-bold text-gray-900 w-[30px] text-right">{avgScore}%</span>
                </div>
              </div>
            </div>

         </div>
      </div>

      {/* OVERLAY LOADING SPINNER */}
      {isRegenerating && (
        <div className="fixed inset-0 z-50 bg-[rgba(15,20,35,0.5)] flex items-center justify-center transition-opacity duration-200">
          <div className="w-[420px] bg-[#FFFFFF] border-[0.5px] border-[#E5E7EB] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-[24px_24px_0] flex items-center gap-[12px]">
              <div className="w-[38px] h-[38px] bg-[#EFF6FF] rounded-[10px] flex items-center justify-center shrink-0">
                <BsStars size={18} className="text-[#185FA5]" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[16px] font-medium text-gray-900 leading-snug">Re-generating Requirements</h2>
                <p className="text-[12px] text-[#6B7280]">AI is re-analyzing your document...</p>
              </div>
            </div>

            {/* Stepper */}
            <div className="p-[24px] flex items-center justify-between relative">
              {/* Step 1: Extract Text */}
              <div className="flex flex-col items-center relative z-10 w-[60px]">
                <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] font-medium transition-colors duration-300 ${progressStep >= 1 ? 'bg-[#1D9E75] text-white' : progressStep === 0 ? 'bg-[#185FA5] text-white' : 'bg-white border-[1.5px] border-[#D1D5DB] text-[#9CA3AF]'}`}>
                  {progressStep >= 1 ? <FiCheck size={16} /> : '1'}
                </div>
                <span className={`text-[12px] mt-2 text-center whitespace-nowrap transition-colors duration-300 ${progressStep >= 0 ? 'text-[#185FA5] font-medium' : 'text-[#9CA3AF]'}`}>Extract Text</span>
              </div>

              {/* Line 1-2 */}
              <div className="flex-1 h-[2px] mx-2 relative top-[-10px]">
                <div className="w-full h-full border-t-[2px] border-dashed border-[#E5E7EB] absolute top-0 left-0"></div>
                <div className="h-full bg-[#185FA5] absolute top-0 left-0 transition-all duration-500" style={{ width: progressStep >= 1 ? '100%' : '0%' }}></div>
              </div>

              {/* Step 2: Generate */}
              <div className="flex flex-col items-center relative z-10 w-[60px]">
                <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] font-medium transition-colors duration-300 ${progressStep >= 2 ? 'bg-[#1D9E75] text-white' : progressStep === 1 ? 'bg-[#185FA5] text-white' : 'bg-white border-[1.5px] border-[#D1D5DB] text-[#9CA3AF]'}`}>
                  {progressStep >= 2 ? <FiCheck size={16} /> : '2'}
                </div>
                <span className={`text-[12px] mt-2 text-center whitespace-nowrap transition-colors duration-300 ${progressStep >= 1 ? 'text-[#185FA5] font-medium' : 'text-[#9CA3AF]'}`}>Generate</span>
              </div>

              {/* Line 2-3 */}
              <div className="flex-1 h-[2px] mx-2 relative top-[-10px]">
                <div className="w-full h-full border-t-[2px] border-dashed border-[#E5E7EB] absolute top-0 left-0"></div>
                <div className="h-full bg-[#185FA5] absolute top-0 left-0 transition-all duration-500" style={{ width: progressStep >= 2 ? '100%' : '0%' }}></div>
              </div>

              {/* Step 3: Critic Review */}
              <div className="flex flex-col items-center relative z-10 w-[60px]">
                <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] font-medium transition-colors duration-300 ${progressStep >= 3 ? 'bg-[#1D9E75] text-white' : progressStep === 2 ? 'bg-[#185FA5] text-white' : 'bg-white border-[1.5px] border-[#D1D5DB] text-[#9CA3AF]'}`}>
                  {progressStep >= 3 ? <FiCheck size={16} /> : '3'}
                </div>
                <span className={`text-[12px] mt-2 text-center whitespace-nowrap transition-colors duration-300 ${progressStep >= 2 ? 'text-[#185FA5] font-medium' : 'text-[#9CA3AF]'}`}>Critic Review</span>
              </div>
            </div>

            {/* Current Step Status Box */}
            <div className="px-[24px] pb-[20px]">
              {progressStep >= 4 ? (
                <div className="bg-[#E1F5EE] border-[0.5px] border-[#1D9E75]/30 rounded-[10px] p-[16px] flex flex-col items-center justify-center gap-3">
                  <div className="w-[48px] h-[48px] rounded-full bg-[#1D9E75] flex items-center justify-center">
                    <FiCheck size={24} className="text-white" />
                  </div>
                  <span className="text-[14px] text-[#1D9E75] font-medium">Re-generation complete! Updating results...</span>
                </div>
              ) : (
                <div className="bg-[#F8FAFC] border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px_16px] flex items-center gap-[12px]">
                  <FiRefreshCw size={16} className="text-[#185FA5] animate-spin shrink-0" />
                  <span className="text-[13px] text-[#374151]">
                    {progressStep === 0 && 'Reading and extracting text from your document...'}
                    {progressStep === 1 && 'AI is generating requirements from extracted content...'}
                    {progressStep === 2 && 'AI Critic is reviewing quality and detecting issues...'}
                    {progressStep === 3 && 'Finalizing results and updating database...'}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-[16px_24px] border-t-[0.5px] border-[#F3F4F6] flex justify-center">
              <span className="text-[12px] text-[#9CA3AF]">
                Please wait, this may take 10–20 seconds
              </span>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default AiStagingReviewPage;
