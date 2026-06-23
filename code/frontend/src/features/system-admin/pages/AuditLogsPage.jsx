import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import SystemAdminLayout from '../layouts/SystemAdminLayout';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters and Pagination
  const [page, setPage] = useState(0);
  const size = 20;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All Time');
  
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset page on search change
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs(page, size, debouncedSearch, typeFilter, timeFilter);
      if (res.data?.success) {
        setLogs(res.data.data.content);
        setTotalElements(res.data.data.totalElements);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, typeFilter, timeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(0); // reset page on filter change
  };

  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await adminService.exportAuditLogs(debouncedSearch, typeFilter, timeFilter);
      if (res.data?.success) {
        const allLogs = res.data.data.content;
        
        let csvContent = "data:text/csv;charset=utf-8,ID,Type,Category,Message,Timestamp\n";
        allLogs.forEach(row => {
          const dateStr = new Date(row.timestamp).toLocaleString();
          const escapedMessage = row.message ? row.message.replace(/"/g, '""') : '';
          csvContent += `${row.id},${row.type},${row.category},"${escapedMessage}",${dateStr}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${typeFilter}_${timeFilter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <SystemAdminLayout>
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 md:px-8 py-8 relative">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 text-[13px] text-on-surface-variant mb-2">
                <Link to="/admin" className="hover:text-[#1E707D] transition-colors">Admin Dashboard</Link>
                <span>/</span>
                <span className="text-on-surface font-medium">Audit Logs</span>
              </div>
              <h1 className="font-display-sm text-on-surface font-semibold">System Audit Logs</h1>
              <p className="text-[14px] text-on-surface-variant mt-1">
                Toàn bộ lịch sử hoạt động của hệ thống
              </p>
            </div>
            <button 
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 bg-[#1E707D] text-white px-4 py-2 rounded-lg text-[13px] font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {exporting ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">download</span>
              )}
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm log..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-[13px] text-on-surface focus:border-[#1E707D] focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={typeFilter} 
                onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-[13px] text-on-surface focus:border-[#1E707D] focus:outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Users">Users</option>
                <option value="Projects">Projects</option>
              </select>
              <select 
                value={timeFilter} 
                onChange={(e) => handleFilterChange(setTimeFilter, e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-[13px] text-on-surface focus:border-[#1E707D] focus:outline-none cursor-pointer"
              >
                <option value="All Time">All Time</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 1 Year">Last 1 Year</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[13px] text-on-surface-variant font-medium">
                    <th className="px-6 py-4 w-16">Icon</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4 w-32">Category</th>
                    <th className="px-6 py-4 w-48">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-on-surface-variant text-[14px]">
                        <span className="material-symbols-outlined animate-spin text-[#1E707D] text-[24px]">progress_activity</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-on-surface-variant text-[14px]">
                        Không tìm thấy log nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.type === 'school' ? 'bg-purple-500/10 text-purple-500' : 'bg-[#1E707D]/10 text-[#1E707D]'}`}>
                            <span className="material-symbols-outlined text-[16px]">{log.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-on-surface group-hover:text-[#1E707D] transition-colors">
                          {log.message}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-surface-container-high text-on-surface-variant">
                            {log.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-on-surface-variant">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <span className="text-[13px] text-on-surface-variant">
                Hiển thị {logs.length} trên {totalElements} kết quả
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant text-on-surface-variant hover:text-[#1E707D] hover:border-[#1E707D] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    // Simple pagination (show max 5 buttons)
                    if (totalPages > 5) {
                      if (i !== 0 && i !== totalPages - 1 && Math.abs(i - page) > 1) {
                        if (i === 1 || i === totalPages - 2) return <span key={i} className="text-on-surface-variant">...</span>;
                        return <React.Fragment key={i} />;
                      }
                    }
                    return (
                      <button 
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-[13px] transition-colors ${page === i ? 'bg-[#1E707D] text-white font-medium shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
                <button 
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant text-on-surface-variant hover:text-[#1E707D] hover:border-[#1E707D] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </SystemAdminLayout>
  );
};

export default AuditLogsPage;
