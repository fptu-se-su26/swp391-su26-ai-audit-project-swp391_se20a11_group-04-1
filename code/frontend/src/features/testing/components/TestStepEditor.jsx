import { useState } from 'react'

/**
 * TestStepEditor — Quản lý danh sách test steps (để dùng trong Create/Edit form)
 */
export default function TestStepEditor({ steps, onChange }) {
  const handleAddStep = () => {
    onChange([...steps, { description: '' }])
  }

  const handleRemoveStep = (index) => {
    const newSteps = [...steps]
    newSteps.splice(index, 1)
    onChange(newSteps)
  }

  const handleChangeStep = (index, value) => {
    const newSteps = [...steps]
    newSteps[index].description = value
    onChange(newSteps)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-md text-label-md text-on-surface">Test Steps</label>
      
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-surface-container-low rounded text-secondary font-medium text-sm">
              {index + 1}
            </span>
            <input
              type="text"
              value={step.description}
              onChange={(e) => handleChangeStep(index, e.target.value)}
              placeholder="Enter step description..."
              className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={() => handleRemoveStep(index)}
              className="w-8 h-8 flex items-center justify-center text-secondary hover:text-error hover:bg-error-container rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddStep}
        className="self-start mt-1 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-fixed-variant transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Add Step
      </button>
    </div>
  )
}
