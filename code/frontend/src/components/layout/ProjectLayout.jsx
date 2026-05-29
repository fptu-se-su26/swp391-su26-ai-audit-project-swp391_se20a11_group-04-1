import React, { useEffect } from 'react';
import { Outlet, useParams, Navigate, useLocation } from 'react-router-dom';
import useProjectStore from '../../store/useProjectStore';

const ProjectLayout = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const activeProject = useProjectStore((state) => state.activeProject);
  const selectProject = useProjectStore((state) => state.selectProject);
  const fetchProjectById = useProjectStore((state) => state.fetchProjectById);
  const clearActiveProject = useProjectStore((state) => state.clearActiveProject);

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

  if (!projectId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Outlet />
  );
};

export default ProjectLayout;
