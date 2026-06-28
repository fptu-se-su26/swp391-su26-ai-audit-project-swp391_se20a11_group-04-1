import React from 'react';
import useSyncStatus from '../../hooks/useSyncStatus';

const SyncStatusBadge = ({ projectId }) => {
    const { isSyncing } = useSyncStatus(projectId);

    if (!isSyncing) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium border border-blue-100 shadow-sm animate-pulse ml-2 transition-all duration-300">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing...
        </div>
    );
};

export default SyncStatusBadge;
