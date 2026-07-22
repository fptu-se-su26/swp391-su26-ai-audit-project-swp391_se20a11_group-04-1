import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { businessModuleService } from '../services/businessModuleService';
import useProjectStore from '../../../store/useProjectStore';
import Button from '../../../components/ui/Button';

const ModuleFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const { activeProject } = useProjectStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assigneeId: '',
    priority: 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          assigneeId: initialData.assigneeId || '',
          priority: initialData.priority || 'MEDIUM'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          assigneeId: '',
          priority: 'MEDIUM'
        });
      }
      fetchMembers();
    }
  }, [isOpen, initialData]);

  const fetchMembers = async () => {
    if (!activeProject?.id) return;
    setLoadingMembers(true);
    try {
      setMembers(activeProject.members || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Module name is required');
      return;
    }

    setLoading(true);
    try {
      if (initialData?.id) {
        await businessModuleService.updateModule(activeProject.id, initialData.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
          priority: formData.priority
        });
        toast.success('Module updated successfully');
      } else {
        await businessModuleService.createModule(activeProject.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
          priority: formData.priority
        });
        toast.success('Module created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Edit Module' : 'Create New Module'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="moduleForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter module name (e.g. Authentication, Payment)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of what this module covers..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow resize-none h-24"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-white"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <select
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                disabled={loadingMembers}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-white"
              >
                <option value="">-- Unassigned --</option>
                {members.filter(member => member?.user || member?.id).map(member => {
                  // Support both { user: { id, username }, role } and { id, username, role } shapes
                  const uid = member?.user?.id ?? member?.id;
                  const uname = member?.user?.username ?? member?.username ?? member?.name ?? 'Unknown';
                  const urole = member?.role?.name ?? member?.role ?? '';
                  return (
                    <option key={uid} value={uid}>
                      {uname}{urole ? ` (${urole})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl sticky bottom-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="moduleForm" variant="primary" loading={loading}>
            {initialData ? 'Save Changes' : 'Create Module'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModuleFormModal;
