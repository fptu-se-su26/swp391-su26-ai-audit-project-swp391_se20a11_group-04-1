import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import useProjectStore from '../../store/useProjectStore';
import toast from 'react-hot-toast';

const ProjectLayout = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const activeProject = useProjectStore((state) => state.activeProject);
  const selectProject = useProjectStore((state) => state.selectProject);
  const fetchProjectById = useProjectStore((state) => state.fetchProjectById);
  const clearActiveProject = useProjectStore((state) => state.clearActiveProject);
  const error = useProjectStore((state) => state.error);
  const isForbidden = useProjectStore((state) => state.isForbidden);

  // ── Inject project theme color as CSS variable ────────────────
  // This allows inline `style={{ color: 'var(--project-theme)' }}` across the app
  useEffect(() => {
    const theme = activeProject?.themeColor
    if (theme && /^#[0-9A-Fa-f]{6}$/.test(theme)) {
      document.documentElement.style.setProperty('--project-theme', theme)
      // Also derive a light tint (15% opacity) for backgrounds
      document.documentElement.style.setProperty('--project-theme-light', theme + '26')
      document.documentElement.style.setProperty('--project-theme-hover', `color-mix(in srgb, ${theme} 85%, white)`)
      document.documentElement.style.setProperty('--project-theme-dark', `color-mix(in srgb, ${theme} 85%, black)`)
    } else {
      // Default DevTrack teal
      document.documentElement.style.setProperty('--project-theme', '#1E707D')
      document.documentElement.style.setProperty('--project-theme-light', '#1E707D26')
      document.documentElement.style.setProperty('--project-theme-hover', '#278A99')
      document.documentElement.style.setProperty('--project-theme-dark', '#165964')
    }
    return () => {
      // Reset to default when leaving project workspace
      document.documentElement.style.setProperty('--project-theme', '#1E707D')
      document.documentElement.style.setProperty('--project-theme-light', '#1E707D26')
      document.documentElement.style.setProperty('--project-theme-hover', '#278A99')
      document.documentElement.style.setProperty('--project-theme-dark', '#165964')
    }
  }, [activeProject?.themeColor])

  // Clear previous store error/forbidden state on mount/reset
  useEffect(() => {
    useProjectStore.setState({ error: null, isForbidden: false });
    return () => {
      useProjectStore.setState({ error: null, isForbidden: false });
    };
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      const pId = parseInt(projectId, 10);
      if (!activeProject || activeProject.id !== pId) {
        // We set the basic activeProject with at least the ID.
        selectProject({ id: pId, title: `Project ${pId}` });
        // Fetch full project data to get members and role
        fetchProjectById(pId);
      } else if (!activeProject.members || activeProject.members.length === 0) {
        // Trải nghiệm người dùng: Nếu có activeProject rồi nhưng bị rỗng members do cache hoặc navigate 
        // thì fetch lại để lấy đủ role và members
        fetchProjectById(pId);
      }
    }

  }, [projectId]); // Added projectId dependency

  useEffect(() => {
    // If it's a generic error (not 403) and there is error, we toast it and redirect
    if (error && !isForbidden) {
      toast.error(error);
      clearActiveProject();
      useProjectStore.setState({ error: null });
      navigate('/classrooms', { replace: true });
    }
  }, [error, isForbidden, navigate, clearActiveProject]);

  if (!projectId) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  // Nếu bị 403 Forbidden, render giao diện lỗi 403 xịn thay vì redirect đột ngột
  if (isForbidden) {
    return (
      <main className="min-h-screen flex-1 p-6 md:p-10 flex items-center justify-center bg-background select-none relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-error/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-xl space-y-6 relative z-10 animate-fade-in">
          <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-4xl font-bold">gpp_bad</span>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-extrabold text-2xl text-on-surface tracking-tight">403 - Truy cập bị từ chối</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {error || 'Bạn không có quyền truy cập vào dự án này. Chỉ thành viên của nhóm hoặc Mentor lớp học mới có thể vào xem.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant/40">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-5 py-2.5 rounded-xl border border-outline-variant/60 hover:bg-surface-container text-xs font-bold transition-all text-on-surface-variant"
            >
              Quay lại trang trước
            </button>
            <button
              onClick={() => {
                clearActiveProject();
                navigate('/dashboard');
              }}
              className="flex-1 bg-[#1E707D] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1E707D]/95 transition-all shadow-md"
            >
              Về Trang chủ
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Outlet />
  );
};

export default ProjectLayout;
