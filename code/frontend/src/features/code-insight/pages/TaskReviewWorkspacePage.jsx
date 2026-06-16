import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import codeInsightService from '../services/codeInsightService'
import useProjectStore from '@store/useProjectStore'
import taskService from '@features/kanban/services/taskService'
import toast from 'react-hot-toast'

// Lightweight Native STOMP Client for WebSocket communication without external npm packages
class NativeStompClient {
  constructor(url, onConnect) {
    this.ws = new WebSocket(url);
    this.onConnect = onConnect;
    this.connected = false;
    this.callbacks = {};

    this.ws.onopen = () => {
      this.sendFrame('CONNECT', { 'accept-version': '1.1,1.0', 'heart-beat': '10000,10000' });
    };

    this.ws.onmessage = (evt) => {
      this.handleMessage(evt.data);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket STOMP error:", err);
    };

    this.ws.onclose = () => {
      console.log("WebSocket STOMP connection closed");
    };
  }

  sendFrame(command, headers, body = '') {
    let frame = command + '\n';
    for (let key in headers) {
      frame += key + ':' + headers[key] + '\n';
    }
    frame += '\n' + body + '\u0000';
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    }
  }

  subscribe(destination, callback) {
    const id = 'sub-' + Math.random().toString(36).substring(2, 9);
    this.callbacks[id] = callback;
    this.sendFrame('SUBSCRIBE', { id, destination });
    return () => {
      this.sendFrame('UNSUBSCRIBE', { id });
      delete this.callbacks[id];
    };
  }

  handleMessage(data) {
    if (!data || data.trim() === '') return;
    const nullIdx = data.indexOf('\u0000');
    if (nullIdx >= 0) {
      data = data.substring(0, nullIdx);
    }
    const parts = data.split('\n\n');
    if (parts.length < 2) return;
    const headerLines = parts[0].split('\n');
    const command = headerLines[0].trim();

    if (command === 'CONNECTED') {
      this.connected = true;
      if (this.onConnect) this.onConnect();
    } else if (command === 'MESSAGE') {
      const headers = {};
      for (let i = 1; i < headerLines.length; i++) {
        const line = headerLines[i].trim();
        const colon = line.indexOf(':');
        if (colon > 0) {
          headers[line.substring(0, colon).trim()] = line.substring(colon + 1).trim();
        }
      }
      const body = parts.slice(1).join('\n\n');
      const subId = headers.subscription;
      if (subId && this.callbacks[subId]) {
        this.callbacks[subId](headers.destination, body);
      }
    }
  }

  disconnect() {
    try {
      this.ws.close();
    } catch (e) {}
  }
}

// Component A: Code Patch Analyzer
const CodePatchAnalyzer = ({ changedFiles }) => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm mt-4">
      <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">data_object</span>
        Component A: Code Patch Analyzer (Physical Changes)
      </h3>
      {changedFiles && changedFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {changedFiles.map((file, idx) => (
            <div key={idx} className="rounded-lg border border-outline-variant p-3 bg-surface hover:shadow-sm transition-all flex justify-between items-center">
              <div className="overflow-hidden mr-2">
                <p className="font-mono text-sm break-all font-semibold text-on-surface truncate" title={file.filePath}>{file.filePath}</p>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mt-1">{file.status || 'MODIFIED'}</p>
              </div>
              <div className="text-xs shrink-0 flex gap-2 font-bold font-mono">
                <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">+{file.additions}</span>
                <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">-{file.deletions}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">No code changes detected or parsed yet.</p>
      )}
    </div>
  )
}

// Component B: Req-Diff Alignment & Risk Assessment
const ReqDiffAlignment = ({ aiReview, streamingMarkdown }) => {
  const parsedAlignment = useMemo(() => {
    if (!aiReview || !aiReview.alignmentResultJson) return null;
    try {
      return JSON.parse(aiReview.alignmentResultJson);
    } catch (e) {
      console.error("Failed to parse alignment matrix json", e);
      return null;
    }
  }, [aiReview]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm mt-4">
      <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">model_training</span>
        Component B: Req-Diff Alignment & Risk Assessment
      </h3>

      {streamingMarkdown && (
        <div className="mb-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 font-sans text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed shadow-sm">
          <div className="font-bold text-xs uppercase text-neutral-500 mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary animate-pulse">chat</span>
            Live AI Audit Commentary
          </div>
          {streamingMarkdown}
        </div>
      )}

      {aiReview ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">AI Recommendation:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
              aiReview.recommendation === 'LIKELY_READY' ? 'bg-green-100 text-green-800 border border-green-200' :
              aiReview.recommendation === 'NEEDS_REVIEW' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              'bg-red-100 text-red-800 border border-red-200'
            }`}>{aiReview.recommendation?.replace('_', ' ')}</span>
            <span className="text-xs text-on-surface-variant font-bold">Confidence: {Math.round((aiReview.confidence || 0) * 100)}%</span>
            {aiReview.codeRiskLevel && (
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                aiReview.codeRiskLevel === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                aiReview.codeRiskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                aiReview.codeRiskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>Risk: {aiReview.codeRiskLevel}</span>
            )}
          </div>
          
          <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
            <p className="font-bold text-sm text-on-surface mb-1">Executive Summary</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{aiReview.summary}</p>
          </div>

          {parsedAlignment && (
            <div className="space-y-4">
              {/* Section 1: Targeted by This Task */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-green-600 text-[18px]">verified</span>
                    Tiêu chí của Task hiện tại (Targeted by This Task)
                  </span>
                </div>
                
                <div className="border border-green-200/60 rounded-xl overflow-hidden divide-y divide-green-100 shadow-sm bg-green-50/5">
                  {targetedCriteria.length > 0 ? (
                    targetedCriteria.map((ac, idx) => (
                      <div key={idx} className="p-3 flex items-start gap-3 justify-between bg-green-50/5">
                        <div className="space-y-1 text-left">
                          <p className="text-sm font-semibold text-green-950">{ac.acText}</p>
                          {ac.evidenceDetail && <p className="text-xs text-green-700/80 font-mono">{ac.evidenceDetail}</p>}
                          {ac.feedback && <p className="text-xs text-green-800 italic">{ac.feedback}</p>}
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase ${
                          ac.status === 'FULLY_COVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{ac.status?.replace('_', ' ')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-on-surface-variant italic">
                      Task này không phủ trực tiếp tiêu chí nào (hoặc là task phi kỹ thuật, thiết kế/tài liệu chung).
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Requirement Progress Context (Collapsible) */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/60">
                <button 
                  onClick={() => setShowProgressContext(prev => !prev)}
                  type="button"
                  className="w-full flex justify-between items-center py-2 px-3 hover:bg-surface-container-low rounded-lg transition-all text-left"
                >
                  <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">rule</span>
                    Requirement Progress Context (Tiến độ chung)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200" style={{ transform: showProgressContext ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </span>
                </button>

                {showProgressContext && (
                  <div className="border border-outline-variant/60 rounded-xl overflow-hidden divide-y divide-outline-variant/60 shadow-sm bg-surface mt-2 animate-fade-in">
                    {requirementAcCoverage && requirementAcCoverage.length > 0 ? (
                      requirementAcCoverage.map((ac, idx) => {
                        const isCoveredHere = targetedCriteria.some(tc => tc.acText === ac.acText);
                        const isFullyCovered = ac.status === 'FULLY_COVERED';
                        const isPartial = ac.status === 'PARTIAL';
                        
                        return (
                          <div key={idx} className="p-3 flex items-start gap-3 justify-between hover:bg-surface-container-lowest transition-colors">
                            <div className="flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0 select-none" style={{
                                color: isCoveredHere ? '#15803d' : (isFullyCovered || isPartial ? '#0284c7' : '#94a3b8')
                              }}>
                                {isCoveredHere ? 'check_box' : (isFullyCovered || isPartial ? 'check_box' : 'check_box_outline_blank')}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <p className={`text-sm font-medium ${isFullyCovered || isPartial ? 'text-on-surface line-through opacity-70' : 'text-on-surface'}`}>
                                  {ac.acText}
                                </p>
                                {(isFullyCovered || isPartial) && (
                                  <p className="text-[10px] text-primary font-bold">
                                    {isCoveredHere 
                                      ? '✓ Được xử lý trong task hiện tại' 
                                      : `✓ Đã duyệt hoàn thành ở task ${ac.coveredByTaskCode || 'TSK-' + ac.coveredByTaskId}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase ${
                              isFullyCovered ? 'bg-green-50 text-green-700 border border-green-200' :
                              isPartial ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}>
                              {ac.status?.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-on-surface-variant italic">
                        Không có thông tin tiến độ Acceptance Criteria nào.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {aiReview.riskDetails && aiReview.riskDetails.length > 0 && (
            <div className="space-y-3 mt-4">
              <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                Identified Vulnerabilities & Logic Risks
              </span>
              <div className="space-y-2">
                {aiReview.riskDetails.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-red-50/10 border border-red-100/35 rounded-xl flex gap-3">
                    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase ${
                      risk.severity === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                      risk.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                      risk.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{risk.severity}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-on-surface">{risk.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{risk.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        !streamingMarkdown && <p className="text-sm text-on-surface-variant">AI Review hasn't been generated to align requirements.</p>
      )}
    </div>
  )
}

const isCodeTask = (taskType) => {
  return taskType === 'DEVELOPMENT' || taskType === 'BUG_FIX'
}

export function TaskReviewWorkspacePage() {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  
  const [queue, setQueue] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  // Streaming AI review state
  const [aiStreaming, setAiStreaming] = useState(false)
  const [aiStreamLogs, setAiStreamLogs] = useState('')
  const [streamingMarkdown, setStreamingMarkdown] = useState('')
  const [reason, setReason] = useState('')
  const [decisionLoading, setDecisionLoading] = useState(false)

  useEffect(() => {
    loadQueue()
  }, [projectId])

  useEffect(() => {
    if (taskId) {
      loadDetail()
      setReason('')
    }
  }, [projectId, taskId])

  // WebSocket Real-time broker connection using browser native WebSocket
  useEffect(() => {
    if (!projectId) return;

    const isDev = window.location.host.includes('localhost:5173');
    const wsHost = isDev ? 'localhost:8080' : window.location.host;
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProto}//${wsHost}/ws`;
    
    let stompClient;
    try {
      console.log('Connecting to STOMP WebSocket:', wsUrl);
      stompClient = new NativeStompClient(wsUrl, () => {
        console.log('STOMP Connected successfully');
        
        stompClient.subscribe(`/topic/project/${projectId}/review`, (destination, body) => {
          const event = JSON.parse(body);
          console.log('Received review WebSocket event:', event);
          if (event.taskId === parseInt(taskId)) {
            loadDetail();
          }
        });

        stompClient.subscribe(`/topic/project/${projectId}/evidence`, (destination, body) => {
          const event = JSON.parse(body);
          console.log('Received evidence WebSocket event:', event);
          if (event.taskId === parseInt(taskId)) {
            loadDetail();
          }
        });
      });
    } catch (err) {
      console.error('WebSocket connection setup failed:', err);
    }

    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [projectId, taskId]);

  const loadQueue = async () => {
    try {
      const data = await codeInsightService.getReviewQueue(projectId)
      setQueue(data || [])
      // Auto select first task if no task id
      if (!taskId && data && data.length > 0) {
        navigate(`/projects/${projectId}/task-reviews/${data[0].task?.id}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadDetail = async () => {
    setDetailLoading(true)
    setError('')
    try {
      const data = await codeInsightService.getReviewDetail(projectId, taskId)
      setDetail(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load task review details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleRunAiReview = () => {
    setAiStreaming(true)
    setAiStreamLogs('Initializing AI review pipeline...\n')
    setStreamingMarkdown('')

    const isDev = window.location.host.includes('localhost:5173');
    const baseUrl = isDev ? 'http://localhost:8080/api/v1' : '/api/v1';
    const sseUrl = `${baseUrl}/projects/${projectId}/task-reviews/${taskId}/ai-stream`;

    console.log("Subscribing to AI review SSE stream:", sseUrl);
    const eventSource = new EventSource(sseUrl, {
      withCredentials: true
    });

    eventSource.addEventListener('status', (event) => {
      try {
        const data = JSON.parse(event.data);
        setAiStreamLogs((prev) => prev + `[${data.phase}] ${data.message}\n`);
        if (data.phase === 'ERROR') {
          setAiStreaming(false);
          eventSource.close();
        }
      } catch (e) {
        console.error(e);
      }
    });

    eventSource.addEventListener('chunk', (event) => {
      try {
        const data = JSON.parse(event.data);
        setStreamingMarkdown((prev) => prev + data.text);
      } catch (e) {
        console.error(e);
      }
    });

    eventSource.addEventListener('alignment', (event) => {
      try {
        const data = JSON.parse(event.data);
        // Live updates alignmentResult matrix
        setDetail((prev) => {
          if (!prev) return prev;
          const ai = prev.evidence?.aiReview || {};
          return {
            ...prev,
            evidence: {
              ...prev.evidence,
              aiReview: {
                ...ai,
                alignmentResultJson: JSON.stringify(data),
                alignmentCoverageRatio: data.coverageRatio,
                alignmentCoveredCount: data.coveredCount,
                alignmentTotalCount: data.totalCount,
                codeRiskLevel: data.finalRiskLevel
              }
            }
          };
        });
      } catch (e) {
        console.error(e);
      }
    });

    eventSource.addEventListener('result', (event) => {
      try {
        const data = JSON.parse(event.data);
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            codeRiskLevel: data.codeRiskLevel,
            evidence: {
              ...prev.evidence,
              aiReview: data
            }
          };
        });
      } catch (e) {
        console.error(e);
      }
    });

    eventSource.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        setAiStreamLogs((prev) => prev + `[COMPLETE] AI Review completed successfully. Saved Review ID: ${data.reviewId}\n`);
      } catch (e) {}
      setAiStreaming(false);
      eventSource.close();
      loadDetail();
    });

    eventSource.addEventListener('error', (event) => {
      console.error('SSE Error:', event);
      setAiStreamLogs((prev) => prev + `[ERROR] Connection error or streaming failed. Check backend credentials and logs.\n`);
      setAiStreaming(false);
      eventSource.close();
    });
  };

  const handleApprove = async () => {
    if (!taskId) return;
    setDecisionLoading(true);
    try {
      await taskService.approveTaskReview(taskId, reason);
      toast.success("Task review approved successfully!");
      setReason('');
      
      const data = await codeInsightService.getReviewQueue(projectId);
      setQueue(data || []);
      
      if (data && data.length > 0) {
        navigate(`/projects/${projectId}/task-reviews/${data[0].task?.id}`);
      } else {
        navigate(`/projects/${projectId}/task-reviews`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to approve task review");
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!taskId) return;
    if (!reason || !reason.trim()) {
      toast.error("Please provide a reason/comments for requesting changes.");
      return;
    }
    setDecisionLoading(true);
    try {
      await taskService.rejectTaskReview(taskId, reason, 'NEEDS_CHANGES');
      toast.success("Task review rejected (changes requested) successfully!");
      setReason('');
      
      const data = await codeInsightService.getReviewQueue(projectId);
      setQueue(data || []);
      
      if (data && data.length > 0) {
        navigate(`/projects/${projectId}/task-reviews/${data[0].task?.id}`);
      } else {
        navigate(`/projects/${projectId}/task-reviews`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to request changes");
    } finally {
      setDecisionLoading(false);
    }
  };

  const evidence = detail?.evidence || {}
  const task = evidence.task || {}
  
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-surface-bright">
      
      {/* COLUMN 1: Task Navigation (Left) */}
      <aside className="w-[320px] shrink-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col h-full overflow-y-auto z-10 shadow-sm">
        <div className="sticky top-0 bg-surface-container-lowest/90 backdrop-blur border-b border-outline-variant p-4 z-20">
          <h2 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">list_alt</span>
            Review Queue ({queue.length})
          </h2>
        </div>
        <div className="p-3 space-y-2 flex-1">
          {queue.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center mt-10">No tasks waiting</p>
          ) : (
            queue.map(item => {
              const isSelected = item.task?.id === parseInt(taskId)
              return (
                <Link
                  key={item.id}
                  to={`/projects/${projectId}/task-reviews/${item.task?.id}`}
                  className={`block p-3 rounded-lg border transition-all ${isSelected ? 'bg-primary-container/20 border-primary shadow-sm' : 'bg-surface border-outline-variant hover:border-primary/50'}`}
                >
                  <div className="text-xs font-bold text-primary mb-1">{item.task?.requirementCode || 'NO-REQ'}</div>
                  <div className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{item.task?.title}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                       <span className="material-symbols-outlined text-[14px]">person</span>
                       {item.task?.assigneeName || 'Unassigned'}
                    </span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      {detailLoading ? (
         <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
         </div>
      ) : error ? (
         <div className="flex-1 flex items-center justify-center">
            <div className="bg-error-container text-error p-6 rounded-xl max-w-lg text-center">
              <span className="material-symbols-outlined text-4xl mb-2">error</span>
              <p className="font-bold">{error}</p>
            </div>
         </div>
      ) : !detail ? (
         <div className="flex-1 flex items-center justify-center text-on-surface-variant">
            Select a task from the queue to start reviewing
         </div>
      ) : (
        <>
          {/* COLUMN 2: Main Content - Risk & Alignment (Middle) */}
          <main className="flex-1 flex flex-col h-full overflow-y-auto bg-surface-container p-6 md:p-8 relative">
            <div className="max-w-4xl mx-auto w-full space-y-6 pb-20">
              {/* Task Header */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-on-surface tracking-tight">{task.title}</h1>
                    <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-bold text-xs">{task.type}</span>
                      <span>#{task.id}</span>
                      <span>• Assignee: {task.assigneeName}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleRunAiReview}
                    disabled={aiStreaming}
                    className={`shrink-0 flex items-center gap-2 bg-tertiary text-on-tertiary px-4 py-2 rounded-xl font-bold shadow-sm hover:opacity-90 transition-all ${
                      aiStreaming ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className={`material-symbols-outlined ${aiStreaming ? 'animate-spin' : ''}`}>
                      {aiStreaming ? 'sync' : 'smart_toy'}
                    </span>
                    {aiStreaming ? 'Reviewing...' : 'Run AI Review'}
                  </button>
                </div>
                {task.description && (
                  <div className="mt-4 p-4 bg-surface rounded-lg border border-outline-variant text-sm text-on-surface">
                    {task.description}
                  </div>
                )}
              </div>

              {/* Developer Terminal logs */}
              {(aiStreaming || aiStreamLogs) && (
                <div className="bg-neutral-950 text-green-400 font-mono text-xs rounded-xl p-5 shadow-inner border border-neutral-800 space-y-2 max-h-[200px] overflow-y-auto">
                  <div className="flex justify-between items-center text-neutral-400 border-b border-neutral-800 pb-2 mb-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">terminal</span>
                      AI Audit Stream Console
                    </span>
                    <span className="animate-pulse flex items-center gap-1.5 font-bold">
                      <span className={`h-2 w-2 rounded-full ${aiStreaming ? 'bg-green-500' : 'bg-neutral-500'}`}></span>
                      {aiStreaming ? 'LIVE' : 'FINISHED'}
                    </span>
                  </div>
                  {aiStreamLogs.split('\n').map((logMsg, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">{logMsg}</div>
                  ))}
                </div>
              )}

              {/* Component A & B */}
              <CodePatchAnalyzer changedFiles={evidence.changedFiles} />
              <ReqDiffAlignment aiReview={evidence.aiReview} streamingMarkdown={streamingMarkdown} requirementAcCoverage={detail?.requirementAcCoverage} />
            </div>
          </main>

          {/* COLUMN 3: Gate & Decision (Right) */}
                    {/* COLUMN 3: Gate & Decision (Right) */}
          <aside className="w-[360px] shrink-0 border-l border-outline-variant bg-surface-container-lowest flex flex-col h-full shadow-sm relative z-10">
            
            {/* 1. Phần nội dung cuộn độc lập bên trên */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* A. Gate Checklist */}
              <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">rule</span>
                  Gate Checklist
                </h3>
                <div className="space-y-2">
                  {detail.gateChecks && detail.gateChecks.length > 0 ? (
                    detail.gateChecks.map(check => (
                      <div key={check.name} className="flex gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface">
                        {check.status === 'PASS' && <span className="material-symbols-outlined text-green-600 shrink-0">check_circle</span>}
                        {check.status === 'FAIL' && <span className="material-symbols-outlined text-red-600 shrink-0">cancel</span>}
                        {check.status === 'WARNING' && <span className="material-symbols-outlined text-yellow-600 shrink-0">warning</span>}
                        <div>
                          <p className="font-bold text-sm text-on-surface">{check.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{check.detail}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">No rules evaluated.</p>
                  )}
                </div>
              </div>

              {/* B. Evidence Confidence (Đã chỉnh lại format đồng bộ & đặt ở vị trí mới) */}
              <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                  Evidence Confidence
                </h3>
                <div className="p-4 border border-outline-variant/60 rounded-xl bg-surface">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wide uppercase border shrink-0 ${
                      detail.evidenceConfidence === 'STRONG' ? 'bg-green-50 text-green-700 border-green-200' :
                      detail.evidenceConfidence === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      detail.evidenceConfidence === 'WEAK' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {detail.evidenceConfidence || 'NONE'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium leading-normal">
                      {detail.evidenceConfidence === 'STRONG' ? 'Bằng chứng đầy đủ, tin cậy cao.' :
                       detail.evidenceConfidence === 'PARTIAL' ? 'Thiếu một vài bằng chứng.' :
                       detail.evidenceConfidence === 'WEAK' ? 'Bằng chứng rất ít hoặc lệch.' :
                       'Chưa ghi nhận bằng chứng.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* C. Evidence Vault */}
              <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
                  Evidence Vault
                </h3>
                {isCodeTask(task.type) ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border border-outline-variant/60 rounded-xl bg-surface text-center">
                        <span className="block text-2xl font-black text-on-surface">{evidence.commits?.length || 0}</span>
                        <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Commits</span>
                      </div>
                      <div className="p-3 border border-outline-variant/60 rounded-xl bg-surface text-center">
                        <span className="block text-2xl font-black text-on-surface">{evidence.pullRequests?.length || 0}</span>
                        <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">PRs</span>
                      </div>
                      <div className="p-3 border border-outline-variant/60 rounded-xl bg-surface text-center">
                        <span className="block text-2xl font-black text-on-surface">{evidence.checkRuns?.length || 0}</span>
                        <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">CI Checks</span>
                      </div>
                      <div className="p-3 border border-outline-variant/60 rounded-xl bg-surface text-center">
                        <span className="block text-2xl font-black text-on-surface">{evidence.githubIssue ? 'Yes' : 'No'}</span>
                        <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Issue</span>
                      </div>
                    </div>

                    {/* Show general evidences for code tasks if they exist */}
                    {evidence.generalEvidences && evidence.generalEvidences.length > 0 && (
                      <div className="p-4 border border-outline-variant/60 rounded-xl bg-surface">
                        <span className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-3 text-left">
                          Attached Documents & Links
                        </span>
                        <div className="space-y-2 text-left">
                          {evidence.generalEvidences.map((ge) => (
                            <div key={ge.id} className="p-2.5 border border-outline-variant rounded-lg bg-surface flex items-center justify-between gap-2 hover:shadow-sm transition-all">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                                  {ge.type === 'SCREENSHOT' ? 'image' :
                                   ge.type === 'SCREEN_RECORDING' ? 'movie' :
                                   ge.type === 'FIGMA_LINK' ? 'link' :
                                   ge.type === 'DEPLOY_LINK' ? 'language' : 'description'}
                                </span>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-on-surface truncate" title={ge.title}>{ge.title}</p>
                                  <p className="text-[9px] uppercase text-on-surface-variant font-bold">{ge.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                                  ge.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  ge.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>{ge.status}</span>
                                {(ge.fileUrl || ge.externalUrl) && (
                                  <a
                                    href={ge.fileUrl || ge.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary-hover flex items-center"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Non-code task display */}
                    {evidence.githubIssue && (
                      <div className="p-3 border border-outline-variant/60 rounded-xl bg-surface flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Linked Issue</span>
                        <a
                          href={evidence.githubIssue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          Issue #{evidence.githubIssue.number}
                        </a>
                      </div>
                    )}

                    {evidence.generalEvidences && evidence.generalEvidences.length > 0 ? (
                      <div className="p-4 border border-outline-variant/60 rounded-xl bg-surface">
                        <span className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-3 text-left">
                          Attached Documents & Links
                        </span>
                        <div className="space-y-2 text-left">
                          {evidence.generalEvidences.map((ge) => (
                            <div key={ge.id} className="p-2.5 border border-outline-variant rounded-lg bg-surface flex items-center justify-between gap-2 hover:shadow-sm transition-all">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                                  {ge.type === 'SCREENSHOT' ? 'image' :
                                   ge.type === 'SCREEN_RECORDING' ? 'movie' :
                                   ge.type === 'FIGMA_LINK' ? 'link' :
                                   ge.type === 'DEPLOY_LINK' ? 'language' : 'description'}
                                </span>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-on-surface truncate" title={ge.title}>{ge.title}</p>
                                  <p className="text-[9px] uppercase text-on-surface-variant font-bold">{ge.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                                  ge.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  ge.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>{ge.status}</span>
                                {(ge.fileUrl || ge.externalUrl) && (
                                  <a
                                    href={ge.fileUrl || ge.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary-hover flex items-center"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-outline-variant/60 rounded-xl bg-surface/50 text-center">
                        <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl">inventory_2</span>
                        <p className="text-xs text-on-surface-variant mt-2 font-medium">Không có evidence</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* 2. Sticky Bottom Decision Panel - Cuộn co giãn Flexbox */}
            <div className="border-t border-outline-variant p-5 bg-surface-container-lowest shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={decisionLoading}
                className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none mb-3"
                rows="2"
                placeholder="Write your review comments here..."
              ></textarea>
              <div className="flex gap-2">
                <button 
                  onClick={handleRequestChanges} 
                  disabled={decisionLoading}
                  className="flex-1 bg-error-container text-error font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  {decisionLoading ? 'Processing...' : 'Request Changes'}
                </button>
                <button 
                  onClick={handleApprove} 
                  disabled={decisionLoading}
                  className="flex-1 bg-primary text-on-primary font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  {decisionLoading ? 'Processing...' : 'Approve Task'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

export default TaskReviewWorkspacePage
