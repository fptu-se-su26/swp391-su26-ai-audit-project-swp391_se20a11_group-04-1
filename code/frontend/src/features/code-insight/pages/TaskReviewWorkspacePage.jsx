import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import TaskReviewService from '../services/taskReviewService'
import useProjectStore from '@store/useProjectStore'
import taskService from '@features/kanban/services/taskService'
import toast from 'react-hot-toast'
import Card from '../../../components/ui/Card'
import SectionTitle from '../../../components/ui/SectionTitle'
import Button from '../../../components/ui/Button'
import { useProjectRole } from '@/hooks/useProjectRole'
import { getApiV1BaseUrl, getStompWebSocketUrl } from '@api/realtimeConfig'


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

// Section 2: Implementation Evidence
const CodePatchAnalyzer = ({ changedFiles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileCount = changedFiles?.length || 0;
  
  return (
    <Card style={{ padding: '20px' }}>
      <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <SectionTitle icon="data_object" style={{ marginBottom: 0 }}>
          2. Implementation Evidence (Code Changes)
          <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs ml-2 text-on-surface-variant font-bold">{fileCount} files</span>
        </SectionTitle>
        <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </div>
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-outline-variant/60 animate-fade-in">
          {fileCount > 0 ? (
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
            <p className="text-sm text-on-surface-variant text-center italic py-2">No code changes detected or parsed yet.</p>
          )}
        </div>
      )}
    </Card>
  )
}
// Custom Lightweight Markdown Parser
const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const renderedElements = [];
  let currentList = [];

  const flushList = (key) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 mb-3 space-y-1.5 text-left">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInline = (str) => {
    let html = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-surface-container-high text-primary px-1.5 py-0.5 rounded font-mono text-xs border border-outline-variant/30">$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const itemContent = trimmed.substring(2);
      currentList.push(
        <li key={`li-${idx}`} className="text-sm text-on-surface-variant leading-relaxed text-left">
          {parseInline(itemContent)}
        </li>
      );
    } else {
      flushList(idx);
      
      if (trimmed.startsWith('#### ')) {
        renderedElements.push(
          <h5 key={`h4-${idx}`} className="text-sm font-bold text-on-surface mt-3 mb-1.5 text-left">
            {parseInline(trimmed.substring(5))}
          </h5>
        );
      } else if (trimmed.startsWith('### ')) {
        renderedElements.push(
          <h4 key={`h3-${idx}`} className="text-base font-bold text-primary mt-4 mb-2 text-left">
            {parseInline(trimmed.substring(4))}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        renderedElements.push(
          <h3 key={`h2-${idx}`} className="text-lg font-black text-on-surface mt-5 mb-3 text-left">
            {parseInline(trimmed.substring(3))}
          </h3>
        );
      } else if (trimmed === '') {
        renderedElements.push(<div key={`br-${idx}`} className="h-1.5" />);
      } else {
        renderedElements.push(
          <p key={`p-${idx}`} className="text-sm text-on-surface-variant leading-relaxed mb-2 text-left">
            {parseInline(trimmed)}
          </p>
        );
      }
    }
  });
  
  flushList(lines.length);
  return <div className="space-y-1">{renderedElements}</div>;
};

// Combined Component for Requirements, Evidence & AI Evaluation
const ReqDiffAlignment = ({ aiReview, streamingMarkdown, requirementAcCoverage, approvalGate, changedFiles }) => {
  const [showVulnerabilities, setShowVulnerabilities] = useState(false);
  
  const parsedAlignment = useMemo(() => {
    if (!aiReview || !aiReview.alignmentResultJson) return null;
    try {
      return JSON.parse(aiReview.alignmentResultJson);
    } catch (e) {
      console.error("Failed to parse alignment matrix json", e);
      return null;
    }
  }, [aiReview]);

  const targetedCriteria = parsedAlignment?.alignmentMatrix || [];
  
  // Auto-expand vulnerabilities if there is a HIGH or CRITICAL risk
  useEffect(() => {
    if (aiReview?.riskDetails) {
      const hasHighRisk = aiReview.riskDetails.some(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
      if (hasHighRisk) setShowVulnerabilities(true);
    }
  }, [aiReview]);

  return (
    <div className="space-y-6 mt-6">
      {/* Section 1: Task Requirements */}
      <Card style={{ padding: '20px' }}>
        <SectionTitle icon="assignment">
          1. Requirements & Criteria
        </SectionTitle>
        
        {/* Render the unified Requirements list using requirementAcCoverage and targetedCriteria */}
        <div className="border border-outline-variant/60 rounded-xl overflow-hidden divide-y divide-outline-variant/60 shadow-sm bg-surface">
          {requirementAcCoverage && requirementAcCoverage.length > 0 ? (
            requirementAcCoverage.map((ac, idx) => {
              const targeted = targetedCriteria.find(tc => tc.acText === ac.acText);
              const isCoveredHere = !!targeted;
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
                      <p className={`text-sm font-medium ${isFullyCovered || isPartial ? 'text-on-surface' : 'text-on-surface'}`}>
                        {ac.acText}
                      </p>
                      {(isFullyCovered || isPartial) && !isCoveredHere && (
                        <p className="text-[10px] text-primary font-bold">
                          ✓ Đã duyệt hoàn thành ở task {ac.coveredByTaskCode || 'TSK-' + ac.coveredByTaskId}
                        </p>
                      )}
                      {isCoveredHere && (
                        <div className="mt-1.5">
                          <span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 rounded font-bold uppercase mr-2">
                            Mục tiêu Task này
                          </span>
                          {targeted.status && (
                             <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                               AI Check: {targeted.status.replace('_', ' ')}
                             </span>
                          )}
                          {targeted.feedback && <p className="text-xs text-on-surface-variant italic mt-1">{targeted.feedback}</p>}
                        </div>
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
             <div className="p-4 text-center text-sm text-on-surface-variant italic">
               Không có thông tin yêu cầu cụ thể nào được link tới task này.
             </div>
          )}
        </div>
      </Card>

      {/* Section 2: Implementation Evidence */}
      <CodePatchAnalyzer changedFiles={changedFiles} />

      {/* Section 3: AI Evaluation */}
      <Card style={{ padding: '20px' }}>
        <SectionTitle icon="model_training">
          3. AI Evaluation & Risks
        </SectionTitle>

        {streamingMarkdown && (
          <div className="mb-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 font-sans text-sm text-on-surface-variant leading-relaxed shadow-sm">
            <div className="font-bold text-xs uppercase text-neutral-500 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary animate-pulse">chat</span>
              Live AI Audit Commentary
            </div>
            <div className="text-left">{renderMarkdown(streamingMarkdown)}</div>
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
              
              {/* Approval Gate Status */}
              {approvalGate && (
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase flex items-center gap-1.5 border ${
                  approvalGate.approvalStatus === 'BLOCKED' ? 'bg-red-500 text-white border-red-600' :
                  approvalGate.approvalStatus === 'CAN_APPROVE_WITH_WARNING' ? 'bg-amber-500 text-white border-amber-600' :
                  'bg-emerald-600 text-white border-emerald-700'
                }`}>
                  Gate Status: {
                    approvalGate.approvalStatus === 'CAN_APPROVE' ? 'READY' :
                    approvalGate.approvalStatus === 'CAN_APPROVE_WITH_WARNING' ? 'WARNING' :
                    approvalGate.approvalStatus || 'UNKNOWN'
                  }
                </span>
              )}
            </div>
            
            <div className="p-4 bg-surface rounded-xl border border-outline-variant/60">
              <p className="font-bold text-sm text-on-surface mb-1">Executive Summary</p>
              <div className="text-left">{renderMarkdown(aiReview.summary)}</div>
            </div>

            {/* Vulnerabilities Accordion */}
            {aiReview.riskDetails && aiReview.riskDetails.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-outline-variant/60">
                <button 
                  onClick={() => setShowVulnerabilities(!showVulnerabilities)}
                  type="button"
                  className="w-full flex justify-between items-center py-2 px-3 hover:bg-surface-container-low rounded-lg transition-all text-left"
                >
                  <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                    Identified Vulnerabilities & Logic Risks ({aiReview.riskDetails.length})
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200" style={{ transform: showVulnerabilities ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </button>

                {showVulnerabilities && (
                  <div className="space-y-2 mt-2 px-1 animate-fade-in">
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
                )}
              </div>
            )}
          </div>
        ) : (
          !streamingMarkdown && <p className="text-sm text-on-surface-variant italic text-center py-4">AI Review hasn't been generated yet.</p>
        )}
      </Card>
    </div>
  )
}

const isCodeTask = (taskType) => {
  return taskType === 'DEVELOPMENT' || taskType === 'BUG_FIX'
}

export function TaskReviewWorkspacePage() {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  const { isLeader, isMember } = useProjectRole()
  
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
  
  // UI States
  const [isQueueOpen, setIsQueueOpen] = useState(true)
  const [showAiLogs, setShowAiLogs] = useState(false)
  const [aiError, setAiError] = useState(false)

  // Manual evidence links state
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false)
  const [suggestType, setSuggestType] = useState('COMMIT') // COMMIT, PULL_REQUEST, CHECK_RUN
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [suggestReason, setSuggestReason] = useState('')
  const [suggestSubmitLoading, setSuggestSubmitLoading] = useState(false)
  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(340)

  const startResizeLeft = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftWidth
    const onMove = (ev) => {
      const newW = Math.min(Math.max(startW + ev.clientX - startX, 160), 480)
      setLeftWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftWidth])

  const startResizeRight = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = rightWidth
    const onMove = (ev) => {
      const newW = Math.min(Math.max(startW - (ev.clientX - startX), 220), 520)
      setRightWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [rightWidth])


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

    const wsUrl = getStompWebSocketUrl();
    
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
      const data = await TaskReviewService.getReviewQueue(projectId)
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
      const data = await TaskReviewService.getReviewDetail(projectId, taskId)
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
    setAiError(false)

    const sseUrl = `${getApiV1BaseUrl()}/projects/${projectId}/task-reviews/${taskId}/ai-stream`;

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
      setAiError(true);
      eventSource.close();
    });
  };

  const handleConfirmManualLink = async (linkId) => {
    try {
      await TaskReviewService.confirmManualLink(projectId, taskId, linkId);
      toast.success("Manual evidence link confirmed!");
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to confirm manual link");
    }
  };

  const handleRejectManualLink = async (linkId) => {
    try {
      await TaskReviewService.rejectManualLink(projectId, taskId, linkId);
      toast.success("Manual evidence link rejected!");
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to reject manual link");
    }
  };

  const handleSearchEvidence = async (query = searchQuery) => {
    setSearchLoading(true);
    try {
      const data = await TaskReviewService.searchEvidence(projectId, suggestType, query);
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to search evidence items");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSuggestManualLink = async (e) => {
    e.preventDefault();
    if (!selectedEvidence) {
      toast.error("Please select an evidence item");
      return;
    }
    setSuggestSubmitLoading(true);
    try {
      await TaskReviewService.suggestManualLink(projectId, taskId, {
        evidenceType: suggestType,
        evidenceId: selectedEvidence.id,
        reason: suggestReason
      });
      toast.success("Manual link suggested successfully!");
      setIsSuggestModalOpen(false);
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to suggest link");
    } finally {
      setSuggestSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (isSuggestModalOpen) {
      handleSearchEvidence('');
      setSelectedEvidence(null);
      setSuggestReason('');
    }
  }, [isSuggestModalOpen, suggestType]);

  const handleApprove = async () => {
    if (!taskId) return;
    setDecisionLoading(true);
    try {
      await taskService.approveTaskReview(taskId, reason);
      toast.success("Task review approved successfully!");
      setReason('');
      
      const data = await TaskReviewService.getReviewQueue(projectId);
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
      
      const data = await TaskReviewService.getReviewQueue(projectId);
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
      
      {/* COLUMN 1: Task Navigation Queue (Left) */}
      {isQueueOpen && (
        <>
          <aside
            className="shrink-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col h-full z-10 shadow-sm overflow-hidden"
            style={{ width: leftWidth + 'px', minWidth: '160px', maxWidth: '480px' }}
          >
            <div className="sticky top-0 bg-surface-container-lowest/90 backdrop-blur border-b border-outline-variant p-4 z-20 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-on-surface flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-primary shrink-0">list_alt</span>
                <span className="truncate">Review Queue ({queue.length})</span>
              </h2>
              <button onClick={() => setIsQueueOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center shrink-0 ml-2">
                <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_left</span>
              </button>
            </div>
            <div className="p-3 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
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
                      <div className="text-xs font-bold text-primary mb-1 truncate">{item.task?.requirementCode || 'NO-REQ'}</div>
                      <div className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{item.task?.title}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-on-surface-variant flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-[14px] shrink-0">person</span>
                          <span className="truncate">{item.task?.assigneeName || 'Unassigned'}</span>
                        </span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </aside>
          {/* Resize Handle Left */}
          <div
            onMouseDown={startResizeLeft}
            className="w-1.5 shrink-0 cursor-col-resize z-20 bg-outline-variant/40 hover:bg-primary/60 active:bg-primary transition-colors"
            title="Drag to resize"
          />
        </>
      )}

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
          <main className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto bg-surface-container p-6 md:p-8 relative">
            {!isQueueOpen && (
              <button 
                onClick={() => setIsQueueOpen(true)}
                className="absolute top-4 left-4 z-20 bg-surface border border-outline-variant p-2 rounded-full shadow-md hover:bg-surface-container-low transition-all text-primary flex items-center justify-center"
                title="Open Review Queue"
              >
                <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_right</span>
              </button>
            )}
            <div className={`max-w-4xl mx-auto w-full space-y-6 pb-20 ${!isQueueOpen ? 'mt-4' : ''}`}>
              {/* Task Header */}
              <Card style={{ padding: '24px' }}>
                {/* Row 1: Title + Run AI Review button */}
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-on-surface tracking-tight break-words">{task.title}</h1>
                    <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2 flex-wrap">
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

                {/* Row 2: AI Status badge (only shown when status exists) */}
                {(aiStreaming || aiStreamLogs || aiError) && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase text-on-surface-variant">AI Status:</span>
                    {aiError ? (
                      <span className="text-xs font-black text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                        <span className="material-symbols-outlined text-[14px]">cancel</span> FAILED
                      </span>
                    ) : aiStreaming ? (
                      <span className="text-xs font-black text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span> RUNNING
                      </span>
                    ) : (
                      <span className="text-xs font-black text-green-700 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> FINISHED
                      </span>
                    )}
                    <button
                      onClick={() => setShowAiLogs(true)}
                      className="text-[10px] bg-surface-container-low border border-outline-variant hover:bg-surface-container-high px-2 py-0.5 rounded font-bold text-on-surface-variant flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">visibility</span>
                      Logs
                    </button>
                  </div>
                )}

                {task.description && (
                  <div className="mt-4 p-4 bg-surface rounded-lg border border-outline-variant text-sm text-on-surface">
                    {task.description}
                  </div>
                )}
              </Card>

              {/* Error Alert */}
              {aiError && (
                <div className="bg-red-50/50 text-red-800 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                   <span className="material-symbols-outlined text-red-600 shrink-0">error</span>
                   <div className="text-sm">
                      <p className="font-bold">Tính năng AI hiện không khả dụng</p>
                      <p className="mt-0.5 opacity-90">Có thể do lỗi kết nối hoặc hết giới hạn API (tokens). Vui lòng xem Log để biết thêm chi tiết hoặc thử lại sau.</p>
                   </div>
                </div>
              )}

              {/* Sections 1, 2, 3 */}
              <ReqDiffAlignment aiReview={evidence.aiReview} streamingMarkdown={streamingMarkdown} requirementAcCoverage={detail?.requirementAcCoverage} approvalGate={detail?.approvalGate} changedFiles={evidence.changedFiles} />
            </div>
          </main>

          {/* Resize Handle Right */}
          <div
            onMouseDown={startResizeRight}
            className="w-1.5 shrink-0 cursor-col-resize z-20 bg-outline-variant/40 hover:bg-primary/60 active:bg-primary transition-colors"
            title="Drag to resize"
          />

          {/* COLUMN 3: Gate & Decision (Right) */}
          <aside
            className="shrink-0 border-l border-outline-variant bg-surface-container-lowest flex flex-col h-full shadow-sm relative z-10 overflow-hidden"
            style={{ width: rightWidth + 'px', minWidth: '220px', maxWidth: '520px' }}
          >
            
            {/* 1. Phần nội dung cuộn độc lập bên trên */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* A. Gate Checklist */}
              <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">rule</span>
                  Gate Checklist
                </h3>
                <div className="space-y-2">
                  {detail.gateChecks && detail.gateChecks.length > 0 ? (
                    detail.gateChecks.map(check => (
                    <div key={check.name} className="flex gap-2 p-2 rounded-xl border border-outline-variant/60 bg-surface">
                        {check.status === 'PASS' && <span className="material-symbols-outlined text-green-600 shrink-0">check_circle</span>}
                        {check.status === 'FAIL' && <span className="material-symbols-outlined text-red-600 shrink-0">cancel</span>}
                        {check.status === 'WARNING' && <span className="material-symbols-outlined text-yellow-600 shrink-0">warning</span>}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-on-surface break-all">{check.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 break-words">{check.detail}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">No rules evaluated.</p>
                  )}
                </div>
              </div>

              {/* B. Evidence Confidence */}
              <div>
                <h3 className="font-bold uppercase text-xs tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">verified_user</span>
                  Evidence Confidence
                </h3>
                <div className="p-3 border border-outline-variant/60 rounded-xl bg-surface">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase border shrink-0 ${
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
                <h3 className="font-bold uppercase text-xs tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">inventory_2</span>
                  Evidence Vault
                </h3>
                {isCodeTask(task.type) ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
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

                      {/* Manual Git Links Section */}
                      <div className="p-4 border border-outline-variant/60 rounded-xl bg-surface flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold text-left">
                            Manually Linked Git Evidences
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsSuggestModalOpen(true)}
                            className="px-2 py-1 bg-surface-container-low text-[10px] font-bold text-primary border border-outline-variant hover:bg-surface-container-high rounded-lg flex items-center gap-1 transition-all"
                          >
                            <span className="material-symbols-outlined text-[12px]">add</span>
                            Suggest Link
                          </button>
                        </div>
                        
                        {detail?.manualEvidenceLinks && detail.manualEvidenceLinks.length > 0 ? (
                          <div className="space-y-2 text-left">
                            {detail.manualEvidenceLinks.map((ml) => (
                              <div key={ml.id} className="p-2.5 border border-outline-variant rounded-lg bg-surface flex flex-col gap-1.5 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                                      {ml.evidenceType === 'COMMIT' ? 'history' :
                                       ml.evidenceType === 'PULL_REQUEST' ? 'description' : 'published_with_changes'}
                                    </span>
                                    <div className="overflow-hidden">
                                      <p className="text-xs font-bold text-on-surface truncate">
                                        {ml.evidenceType} #{ml.evidenceId}
                                      </p>
                                      <p className="text-[9px] text-on-surface-variant">
                                        Suggested by {ml.suggestedBy?.name || 'Unknown'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                                    ml.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' :
                                    ml.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }`}>
                                    {ml.status}
                                  </span>
                                </div>
                                
                                {ml.reason && (
                                  <p className="text-[10px] italic text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded">
                                    Reason: {ml.reason}
                                  </p>
                                )}

                                {ml.status === 'PENDING' && (
                                  <div className="flex justify-end gap-1.5 mt-1 border-t border-outline-variant/30 pt-1.5">
                                    <button
                                      onClick={() => handleRejectManualLink(ml.id)}
                                      type="button"
                                      className="px-2 py-1 bg-red-50 text-[9px] font-bold text-red-700 hover:bg-red-100 rounded flex items-center gap-0.5 border border-red-200 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">close</span>
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleConfirmManualLink(ml.id)}
                                      type="button"
                                      className="px-2 py-1 bg-green-50 text-[9px] font-bold text-green-700 hover:bg-green-100 rounded flex items-center gap-0.5 border border-green-200 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">check</span>
                                      Approve
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant italic text-center py-2 bg-surface-container-lowest/50 rounded-lg">
                            No manual Git links suggested yet.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {/* Non-code task display */}
                    {evidence.githubIssue && (
                      <div className="p-3 border border-outline-variant/60 rounded-xl bg-surface flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Linked Issue</span>
                        <a
                          href={evidence.githubIssue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-primary hover:underline truncate"
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

            {/* 2. Sticky Bottom Decision Panel */}
                  <div className="bg-surface-container-low px-3 py-3 border-t border-outline-variant/30 shrink-0">
                <h3 className="font-extrabold text-xs mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">gavel</span>
                  Final Decision
                </h3>
                {isMember ? (
                  <div className="p-4 bg-surface rounded-xl border border-outline-variant/30 text-center">
                    <span className="material-symbols-outlined text-outline mb-2 text-3xl">lock</span>
                    <p className="text-sm font-bold text-on-surface">View Only Mode</p>
                    <p className="text-xs text-on-surface-variant mt-1">Only Project Leaders can approve or reject tasks.</p>
                  </div>
                ) : (
                  <>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={decisionLoading}
                      className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none mb-2"
                      rows="1"
                      placeholder="Write your review comments here..."
                    ></textarea>
                    <div className="flex flex-col gap-1.5">
                      <button 
                        onClick={handleApprove} 
                        disabled={decisionLoading}
                        className="w-full bg-primary text-on-primary font-bold py-2 rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        {decisionLoading ? 'Processing...' : 'Approve Task'}
                      </button>
                      <button 
                        onClick={handleRequestChanges} 
                        disabled={decisionLoading}
                        className="w-full bg-error-container text-error font-bold py-2 rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        {decisionLoading ? 'Processing...' : 'Request Changes'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </aside>

      {/* Modal for AI Logs */}
      {showAiLogs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
          <div className="bg-surface rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-outline-variant flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">terminal</span>
                AI Audit Stream Console
              </h3>
              <button onClick={() => setShowAiLogs(false)} className="text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-neutral-950 text-green-400 font-mono text-xs space-y-2 flex-1">
              <div className="flex items-center gap-1.5 mb-4 text-neutral-500 border-b border-neutral-800 pb-3">
                <span className={`h-2 w-2 rounded-full ${aiStreaming ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`}></span>
                <span className="font-bold tracking-wider">{aiStreaming ? 'STATUS: LIVE' : 'STATUS: FINISHED'}</span>
              </div>
              {aiStreamLogs ? aiStreamLogs.split('\n').map((logMsg, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed">{logMsg}</div>
              )) : (
                <div className="text-neutral-500 italic">No logs available. Run an AI review to see output.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggest Link Modal */}
          {isSuggestModalOpen && (
            <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
                {/* Modal Header */}
                <div className="p-5 border-b border-outline-variant flex items-center justify-between">
                  <h3 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">link</span>
                    Suggest Manual Git Evidence Link
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSuggestModalOpen(false)}
                    className="text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-full transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSuggestManualLink} className="p-5 overflow-y-auto space-y-4 text-left flex-1">
                  {/* Type Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Evidence Type
                    </label>
                    <div className="flex gap-2">
                      {['COMMIT', 'PULL_REQUEST', 'CHECK_RUN'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSuggestType(t)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            suggestType === t
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {t === 'COMMIT' ? 'Commit' : t === 'PULL_REQUEST' ? 'PR' : 'CI Check'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Search Repository {suggestType === 'COMMIT' ? 'Commits' : suggestType === 'PULL_REQUEST' ? 'PRs' : 'CI Checks'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter keywords to search..."
                        className="flex-1 bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleSearchEvidence()}
                        className="px-4 py-2 bg-secondary text-on-secondary font-bold text-sm rounded-xl hover:opacity-90 transition-all shrink-0 shadow-sm"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Select Evidence Item
                    </label>
                    <div className="border border-outline-variant rounded-xl max-h-48 overflow-y-auto divide-y divide-outline-variant bg-surface">
                      {searchLoading ? (
                        <div className="p-4 text-center text-xs text-on-surface-variant italic">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((item) => {
                          const isSelected = selectedEvidence?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedEvidence(item)}
                              className={`w-full p-3 text-left flex items-start gap-2.5 transition-colors ${
                                isSelected ? 'bg-primary-container/20 border-l-4 border-primary' : 'hover:bg-surface-container-low'
                              }`}
                            >
                              <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">
                                {suggestType === 'COMMIT' ? 'history' :
                                 suggestType === 'PULL_REQUEST' ? 'description' : 'published_with_changes'}
                              </span>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-on-surface break-words">{item.title}</p>
                                {item.subtitle && <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{item.subtitle}</p>}
                                {item.reference && <p className="text-[9px] text-neutral-400 font-mono mt-0.5 truncate">{item.reference}</p>}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-on-surface-variant italic">
                          No results found. Type query and click Search.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Reason for Linking
                    </label>
                    <textarea
                      value={suggestReason}
                      onChange={(e) => setSuggestReason(e.target.value)}
                      placeholder="Explain why this evidence belongs to this task..."
                      rows="2"
                      className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    ></textarea>
                  </div>

                  {/* Selected Item Indicator */}
                  {selectedEvidence && (
                    <div className="p-3 bg-green-50/10 border border-green-200/40 rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">verified</span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-green-950 truncate">Selected: {selectedEvidence.title}</p>
                      </div>
                    </div>
                  )}
                </form>

                {/* Modal Footer */}
                <div className="p-5 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSuggestModalOpen(false)}
                    className="px-4 py-2 border border-outline-variant text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container-high transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSuggestManualLink}
                    disabled={suggestSubmitLoading || !selectedEvidence}
                    className="px-4 py-2 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {suggestSubmitLoading ? 'Submitting...' : 'Link Evidence'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TaskReviewWorkspacePage
