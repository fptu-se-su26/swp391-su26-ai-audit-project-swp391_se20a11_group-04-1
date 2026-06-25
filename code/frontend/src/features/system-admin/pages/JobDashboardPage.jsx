import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@api/axiosConfig';
import toast from 'react-hot-toast';

export default function JobDashboardPage() {
  const [stats, setStats] = useState({ pending: 0, published: 0, dead: 0, dlqCount: 0 });
  const [dlqEvents, setDlqEvents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [runsPage, setRunsPage] = useState(0);
  const [dlqPage, setDlqPage] = useState(0);
  
  const [auditStats, setAuditStats] = useState({ totalToday: 0, failedToday: 0, suspiciousUsers: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [debouncedAction, setDebouncedAction] = useState("");

  const [healthSummary, setHealthSummary] = useState(null);
  const [jobStats, setJobStats] = useState([]);
  const [jobStatsPage, setJobStatsPage] = useState(0);
  const [jobNameFilter, setJobNameFilter] = useState('');
  const [isLiveChecking, setIsLiveChecking] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAction(auditActionFilter);
      setAuditPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [auditActionFilter]);
  
  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/v1/admin/outbox/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchDlq = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/v1/admin/dlq?page=${dlqPage}&size=20`);
      if (res.data.success) {
        setDlqEvents(res.data.data.content || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [dlqPage]);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/v1/admin/scheduler/runs?page=${runsPage}&size=20`);
      if (res.data.success) {
        setRuns(res.data.data.content || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [runsPage]);

  const fetchAuditStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/v1/admin/audit/stats');
      if (res.data.success) {
        setAuditStats(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      let url = `/api/v1/admin/audit/logs?page=${auditPage}&size=20`;
      if (debouncedAction) {
        url += `&action=${encodeURIComponent(debouncedAction)}`;
      }
      const res = await axiosInstance.get(url);
      if (res.data.success) {
        setAuditLogs(res.data.data.content || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [auditPage, debouncedAction]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/v1/admin/monitor/health');
      if (res.data.success) {
        setHealthSummary(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLiveCheck = async () => {
    if (isLiveChecking) return;
    setIsLiveChecking(true);
    try {
      const res = await axiosInstance.get('/api/v1/admin/monitor/health/live');
      if (res.data.success) {
        toast.success("Live check completed");
        fetchHealth();
      }
    } catch (e) {
      toast.error("Live check failed");
    } finally {
      setTimeout(() => setIsLiveChecking(false), 10000);
    }
  };

  const fetchJobStats = useCallback(async () => {
    try {
      let url = `/api/v1/admin/monitor/jobs?page=${jobStatsPage}&size=10`;
      if (jobNameFilter) {
        url += `&name=${encodeURIComponent(jobNameFilter)}`;
      }
      const res = await axiosInstance.get(url);
      if (res.data.success) {
        setJobStats(res.data.data.content || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [jobStatsPage, jobNameFilter]);

  useEffect(() => {
    fetchStats();
    fetchDlq();
    fetchRuns();
    fetchAuditStats();
    fetchAuditLogs();
    fetchHealth();
    fetchJobStats();
    
    const interval = setInterval(() => {
      fetchStats();
      fetchAuditStats();
    }, 30000);

    const healthInterval = setInterval(() => {
      fetchHealth();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(healthInterval);
    };
  }, [fetchStats, fetchDlq, fetchRuns, fetchAuditStats, fetchAuditLogs, fetchHealth, fetchJobStats]);

  const handleRetry = async (id) => {
    try {
      await axiosInstance.post(`/api/v1/admin/dlq/${id}/retry`);
      toast.success('Retry requested successfully');
      fetchDlq();
      fetchStats();
    } catch (e) {
      toast.error('Failed to request retry');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Job Dashboard</h1>

      {/* SECTION 1: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-500 rounded-lg shadow-lg p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Pending Events</p>
          <p className="text-4xl font-extrabold">{stats.pending}</p>
        </div>
        <div className="bg-green-500 rounded-lg shadow-lg p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Published Events</p>
          <p className="text-4xl font-extrabold">{stats.published}</p>
        </div>
        <div className="bg-red-500 rounded-lg shadow-lg p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Dead Events</p>
          <p className="text-4xl font-extrabold">{stats.dead}</p>
        </div>
        <div className="bg-orange-500 rounded-lg shadow-lg p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">DLQ Count</p>
          <p className="text-4xl font-extrabold">{stats.dlqCount}</p>
        </div>
      </div>

      {/* SECTION 2: DLQ Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Dead Letter Queue</h2>
          <div className="space-x-2 flex items-center">
            <button onClick={() => setDlqPage(Math.max(0, dlqPage - 1))} disabled={dlqPage === 0} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <span className="text-sm font-medium text-gray-500 mx-2">Page {dlqPage + 1}</span>
            <button onClick={() => setDlqPage(dlqPage + 1)} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50">Next</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Event Type</th>
                <th className="px-5 py-4">Agg ID</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4 text-center">Retries</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dlqEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">{event.id}</td>
                  <td className="px-5 py-4 font-semibold text-gray-800">{event.eventType}</td>
                  <td className="px-5 py-4">{event.aggregateId}</td>
                  <td className="px-5 py-4 text-red-600 max-w-[200px] truncate" title={event.failureReason}>{event.failureReason}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-gray-700">{event.retryCount}</span>
                    {event.retryStatus && (
                      <span className={`block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${event.retryStatus === 'RETRY_REQUESTED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {event.retryStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{new Date(event.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleRetry(event.id)} className="text-blue-600 hover:text-white hover:bg-blue-600 font-semibold bg-blue-50 px-4 py-1.5 rounded transition-colors shadow-sm">Retry</button>
                  </td>
                </tr>
              ))}
              {dlqEvents.length === 0 && (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-500 font-medium">No events in DLQ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Scheduler Runs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Scheduler Run History</h2>
          <div className="space-x-2 flex items-center">
            <button onClick={() => setRunsPage(Math.max(0, runsPage - 1))} disabled={runsPage === 0} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <span className="text-sm font-medium text-gray-500 mx-2">Page {runsPage + 1}</span>
            <button onClick={() => setRunsPage(runsPage + 1)} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50">Next</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
              <tr>
                <th className="px-5 py-4">Job Name</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Duration (s)</th>
                <th className="px-5 py-4">Records (Scan/Create/Send)</th>
                <th className="px-5 py-4">Started</th>
                <th className="px-5 py-4">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map(run => (
                <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-800">{run.jobName}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider ${
                      run.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                      run.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700 animate-pulse'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium">{run.durationSeconds ?? '-'}</td>
                  <td className="px-5 py-4 text-gray-500">
                    <span className="font-semibold text-gray-700">{run.totalScanned}</span> / <span className="font-semibold text-green-600">{run.totalCreated}</span> / <span className="font-semibold text-blue-600">{run.totalSent}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-red-500 text-xs max-w-[150px] truncate" title={run.errorMessage}>{run.errorMessage || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Audit Logs */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-t pt-8">System Audit Logs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-500 rounded-lg shadow-lg p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Total Today</p>
            <p className="text-4xl font-extrabold">{auditStats.totalToday}</p>
          </div>
          <div className="bg-red-500 rounded-lg shadow-lg p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Failed Today</p>
            <p className="text-4xl font-extrabold">{auditStats.failedToday}</p>
          </div>
          <div className="bg-orange-500 rounded-lg shadow-lg p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Suspicious Users</p>
            <p className="text-4xl font-extrabold">{auditStats.suspiciousUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Filter by action..."
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-sm border rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
              />
              {auditActionFilter && (
                <button
                  onClick={() => setAuditActionFilter("")}
                  className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 font-bold"
                >
                  &times;
                </button>
              )}
            </div>
            <div className="space-x-2 flex items-center">
              <button onClick={() => setAuditPage(Math.max(0, auditPage - 1))} disabled={auditPage === 0} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Prev</button>
              <span className="text-sm font-medium text-gray-500 mx-2">Page {auditPage + 1}</span>
              <button onClick={() => setAuditPage(auditPage + 1)} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50">Next</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{log.username || 'System/Anon'}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.entityType ? (
                        <span><span className="font-semibold text-gray-700">{log.entityType}</span> #{log.entityId}</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.ipAddress}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.httpMethod || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider ${
                        log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        log.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{log.durationMs || 0}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-500 font-medium">No audit logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 5: System Health */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-t pt-8">System Health & Monitoring</h2>

        {/* Row 1: Overall Status Banner */}
        <div className={`rounded-xl shadow-sm p-5 flex flex-col md:flex-row justify-between items-center transition-colors ${
          !healthSummary ? 'bg-gray-100 animate-pulse' :
          healthSummary.overallStatus === 'UP' ? 'bg-green-50 border border-green-200' :
          healthSummary.overallStatus === 'WARN' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div>
            <h3 className={`text-lg font-bold ${
              !healthSummary ? 'text-gray-400' :
              healthSummary.overallStatus === 'UP' ? 'text-green-800' :
              healthSummary.overallStatus === 'WARN' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              {!healthSummary ? 'Checking Status...' :
               healthSummary.overallStatus === 'UP' ? 'All Systems Operational' :
               healthSummary.overallStatus === 'WARN' ? 'Degraded Performance' :
               'System Issues Detected'}
            </h3>
            {healthSummary && (
              <p className="text-sm text-gray-600 mt-1">Last checked: {new Date(healthSummary.lastCheckedAt).toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={handleLiveCheck}
            disabled={isLiveChecking}
            className={`mt-4 md:mt-0 px-4 py-2 rounded-lg font-semibold shadow-sm transition-all ${
              isLiveChecking 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white border text-gray-700 hover:bg-gray-50 active:scale-95'
            }`}
          >
            {isLiveChecking ? 'Checking...' : 'Run Live Check'}
          </button>
        </div>

        {/* Row 2: Component Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['DATABASE', 'DISK', 'MEMORY'].map((compName) => {
            const comp = healthSummary?.components?.find(c => c.component === compName);
            if (!comp) {
              return (
                <div key={compName} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              );
            }
            return (
              <div key={compName} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold uppercase text-gray-600">{comp.component}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      comp.status === 'UP' ? 'bg-green-100 text-green-700' :
                      comp.status === 'WARN' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {comp.status}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{comp.message || 'Healthy'}</p>
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
                  <span>{comp.responseTimeMs ?? '-'} ms</span>
                  <span>{comp.checkedAt ? new Date(comp.checkedAt).toLocaleTimeString() : '-'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 3: Job Stats Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Job Statistics</h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <select
                value={jobNameFilter}
                onChange={(e) => { setJobNameFilter(e.target.value); setJobStatsPage(0); }}
                className="w-full md:w-auto px-3 py-1.5 text-sm border rounded outline-none focus:border-blue-500 transition-shadow bg-white"
              >
                <option value="">All Monitored Jobs</option>
                <option value="DataSyncScheduler">DataSyncScheduler</option>
                <option value="AuditMonitorScheduler">AuditMonitorScheduler</option>
                <option value="SystemMonitorScheduler">SystemMonitorScheduler</option>
              </select>
              <div className="space-x-2 flex items-center shrink-0">
                <button onClick={() => setJobStatsPage(Math.max(0, jobStatsPage - 1))} disabled={jobStatsPage === 0} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Prev</button>
                <span className="text-sm font-medium text-gray-500 mx-1">Page {jobStatsPage + 1}</span>
                <button onClick={() => setJobStatsPage(jobStatsPage + 1)} className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50">Next</button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Job Name</th>
                  <th className="px-4 py-3">Duration (ms)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Consecutive Failures</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobStats.map(stat => (
                  <tr key={stat.id || stat.executedAt} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{new Date(stat.executedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{stat.jobName}</td>
                    <td className="px-4 py-3 font-mono">{stat.durationMs || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider ${
                        stat.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {stat.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${stat.consecutiveFailures > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {stat.consecutiveFailures}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-red-500 text-xs max-w-[200px] truncate" title={stat.errorMessage}>{stat.errorMessage || '-'}</td>
                  </tr>
                ))}
                {jobStats.length === 0 && (
                  <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500 font-medium">No job statistics found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
