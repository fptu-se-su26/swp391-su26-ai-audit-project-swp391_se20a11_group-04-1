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
      id: "new_" + Date.now().toString(),
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

  const handleFocus = (id) => {
    if (window.focusDiagramNode) {
      window.focusDiagramNode(`uc_${id}`);
    }
  };

  const handleToggleVisibility = (uc) => {
    updateUseCase(uc.id, { showInDiagram: !(uc.showInDiagram !== false) });
  };

  const visibleUseCases = useCases.filter(uc => uc.showInDiagram !== false);
  const hiddenUseCases = useCases.filter(uc => uc.showInDiagram === false);

  const renderUseCaseList = (list, isHidden) => {
    if (list.length === 0) {
      return <p className="text-gray-500 text-sm text-center py-2 italic">No use cases</p>;
    }
    return list.map(uc => (
      <div key={uc.id} className={`flex items-center justify-between p-2 border rounded ${isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow`}>
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
            <div 
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
              onClick={() => !isHidden && handleFocus(uc.id)}
              title={isHidden ? "Hidden from diagram" : "Click to focus on diagram"}
            >
              <div className={`w-2 h-2 rounded-full ${isHidden ? 'bg-gray-400' : (uc.isIsolated ? 'bg-red-400' : 'bg-green-400')}`} title={isHidden ? 'Hidden' : (uc.isIsolated ? 'Needs connection' : 'Connected')}></div>
              <span className="text-sm font-medium text-gray-800 truncate">{uc.name}</span>
            </div>
            <div className="flex gap-1 ml-2">
              {isHidden && uc.addedFromDiagram && (
                <button 
                  onClick={() => removeUseCase(uc.id)}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Permanently Delete Draft"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
              <button 
                onClick={() => handleToggleVisibility(uc)}
                className={`p-1 rounded transition-colors ${isHidden ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title={isHidden ? "Show on Diagram" : "Hide from Diagram"}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isHidden ? 'visibility' : 'visibility_off'}
                </span>
              </button>
              {!isHidden && (
                <button 
                  onClick={() => handleEdit(uc)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Rename (Display Name)"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    ));
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
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">On Diagram ({visibleUseCases.length})</h3>
        {renderUseCaseList(visibleUseCases, false)}
        
        {hiddenUseCases.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-1 border-t pt-4">Hidden ({hiddenUseCases.length})</h3>
            {renderUseCaseList(hiddenUseCases, true)}
          </>
        )}
      </div>
    </div>
  );
};

export default UseCaseTab;
