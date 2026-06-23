import React, { useState, useEffect } from 'react';
import { useApiTestStore } from '../stores/useApiTestStore';

const ApiEnvironmentModal = ({ onClose, projectId }) => {
  const { environments, createEnvironment, updateEnvironment, deleteEnvironment } = useApiTestStore();
  
  const [activeEnv, setActiveEnv] = useState(null);
  const [envName, setEnvName] = useState('');
  const [variables, setVariables] = useState([{ key: '', value: '' }]);

  useEffect(() => {
    if (environments.length > 0 && !activeEnv) {
      handleSelectEnv(environments[0]);
    } else if (environments.length === 0) {
      handleCreateNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environments]);

  const handleSelectEnv = (env) => {
    setActiveEnv(env);
    setEnvName(env.name);
    
    if (env.variables && Object.keys(env.variables).length > 0) {
      const varsArray = Object.entries(env.variables).map(([key, value]) => ({ key, value }));
      setVariables(varsArray.length > 0 ? varsArray : [{ key: '', value: '' }]);
    } else {
      setVariables([{ key: '', value: '' }]);
    }
  };

  const handleCreateNew = () => {
    setActiveEnv(null);
    setEnvName('New Environment');
    setVariables([{ key: '', value: '' }]);
  };

  const handleSave = async () => {
    if (!envName.trim()) return;
    
    const varsObject = {};
    variables.forEach(v => {
      if (v.key.trim()) {
        varsObject[v.key.trim()] = v.value;
      }
    });

    const data = {
      name: envName,
      variables: varsObject
    };

    if (activeEnv) {
      await updateEnvironment(projectId, activeEnv.id, data);
    } else {
      const newEnv = await createEnvironment(projectId, data);
      setActiveEnv(newEnv);
    }
  };

  const handleDelete = async () => {
    if (activeEnv) {
      await deleteEnvironment(projectId, activeEnv.id);
      handleCreateNew();
    }
  };

  const addVarRow = () => setVariables([...variables, { key: '', value: '' }]);
  
  const updateVar = (index, field, val) => {
    const newVars = [...variables];
    newVars[index][field] = val;
    setVariables(newVars);
  };

  const removeVarRow = (index) => {
    const newVars = [...variables];
    newVars.splice(index, 1);
    if (newVars.length === 0) newVars.push({ key: '', value: '' });
    setVariables(newVars);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[800px] h-[500px] bg-surface-container-lowest border border-outline-variant rounded-sm shadow-2xl flex flex-col overflow-hidden text-on-surface">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container-low/50">
          <h2 className="font-bold font-mono">Manage Environments</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-container-highest rounded-sm transition-colors text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Env List */}
          <div className="w-1/3 border-r border-outline-variant bg-surface-container-lowest flex flex-col">
            <div className="p-2 border-b border-outline-variant">
              <button 
                onClick={handleCreateNew}
                className="w-full flex justify-center items-center gap-2 py-1.5 bg-surface-container hover:bg-surface-container-highest border border-outline-variant/50 rounded-sm font-mono text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> New Environment
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {environments.map(env => (
                <div 
                  key={env.id}
                  onClick={() => handleSelectEnv(env)}
                  className={`px-3 py-2 cursor-pointer rounded-sm text-sm font-mono transition-colors ${
                    activeEnv?.id === env.id 
                      ? 'bg-[#1E707D]/10 text-[#1E707D] font-bold' 
                      : 'hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {env.name}
                </div>
              ))}
              {environments.length === 0 && (
                <div className="text-xs text-on-surface-variant font-mono text-center mt-4">
                  No environments
                </div>
              )}
            </div>
          </div>

          {/* Right: Env Editor */}
          <div className="w-2/3 flex flex-col bg-surface-container-lowest relative">
            <div className="p-4 border-b border-outline-variant flex gap-4">
              <input 
                type="text" 
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                placeholder="Environment Name"
                className="flex-1 bg-surface-container-highest border border-outline-variant rounded-sm px-3 py-1.5 text-sm font-mono outline-none focus:border-[#1E707D]"
              />
              <button 
                onClick={handleSave}
                className="px-4 py-1.5 bg-[#1E707D] text-white font-mono text-xs font-bold rounded-sm hover:bg-[#1E707D]/90 transition-colors"
              >
                Save
              </button>
              {activeEnv && (
                <button 
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-error/10 text-error font-mono text-xs font-bold rounded-sm hover:bg-error/20 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-5">Variable</div>
                <div className="col-span-6">Initial Value</div>
                <div className="col-span-1"></div>
              </div>

              {variables.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center group">
                  <div className="col-span-5">
                    <input 
                      type="text"
                      value={v.key}
                      onChange={(e) => updateVar(i, 'key', e.target.value)}
                      placeholder="e.g. baseUrl"
                      className="w-full bg-surface-container-highest border border-outline-variant/50 focus:border-[#1E707D] rounded-sm px-2 py-1.5 font-mono text-xs outline-none"
                    />
                  </div>
                  <div className="col-span-6">
                    <input 
                      type="text"
                      value={v.value}
                      onChange={(e) => updateVar(i, 'value', e.target.value)}
                      placeholder="e.g. http://localhost:8080"
                      className="w-full bg-surface-container-highest border border-outline-variant/50 focus:border-[#1E707D] rounded-sm px-2 py-1.5 font-mono text-xs outline-none"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button 
                      onClick={() => removeVarRow(i)}
                      className="opacity-0 group-hover:opacity-100 text-error hover:bg-error/10 p-1 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={addVarRow}
                className="mt-2 text-xs font-mono text-[#1E707D] hover:underline px-2"
              >
                + Add Variable
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ApiEnvironmentModal;
