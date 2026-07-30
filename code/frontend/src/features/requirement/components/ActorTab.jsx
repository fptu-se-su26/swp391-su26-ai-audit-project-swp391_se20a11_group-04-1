import React, { useState } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import Button from '../../../components/ui/Button';

const ActorTab = ({ onUnsavedChanges }) => {
  const { actors, addActor, updateActor, removeActor } = useDiagramStore();
  const [newActorName, setNewActorName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newActorName.trim()) return;
    addActor({
      id: "new_" + Date.now().toString(),
      name: newActorName.trim()
    });
    setNewActorName('');
    if (onUnsavedChanges) onUnsavedChanges();
  };

  const handleEdit = (actor) => {
    setEditingId(actor.id);
    setEditName(actor.name);
  };

  const handleSave = (id) => {
    if (!editName.trim()) return;
    updateActor(id, { name: editName.trim() });
    setEditingId(null);
    if (onUnsavedChanges) onUnsavedChanges();
  };

  const handleRemove = (id) => {
    removeActor(id);
    if (onUnsavedChanges) onUnsavedChanges();
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newActorName}
          onChange={(e) => setNewActorName(e.target.value)}
          placeholder="New Actor Name"
          className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} size="sm" variant="primary">Add</Button>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {actors.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No actors added yet.</p>
        ) : (
          actors.map(actor => (
            <div key={actor.id} className="flex items-center justify-between p-2 border rounded bg-white shadow-sm hover:shadow-md transition-shadow">
              {editingId === actor.id ? (
                <div className="flex flex-1 gap-2">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(actor.id)}
                  />
                  <Button onClick={() => handleSave(actor.id)} size="sm" variant="success">Save</Button>
                  <Button onClick={() => setEditingId(null)} size="sm" variant="secondary">Cancel</Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-800 truncate" title={actor.name}>{actor.name}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(actor)}
                      className="p-1 text-gray-500 hover:text-[#1E707D] rounded transition-colors"
                      title="Edit Actor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button 
                      onClick={() => handleRemove(actor.id)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                      title="Remove Actor"
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

export default ActorTab;
