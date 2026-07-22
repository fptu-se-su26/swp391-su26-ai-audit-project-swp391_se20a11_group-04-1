import React, { useState, useRef, useEffect } from 'react';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';
import { toast } from 'react-hot-toast';
import { FiUploadCloud, FiX, FiFileText, FiCheck, FiCheckCircle, FiEdit3 } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';

const STEPS = [
  "Reading and processing file...",
  "AI is analyzing and extracting requirements...",
  "AI Critic is reviewing requirement quality...",
  "Finalizing results and saving to database..."
];

const AiUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [promptText, setPromptText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [errorData, setErrorData] = useState(null);
  const fileInputRef = useRef(null);
  const { activeProject } = useProjectStore();
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      isCancelledRef.current = false;
    } else {
      setFile(null);
      setPromptText("");
      setIsUploading(false);
      setIsDragging(false);
      setCurrentStep(-1);
      isCancelledRef.current = true;
    }
  }, [isOpen]);

  // Listen to WebSocket real-time progress
  useEffect(() => {
    const handleProgress = (event) => {
      if (!isCancelledRef.current) {
        const { step } = event.detail || {};
        if (typeof step === 'number') {
          setCurrentStep(step);
        }
      }
    };

    window.addEventListener('AI_PROGRESS', handleProgress);
    return () => window.removeEventListener('AI_PROGRESS', handleProgress);
  }, []);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.pdf')) {
      setFile(selectedFile);
    } else {
      toast.error('Chỉ hỗ trợ file .pdf hoặc .docx');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!activeProject?.id) {
      toast.error('Không xác định được ID dự án');
      return;
    }

    setIsUploading(true);
    setCurrentStep(0);
    
    try {
      const response = await requirementApi.generateRequirementsWithAi(activeProject.id, file, promptText);
      
      if (isCancelledRef.current) return;
      
      // Jump to last step briefly before closing if it hasn't reached yet
      setCurrentStep(STEPS.length);
      setTimeout(() => {
        if (isCancelledRef.current) return;
        toast.success(response.message || 'Phân tích tài liệu thành công!');
        if (onSuccess) onSuccess(response.generationId);
        onClose();
      }, 500);

    } catch (error) {
      if (isCancelledRef.current) return;
      console.error('Error generating AI requirements:', error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Có lỗi xảy ra khi xử lý file bằng AI.';
      setErrorData(errMsg);
      setIsUploading(false);
      setCurrentStep(-1);
    }
  };

  const handleCancel = async () => {
    isCancelledRef.current = true;
    if (activeProject?.id && isUploading) {
      try {
        await requirementApi.deletePendingGenerations(activeProject.id, 'REQUIREMENT');
      } catch (err) {
        console.error('Failed to clear pending requirement generation:', err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-[#FFFFFF] w-full max-w-[480px] rounded-[12px] border border-[#E5E7EB] flex flex-col font-sans shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-[#E5E7EB]">
          <div className="flex items-center gap-[12px]">
            <div className="w-[38px] h-[38px] rounded-[8px] bg-[#1E707D]/10 text-[#1E707D] flex items-center justify-center shrink-0">
              <BsStars size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-medium text-gray-900 leading-tight">AI Requirements Import</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">Upload a document — AI will extract requirements automatically</p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
            className="w-[28px] h-[28px] rounded-[6px] border border-[#E5E7EB] text-gray-500 hover:bg-gray-50 flex items-center justify-center shrink-0 transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-[24px] py-[20px]">
          
          {errorData ? (
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="w-[56px] h-[56px] bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <FiX size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                {errorData && errorData.toLowerCase().includes('context mismatch') ? 'Document Context Mismatch!' : 'Generation Failed'}
              </h3>
              <p className="text-[13px] text-gray-600 px-2 mb-6 leading-relaxed">
                {errorData}
              </p>
              <button 
                onClick={() => { setErrorData(null); setFile(null); }}
                className="px-[16px] py-[8px] border border-[#E5E7EB] hover:bg-gray-50 text-gray-700 text-[13px] font-medium rounded-[6px] transition-colors"
              >
                Upload a different document
              </button>
            </div>
          ) : (
            <>
              {/* Main Area: Dropzone OR File OR Progress */}
          {!isUploading && !file && (
            <div
              className={`border-[1.5px] border-dashed rounded-[12px] p-[28px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging ? 'border-[#1E707D] bg-[#1E707D]/10' : 'border-[#D1D5DB] hover:border-[#1E707D] hover:bg-[#1E707D]/10'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx" />
              <div className="w-[48px] h-[48px] bg-[#1E707D]/10 text-[#1E707D] rounded-[8px] flex items-center justify-center mb-[12px]">
                <FiUploadCloud size={24} />
              </div>
              <h3 className="text-[14px] font-medium text-gray-900">Drag and drop your file here</h3>
              <p className="text-[12px] text-gray-600 mt-[4px]">
                or <span className="text-[#1E707D] font-medium">browse</span> from your computer
              </p>
              <p className="text-[11px] text-gray-400 mt-[8px]">Supports .DOCX, .PDF — max 10 MB</p>
            </div>
          )}

          {!isUploading && file && (
            <div className="bg-gray-50 rounded-[8px] border border-[#E5E7EB] p-[10px_12px] flex items-center justify-between">
              <div className="flex items-center gap-[12px] overflow-hidden">
                <div className="w-[36px] h-[36px] bg-[#1E707D]/10 text-[#1E707D] rounded-[6px] flex items-center justify-center shrink-0">
                  <FiFileText size={18} />
                </div>
                <div className="truncate">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="w-[28px] h-[28px] rounded-[6px] text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
          )}

          {isUploading && (
            <div className="flex flex-col gap-[8px]">
              {STEPS.map((stepLabel, index) => {
                const isWaiting = index > currentStep;
                const isActive = index === currentStep;
                const isDone = index < currentStep;

                return (
                  <div key={index} className="bg-gray-50 rounded-[8px] border border-[#E5E7EB] p-[12px_16px] flex items-center gap-[16px]">
                    {isWaiting && (
                      <div className="w-[24px] h-[24px] rounded-full bg-gray-200 text-gray-500 text-[11px] font-medium flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                    )}
                    {isActive && (
                      <div className="w-[24px] h-[24px] rounded-full border-[2px] border-gray-200 border-t-[#1E707D] animate-spin shrink-0"></div>
                    )}
                    {isDone && (
                      <div className="w-[24px] h-[24px] rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <FiCheck size={14} strokeWidth={3} />
                      </div>
                    )}
                    <span className={`text-[13px] ${isActive ? 'font-medium text-[#1E707D]' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Prompt Area - hidden during upload */}
          {!isUploading && (
            <div className="mt-[20px] bg-gray-50/50 border border-[#E5E7EB] rounded-[10px] p-[14px] transition-colors hover:border-[#D1D5DB]">
              <div className="flex items-center gap-[6px] mb-[8px]">
                <BsStars size={14} className="text-[#1E707D]" />
                <label className="block text-[13px] font-medium text-gray-800">
                  Additional Instructions
                </label>
                <span className="text-[11px] text-gray-400 font-normal ml-auto border border-gray-200 px-[6px] py-[2px] rounded-full bg-white">Optional</span>
              </div>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="E.g., Focus on the payment flow, ignore the admin dashboard..."
                className="w-full h-[76px] p-[12px] text-[13px] text-gray-900 bg-white border border-[#E5E7EB] rounded-[8px] resize-none focus:outline-none focus:ring-[2px] focus:ring-[#1E707D]/20 focus:border-[#1E707D] transition-all placeholder:text-gray-400 shadow-sm"
              />
            </div>
          )}
          </>
          )}

        </div>

        {/* FOOTER */}
        {!errorData && (
          <div className="px-[24px] py-[16px] border-t border-[#E5E7EB] flex items-center justify-between bg-gray-50/50 rounded-b-[12px]">
            <button
              onClick={handleCancel}
              className="px-[16px] py-[8px] text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="h-[36px] px-[16px] text-[13px] font-medium text-white bg-[#1E707D] rounded-[6px] flex items-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#155762] transition-colors"
            >
              <BsStars size={14} />
              Start Analysis
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AiUploadModal;
