import React, { useState } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import Button from '../../../components/ui/Button';

const RelationTab = ({ onUnsavedChanges }) => {
  const { actors, useCases, relations, addRelation, removeRelation, drawingMode, setDrawingMode } = useDiagramStore();
  
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState('actor-uc');

  // Helper to resolve name from id
  const getEntityName = (id) => {
    if (!id) return 'Unknown';
    const actor = actors.find(a => a.id?.toString() === id.toString() || a.id?.toString() === `actor_${id}` || id.toString() === `actor_${a.id}`);
    if (actor) return actor.name;
    const uc = useCases.find(u => u.id?.toString() === id.toString() || u.id?.toString() === `uc_${id}` || id.toString() === `uc_${u.id}`);
    if (uc) return uc.name;
    return 'Unknown';
  };

  const handleAdd = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const existingRel = relations.find(r => 
        (r.sourceId.toString() === sourceId.toString() && r.targetId.toString() === targetId.toString()) ||
        (r.sourceId.toString() === targetId.toString() && r.targetId.toString() === sourceId.toString())
    );

    if (existingRel) {
        alert("Đã tồn tại liên kết giữa 2 phần tử này!");
        return;
    }

    addRelation({
      id: Date.now().toString(),
      sourceId,
      targetId,
      type
    });

    // Reset fields
    setSourceId('');
    setTargetId('');
    setType('actor-uc');
    if (onUnsavedChanges) onUnsavedChanges();
  };

  const getFilteredTargets = () => {
    if (!sourceId) return [];
    const isSourceActor = actors.some(a => a.id?.toString() === sourceId.toString());
    
    if (isSourceActor) {
      // Actor can only point to Use Case (association) or other Actor (generalization)
      if (type === 'actor-uc') return useCases;
      if (type === 'actor-generalization') return actors.filter(a => a.id?.toString() !== sourceId.toString());
      return [];
    } else {
      // Use case can point to Use Case (include, extends, generalization) or Actor (association)
      if (type === 'actor-uc') return actors;
      return useCases.filter(u => u.id?.toString() !== sourceId.toString());
    }
  };

  const availableTargets = getFilteredTargets();

  const drawingModes = [
    { id: 'auto', label: 'Auto (Smart connection)', isSvg: false, icon: 'auto_fix' },
    { id: 'actor-uc', label: 'Association (Actor to Use Case)', isSvg: true, icon: <svg width="40" height="14" className="overflow-visible"><line x1="0" y1="7" x2="40" y2="7" stroke="currentColor" strokeWidth="1.5" /></svg> },
    { id: 'include', label: 'Include (Use Case includes Use Case)', isSvg: true, icon: <svg width="70" height="14" className="overflow-visible"><line x1="0" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3,2" /><text x="35" y="7" fontSize="7.5" fontFamily="monospace" fill="currentColor" textAnchor="middle" dominantBaseline="middle">&lt;&lt;include&gt;&gt;</text><line x1="58" y1="7" x2="64" y2="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3,2" /><polygon points="64,4 70,7 64,10" fill="currentColor" /></svg> },
    { id: 'extends', label: 'Extends (Use Case extends Use Case)', isSvg: true, icon: <svg width="70" height="14" className="overflow-visible"><polygon points="6,4 0,7 6,10" fill="currentColor" /><line x1="6" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3,2" /><text x="35" y="7" fontSize="7.5" fontFamily="monospace" fill="currentColor" textAnchor="middle" dominantBaseline="middle">&lt;&lt;extends&gt;&gt;</text><line x1="58" y1="7" x2="70" y2="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3,2" /></svg> },
    { id: 'actor-generalization', label: 'Generalization (Actor Inheritance)', isSvg: true, icon: <svg width="40" height="14" className="overflow-visible"><line x1="0" y1="7" x2="32" y2="7" stroke="currentColor" strokeWidth="1.5" /><polygon points="32,3 40,7 32,11" fill="white" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg> },
  ];

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Drawing Mode Toolbar */}
      <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-[#1E707D]">draw</span>
          Free-draw Mode
        </label>
        <p className="text-[10px] text-gray-500 leading-tight">
          Select a tool to draw specific lines on the canvas, overriding auto-logic.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {drawingModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setDrawingMode(mode.id)}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${
                drawingMode === mode.id
                  ? 'bg-[#1E707D] text-white border-[#1E707D] shadow-md'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
              title={mode.label}
            >
              {mode.isSvg ? (
                <div className={`flex items-center justify-center px-1 ${drawingMode === mode.id ? 'text-white' : 'text-gray-500'}`}>
                  {mode.icon}
                </div>
              ) : (
                <>
                  <span className={`material-symbols-outlined text-[14px] ${drawingMode === mode.id ? 'text-white' : 'text-gray-500'}`}>
                    {mode.icon}
                  </span>
                  {mode.id === 'auto' && 'Auto'}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded border">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Source</label>
          <select 
            value={sourceId} 
            onChange={(e) => {
              setSourceId(e.target.value);
              setTargetId('');
            }}
            className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
          >
            <option value="">Select Source...</option>
            <optgroup label="Actors">
              {actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </optgroup>
            <optgroup label="Use Cases">
              {useCases.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Relation Type</label>
          <select 
            value={type} 
            onChange={(e) => {
              setType(e.target.value);
              setTargetId('');
            }}
            className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
          >
            <option value="actor-uc">Association (Actor ↔ UC)</option>
            <option value="include">Include (UC → UC)</option>
            <option value="extends">Extends (UC → UC)</option>
            <option value="actor-generalization">Generalization</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Target</label>
          <select 
            value={targetId} 
            onChange={(e) => setTargetId(e.target.value)}
            disabled={!sourceId || availableTargets.length === 0}
            className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1E707D] disabled:opacity-50 disabled:bg-gray-100"
          >
            <option value="">Select Target...</option>
            {availableTargets.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <Button 
          onClick={handleAdd} 
          disabled={!sourceId || !targetId} 
          variant="primary" 
          className="mt-2 w-full"
        >
          Add Relation
        </Button>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {relations.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No relations added yet.</p>
        ) : (
          [...relations].map(rel => (
            <div key={rel.id} className="flex items-center justify-between p-2.5 border rounded bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800 truncate max-w-[100px]" title={getEntityName(rel.sourceId)}>
                    {getEntityName(rel.sourceId)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {rel.type === 'include' && '.>'}
                    {rel.type === 'extends' && '.>'}
                    {rel.type === 'actor-generalization' && '--|>'}
                    {rel.type === 'actor-uc' && '—'}
                  </span>
                  <span className="font-medium text-gray-800 truncate max-w-[100px]" title={getEntityName(rel.targetId)}>
                    {getEntityName(rel.targetId)}
                  </span>
                </div>
                {rel.type === 'include' && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1 border border-emerald-200">
                    &lt;&lt;include&gt;&gt;
                  </span>
                )}
                {rel.type === 'extends' && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit mt-1 border border-amber-200">
                    &lt;&lt;extends&gt;&gt;
                  </span>
                )}
                {rel.type === 'actor-generalization' && (
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit mt-1 border border-purple-200">
                    Generalization
                  </span>
                )}
                {(rel.type === 'actor-uc') && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit mt-1 border border-blue-200">
                    Association
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  removeRelation(rel.id);
                  if (onUnsavedChanges) onUnsavedChanges();
                }}
                className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                title="Remove Relation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RelationTab;
