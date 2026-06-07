import React, { useState } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import Button from '../../../components/ui/Button';

const RelationTab = () => {
  const { actors, useCases, relations, addRelation, removeRelation } = useDiagramStore();
  
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState('association');

  // Helper to resolve name from id
  const getEntityName = (id) => {
    const actor = actors.find(a => a.id === id);
    if (actor) return actor.name;
    const uc = useCases.find(u => u.id === id);
    if (uc) return uc.name;
    return 'Unknown';
  };

  const handleAdd = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    addRelation({
      id: Date.now().toString(),
      sourceId,
      targetId,
      type
    });

    // Reset fields
    setSourceId('');
    setTargetId('');
    setType('association');
  };

  const getFilteredTargets = () => {
    if (!sourceId) return [];
    const isSourceActor = actors.some(a => a.id === sourceId);
    
    if (isSourceActor) {
      // Actor can only point to Use Case (association) or other Actor (generalization)
      if (type === 'association') return useCases;
      if (type === 'generalization') return actors.filter(a => a.id !== sourceId);
      return [];
    } else {
      // Use case can point to Use Case (include, extend, generalization) or Actor (association)
      if (type === 'association') return actors;
      return useCases.filter(u => u.id !== sourceId);
    }
  };

  const availableTargets = getFilteredTargets();

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded border">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Source</label>
          <select 
            value={sourceId} 
            onChange={(e) => {
              setSourceId(e.target.value);
              setTargetId('');
            }}
            className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="association">Association (Actor ↔ UC)</option>
            <option value="include">Include (UC → UC)</option>
            <option value="extend">Extend (UC → UC)</option>
            <option value="generalization">Generalization</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Target</label>
          <select 
            value={targetId} 
            onChange={(e) => setTargetId(e.target.value)}
            disabled={!sourceId || availableTargets.length === 0}
            className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
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
          relations.map(rel => (
            <div key={rel.id} className="flex items-center justify-between p-2.5 border rounded bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800 truncate max-w-[100px]" title={getEntityName(rel.sourceId)}>
                    {getEntityName(rel.sourceId)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {rel.type === 'include' && '.>'}
                    {rel.type === 'extend' && '.>'}
                    {rel.type === 'generalization' && '--|>'}
                    {rel.type === 'association' && '-->'}
                  </span>
                  <span className="font-medium text-gray-800 truncate max-w-[100px]" title={getEntityName(rel.targetId)}>
                    {getEntityName(rel.targetId)}
                  </span>
                </div>
                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-1">
                  &lt;&lt;{rel.type}&gt;&gt;
                </span>
              </div>
              <button 
                onClick={() => removeRelation(rel.id)}
                className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
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
