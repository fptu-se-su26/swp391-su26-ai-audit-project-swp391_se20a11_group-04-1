import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const AITaskGenerationProgressModal = ({ isOpen, requirementCount = 1, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setProgressWidth(0);

      const interval = setInterval(() => {
        setProgressWidth(prev => {
          if (prev < 90) return prev + Math.random() * 5;
          return prev;
        });
      }, 1000);

      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < 3) return prev + 1;
          return prev;
        });
      }, 8000);

      return () => {
        clearInterval(interval);
        clearInterval(stepInterval);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep === 4) {
      setProgressWidth(100);
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Analyze Context' },
    { id: 2, title: 'Generate Tasks' },
    { id: 3, title: 'AI Critic Review' }
  ];

  const getStepStatus = (stepId) => {
    if (currentStep > stepId || currentStep === 4) return 'completed';
    if (currentStep === stepId) return 'active';
    return 'waiting';
  };

  const activeStepDetails = {
    1: { title: `Analyzing ${requirementCount} requirement(s)...`, detail: 'Reading use cases and existing tasks to understand context' },
    2: { title: 'Generating technical tasks...', detail: 'Extracting frontend, backend, and database tasks from use cases' },
    3: { title: 'AI Critic reviewing quality...', detail: 'Checking for duplicates, circular dependencies, and logical gaps' },
    4: { title: 'Finalizing...', detail: 'Saving generated tasks to database' }
  };

  const currentDetails = activeStepDetails[currentStep] || activeStepDetails[3];

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0f1423]/50 p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-2xl w-full max-w-[440px] flex flex-col overflow-hidden relative">
        
        {currentStep === 4 ? (
          // SUCCESS STATE
          <div className="px-[24px] py-[40px] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            <div className="w-[48px] h-[48px] bg-[#E1F5EE] rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#1D9E75]" style={{ fontSize: '24px' }}>check</span>
            </div>
            <h2 className="text-[16px] font-medium text-[#111827] mb-1 text-center">Tasks Generated!</h2>
            <p className="text-[13px] text-[#6B7280] text-center">Tasks successfully created. Redirecting to Staging Board...</p>
          </div>
        ) : (
          // LOADING STATE
          <div className="animate-in fade-in duration-300">
            {/* HEADER */}
            <div className="flex items-start justify-between px-[24px] pt-[24px] pb-0">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#1E707D]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1E707D]" style={{ fontSize: '20px' }}>auto_awesome</span>
                </div>
                <div>
                  <h2 className="text-[16px] font-medium text-[#111827] leading-tight">Generating Tasks...</h2>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">AI is analyzing use cases for tasks</p>
                </div>
              </div>
              {onClose && (
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-[28px] h-[28px] rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:bg-gray-50 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              )}
            </div>

            {/* PROGRESS INDICATOR */}
            <div className="px-[24px] py-[24px] flex items-start justify-between relative">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10 w-[80px]">
                    <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all duration-300 ${
                      status === 'completed' ? 'bg-[#E1F5EE]' :
                      status === 'active' ? 'bg-[#1E707D]/10 border-2 border-[#1E707D]' :
                      'bg-white border-[1.5px] border-[#E5E7EB]'
                    }`}>
                      {status === 'completed' ? (
                        <span className="material-symbols-outlined text-[#1D9E75]" style={{ fontSize: '18px' }}>check</span>
                      ) : status === 'active' ? (
                        <span className="material-symbols-outlined text-[#1E707D] animate-spin" style={{ fontSize: '18px' }}>sync</span>
                      ) : (
                        <span className="text-[#9CA3AF] text-[13px] font-medium">{step.id}</span>
                      )}
                    </div>
                    <span className={`text-[11px] text-center mt-2 ${
                      status === 'completed' ? 'text-[#1D9E75] font-medium' :
                      status === 'active' ? 'text-[#1E707D] font-medium' :
                      'text-[#9CA3AF]'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}

              {/* Connecting Lines */}
              <div className="absolute top-[40px] left-[60px] right-[60px] h-[2px] flex items-center z-0">
                <div className={`h-full flex-1 transition-all duration-500 ${getStepStatus(1) === 'completed' ? 'bg-[#1D9E75]' : 'border-t-[2px] border-dashed border-[#E5E7EB]'}`}></div>
                <div className={`h-full flex-1 transition-all duration-500 ${getStepStatus(2) === 'completed' ? 'bg-[#1D9E75]' : 'border-t-[2px] border-dashed border-[#E5E7EB]'}`}></div>
              </div>
            </div>

            {/* CURRENT STEP STATUS BOX */}
            <div className="px-[24px] pb-[20px]">
              <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-[16px] py-[14px] flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1E707D] animate-spin shrink-0" style={{ fontSize: '24px' }}>sync</span>
                <div>
                  <h3 className="text-[13px] font-bold text-[#111827]">{currentDetails.title}</h3>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">{currentDetails.detail}</p>
                </div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="px-[24px] pb-[16px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] text-[#6B7280]">Processing...</span>
                <span className="text-[12px] text-[#6B7280]">{Math.min(Math.round(progressWidth / 100 * requirementCount), requirementCount)} / {requirementCount} requirements</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-[6px] rounded-[3px] overflow-hidden">
                <div 
                  className="h-full rounded-[3px] bg-gradient-to-r from-[#1E707D] to-[#1E707D] transition-all duration-300 ease-out" 
                  style={{ width: `${progressWidth}%` }}
                ></div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-[24px] py-[16px] border-t border-[#F3F4F6]">
              <p className="text-center text-[12px] text-[#9CA3AF]">Please wait, this usually takes 15–30 seconds</p>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default AITaskGenerationProgressModal;
