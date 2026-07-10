import React, { useState, useEffect, useCallback } from 'react';
import SystemAdminLayout from '../layouts/SystemAdminLayout';
import { getKubernetesStatus, getKafkaStatus } from '../services/resourceManagementService';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ResourceManagementPage = () => {
  const [k8sData, setK8sData] = useState(null);
  const [kafkaData, setKafkaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false); // true khi đã kết nối WS
  
  // Historical data for charts
  const [chartData, setChartData] = useState([]);

  // Hàm chung để xử lý data snapshot (dùng cho cả HTTP init lẫn WS push)
  const applySnapshot = useCallback((k8sRes, kafkaRes) => {
    setK8sData(k8sRes);
    setKafkaData(kafkaRes);
    const now = new Date();
    setLastUpdated(now);
    setChartData(prev => {
      // Active Workers = số pod Running thực tế (không dùng KEDA currentReplicas
      // vì KEDA trả 0 khi idle dù pod vẫn chạy với minReplicaCount=1)
      const runningPods = (k8sRes?.pods || []).filter(p => p.status === 'Running').length;
      const newDataPoint = {
        time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        lag: kafkaRes?.totalLag || 0,
        workers: runningPods,
        maxWorkers: k8sRes?.scaler?.maxReplicas || 0,
      };
      const updated = [...prev, newDataPoint];
      return updated.length > 30 ? updated.slice(updated.length - 30) : updated;
    });
  }, []);

  // Initial HTTP fetch khi mount — để hiển thị data ngay lập tức
  // trước khi WS scheduler push lần đầu (tối đa 5s)
  useEffect(() => {
    const initialFetch = async () => {
      try {
        const [k8sRes, kafkaRes] = await Promise.all([
          getKubernetesStatus(),
          getKafkaStatus()
        ]);
        applySnapshot(k8sRes, kafkaRes);
        setError(null);
      } catch (err) {
        console.error('Error fetching initial resource data:', err);
        setError('Lỗi khi lấy dữ liệu tài nguyên hệ thống. Vui lòng kiểm tra lại kết nối.');
      } finally {
        setLoading(false);
      }
    };
    initialFetch();
  }, [applySnapshot]);

  // WebSocket listener — nhận RESOURCE_SNAPSHOT push từ backend mỗi 5s
  useEffect(() => {
    const handleSnapshot = (event) => {
      // Skip update khi tab bị ẩn để tránh stale data tích lũy trong chartData
      if (document.hidden) return;

      const payload = event.detail;
      if (payload?.type === 'RESOURCE_SNAPSHOT' && payload.k8s && payload.kafka) {
        applySnapshot(payload.k8s, payload.kafka);
        setIsRealtime(true);
        setError(null);
        setLoading(false);
      }
    };

    window.addEventListener('resource-snapshot', handleSnapshot);
    return () => window.removeEventListener('resource-snapshot', handleSnapshot);
  }, [applySnapshot]);

  const formatAge = (ageStr) => {
    if (!ageStr) return '-';
    try {
      const created = new Date(ageStr);
      const now = new Date();
      const diffMs = now - created;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return `${diffSecs}s`;
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
      return `${diffDays}d ${diffHours % 24}h`;
    } catch (e) {
      return ageStr;
    }
  };

  const getPodStatusColor = (status) => {
    if (status === 'Running') return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
    if (status === 'Pending') return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
    if (status === 'Terminating') return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
    return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
  };

  return (
    <SystemAdminLayout>
      <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1E707D] text-3xl">dns</span>
              Quản lý tài nguyên hệ thống
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Giám sát tình trạng hàng đợi Kafka và hệ thống chạy tự động Kubernetes Pods. Cập nhật realtime qua WebSocket mỗi 5s.
            </p>
          </div>
          {lastUpdated && (
            <div className="text-sm text-gray-500 flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm transition-all duration-300">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRealtime ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isRealtime ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              </span>
              {isRealtime ? 'Realtime · ' : 'Snapshot · '}
              {lastUpdated.toLocaleTimeString('vi-VN')}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">error</span>
            <p>{error}</p>
          </div>
        )}

        {loading && !k8sData && !kafkaData ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KPI OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Lag Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Messages Tồn Đọng</p>
                    <h3 className={`text-4xl font-extrabold mt-2 ${kafkaData?.totalLag > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                      {kafkaData?.totalLag ?? '-'}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-lg ${kafkaData?.totalLag > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="material-symbols-outlined">stacked_inbox</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                  {kafkaData?.totalLag > 0 ? (
                    <><span className="material-symbols-outlined text-xs text-orange-500">warning</span> Cần xử lý</>
                  ) : 'Hệ thống đang rảnh'}
                </div>
              </div>

              {/* Workers Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Workers</p>
                    <h3 className="text-4xl font-extrabold mt-2 text-indigo-700">
                      {k8sData?.pods?.filter(p => p.status === 'Running').length ?? '-'}
                    </h3>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <span className="material-symbols-outlined">smart_toy</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                  KEDA Min: {k8sData?.scaler?.minReplicas ?? '-'} | Max: {k8sData?.scaler?.maxReplicas ?? '-'}
                </div>
              </div>

              {/* K8s Pods Running */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pods Đang Chạy</p>
                    <h3 className="text-4xl font-extrabold mt-2 text-emerald-600">
                      {k8sData?.pods?.filter(p => p.status === 'Running').length ?? 0}
                    </h3>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <span className="material-symbols-outlined">apps</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                  Tổng số cấp phát: {k8sData?.pods?.length ?? 0} pods
                </div>
              </div>

              {/* Cluster Status */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Trạng thái Cluster</p>
                    <h3 className={`text-xl font-extrabold mt-2 ${k8sData?.status === 'OK' && kafkaData?.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                      {k8sData?.status === 'OK' && kafkaData?.status === 'OK' ? 'HEALTHY' : 'DEGRADED'}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-lg ${k8sData?.status === 'OK' && kafkaData?.status === 'OK' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <span className="material-symbols-outlined">health_and_safety</span>
                  </div>
                </div>
                <div className="mt-4 text-xs flex gap-3">
                  <span className={k8sData?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>K8s API</span>
                  <span className={kafkaData?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>Kafka</span>
                </div>
              </div>
            </div>

            {/* KEDA CONFIGURATION BANNER */}
            {k8sData?.scaler && (
              <div className="bg-gradient-to-r from-teal-50 to-indigo-50 rounded-xl border border-teal-100 p-4 flex flex-wrap gap-6 items-center shadow-sm">
                <div className="flex items-center gap-2 text-teal-800 font-semibold mr-4">
                  <span className="material-symbols-outlined">settings_suggest</span>
                  KEDA Autoscaler
                </div>
                <div className="flex flex-wrap gap-8 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Lag Threshold</span>
                    <span className="font-bold text-gray-800">{k8sData.scaler.lagThreshold} msgs</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Cooldown Period</span>
                    <span className="font-bold text-gray-800">{k8sData.scaler.cooldownPeriod}s</span>
                  </div>
                  <div className="flex flex-col border-l border-teal-200 pl-8">
                    <span className="text-gray-500 text-xs">Trigger Status</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`h-2 w-2 rounded-full ${k8sData.scaler.active ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`}></span>
                      <span className={`font-bold ${k8sData.scaler.active ? 'text-teal-700' : 'text-gray-500'}`}>
                        {k8sData.scaler.active ? 'ACTIVE (Scaling)' : 'IDLE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REAL-TIME AUTOSCALING CHART */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">monitoring</span>
                  Autoscaling Pipeline (Kafka Lag vs Workers)
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {isRealtime ? 'Realtime · 5s' : 'Polling: manual'}
                </span>
              </div>
              <div className="h-80 w-full relative">
                {chartData.length < 2 && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg border border-dashed border-gray-200">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600 font-medium text-sm">Đang thu thập dữ liệu time-series...</p>
                    <p className="text-gray-400 text-xs mt-1">Đang chờ thêm {2 - chartData.length} điểm dữ liệu từ scheduler (mỗi 5s)</p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLag" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="time" textAnchor="end" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#f97316" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#4f46e5" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="lag" name="Total Lag (Messages)" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorLag)" animationDuration={500} />
                    <Line yAxisId="right" type="stepAfter" dataKey="workers" name="Active Workers" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} animationDuration={500} />
                    <Line yAxisId="right" type="monotone" dataKey="maxWorkers" name="Max Capacity" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={500} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LOWER SECTION: KAFKA PARTITIONS & KUBERNETES PODS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* KAFKA PARTITIONS */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">view_column</span>
                    Chi tiết Partitions
                  </h3>
                </div>
                <div className="flex-1 overflow-x-auto p-4">
                  {kafkaData?.partitionDetails && kafkaData.partitionDetails.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold rounded-tl-lg">Partition ID</th>
                          <th className="px-4 py-3 font-semibold">Assigned Worker</th>
                          <th className="px-4 py-3 font-semibold text-right">Offset / End</th>
                          <th className="px-4 py-3 font-semibold text-right">Active Jobs</th>
                          <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Lag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {kafkaData.partitionDetails.map(p => (
                          <tr key={p.partition} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">Partition-{p.partition}</td>
                            <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]" title={p.consumerId}>
                              {p.consumerId !== 'none' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                  {/* BUG FIX #13: conditional ellipsis chỉ khi dài hơn 15 ký tự */}
                                  {p.consumerId.length > 15 ? p.consumerId.substring(0, 15) + '...' : p.consumerId}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic text-xs">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-right text-xs font-mono">
                              {p.currentOffset} <span className="text-gray-400">/ {p.endOffset}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {(p.activeJobs ?? 0) > 0 ? (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 animate-pulse">
                                  ⚙ {p.activeJobs}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">
                                  0
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${p.lag > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              {p.lag > 0 ? `+${p.lag}` : '0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-500 italic text-sm">
                      Không có thông tin Partitions
                    </div>
                  )}
                </div>
              </div>

              {/* KUBERNETES PODS */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">apps</span>
                    Kubernetes Worker Pods
                  </h3>
                </div>
                <div className="flex-1 overflow-x-auto p-4">
                  {k8sData?.pods?.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3 rounded-tl-lg">Pod Name</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-center">Restarts</th>
                          <th className="px-4 py-3">CPU / RAM</th>
                          <th className="px-4 py-3 rounded-tr-lg text-right">Uptime</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {k8sData.pods.map((pod, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800 text-xs max-w-[150px] truncate" title={pod.name}>
                              {pod.name}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${getPodStatusColor(pod.status)}`}></span>
                                <span className="text-gray-700 font-medium text-xs">{pod.status}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pod.restarts > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                {pod.restarts}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {pod.cpuRequest || '-'} / {pod.memoryRequest || '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs text-right">
                              {formatAge(pod.age)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-500 italic text-sm">
                      Không có Worker Pod nào đang chạy
                    </div>
                  )}
                </div>
              </div>
              
            </div>

          </div>
        )}
      </div>
    </SystemAdminLayout>
  );
};

export default ResourceManagementPage;

