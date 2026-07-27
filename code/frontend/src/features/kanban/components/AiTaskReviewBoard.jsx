import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import taskService from '../services/taskService';
import { requirementService } from '../../requirement/services/requirementService';
import { diagramService } from '../../requirement/services/diagramService';
import { useProjectStore } from '@/store/useProjectStore';
import EditableTaskCard from './EditableTaskCard';
import SplitTaskReviewModal from './SplitTaskReviewModal';
import MergeTaskReviewModal from './MergeTaskReviewModal';
import DuplicationDiffModal from './DuplicationDiffModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import TaskFlowGraph from './TaskFlowGraph';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const autoMapSprint = (t, sprintList) => {
  const targetDate = t.suggested_deadline || t.deadline || t.start_date;
  if (targetDate && sprintList?.length > 0) {
    const tDate = new Date(targetDate);
    const matched = sprintList.find(s => {
      const start = s.startDate ? new Date(s.startDate) : null;
      const end   = s.endDate   ? new Date(s.endDate)   : null;
      if (start && end) return tDate >= start && tDate <= end;
      if (start) return tDate >= start;
      if (end)   return tDate <= end;
      return false;
    });
    if (matched) return matched.id;
  }
  return '';
};

/** Topological sort within a group, returns tasks in execution order */
// BUG-6 FIX: Use a stable unique key instead of temp_id (which can be undefined)
const topoSort = (groupTasks) => {
  // Assign a stable fallback key for tasks without temp_id
  const getKey = (t) => t.temp_id ?? `__no_id_${groupTasks.indexOf(t)}`;

  const idMap = {};
  groupTasks.forEach(t => { idMap[getKey(t)] = t; });
  const visited = new Set();
  const result = [];

  const visit = (t) => {
    const key = getKey(t);
    if (!t || visited.has(key)) return;
    visited.add(key);
    (t.depends_on || []).forEach(depId => {
      if (idMap[depId]) visit(idMap[depId]);
    });
    result.push(t);
  };

  groupTasks.forEach(t => visit(t));
  return result;
};

/** Group tasks by use_case_code then requirement_code */
const groupAndSortTasks = (tasks, reqMap = {}, ucMap = {}) => {
  const groups = {};
  tasks.forEach(t => {
    const key = t.requirement_code || t.use_case_code || 'Ungrouped';
    let label = key;
    let title = '';
    
    if (key !== 'Ungrouped') {
      if (t.requirement_code && reqMap[t.requirement_code]) {
        title = reqMap[t.requirement_code];
      } else if (t.use_case_code && ucMap[t.use_case_code]) {
        title = ucMap[t.use_case_code];
      }
    }
    
    if (title) {
        label = title;
    }

    if (!groups[key]) groups[key] = { key, title, label, tasks: [] };
    groups[key].tasks.push(t);
  });

  return Object.values(groups).map(g => ({
    ...g,
    tasks: topoSort(g.tasks),
  }));
};

const PRIORITY_STYLE = {
  CRITICAL: { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200',    label: 'CRITICAL' },
  HIGH:     { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200', label: 'HIGH' },
  MEDIUM:   { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'MEDIUM' },
  LOW:      { dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',   label: 'LOW' },
};

const TYPE_STYLE = {
  DEVELOPMENT:   { icon: '💻', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  TESTING:       { icon: '🧪', color: 'bg-green-50 text-green-700 border-green-200' },
  DOCUMENTATION: { icon: '📄', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  UI_UX:         { icon: '🎨', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  RESEARCH:      { icon: '🔍', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  DEPLOYMENT:    { icon: '🚀', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  BUG_FIX:       { icon: '🐛', color: 'bg-red-50 text-red-700 border-red-200' },
  REVIEW:        { icon: '👁️', color: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const priorityColor = (p) => {
  const s = PRIORITY_STYLE[p];
  return s ? `${s.badge}` : 'bg-slate-100 text-slate-700 border-slate-200';
};

const getTypeConfig = (type) => {
  const s = TYPE_STYLE[type];
  return s ? { label: type, icon: s.icon, color: s.color } : { label: type || 'Unknown', icon: '📌', color: 'bg-gray-50 text-gray-700 border-gray-200' };
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const AiTaskReviewBoard = ({ isOpen, onClose, generationId, projectId, onSuccess, onFullyCovered }) => {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('group'); // 'group' or 'flow'
  const [assessment, setAssessment] = useState(null);
  const [sprints, setSprints] = useState([]);
  const members = useProjectStore(state => state.activeProject?.members || []);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [globalSprintId, setGlobalSprintId] = useState('');

  // Diff Popup
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [activeDiffRisk, setActiveDiffRisk] = useState(null);
  const [activeDiffTaskIndex, setActiveDiffTaskIndex] = useState(null);

  // Split (per-card)
  const [splitSelectedIndex, setSplitSelectedIndex] = useState(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [reviewingSplitData, setReviewingSplitData] = useState(null);

  // Merge (scoped popup)
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSelectedSet, setMergeSelectedSet] = useState(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [reviewingMergeData, setReviewingMergeData] = useState(null);

  const [actionError, setActionError] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, action: null, message: '', title: '' });

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen && generationId) fetchData();
  }, [isOpen, generationId]);

  const [reqMap, setReqMap] = useState({});
  const [ucMap, setUcMap] = useState({});

  // ─── DATA ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await taskService.getAIGenerationStatus(generationId);
      if (data.stage !== 'TASK') { toast.error("This draft is not a Task."); onClose(); return; }
      let payloadData = data.payload || {};
      if (typeof payloadData === 'string') { try { payloadData = JSON.parse(payloadData); } catch(e) {} }
      if (data.status === 'PENDING') return;
      if (data.status === 'DISCARDED') { toast.error("AI analysis failed. Please try again!"); onClose(); return; }

      const generatedTasks = payloadData.tasks || [];
      if (generatedTasks.length === 0) { setLoading(false); onClose(); onFullyCovered?.(); return; }

      let fetchedSprints = [];
      try { fetchedSprints = await taskService.getProjectSprints(projectId); setSprints(fetchedSprints); }
      catch (err) { console.error("Failed to load sprints", err); }

      let projectTasks = [];
      try { projectTasks = await taskService.getProjectTasks(projectId); }
      catch (err) { console.error("Failed to load project tasks", err); }

      let rMap = {};
      let uMap = {};
      try {
        const [projectReqs, diagramData] = await Promise.all([
          requirementService.getRequirements(projectId),
          diagramService.getDiagramData(projectId)
        ]);
        (projectReqs || []).forEach(r => rMap[r.reqCode || r.id] = r.title);
        (diagramData?.useCases || []).forEach(u => uMap[u.id] = u.name);
      } catch (err) { console.error("Failed to load reqs/ucs", err); }
      
      setReqMap(rMap);
      setUcMap(uMap);

      const mappedTasks = generatedTasks.map(t => {
        const matched = autoMapSprint(t, fetchedSprints);
        return { ...t, sprint_id: matched !== '' ? matched : (t.sprint_id || '') };
      });

      let parsedAssessment = payloadData.ai_critical_assessment || null;
      if (parsedAssessment && parsedAssessment.duplication_risks) {
        parsedAssessment.duplication_risks = parsedAssessment.duplication_risks.filter(risk => {
          const parsedId = parseInt(String(risk.existing_task_id).replace("TASK-", ""), 10);
          return projectTasks.some(pt => String(pt.id) === String(parsedId));
        });
      }

      setTasks(mappedTasks);
      setAssessment(parsedAssessment);
      const defaultSelected = new Set();
      mappedTasks.forEach((t, i) => {
         const hasDup = parsedAssessment?.duplication_risks?.some(r => r.generated_task_temp_id === t.temp_id);
         if (!hasDup) defaultSelected.add(i);
      });
      setSelectedIndices(defaultSelected);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load generated Tasks.");
      setLoading(false);
    }
  };

  // ─── DERIVED DATA ──────────────────────────────────────────────────────────

  const duplicationRisks = assessment?.duplication_risks || [];
  const coverageGaps     = assessment?.coverage_gaps     || [];

  const groups = useMemo(() => groupAndSortTasks(tasks, reqMap, ucMap), [tasks, reqMap, ucMap]);

  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [initializedExpansions, setInitializedExpansions] = useState(false);

  useEffect(() => {
    if (groups.length > 0 && !initializedExpansions) {
       const initialSet = new Set();
       groups.forEach((g, i) => {
          const hasWarning = g.tasks.some(t => {
             const hasDup = duplicationRisks.some(r => r.generated_task_temp_id === t.temp_id);
             const hasGap = coverageGaps.some(gap => t.use_case_code && gap.use_case_code === t.use_case_code);
             return hasDup || hasGap;
          });
          if (i === 0 || hasWarning) initialSet.add(g.key);
       });
       setExpandedGroups(initialSet);
       setInitializedExpansions(true);
    }
  }, [groups, initializedExpansions, duplicationRisks, coverageGaps]);

  const handleToggleExpand = (groupKey) => {
    const s = new Set(expandedGroups);
    if (s.has(groupKey)) s.delete(groupKey); else s.add(groupKey);
    setExpandedGroups(s);
  };

  // flat index lookup: use indexOf since we don't clone task objects
  const getTaskIndex = (task) => tasks.indexOf(task);

  // ─── SELECTION ─────────────────────────────────────────────────────────────

  // Scope check for merge: all selected tasks must be in same use_case_code/requirement_code
  const mergeScope = useMemo(() => {
    if (mergeSelectedSet.size === 0) return null;
    const selected = Array.from(mergeSelectedSet).map(i => tasks[i]);
    const scopes = new Set(selected.map(t => t.requirement_code || t.use_case_code || 'Ungrouped'));
    return scopes.size === 1 ? [...scopes][0] : null; // null = cross-scope (invalid)
  }, [mergeSelectedSet, tasks]);

  const selectedMergeScope = useMemo(() => {
    if (selectedIndices.size === 0) return null;
    const selected = Array.from(selectedIndices).map(i => tasks[i]);
    const scopes = new Set(selected.map(t => t.requirement_code || t.use_case_code || 'Ungrouped'));
    return scopes.size === 1 ? [...scopes][0] : null;
  }, [selectedIndices, tasks]);

  const handleSelectAll = () => {
    if (selectedIndices.size === tasks.length) setSelectedIndices(new Set());
    else setSelectedIndices(new Set(tasks.map((_, i) => i)));
  };

  const toggleTaskSelection = (index) => {
    if (!selectedIndices.has(index)) {
       const task = tasks[index];
       const unselectedParents = [];
       if (task.depends_on && Array.isArray(task.depends_on)) {
          task.depends_on.forEach(depId => {
              const pIdx = tasks.findIndex(t => t.temp_id === depId);
              if (pIdx !== -1 && !selectedIndices.has(pIdx)) {
                  unselectedParents.push(`#${depId.replace('#', '')}`);
              }
          });
       }
       if (unselectedParents.length > 0) {
          toast.custom((t) => (
             <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 max-w-sm">
                <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5">warning</span>
                <div>
                  <div className="font-bold text-[13px] mb-0.5">Cảnh báo Bottleneck</div>
                  <div className="text-[12px] opacity-90">Bạn vừa duyệt task này nhưng các task cha ({unselectedParents.join(', ')}) chưa được duyệt. Có thể gây kẹt luồng thực thi!</div>
                </div>
             </div>
          ), { duration: 4000, position: 'bottom-right' });
       }
    }
    
    setSelectedIndices(prev => {
      const s = new Set(prev);
      if (s.has(index)) s.delete(index); else s.add(index);
      return s;
    });
  };

  const toggleTaskGroupSelection = (indices, deselectAll) => {
    setSelectedIndices(prev => {
      const s = new Set(prev);
      indices.forEach(idx => {
        if (deselectAll) s.delete(idx);
        else s.add(idx);
      });
      return s;
    });
  };

  // ─── APPROVE ───────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (selectedIndices.size === 0) return;

    const hasUnresolvedDuplications = Array.from(selectedIndices).some(idx => {
      const task = tasks[idx];
      return duplicationRisks.some(r => r.generated_task_temp_id === task.temp_id)
          && task._syncAction !== 'MERGE_INTO_EXISTING';
    });
    if (hasUnresolvedDuplications) {
      setConfirmConfig({ isOpen: true, action: 'BLOCK_APPROVE', type: 'warning', title: 'Unresolved Duplications',
        message: 'Please resolve all highlighted duplication risks (orange border tasks) before approving.', hideCancel: true, confirmText: 'OK, I got it' });
      return;
    }

    const invalidTaskIdx = Array.from(selectedIndices).find(idx => {
      const task = tasks[idx];
      if (task.estimated_hours !== undefined && task.estimated_hours !== null && task.estimated_hours !== '') {
        const h = Number(task.estimated_hours);
        if (isNaN(h) || h <= 0 || h > 999) return true;
      }
      const tStart = task.start_date || task.startDate;
      const tEnd = task.deadline || task.suggested_deadline || task.endDate;
      if (tStart && tEnd && tStart > tEnd) return true;
      const sprintId = task.sprint_id || task.sprintId;
      if (sprintId) {
        const sprint = sprints.find(s => String(s.id) === String(sprintId));
        if (sprint) {
          const sStart = sprint.startDate || sprint.start_date;
          const sEnd   = sprint.endDate   || sprint.end_date;
          if (sStart && tStart && tStart < sStart) return true;
          if (sEnd   && tEnd   && tEnd   > sEnd)   return true;
        }
      }
      return false;
    });
    if (invalidTaskIdx !== undefined) {
      toast.error(`Task "${tasks[invalidTaskIdx].title}" has invalid dates or hours!`);
      return;
    }

    setApproving(true);
    try {
      // Send depends_on as-is; backend handles mapping
      const finalTasks = tasks.map((t, idx) => {
        const taskCopy = { ...t };
        if (selectedIndices.has(idx)) {
          if (!taskCopy.sprint_id || taskCopy.sprint_id === '') taskCopy.sprint_id = null;
          // Keep depends_on – backend handles temp_id -> real ID mapping
        }
        return taskCopy;
      });
      await taskService.approveAITasks(projectId, generationId, {
        selectedIndices: Array.from(selectedIndices),
        modifiedPayload: finalTasks
      });
      toast.success("Approved! Tasks saved to Kanban.");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Error approving tasks.");
    } finally {
      setApproving(false);
    }
  };

  // ─── SPLIT ─────────────────────────────────────────────────────────────────

  const handleSplitCard = (index) => {
    setSplitSelectedIndex(index);
    executeSplit(index);
  };

  const executeSplit = async (indexOverride) => {
    const idx = indexOverride ?? splitSelectedIndex;
    if (idx === null) return;
    setIsSplitting(true);
    abortControllerRef.current = new AbortController();
    try {
      const fullTask = tasks[idx];
      const taskToSplit = { title: fullTask.title, description: fullTask.description, estimated_hours: fullTask.estimated_hours, priority: fullTask.priority, task_type: fullTask.task_type };
      const result = await taskService.splitAITask(projectId, { task: taskToSplit }, { signal: abortControllerRef.current.signal });

      let subTasks = result.data?.sub_tasks || result.sub_tasks;
      if (subTasks && !Array.isArray(subTasks)) {
        if (subTasks.items && Array.isArray(subTasks.items)) subTasks = subTasks.items;
        else if (Object.keys(subTasks).length > 0) subTasks = Object.values(subTasks)[0];
      }

      if (subTasks && Array.isArray(subTasks) && subTasks.length > 0) {
        const oldId = fullTask.temp_id;
        const baseId = oldId || `t${Date.now()}`;
        const idMap = {};
        subTasks.forEach((st, i) => {
          const aiId = st.temp_id || `ai_sub_${i}`;
          idMap[aiId] = `${baseId}_${i+1}`;
        });

        const enrichedSubTasks = subTasks.map((st, i) => {
          // Internal dependencies mapped to new IDs
          const internalDeps = (st.depends_on || []).map(dep => idMap[dep] || dep);
          
          // Does this task depend on any other split task?
          const dependsOnOtherSplits = internalDeps.some(dep => Object.values(idMap).includes(dep));
          
          let combinedDeps = internalDeps;
          if (!dependsOnOtherSplits) {
            // Inherited dependencies from the parent task
            const inheritedDeps = fullTask.depends_on || [];
            // Combine and deduplicate
            combinedDeps = Array.from(new Set([...inheritedDeps, ...internalDeps]));
          }

          const newSub = { ...fullTask, ...st,
            title: st.title || `${fullTask.title} (Part ${i+1})`,
            description: st.description || fullTask.description,
            temp_id: idMap[st.temp_id || `ai_sub_${i}`],
            use_case_code: fullTask.use_case_code,
            requirement_code: fullTask.requirement_code,
            is_split_child: true,
            depends_on: combinedDeps
          };
          
          const matched = autoMapSprint(newSub, sprints);
          newSub.sprint_id = matched !== '' ? matched : '';
          return newSub;
        });

        setReviewingSplitData({ originalTask: fullTask, subTasks: enrichedSubTasks });
        toast.success("AI split complete – please review!");
      } else {
        const reason = result.data?.reason || result.reason || "Task is too small to split further.";
        setActionError({ title: "Cannot split Task", reason });
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') toast('Split cancelled.', { icon: 'ℹ️' });
      else toast.error(err.response?.data?.error || "Error splitting task.");
    } finally {
      setIsSplitting(false);
      abortControllerRef.current = null;
    }
  };

    const handleApproveSplit = (finalSubTasks) => {
    const originalTask = tasks[splitSelectedIndex];
    const oldId = originalTask.temp_id;
    
    // Find leaf split tasks (tasks that no other split task depends on)
    const splitTaskIds = new Set(finalSubTasks.map(t => t.temp_id).filter(Boolean));
    const dependedUponIds = new Set();
    finalSubTasks.forEach(t => {
      if (t.depends_on) {
        t.depends_on.forEach(dep => {
          if (splitTaskIds.has(dep)) dependedUponIds.add(dep);
        });
      }
    });
    
    let leafIds = finalSubTasks
      .filter(t => t.temp_id && !dependedUponIds.has(t.temp_id))
      .map(t => t.temp_id);
      
    // Fallback if no leaves (e.g. circle)
    if (leafIds.length === 0) {
      leafIds = finalSubTasks.map(t => t.temp_id).filter(Boolean);
    }

    let newTasks = [...tasks];
    newTasks.splice(splitSelectedIndex, 1, ...finalSubTasks);
    if (oldId) {
      newTasks = newTasks.map(t => {
        if (!finalSubTasks.includes(t) && t.depends_on?.includes(oldId)) {
          const deps = new Set(t.depends_on);
          deps.delete(oldId);
          leafIds.forEach(id => deps.add(id));
          return { ...t, depends_on: Array.from(deps) };
        }
        return t;
      });
    }
    setTasks(newTasks);
    // BUG-4 FIX: Re-build selectedIndices preserving old selections.
    // Map old indices → new indices after splice. Old tasks before splitSelectedIndex keep same index.
    // The split tasks (finalSubTasks) are all selected. Tasks after are shifted by (finalSubTasks.length - 1).
    const shift = finalSubTasks.length - 1;
    const newSelected = new Set();
    // Add all split sub-tasks (they occupy splitSelectedIndex .. splitSelectedIndex + shift)
    finalSubTasks.forEach((_, i) => newSelected.add(splitSelectedIndex + i));
    // Re-map previously selected indices that were after the split point
    selectedIndices.forEach(idx => {
      if (idx < splitSelectedIndex) newSelected.add(idx);          // before → unchanged
      else if (idx > splitSelectedIndex) newSelected.add(idx + shift); // after → shifted
      // idx === splitSelectedIndex (original task) is replaced by subtasks above
    });
    setSelectedIndices(newSelected);
    setReviewingSplitData(null);
    setSplitSelectedIndex(null);
    toast.success("Split applied!");
  };

  // ─── MERGE ─────────────────────────────────────────────────────────────────

  const executeMerge = async () => {
    if (mergeSelectedSet.size < 2) return;
    // Scope guard
    if (!mergeScope) {
      toast.error("Can only merge tasks within the same Feature Flow (Use Case / Requirement).");
      return;
    }
    setIsMerging(true);
    abortControllerRef.current = new AbortController();
    try {
      const fullTasksToMerge = Array.from(mergeSelectedSet).map(idx => tasks[idx]);
      const tasksToMerge = fullTasksToMerge.map(t => ({ title: t.title, description: t.description, estimated_hours: t.estimated_hours, priority: t.priority, task_type: t.task_type }));
      const result = await taskService.mergeAITasks(projectId, { tasks: tasksToMerge }, { signal: abortControllerRef.current.signal });
      let mergedTask = result.data?.merged_task || result.merged_task;
      if (mergedTask?.merged_task) mergedTask = mergedTask.merged_task;

      if (mergedTask && typeof mergedTask === 'object') {
        const baseTask = fullTasksToMerge[0];
        // BUG-8 FIX: Generate a guaranteed unique masterId regardless of whether baseTask.temp_id exists.
        // Using timestamp + random suffix ensures no collision even if multiple tasks lack temp_id.
        const masterId = baseTask.temp_id || `t_merged_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const allOldIds = fullTasksToMerge.map(t => t.temp_id).filter(Boolean);

        let mergedDeps = new Set();
        fullTasksToMerge.forEach(t => (t.depends_on || []).forEach(dep => mergedDeps.add(dep)));
        // Remove internal deps (between merged tasks themselves)
        allOldIds.forEach(id => mergedDeps.delete(id));

        const enrichedMerge = {
          ...baseTask, ...mergedTask,
          title: mergedTask.title || `${baseTask.title} (Merged)`,
          description: mergedTask.description || baseTask.description,
          temp_id: masterId,
          use_case_code: baseTask.use_case_code,
          requirement_code: baseTask.requirement_code,
          depends_on: mergedDeps.size > 0 ? Array.from(mergedDeps) : [],
          is_merged_result: true,
        };
        const matched = autoMapSprint(enrichedMerge, sprints);
        enrichedMerge.sprint_id = matched !== '' ? matched : '';

        setReviewingMergeData({ originalTasks: fullTasksToMerge, mergedTask: enrichedMerge });
        toast.success("AI merge complete – please review!");
      } else {
        setActionError({ title: "Cannot merge Tasks", reason: result.data?.reason || result.reason || "These tasks conflict or have no logical connection." });
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') toast('Merge cancelled.', { icon: 'ℹ️' });
      else toast.error(err.response?.data?.error || "Error merging tasks.");
    } finally {
      setIsMerging(false);
      setMergeModalOpen(false);
      abortControllerRef.current = null;
    }
  };

  const handleApproveMerge = (finalMergedTask) => {
    const allOldIds = Array.from(mergeSelectedSet).map(idx => tasks[idx].temp_id).filter(Boolean);
    const masterId = finalMergedTask.temp_id;
    let newTasks = tasks.filter((_, idx) => !mergeSelectedSet.has(idx));
    newTasks = newTasks.map(t => {
      if (t.depends_on?.some(dep => allOldIds.includes(dep))) {
        const newDeps = [...new Set(t.depends_on.map(dep => allOldIds.includes(dep) ? masterId : dep))];
        return { ...t, depends_on: newDeps };
      }
      return t;
    });
    newTasks.unshift(finalMergedTask);
    setTasks(newTasks);
    setSelectedIndices(new Set(newTasks.map((_, i) => i)));
    setReviewingMergeData(null);
    setMergeSelectedSet(new Set());
    toast.success("Merge applied!");
  };

  // ─── DIFF ──────────────────────────────────────────────────────────────────

  const handleResolveDiff = (action) => {
    if (activeDiffTaskIndex === null) return;
    if (action === 'DELETE_GENERATED') {
      setConfirmConfig({ isOpen: true, action: 'DELETE_GENERATED', type: 'danger', title: 'Delete AI Task', message: 'Delete this AI-generated task from the list?', confirmText: 'Delete' });
    } else if (action === 'MERGE_INTO_EXISTING') {
      setConfirmConfig({ isOpen: true, action: 'MERGE_INTO_EXISTING', type: 'merge', title: 'Confirm Merge', message: 'Existing task will be overwritten by this AI task.', confirmText: 'Confirm' });
    } else if (action === 'KEEP_BOTH') {
      executeResolveDiff('KEEP_BOTH');
    }
  };

  const executeResolveDiff = (action) => {
    if (activeDiffTaskIndex === null) return;
    const updatedTasks = [...tasks];
    if (action === 'DELETE_GENERATED') {
      updatedTasks.splice(activeDiffTaskIndex, 1);
      setTasks(updatedTasks);
      const newSet = new Set();
      selectedIndices.forEach(idx => {
        if (idx < activeDiffTaskIndex) newSet.add(idx);
        else if (idx > activeDiffTaskIndex) newSet.add(idx - 1);
      });
      setSelectedIndices(newSet);
    } else if (action === 'MERGE_INTO_EXISTING') {
      updatedTasks[activeDiffTaskIndex] = { ...updatedTasks[activeDiffTaskIndex], _syncAction: 'MERGE_INTO_EXISTING', _existingTaskId: activeDiffRisk.existing_task_id };
      setTasks(updatedTasks);
      const newSet = new Set(selectedIndices); newSet.add(activeDiffTaskIndex); setSelectedIndices(newSet);
    } else if (action === 'KEEP_BOTH') {
      updatedTasks[activeDiffTaskIndex] = { ...updatedTasks[activeDiffTaskIndex], _syncAction: 'KEEP_BOTH' };
      delete updatedTasks[activeDiffTaskIndex]._existingTaskId;
      setTasks(updatedTasks);
      const newSet = new Set(selectedIndices); newSet.add(activeDiffTaskIndex); setSelectedIndices(newSet);
    }
    setDiffModalOpen(false);
    setActiveDiffRisk(null);
    setActiveDiffTaskIndex(null);
  };

  // ─── RENDER GUARDS ─────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const reqCount = new Set(tasks.map(t => t.requirement_code).filter(Boolean)).size;

  const getTaskGaps = (task) =>
    coverageGaps.filter(g => task.use_case_code && g.use_case_code === task.use_case_code).map(g => ({ message: `${g.use_case_code}: ${g.missing_step}` }));

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">

          {/* ── HEADER ── */}
          <div className="px-6 py-5 flex justify-between items-start shrink-0 border-b border-white/10" style={{background:'#1e707d'}}>
            <div className="flex items-start gap-4">
               <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                 <span className="material-symbols-outlined text-[28px] text-white">auto_awesome</span>
               </div>
               <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    AI Task Review Board
                    <span className="bg-white/20 text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold border border-white/10 shadow-sm">Review Mode</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-white/10 text-white/90 border border-white/10 flex items-center gap-1.5 shadow-sm"><span className="material-symbols-outlined text-[14px]">task</span> {tasks.length} Generated Tasks</span>
                    <span className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-white/10 text-white/90 border border-white/10 flex items-center gap-1.5 shadow-sm"><span className="material-symbols-outlined text-[14px]">description</span> {reqCount} Requirements</span>
                    <span className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-white/10 text-white/90 border border-white/10 flex items-center gap-1.5 shadow-sm"><span className="material-symbols-outlined text-[14px]">account_tree</span> {groups.length} Feature Flows</span>
                    
                    {(coverageGaps.length > 0 || duplicationRisks.length > 0) && <div className="w-px h-4 bg-white/20 mx-1"></div>}
                    
                    {coverageGaps.length > 0 && <span className="flex items-center gap-1 bg-red-500/20 text-red-100 border border-red-400/30 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-inner"><span className="material-symbols-outlined text-[14px] text-red-300">warning</span> {coverageGaps.length} Coverage Gaps</span>}
                    {duplicationRisks.length > 0 && <span className="flex items-center gap-1 bg-orange-500/20 text-orange-100 border border-orange-400/30 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-inner"><span className="material-symbols-outlined text-[14px] text-orange-300">content_copy</span> {duplicationRisks.length} Duplications</span>}
                  </div>
               </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm" style={{background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
              <span className="material-symbols-outlined text-[22px] text-white">close</span>
            </button>
          </div>

          {/* ── TOOLBAR ── */}
          <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-slate-600 hover:text-slate-900">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer"
                  style={{accentColor:'#1e707d'}}
                  checked={tasks.length > 0 && selectedIndices.size === tasks.length}
                  ref={el => { if (el) el.indeterminate = tasks.length > 0 && selectedIndices.size > 0 && selectedIndices.size < tasks.length; }}
                  onChange={handleSelectAll} />
                Select all
              </label>
              <span className="text-slate-200">|</span>
              <span className="text-[13px] text-slate-500">{selectedIndices.size} / {tasks.length} selected</span>
              <span className="text-slate-200">|</span>
              <button 
                className="text-[13px] font-medium text-slate-600 hover:text-slate-900 underline decoration-slate-300 underline-offset-2"
                onClick={() => expandedGroups.size > 0 ? setExpandedGroups(new Set()) : setExpandedGroups(new Set(groups.map(g => g.key)))}
              >
                {expandedGroups.size > 0 ? "Collapse All" : "Expand All"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2">
                <button
                  onClick={() => setViewMode('group')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-colors ${viewMode === 'group' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_list</span>
                  Detail View
                </button>
                <button
                  onClick={() => setViewMode('flow')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-colors ${viewMode === 'flow' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_tree</span>
                  Flow View
                </button>
              </div>

              {/* MERGE button */}
              <button
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                onClick={() => { 
                  setMergeSelectedSet(new Set(selectedIndices)); 
                  setMergeModalOpen(true); 
                }}
                title="Merge tasks"
              >
                <span className="material-symbols-outlined text-[16px] rotate-180">call_merge</span>
                Merge
                {selectedIndices.size >= 2 && <span className="bg-white/20 text-white text-[11px] font-bold px-1.5 py-0.5 rounded ml-1">{selectedIndices.size}</span>}
              </button>

              {/* Override sprint */}
              {sprints.length > 0 ? (
                <select
                  className="border border-slate-300 rounded px-2 py-1.5 text-[13px] bg-white outline-none min-w-[130px]"
                  style={{accentColor:'#1e707d'}}
                  value={globalSprintId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGlobalSprintId(val);
                    if (val) { setTasks(tasks.map(t => ({ ...t, sprint_id: val }))); toast.success("Sprint overridden for all tasks."); }
                  }}
                >
                  <option value="">Sprint</option>
                  {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <span className="text-[13px] text-slate-400 italic">No sprints</span>
              )}
            </div>
          </div>

          {/* ── TASK LIST ── */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                <span className="material-symbols-outlined animate-spin text-5xl text-teal-700">progress_activity</span>
                <p className="text-sm font-medium">Loading AI-generated tasks…</p>
              </div>
            ) : viewMode === 'flow' ? (
              <TaskFlowGraph tasks={tasks} duplicationRisks={duplicationRisks} coverageGaps={coverageGaps} selectedIndices={selectedIndices} />
            ) : (
              <div className="max-w-5xl mx-auto pb-10">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  {groups.map((group, index) => (
                    <FeatureFlowGroup
                      key={group.key}
                      group={group}
                      isLast={index === groups.length - 1}
                      tasks={tasks}
                      selectedIndices={selectedIndices}
                      duplicationRisks={duplicationRisks}
                      coverageGaps={coverageGaps}
                      sprints={sprints}
                      members={members}
                      isSplitting={isSplitting}
                      isExpanded={expandedGroups.has(group.key)}
                      onToggleExpand={() => handleToggleExpand(group.key)}
                      onToggleSelect={(task) => toggleTaskSelection(getTaskIndex(task))}
                      onToggleGroup={toggleTaskGroupSelection}
                      onSplitCard={(task) => handleSplitCard(getTaskIndex(task))}
                      onUpdateTask={(task, updatedTask) => {
                        const i = getTaskIndex(task);
                        const n = [...tasks]; n[i] = updatedTask; setTasks(n);
                      }}
                      onOpenDiff={(task) => {
                        const i = getTaskIndex(task);
                        const dup = duplicationRisks.find(r => r.generated_task_temp_id === task.temp_id);
                        setActiveDiffRisk(dup);
                        setActiveDiffTaskIndex(i);
                        setDiffModalOpen(true);
                      }}
                      getTaskIndex={getTaskIndex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
            <button onClick={onClose} disabled={approving}
              className="px-4 py-2 border border-slate-300 rounded text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleApprove} disabled={loading || approving || selectedIndices.size === 0}
              className="px-5 py-2 text-white text-[13px] font-bold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background: (loading || approving || selectedIndices.size === 0) ? '#94a3b8' : '#1e707d'}}>
              {approving ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Approving…</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">check_circle</span> Approve {selectedIndices.size} Tasks</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── MERGE POPUP (Scoped) ── */}
      {mergeModalOpen && (
        <ScopedMergePopup
          tasks={tasks}
          mergeSelectedSet={mergeSelectedSet}
          setMergeSelectedSet={setMergeSelectedSet}
          mergeScope={mergeScope}
          isMerging={isMerging}
          onClose={() => setMergeModalOpen(false)}
          onExecuteMerge={executeMerge}
          reqMap={reqMap}
          ucMap={ucMap}
        />
      )}

      {/* ── AI LOADING OVERLAY ── */}
      {(isSplitting || isMerging) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white px-10 py-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center relative">
            <button onClick={() => abortControllerRef.current?.abort()}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <span className="material-symbols-outlined text-5xl text-indigo-600 animate-spin mb-4 mt-2">progress_activity</span>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {isSplitting ? '✂️ AI is splitting…' : '🔀 AI is merging…'}
            </h3>
            <p className="text-sm text-slate-500">
              {isSplitting ? `Breaking down "${tasks[splitSelectedIndex]?.title}"…` : `Synthesizing ${mergeSelectedSet.size} tasks…`}
            </p>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <DuplicationDiffModal isOpen={diffModalOpen} onClose={() => setDiffModalOpen(false)}
        activeDiffTask={tasks[activeDiffTaskIndex]} activeDiffRisk={activeDiffRisk}
        onResolve={handleResolveDiff} sprints={sprints} members={members}
        priorityColor={priorityColor} getTypeConfig={getTypeConfig} projectId={projectId} />

      <SplitTaskReviewModal isOpen={!!reviewingSplitData}
        onClose={() => { setReviewingSplitData(null); setSplitSelectedIndex(null); }}
        originalTask={reviewingSplitData?.originalTask} generatedSubTasks={reviewingSplitData?.subTasks}
        onApprove={handleApproveSplit} sprints={sprints} members={members}
        priorityColor={priorityColor} getTypeConfig={getTypeConfig} />

      <MergeTaskReviewModal isOpen={!!reviewingMergeData}
        onClose={() => { setReviewingMergeData(null); setMergeSelectedSet(new Set()); }}
        originalTasks={reviewingMergeData?.originalTasks} generatedMergedTask={reviewingMergeData?.mergedTask}
        onApprove={handleApproveMerge} sprints={sprints} members={members}
        priorityColor={priorityColor} getTypeConfig={getTypeConfig} />

      <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message}
        type={confirmConfig.type || 'danger'} confirmText={confirmConfig.confirmText || 'Confirm'} cancelText="Cancel"
        hideCancel={confirmConfig.hideCancel}
        onConfirm={() => { if (confirmConfig.action !== 'BLOCK_APPROVE') executeResolveDiff(confirmConfig.action); setConfirmConfig({ isOpen: false }); }}
        onCancel={() => setConfirmConfig({ isOpen: false })} />

      {actionError && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="material-symbols-outlined text-3xl">error</span>
              <h3 className="font-bold text-lg">{actionError.title}</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">{actionError.reason}</p>
            <div className="flex justify-end">
              <button onClick={() => setActionError(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg">Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── FEATURE FLOW GROUP ───────────────────────────────────────────────────────
const STEP_COLORS = [
  { ring: 'ring-indigo-500',  bg: 'bg-indigo-600',  line: 'bg-indigo-300' },
  { ring: 'ring-violet-500',  bg: 'bg-violet-600',  line: 'bg-violet-300' },
  { ring: 'ring-blue-500',    bg: 'bg-blue-600',    line: 'bg-blue-300' },
  { ring: 'ring-cyan-500',    bg: 'bg-cyan-600',    line: 'bg-cyan-300' },
  { ring: 'ring-teal-500',    bg: 'bg-teal-600',    line: 'bg-teal-300' },
];

const FeatureFlowGroup = ({ 
  group, tasks, isExpanded, onToggleExpand, selectedIndices, 
  onToggleSelect, onToggleGroup, sprints, members,
  duplicationRisks, coverageGaps, onSplitCard, isSplitting, onUpdateTask, onOpenDiff,
  getTaskIndex, isLast
}) => {
  const allSelected = group.tasks.every(t => selectedIndices.has(getTaskIndex(t)));
  const someSelected = group.tasks.some(t => selectedIndices.has(getTaskIndex(t)));
  const selectedCount = group.tasks.filter(t => selectedIndices.has(getTaskIndex(t))).length;

  const handleGroupCheck = (e) => {
    e.stopPropagation();
    if (onToggleGroup) {
      onToggleGroup(group.tasks.map(t => getTaskIndex(t)), allSelected);
    }
  };

  const hasWarnings = group.tasks.some(task => {
    const hasDup = duplicationRisks.some(r => r.generated_task_temp_id === task.temp_id && !['MERGE_INTO_EXISTING', 'KEEP_BOTH'].includes(task._syncAction));
    const hasGap = coverageGaps.some(gap => task.use_case_code && gap.use_case_code === task.use_case_code);
    return hasDup || hasGap;
  });

  return (
    <div className={`w-full bg-white overflow-hidden transition-all ${isLast ? '' : 'border-b border-slate-200'}`}>
      <div 
        className={`px-4 py-3.5 cursor-pointer transition-all flex items-center justify-between relative overflow-hidden
          ${isExpanded ? 'bg-teal-50/30' : 'bg-white hover:bg-slate-50'}`}
        onClick={onToggleExpand}
      >
        {/* Subtle active indicator line */}
        {isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1D7A85]"></div>}
        
        {/* Separator line below header when expanded */}
        {isExpanded && <div className="absolute left-0 right-0 bottom-0 h-px bg-slate-200"></div>}
        
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            className="w-4.5 h-4.5 rounded border-slate-300 text-[#1D7A85] focus:ring-[#1D7A85] cursor-pointer"
            checked={allSelected} 
            ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
            onChange={handleGroupCheck} 
            onClick={e => e.stopPropagation()} 
          />

          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-extrabold text-slate-800 text-[15px]">
              {group.key !== 'Ungrouped' ? (group.title || group.key) : 'Independent Tasks'}
            </h3>
            
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            
            <span className="text-slate-500 text-[13px] font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">task</span>
              {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'} 
            </span>
            
            {selectedCount > 0 && (
              <span className="text-white text-[11px] font-bold px-2 py-0.5 bg-[#1D7A85] rounded-full shadow-sm ml-1">
                {selectedCount} selected
              </span>
            )}

            {hasWarnings && (
              <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-200 shadow-sm ml-1">
                <span className="material-symbols-outlined text-[14px]">warning</span> Review Needed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#1D7A85]' : 'rotate-0'}`}>
            expand_more
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {group.tasks.map((task, stepIdx) => {
              const flatIdx = getTaskIndex(task);
              const isSelected = selectedIndices.has(flatIdx);
              const duplication = duplicationRisks.find(r => r.generated_task_temp_id === task.temp_id);
              const hasDuplication = !!duplication && !['MERGE_INTO_EXISTING', 'KEEP_BOTH'].includes(task._syncAction);
              const gaps = coverageGaps.filter(g => task.use_case_code && g.use_case_code === task.use_case_code);

              return (
                <div key={task.temp_id || stepIdx} className="flex flex-col h-full">
                  <div className={[
                    'rounded-xl border p-5 transition-all flex-1 flex flex-col relative overflow-hidden',
                    hasDuplication ? 'border-orange-400 bg-orange-50/40 shadow-[0_4px_12px_rgba(251,146,60,0.08)]' :
                    gaps.length > 0 ? 'border-red-400 bg-red-50/40 shadow-[0_4px_12px_rgba(248,113,113,0.08)]' :
                    isSelected ? 'border-teal-500 bg-teal-50/30 shadow-[0_4px_12px_rgba(20,184,166,0.1)] ring-1 ring-teal-500' :
                    'border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'
                  ].join(' ')}>
                    
                    <div className="flex-1 min-w-0">
                      <EditableTaskCard
                        task={task} sprints={sprints} members={members}
                        priorityColor={priorityColor} getTypeConfig={getTypeConfig}
                        isMergingToExisting={task._syncAction === 'MERGE_INTO_EXISTING'}
                        maxAllowedDate={useProjectStore.getState().activeProject?.deadline}
                        onUpdate={(updatedTask) => onUpdateTask(task, updatedTask)}
                        onChangeSprint={(newSprintId) => onUpdateTask(task, { ...task, sprint_id: newSprintId })}
                        checkboxSlot={
                          <input type="checkbox" className="w-5 h-5 mt-0.5 rounded border-slate-300 text-[#1D7A85] focus:ring-[#1D7A85] cursor-pointer shrink-0"
                            checked={isSelected} onChange={() => onToggleSelect(task)} />
                        }
                        splitButtonSlot={
                          <button
                            title="Split this task with AI"
                            disabled={isSplitting}
                            onClick={() => onSplitCard(task)}
                            className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded border border-[#1D7A85] text-[#1D7A85] font-bold text-[11px] hover:bg-[#1D7A85] hover:text-white transition-colors disabled:opacity-40 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[13px] rotate-180">call_split</span>
                            Split
                          </button>
                        }
                      />
                    </div>

                    {(gaps.length > 0 || hasDuplication) && (
                      <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-slate-100">
                        {gaps.length > 0 && (
                          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                            <div className="text-red-700 font-bold text-xs mb-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">warning</span> Coverage Gap</div>
                            <ul className="list-disc pl-5 text-xs text-red-600 space-y-1">
                              {gaps.map((g, i) => <li key={i}>{g.missing_step}</li>)}
                            </ul>
                          </div>
                        )}
                        {hasDuplication && (
                          <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg flex flex-col gap-2">
                            <div className="text-orange-800 text-xs font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Duplicated with {duplication.existing_task_id}</div>
                            <button onClick={() => onOpenDiff(task)}
                              className="self-start px-3 py-1.5 bg-white border border-orange-300 text-orange-700 text-xs font-bold rounded-md hover:bg-orange-100 transition-colors shadow-sm">
                              Compare & Resolve →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SCOPED MERGE POPUP ───────────────────────────────────────────────────────

const ScopedMergePopup = ({ tasks, mergeSelectedSet, setMergeSelectedSet, mergeScope, isMerging, onClose, onExecuteMerge, reqMap, ucMap }) => {
  // Group tasks by scope for display
  const grouped = useMemo(() => {
    const g = {};
    tasks.forEach((t, i) => {
      const scope = t.requirement_code || t.use_case_code || 'Ungrouped';
      if (!g[scope]) g[scope] = [];
      g[scope].push({ task: t, idx: i });
    });
    return g;
  }, [tasks]);

  const scopeValid = mergeScope !== null && mergeSelectedSet.size >= 2;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-violet-50 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-[22px] rotate-180">call_merge</span>
              Select Tasks to Merge
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">Select the tasks you want to combine into a single task.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Status bar */}
        <div className={[
          'px-6 py-2.5 text-sm font-medium flex items-center gap-2 border-b',
          scopeValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          mergeSelectedSet.size >= 2 ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-slate-50 text-slate-500 border-slate-200'
        ].join(' ')}>
          {scopeValid
            ? <><span className="material-symbols-outlined text-[18px]">check_circle</span> {mergeSelectedSet.size} tasks selected for merging.</>
            : mergeSelectedSet.size >= 2
            ? <><span className="material-symbols-outlined text-[18px]">cancel</span> Cross-scope selection detected. Please select tasks from the same flow.</>
            : <><span className="material-symbols-outlined text-[18px]">info</span> Select at least 2 tasks to merge.</>
          }
        </div>

        {/* Task list (Grouped & Vertical Timeline) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/50 custom-scrollbar">
          {Object.entries(grouped).map(([scope, items], groupIndex) => {
            if (mergeScope && scope !== mergeScope) return null; // Only show relevant tasks if opened from a specific scope
            
            const isUngrouped = scope === 'Ungrouped';
            const groupTitle = isUngrouped ? 'Independent Tasks' : (ucMap?.[scope] || reqMap?.[scope] || 'Feature Group');
            
            return (
              <div key={scope} className="flex flex-col">
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">account_tree</span>
                    <span className="text-[12px] font-bold text-slate-700 normal-case tracking-normal">{groupTitle}</span>
                  </span>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                {/* Vertical Stepper */}
                <div className="flex flex-col relative pl-2">
                  {items.map(({ task, idx }, stepIdx) => {
                    const isChecked = mergeSelectedSet.has(idx);
                    
                    // Lock to a specific scope once EXACTLY 1 scope exists in selection.
                    const selectedScopes = new Set(Array.from(mergeSelectedSet).map(i => tasks[i].requirement_code || tasks[i].use_case_code || 'Ungrouped'));
                    const lockedScope = selectedScopes.size === 1 ? [...selectedScopes][0] : null;
                    const wouldCrossScope = !isChecked && lockedScope !== null && lockedScope !== scope;
                    const isLast = stepIdx === items.length - 1;
                    
                    return (
                      <div key={idx} className="flex relative items-start">
                        {/* Timeline line */}
                        {!isLast && (
                          <div className="absolute left-[11px] top-[24px] bottom-[-16px] w-0.5 bg-indigo-100 z-0"></div>
                        )}
                        
                        {/* Step Marker */}
                        <div className="relative z-10 flex flex-col items-center mr-4 mt-1.5">
                          <div className={['w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border shadow-sm transition-colors',
                            isChecked ? 'bg-[#1D7A85] border-[#1D7A85] text-white' : wouldCrossScope ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-teal-200 text-[#1D7A85]'
                          ].join(' ')}>
                            {stepIdx + 1}
                          </div>
                        </div>

                        {/* Task Card */}
                        <div 
                          className={[
                            'flex-1 flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors relative mb-4 select-none',
                            isChecked ? 'ring-1 ring-[#1D7A85] border-[#1D7A85] bg-teal-50/30 shadow-sm' : 
                            wouldCrossScope ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : 
                            'hover:border-teal-300 border-slate-200 bg-white hover:shadow-sm'
                          ].join(' ')}
                          onClick={() => {
                            if (wouldCrossScope || isMerging) return;
                            const s = new Set(mergeSelectedSet);
                            if (s.has(idx)) s.delete(idx); else s.add(idx);
                            setMergeSelectedSet(s);
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-[13px] font-bold text-slate-800 leading-snug pr-2">{task.title}</span>
                            {isChecked && <span className="material-symbols-outlined text-[18px] text-[#1D7A85] shrink-0">check_circle</span>}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{task.task_type}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-100 shadow-sm px-2 py-0.5 rounded-md">{task.estimated_hours}h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center">
          <button onClick={onClose} disabled={isMerging} className="px-4 py-2 border rounded-lg font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
          <button onClick={onExecuteMerge} disabled={!scopeValid || isMerging}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] rotate-180">call_merge</span>
            {isMerging ? 'Merging...' : `Merge ${mergeSelectedSet.size} Tasks`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTaskReviewBoard;
