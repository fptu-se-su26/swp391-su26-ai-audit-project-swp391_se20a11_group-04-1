import React, { useState } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import Button from '../../../components/ui/Button';

const UseCaseTab = () => {
  const { useCases, addUseCase, updateUseCase, removeUseCase } = useDiagramStore();
  const [newUseCaseName, setNewUseCaseName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newUseCaseName.trim()) return;
    addUseCase({
      id: Date.now().toString(),
      name: newUseCaseName.trim()
    });
    setNewUseCaseName('');
  };

  const handleEdit = (uc) => {
    setEditingId(uc.id);
    setEditName(uc.name);
  };

  const handleSave = (id) => {
    if (!editName.trim()) return;
    updateUseCase(id, { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newUseCaseName}
          onChange={(e) => setNewUseCaseName(e.target.value)}
          placeholder="New Use Case Name"
          className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} size="sm" variant="primary">Add</Button>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {useCases.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No use cases added yet.</p>
        ) : (
          useCases.map(uc => (
            <div key={uc.id} className="flex items-center justify-between p-2 border rounded bg-white shadow-sm hover:shadow-md transition-shadow">
              {editingId === uc.id ? (
                <div className="flex flex-1 gap-2">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(uc.id)}
                  />
                  <Button onClick={() => handleSave(uc.id)} size="sm" variant="success">Save</Button>
                  <Button onClick={() => setEditingId(null)} size="sm" variant="secondary">Cancel</Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-800 truncate" title={uc.name}>{uc.name}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(uc)}
                      className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
                      title="Edit Use Case"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button 
                      onClick={() => removeUseCase(uc.id)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                      title="Remove Use Case"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UseCaseTab;
