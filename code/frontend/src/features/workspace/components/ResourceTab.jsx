import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { resourceApi } from '@api/resourceApi';

export default function ResourceTab({ classroomId, classroomData, userId }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadType, setUploadType] = useState('FILE'); // 'FILE' or 'LINK'
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Link upload state
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const isOwner = String(classroomData?.owner?.id) === String(userId);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await resourceApi.getClassroomResources(classroomId);
      setResources(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      fetchResources();
    }
  }, [classroomId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (uploadType === 'FILE') {
        if (!selectedFile) {
          toast.error('Please select a file');
          return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast.error('File size must not exceed 10MB');
          return;
        }
        if (!fileName.trim()) {
          toast.error('Please enter the document name');
          return;
        }
        await resourceApi.uploadFileResource(classroomId, fileName, selectedFile);
        toast.success('Document uploaded successfully!');
      } else {
        if (!linkName.trim() || !linkUrl.trim()) {
          toast.error('Please enter name and URL');
          return;
        }
        await resourceApi.addLinkResource(classroomId, linkName, linkUrl);
        toast.success('Link added successfully!');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchResources();
      window.dispatchEvent(new CustomEvent('NEW_RESOURCE_CREATED'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while adding the document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await resourceApi.deleteResource(classroomId, resourceId);
      toast.success('Document deleted successfully!');
      fetchResources();
      window.dispatchEvent(new CustomEvent('NEW_RESOURCE_CREATED'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while deleting the document');
    }
  };

  const handleDownload = async (resource) => {
    const toastId = toast.loading('Preparing file for download...');
    try {
      const response = await resourceApi.downloadResource(classroomId, resource.id);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let fileName = `${resource.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.zip`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches && matches[1]) {
          fileName = matches[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started!', { id: toastId });
    } catch (err) {
      toast.error('An error occurred while downloading', { id: toastId });
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileName('');
    setLinkName('');
    setLinkUrl('');
    setUploadType('FILE');
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Class Resources</h2>
          <p className="text-sm text-slate-500 mt-1">Study materials and useful links</p>
        </div>
        {isOwner && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Resource
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500">Loading documents...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <span className="material-symbols-outlined text-3xl text-slate-400">library_books</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No resources yet</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Resources such as lecture slides, reading materials, or external links will appear here once added by the instructor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:border-sky-300 transition-colors">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${resource.type === 'FILE' ? 'bg-orange-50 text-orange-500' : 'bg-[#1E707D]/10 text-[#1E707D]'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {resource.type === 'FILE' ? 'folder_zip' : 'link'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate" title={resource.name}>{resource.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    {resource.type === 'FILE' && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">sd_storage</span>
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {resource.type === 'FILE' ? (
                      <button 
                        onClick={() => handleDownload(resource)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Download ZIP
                      </button>
                    ) : (
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        Open Link
                      </a>
                    )}
                    {isOwner && (
                      <button 
                        onClick={() => handleDelete(resource.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[slideUp_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Add Resource</h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadType('FILE')}
                  className={`flex-1 py-2 font-semibold text-xs rounded-lg transition-all ${uploadType === 'FILE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('LINK')}
                  className={`flex-1 py-2 font-semibold text-xs rounded-lg transition-all ${uploadType === 'LINK' ? 'bg-white text-[#0284c7] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Paste Link
                </button>
              </div>

              {uploadType === 'FILE' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Document Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="e.g. Lecture Slide 01..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[#0284c7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      File <span className="text-rose-500">*</span>
                    </label>
                    <div 
                      onClick={() => document.getElementById('file-input-resource').click()}
                      className="border-2 border-dashed border-slate-200 hover:border-sky-300 rounded-xl p-6 text-center cursor-pointer transition-colors"
                    >
                      <input 
                        id="file-input-resource"
                        type="file" 
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                            if (!fileName) {
                              setFileName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                            }
                          }
                        }}
                      />
                      <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">upload_file</span>
                      <p className="text-xs font-bold text-slate-700">
                        {selectedFile ? selectedFile.name : 'Click to upload file'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Maximum 10MB</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Link Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      placeholder="e.g. Official Documentation..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[#0284c7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Link (URL) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[#0284c7]"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
