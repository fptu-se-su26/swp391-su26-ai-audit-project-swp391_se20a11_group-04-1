import { useState } from 'react'

/**
 * TestStepEditor — Quản lý danh sách test steps (để dùng trong Create/Edit form)
 */
export default function TestStepEditor({ steps, onChange, isUiTest }) {
  const handleAddStep = () => {
    if (isUiTest) {
      onChange([...steps, { action: 'goto', path: '', selector: '', value: '', expected: '', description: '' }])
    } else {
      onChange([...steps, { description: '' }])
    }
  }

  const handleRemoveStep = (index) => {
    const newSteps = [...steps]
    newSteps.splice(index, 1)
    onChange(newSteps)
  }

  const handleChangeStep = (index, field, value) => {
    const newSteps = [...steps]
    newSteps[index][field] = value
    onChange(newSteps)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-md text-label-md text-on-surface">Test Steps</label>
      
      <div className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-start gap-2 p-3 bg-surface-container-lowest border border-outline-variant rounded shadow-sm">
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-surface-container-low rounded text-secondary font-medium text-sm mt-1">
              {index + 1}
            </span>
            
            <div className="flex-1 w-full flex flex-col gap-2">
              {isUiTest ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={step.action || 'goto'}
                      onChange={(e) => handleChangeStep(index, 'action', e.target.value)}
                      className="w-full sm:w-1/3 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="goto">Navigate (goto)</option>
                      <option value="fill">Input (fill)</option>
                      <option value="click">Click</option>
                      <option value="select">Select Option</option>
                      <option value="wait_for">Wait for Element</option>
                      <option value="expect_url">Expect URL</option>
                      <option value="expect_text">Expect Text</option>
                      <option value="expect_visible">Expect Visible</option>
                      <option value="expect_hidden">Expect Hidden</option>
                    </select>

                    {/* Dynamic Inputs based on Action */}
                    {step.action === 'goto' && (
                      <input
                        type="text"
                        value={step.path || ''}
                        onChange={(e) => handleChangeStep(index, 'path', e.target.value)}
                        placeholder="Path (e.g. /login)"
                        className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md focus:border-primary outline-none transition-all"
                        required
                      />
                    )}

                    {['fill', 'click', 'wait_for', 'select', 'expect_text', 'expect_visible', 'expect_hidden'].includes(step.action) && (
                      <input
                        type="text"
                        value={step.selector || ''}
                        onChange={(e) => handleChangeStep(index, 'selector', e.target.value)}
                        placeholder="Selector (e.g. #email)"
                        className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md focus:border-primary outline-none transition-all"
                        required
                      />
                    )}

                    {['fill', 'select'].includes(step.action) && (
                      <input
                        type="text"
                        value={step.value || ''}
                        onChange={(e) => handleChangeStep(index, 'value', e.target.value)}
                        placeholder={step.action === 'select' ? "Option value to select" : "Value to input"}
                        className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md focus:border-primary outline-none transition-all"
                        required
                      />
                    )}

                    {['expect_url', 'expect_text'].includes(step.action) && (
                      <input
                        type="text"
                        value={step.expected || ''}
                        onChange={(e) => handleChangeStep(index, 'expected', e.target.value)}
                        placeholder={step.action === 'expect_text' ? "Expected Text" : "Expected URL (e.g. /dashboard)"}
                        className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md focus:border-primary outline-none transition-all"
                        required
                      />
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={step.description || ''}
                    onChange={(e) => handleChangeStep(index, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-1.5 bg-surface-container-low border border-transparent focus:border-outline-variant rounded font-body-sm text-body-sm text-on-surface-variant outline-none transition-all"
                  />
                </>
              ) : (
                <input
                  type="text"
                  value={step.description || ''}
                  onChange={(e) => handleChangeStep(index, 'description', e.target.value)}
                  placeholder="Enter step description..."
                  className="flex-1 w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md focus:border-primary outline-none transition-all"
                  required
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => handleRemoveStep(index)}
              className="w-8 h-8 flex items-center justify-center text-secondary hover:text-error hover:bg-error-container rounded transition-colors mt-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddStep}
        className="self-start mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-fixed-variant transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Add Step
      </button>
    </div>
  )
}
