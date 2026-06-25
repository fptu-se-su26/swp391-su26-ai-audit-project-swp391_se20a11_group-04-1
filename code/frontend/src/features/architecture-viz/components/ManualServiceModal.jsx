import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Link, FolderPlus, Server, Settings } from 'lucide-react';
import { 
  addManualNode, 
  addManualEdge, 
  deleteManualNode, 
  deleteManualEdge 
} from '../api/architectureApi';
import toast from 'react-hot-toast';

const COMMON_TECHS = [
  { label: 'React', key: 'react', type: 'client' },
  { label: 'Spring Boot', key: 'springboot', type: 'service' },
  { label: 'PostgreSQL', key: 'postgresql', type: 'database' },
  { label: 'MongoDB', key: 'mongodb', type: 'database' },
  { label: 'Redis', key: 'redis', type: 'cache' },
  { label: 'Docker', key: 'docker', type: 'other' },
  { label: 'Nginx', key: 'nginx', type: 'other' },
  { label: 'Kafka', key: 'kafka', type: 'broker' },
  { label: 'Node.js', key: 'nodejs', type: 'service' },
  { label: 'Python', key: 'python', type: 'service' },
  { label: 'Go (Golang)', key: 'golang', type: 'service' },
  { label: 'Java', key: 'java', type: 'service' },
  { label: 'Plaid API', key: 'plaid', type: 'external' },
  { label: 'Telegram Bot', key: 'telegram', type: 'external' },
  { label: 'Let\'s Encrypt', key: 'letsencrypt', type: 'external' }
];

export default function ManualServiceModal({ isOpen, onClose, projectId, graphData, onRefresh }) {
  const [activeTab, setActiveTab] = useState('service');
  const [loading, setLoading] = useState(false);

  // Form states
  // 1. Service
  const [svcName, setSvcName] = useState('');
  const [svcTech, setSvcTech] = useState('');
  const [svcIcon, setSvcIcon] = useState('');
  const [svcGroup, setSvcGroup] = useState('');
  const [svcType, setSvcType] = useState('service');
  const [svcPort, setSvcPort] = useState('');
  const [svcDesc, setSvcDesc] = useState('');

  // 2. Infra Group
  const [grpName, setGrpName] = useState('');
  const [grpType, setGrpType] = useState('CONTAINER_CLUSTER');
  const [grpTech, setGrpTech] = useState('');
  const [grpIcon, setGrpIcon] = useState('');
  const [grpParent, setGrpParent] = useState('');

  // 3. Edge
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeProtocol, setEdgeProtocol] = useState('HTTP/REST');

  // Filter groups and services from current graph data for dropdown select
  const existingGroups = useMemo(() => {
    if (!graphData.nodes) return [];
    return graphData.nodes.filter(n => n.type === 'INFRA_GROUP' || n.nodeId?.startsWith('group:'));
  }, [graphData]);

  const allConnectableNodes = useMemo(() => {
    if (!graphData.nodes) return [];
    // Can connect services and groups
    return graphData.nodes.map(n => ({
      id: n.nodeId || n.id,
      name: n.name,
      type: n.type
    }));
  }, [graphData]);

  // List manual nodes & edges
  const manualNodes = useMemo(() => {
    if (!graphData.nodes) return [];
    return graphData.nodes.filter(n => n.metadata?.isManual || n.isManual || n.nodeId?.startsWith('manual:'));
  }, [graphData]);

  const manualEdges = useMemo(() => {
    if (!graphData.edges) return [];
    return graphData.edges.filter(e => e.metadata?.isManual || e.isManual || e.edgeId?.startsWith('manual:'));
  }, [graphData]);

  const handleTechChange = (techKey) => {
    setSvcTech(techKey);
    const matched = COMMON_TECHS.find(t => t.key === techKey);
    if (matched) {
      setSvcIcon(matched.key);
      setSvcType(matched.type);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!svcName) return toast.error('Vui lòng nhập tên dịch vụ');
    
    setLoading(true);
    try {
      const payload = {
        nodeId: `manual:service_${Date.now()}`,
        name: svcName,
        type: 'CLASS',
        parentId: svcGroup ? svcGroup : null,
        metadata: {
          tech: svcTech,
          icon: svcIcon || svcTech.toLowerCase(),
          port: svcPort || null,
          type: svcType,
          description: svcDesc,
          isManual: true
        }
      };
      await addManualNode(projectId, payload);
      toast.success('Thêm dịch vụ thành công!');
      // Reset
      setSvcName('');
      setSvcPort('');
      setSvcDesc('');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi thêm dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!grpName) return toast.error('Vui lòng nhập tên nhóm');

    setLoading(true);
    try {
      const payload = {
        nodeId: `manual:group_${Date.now()}`,
        name: grpName,
        type: 'INFRA_GROUP',
        parentId: grpParent ? grpParent : null,
        metadata: {
          groupType: grpType,
          tech: grpTech || null,
          icon: grpIcon || grpType.toLowerCase(),
          isManual: true
        }
      };
      await addManualNode(projectId, payload);
      toast.success('Thêm nhóm hạ tầng thành công!');
      setGrpName('');
      setGrpTech('');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi thêm nhóm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdge = async (e) => {
    e.preventDefault();
    if (!edgeSource || !edgeTarget) return toast.error('Vui lòng chọn nguồn và đích');
    if (edgeSource === edgeTarget) return toast.error('Nguồn và đích trùng nhau');

    setLoading(true);
    try {
      const payload = {
        edgeId: `manual:edge_${Date.now()}`,
        source: edgeSource,
        target: edgeTarget,
        type: 'DEPENDS_ON',
        metadata: {
          label: edgeProtocol,
          isManual: true
        }
      };
      await addManualEdge(projectId, payload);
      toast.success('Thêm kết nối thành công!');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi thêm kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phần tử này?')) return;
    try {
      await deleteManualNode(projectId, nodeId);
      toast.success('Đã xóa phần tử thủ công');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa phần tử');
    }
  };

  const handleDeleteEdge = async (edgeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kết nối này?')) return;
    try {
      await deleteManualEdge(projectId, edgeId);
      toast.success('Đã xóa kết nối thủ công');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa kết nối');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-vietnamese">
              Chỉnh Sửa Sơ Đồ Kiến Trúc
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 gap-2 text-xs">
          <button 
            onClick={() => setActiveTab('service')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'service' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Server className="w-3.5 h-3.5" />
            Thêm dịch vụ
          </button>
          <button 
            onClick={() => setActiveTab('group')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'group' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Thêm nhóm hạ tầng
          </button>
          <button 
            onClick={() => setActiveTab('edge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'edge' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Link className="w-3.5 h-3.5" />
            Thêm kết nối
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ml-auto ${activeTab === 'manage' ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Quản lý thay đổi ({manualNodes.length + manualEdges.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'service' && (
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Tên Dịch Vụ</label>
                  <input 
                    type="text" 
                    value={svcName}
                    onChange={(e) => setSvcName(e.target.value)}
                    placeholder="Ví dụ: Backend API, Payment Service"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Công Nghệ / Stack</label>
                  <select 
                    value={svcTech}
                    onChange={(e) => handleTechChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="">Chọn hoặc nhập thủ công</option>
                    {COMMON_TECHS.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Loại Dịch Vụ</label>
                  <select 
                    value={svcType}
                    onChange={(e) => setSvcType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="client">Client (Frontend)</option>
                    <option value="service">Service (Logic Backend)</option>
                    <option value="database">Database (Cơ sở dữ liệu)</option>
                    <option value="cache">Cache</option>
                    <option value="broker">Broker (Message Queue)</option>
                    <option value="worker">Worker</option>
                    <option value="parser">Parser</option>
                    <option value="external">External (Dịch vụ bên ngoài)</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Cổng (Port)</label>
                  <input 
                    type="text" 
                    value={svcPort}
                    onChange={(e) => setSvcPort(e.target.value)}
                    placeholder="Ví dụ: 8080"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Phân Nhóm Hạ Tầng</label>
                  <select 
                    value={svcGroup}
                    onChange={(e) => setSvcGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="">Để trống (Nằm ngoài cùng)</option>
                    {existingGroups.map(g => (
                      <option key={g.id || g.nodeId} value={g.id || g.nodeId}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Icon Brand Key</label>
                <input 
                  type="text" 
                  value={svcIcon}
                  onChange={(e) => setSvcIcon(e.target.value)}
                  placeholder="Ví dụ: springboot, react, postgresql, nodejs (để trống sẽ dùng mặc định)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Mô Tả Vai Trò</label>
                <textarea 
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                  placeholder="Mô tả công việc của dịch vụ này..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold font-vietnamese transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm dịch vụ
              </button>
            </form>
          )}

          {activeTab === 'group' && (
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Tên Nhóm Hạ Tầng</label>
                  <input 
                    type="text" 
                    value={grpName}
                    onChange={(e) => setGrpName(e.target.value)}
                    placeholder="Ví dụ: AWS EC2 Instance, Docker Compose"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Loại Nhóm (Group Type)</label>
                  <select 
                    value={grpType}
                    onChange={(e) => setGrpType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="CI_CD">CI/CD Pipeline (Build/Test/Deploy)</option>
                    <option value="CLOUD_INSTANCE">Cloud Instance / Host Server (Máy chủ vật lý/GCP/AWS)</option>
                    <option value="CONTAINER_CLUSTER">Container Cluster (Docker Compose, Kubernetes)</option>
                    <option value="MONITORING">Monitoring Stack (Hộp giám sát Prometheus/Grafana)</option>
                    <option value="EXTERNAL">External Services (Các SaaS bên ngoài gọi qua internet)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Công Nghệ sử dụng</label>
                  <input 
                    type="text" 
                    value={grpTech}
                    onChange={(e) => setGrpTech(e.target.value)}
                    placeholder="Ví dụ: Docker Compose v2, AWS EC2 Instance"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Nhóm Cha (Nesting)</label>
                  <select 
                    value={grpParent}
                    onChange={(e) => setGrpParent(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="">Không lồng (Nằm ngoài cùng)</option>
                    {existingGroups.map(g => (
                      <option key={g.id || g.nodeId} value={g.id || g.nodeId}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Icon Brand Key</label>
                <input 
                  type="text" 
                  value={grpIcon}
                  onChange={(e) => setGrpIcon(e.target.value)}
                  placeholder="Ví dụ: amazonec2, docker, kubernetes, githubactions"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold font-vietnamese transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm nhóm hạ tầng
              </button>
            </form>
          )}

          {activeTab === 'edge' && (
            <form onSubmit={handleAddEdge} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Nguồn (Source)</label>
                  <select 
                    value={edgeSource}
                    onChange={(e) => setEdgeSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="">Chọn dịch vụ/nhóm gửi đi</option>
                    {allConnectableNodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.type === 'INFRA_GROUP' ? 'Nhóm' : 'Dịch vụ'})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Đích (Target)</label>
                  <select 
                    value={edgeTarget}
                    onChange={(e) => setEdgeTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    <option value="">Chọn dịch vụ/nhóm gọi tới</option>
                    {allConnectableNodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.type === 'INFRA_GROUP' ? 'Nhóm' : 'Dịch vụ'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Giao thức kết nối / Nhãn mối quan hệ</label>
                <input 
                  type="text" 
                  value={edgeProtocol}
                  onChange={(e) => setEdgeProtocol(e.target.value)}
                  placeholder="Ví dụ: HTTP/REST, JDBC, gRPC, WebSocket, SSH Deploy, remote_write"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold font-vietnamese transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm kết nối
              </button>
            </form>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Phần tử thêm thủ công ({manualNodes.length})</h4>
                {manualNodes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-vietnamese">Chưa có dịch vụ hay nhóm hạ tầng thủ công nào.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/55">
                    {manualNodes.map(n => (
                      <div key={n.nodeId} className="flex justify-between items-center px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-900">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{n.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{n.nodeId} | {n.type === 'INFRA_GROUP' ? 'Group' : 'Service'}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteNode(n.nodeId || n.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-vietnamese font-bold">Mối quan hệ thêm thủ công ({manualEdges.length})</h4>
                {manualEdges.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-vietnamese">Chưa có kết nối thủ công nào.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/55">
                    {manualEdges.map(e => {
                      const srcLabel = allConnectableNodes.find(n => n.id === e.source)?.name || e.source.split(':').pop();
                      const tgtLabel = allConnectableNodes.find(n => n.id === e.target)?.name || e.target.split(':').pop();
                      return (
                        <div key={e.edgeId} className="flex justify-between items-center px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-900">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 dark:text-slate-350">{srcLabel} → {tgtLabel}</span>
                            <span className="text-[9px] text-slate-400 font-mono">Giao thức: {e.metadata?.label || e.label}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteEdge(e.edgeId || e.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
