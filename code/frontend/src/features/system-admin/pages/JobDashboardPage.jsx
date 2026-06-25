import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@api/axiosConfig';
import toast from 'react-hot-toast';

export default function JobDashboardPage() {
  const [stats, setStats] = useState({ pending: 0, published: 0, dead: 0, dlqCount: 0 });
  const [dlqEvents, setDlqEvents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [runsPage, setRunsPage] = useState(0);
  const [dlqPage, setDlqPage] = useState(0);
  
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

  useEffect(() => {
    fetchStats();
    fetchDlq();
    fetchRuns();
    
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchDlq, fetchRuns]);

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
    </div>
  );
}
