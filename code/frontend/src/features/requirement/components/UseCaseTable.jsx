import React from 'react';
import Badge from '../../../components/ui/Badge';
import { Link } from 'react-router-dom';
import useProjectStore from '../../../store/useProjectStore';

const UseCaseTable = ({ useCases }) => {
  const activeProject = useProjectStore((state) => state.activeProject);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f8fafc] border-b border-outline-variant font-label-md text-label-md text-secondary">
            <th className="py-3 px-4 font-semibold uppercase w-12 text-center">
              <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
            </th>
            <th className="py-3 px-4 font-semibold uppercase">ID & Name</th>
            <th className="py-3 px-4 font-semibold uppercase">Linked Req</th>
            <th className="py-3 px-4 font-semibold uppercase">Primary Actor</th>
            <th className="py-3 px-4 font-semibold uppercase">Status</th>
            <th className="py-3 px-4 font-semibold uppercase">AI Score</th>
            <th className="py-3 px-4 font-semibold uppercase w-16 text-center"></th>
          </tr>
        </thead>
        <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
          {useCases.map((uc) => (
            <tr key={uc.id} className="hover:bg-[#f0f4fb] transition-colors group">
              <td className="py-3 px-4 text-center">
                <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-primary font-bold">{uc.code || `UC-${uc.id}`}</span>
                  <Link to={`/projects/${activeProject?.id}/use-cases/${uc.id}`} className="font-medium text-on-surface hover:text-primary transition-colors">{uc.name}</Link>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '16px' }}>description</span>
                  <a href="#" className="text-primary hover:underline">{uc.requirement?.reqCode || `REQ-${uc.requirementId || 'X'}`}</a>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-secondary-container text-on-secondary-container">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                  </div>
                  <span>{uc.actors && uc.actors.length > 0 ? uc.actors.join(', ') : 'None'}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-wider
                  ${uc.status === 'APPROVED' ? 'bg-[#e6f4ea] text-[#137333]' : 
                    uc.status === 'IN_REVIEW' ? 'bg-[#fef7e0] text-[#b06000]' : 
                    'bg-surface-variant text-on-surface-variant'}`}>
                  {uc.status || 'DRAFT'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-surface-variant rounded-full h-1.5 max-w-[60px]">
                    <div 
                      className={`h-1.5 rounded-full ${(uc.completenessScore || 0) < 50 ? 'bg-error' : 'bg-primary'}`} 
                      style={{ width: `${uc.completenessScore || 0}%` }}
                    ></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">{uc.completenessScore || 0}%</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UseCaseTable;
