import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Plus,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  RotateCcw,
  LogOut,
  Calendar,
  DollarSign,
  Users,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Mountain,
  Clock,
  Sparkles,
  MapPin,
  ListOrdered,
  Share2,
  Link,
  Check,
  Eye,
  Layers,
  Cloud,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Search,
  FileSpreadsheet,
  Loader2,
  Car
} from 'lucide-react';
import { Activity, calculateDays, calculateTotalHours, getActivityDays } from '../types';
import { ActivityEditorModal } from './ActivityEditorModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  createBlankActivity,
  duplicateActivity,
  archiveActivity,
  unarchiveActivity,
  saveActivities,
  saveActivitiesToCloud,
  deleteActivityFromCloud,
  fetchActivitiesFromCloud,
  setAdminAuth,
  getActivityPublicUrl
} from '../utils/storage';

interface AdminPortalProps {
  activities: Activity[];
  onUpdateActivities: (activities: Activity[]) => void;
  onViewActivityOnPublic: (activityId: string) => void;
  isAdminLoggedIn: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activities,
  onUpdateActivities,
  onViewActivityOnPublic,
  isAdminLoggedIn,
  onLoginSuccess,
  onLogout,
}) => {
  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Selected Activity in sidebar & view mode
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    activities[0]?.id || ''
  );
  const [adminViewMode, setAdminViewMode] = useState<'list' | 'detail'>('list');

  // Filter Tab: All, Active (Public), Missing Dates (Hidden), Archived
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'nodate' | 'archived'>('all');

  // Helper to check valid dates
  const hasValidDates = (a?: Activity | null): boolean =>
    Boolean(a && a.startDate && a.startDate.trim() !== '' && a.endDate && a.endDate.trim() !== '');

  // Template Picker Modal
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateCustomTitle, setTemplateCustomTitle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Archive Confirmation Modal
  const [archiveConfirmAct, setArchiveConfirmAct] = useState<Activity | null>(null);

  // Editor Modal States
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteTargetActivity, setDeleteTargetActivity] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedActivity =
    activities.find((a) => a.id === selectedActivityId) || activities[0];

  const activeCount = activities.filter((a) => !a.isArchived && a.status !== 'archived' && hasValidDates(a)).length;
  const noDateCount = activities.filter((a) => !a.isArchived && a.status !== 'archived' && !hasValidDates(a)).length;
  const archivedCount = activities.filter((a) => a.isArchived || a.status === 'archived').length;

  const filteredActivities = activities.filter((act) => {
    const isArchived = Boolean(act.isArchived || act.status === 'archived');
    const hasDates = hasValidDates(act);
    if (filterTab === 'active') return !isArchived && hasDates;
    if (filterTab === 'nodate') return !isArchived && !hasDates;
    if (filterTab === 'archived') return isArchived;
    return true;
  });

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'yy661003' && password === 'yy661003') {
      setAdminAuth(true);
      onLoginSuccess();
      setLoginError('');
      showToast('管理員登入成功！');
    } else {
      setLoginError('帳號或密碼錯誤，請確認輸入正確的帳號密碼。');
    }
  };

  const handleCreateNew = async () => {
    const newAct = createBlankActivity(activities);
    const updated = [...activities, newAct];
    const ok = await saveActivitiesToCloud(updated);
    if (ok) {
      onUpdateActivities(updated);
      setSelectedActivityId(newAct.id);
      setEditingActivity(newAct);
      setIsEditorOpen(true);
      showToast(`已建立全新活動並存入雲端資料庫 (ID: ${newAct.id})`);
    } else {
      showToast(`建立活動失敗！無法寫入雲端資料庫`);
    }
  };

  const handleDuplicateFromTemplate = async (template: Activity, customTitle?: string) => {
    const titleToUse = customTitle?.trim() || `${template.title || '活動'} (新梯次)`;
    const cloned = duplicateActivity(template, activities, titleToUse);
    const updated = [...activities, cloned];
    const ok = await saveActivitiesToCloud(updated);
    if (ok) {
      onUpdateActivities(updated);
      setSelectedActivityId(cloned.id);
      setEditingActivity(cloned);
      setIsEditorOpen(true);
      setIsTemplatePickerOpen(false);
      setSelectedTemplateId('');
      setTemplateCustomTitle('');
      showToast(`已成功依「${template.title || '活動'}」複製為新活動並寫入雲端 (ID: ${cloned.id})！`);
    } else {
      showToast(`複製活動失敗！無法寫入雲端資料庫`);
    }
  };

  const handleArchive = async (act: Activity) => {
    const updated = archiveActivity(act.id, activities);
    const ok = await saveActivitiesToCloud(updated);
    if (ok) {
      onUpdateActivities(updated);
      setArchiveConfirmAct(null);
      showToast(`已將活動「${act.title || '未命名活動'}」移入封存！雲端資料庫已同步更新。`);
    } else {
      showToast(`封存失敗！無法寫入雲端資料庫`);
    }
  };

  const handleUnarchive = async (act: Activity) => {
    const updated = unarchiveActivity(act.id, activities);
    const ok = await saveActivitiesToCloud(updated);
    if (ok) {
      onUpdateActivities(updated);
      showToast(`已解除「${act.title || '未命名活動'}」封存並重新公開上架！雲端已同步。`);
    } else {
      showToast(`解除封存失敗！無法寫入雲端資料庫`);
    }
  };

  const handleEdit = (act: Activity) => {
    setEditingActivity(act);
    setIsEditorOpen(true);
  };

  const handleSaveActivity = async (saved: Activity) => {
    // Strictly update ONLY the matching Activity ID or append if new
    const exists = activities.some((item) => item.id === saved.id);
    const updated = exists
      ? activities.map((item) => (item.id === saved.id ? saved : item))
      : [...activities, saved];
    const ok = await saveActivitiesToCloud(updated);
    if (ok) {
      onUpdateActivities(updated);
      showToast(`已成功寫入資料庫並同步發布：「${saved.title || '未命名活動'}」(ID: ${saved.id})`);
    } else {
      showToast(`儲存失敗！無法寫入雲端資料庫，請檢查連線`);
    }
  };

  const handleDuplicate = async (act: Activity) => {
    // Generate a fresh unique Activity ID; original act remains 100% untouched
    const cloned = duplicateActivity(act, activities);
    const updated = [...activities, cloned];
    const ok = await saveActivitiesToCloud(updated);
    if (ok) {
      onUpdateActivities(updated);
      setSelectedActivityId(cloned.id);
      showToast(`已成功複製活動並寫入雲端！生成新 ID: ${cloned.id}`);
    } else {
      showToast(`複製活動失敗！無法寫入雲端資料庫`);
    }
  };

  const handleConfirmDelete = async (target: Activity) => {
    setIsDeleting(true);
    const id = target.id;
    const title = target.title;

    try {
      const res = await deleteActivityFromCloud(id);
      if (res.success) {
        const remaining = activities.filter((act) => act.id !== id);
        onUpdateActivities(remaining);
        if (selectedActivityId === id) {
          setSelectedActivityId(remaining[0]?.id || '');
        }
        if (editingActivity?.id === id) {
          setIsEditorOpen(false);
          setEditingActivity(null);
        }
        setDeleteTargetActivity(null);
        setDeleteConfirmId(null);
        showToast(`已成功永久刪除活動「${title}」(ID: ${id})，雲端資料庫已同步更新！`);
      } else {
        showToast(`刪除失敗！無法連線至雲端資料庫`);
      }
    } catch (err) {
      console.error('Delete activity error:', err);
      showToast('刪除活動時發生錯誤');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = activities.find((a) => a.id === id);
    if (target) {
      await handleConfirmDelete(target);
    }
  };

  const handleCopyLink = (actId: string) => {
    const url = getActivityPublicUrl(actId);
    navigator.clipboard.writeText(url);
    setCopiedId(actId);
    showToast(`已複製專屬招生網址：${url}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchActivitiesFromCloud();
      if (data && data.length > 0) {
        onUpdateActivities(data);
        showToast(`已與雲端同步完成（共 ${data.length} 筆活動，手機與電腦即時一致）`);
      }
    } catch {
      showToast('雲端同步發生錯誤，請檢查網路連線');
    } finally {
      setIsSyncing(false);
    }
  };

  // If not logged in, render the login card (without credentials hint)
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#0c0e12]">
        <div className="w-full max-w-md bg-[#161b22] border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-orange-600 text-white font-bold text-xl shadow-lg mb-3">
              A
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide uppercase">
              亞馬遜國家山岳協會
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              登山活動招生管理系統・管理員身分驗證
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                管理員帳號
              </label>
              <input
                type="text"
                id="admin-username-input"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入帳號"
                className="w-full bg-[#0d1117] border border-slate-700 rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                管理員密碼
              </label>
              <input
                type="password"
                id="admin-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full bg-[#0d1117] border border-slate-700 rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-admin-login-submit"
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>登入管理系統</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const selectedDays = selectedActivity
    ? getActivityDays(selectedActivity)
    : 0;
  const selectedWalkTime = selectedActivity
    ? calculateTotalHours(selectedActivity.itinerary)
    : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0e12] min-h-[calc(100vh-4rem)]">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-20 right-4 z-50 bg-orange-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Admin Subheader Bar */}
      <div className="bg-[#161b22] border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Layers className="w-4 h-4 text-orange-500" />
            <span>活動管理中心</span>
            <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-orange-400 border border-slate-700">
              共 {activities.length} 個獨立活動
            </span>
          </div>

          {/* Tab Switcher: List vs Detail */}
          <div className="flex items-center bg-[#0d1117] border border-slate-700 rounded p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setAdminViewMode('list')}
              className={`px-3 py-1 rounded font-medium transition ${
                adminViewMode === 'list'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              活動列表
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('detail')}
              className={`px-3 py-1 rounded font-medium transition ${
                adminViewMode === 'detail'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              活動詳情檢視
            </button>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualCloudSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#0d1117] hover:bg-slate-800 text-slate-200 hover:text-white rounded text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
            title="手動重新同步雲端資料庫（確保手機與電腦即時一致）"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isSyncing ? '同步中...' : '雲端同步'}</span>
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTemplateId(activities[0]?.id || '');
              setTemplateCustomTitle(`${activities[0]?.title || '活動'} (新梯次)`);
              setIsTemplatePickerOpen(true);
            }}
            id="btn-admin-template-add"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 rounded text-xs font-bold transition flex items-center gap-1.5 border border-orange-500/40 shadow cursor-pointer"
            title="從現有活動複製完整行程為範本，建立新梯次活動"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">從範本複製新增</span>
            <span className="sm:hidden">範本新增</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTemplatePickerOpen(true)}
            id="btn-admin-add-activity"
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增活動</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 rounded text-xs transition flex items-center gap-1 border border-slate-700"
            title="登出管理員"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">登出</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Either Comprehensive Table List OR Inspector */}
      {adminViewMode === 'list' ? (
        /* ==================== 1. FULL ACTIVITY LIST VIEW ==================== */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>活動列表</span>
                <span className="text-xs text-slate-400 font-normal">
                  （支援複製範本與封存管理，封存後前台完全隱藏）
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                點擊「開啟活動招生頁」可直接檢視公開畫面；已完成活動可「封存」以供日後參考或作為新活動複製範本。
              </p>
            </div>
          </div>

          {/* Activity State Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'all'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-[#161b22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>全部活動</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                {activities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#161b22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>前台公開中</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('nodate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'nodate'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-[#161b22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>未填日期・前台隱藏</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                {noDateCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'archived'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-[#161b22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-purple-300" />
              <span>已封存留存</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                {archivedCount}
              </span>
            </button>
          </div>

          <div className="bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0d1117] text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Activity ID</th>
                    <th className="py-3.5 px-4 font-semibold">活動名稱 / 難度</th>
                    <th className="py-3.5 px-4 font-semibold">活動日期 / 天數</th>
                    <th className="py-3.5 px-4 font-semibold">狀態 / 人數</th>
                    <th className="py-3.5 px-4 font-semibold">活動費用</th>
                    <th className="py-3.5 px-4 font-semibold text-right">活動管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        此分類目前尚無活動資料。
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => {
                      const days = getActivityDays(act);
                      const isSelected = act.id === selectedActivityId;
                      const isArchived = Boolean(act.isArchived || act.status === 'archived');

                      return (
                        <tr
                          key={act.id}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            isSelected ? 'bg-slate-800/30' : ''
                          }`}
                        >
                          {/* Activity ID Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2 py-0.5 rounded text-xs">
                                {act.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(act.id)}
                                className="p-1 text-slate-500 hover:text-slate-200 transition cursor-pointer"
                                title="複製活動專屬連結"
                              >
                                {copiedId === act.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Link className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Title & Difficulty */}
                          <td className="py-3.5 px-4">
                            <div
                              className="font-bold text-white text-sm hover:text-orange-400 transition cursor-pointer flex flex-wrap items-center gap-2"
                              onClick={() => {
                                setSelectedActivityId(act.id);
                                setAdminViewMode('detail');
                              }}
                            >
                              <span>{act.title || '（未命名活動）'}</span>
                              {hasValidDates(act) ? (
                                <span className="text-xs font-mono font-bold text-orange-300 bg-orange-950/80 border border-orange-500/50 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                  <Calendar className="w-3 h-3 text-orange-400" />
                                  {act.startDate} ~ {act.endDate}
                                </span>
                              ) : (
                                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-600/60 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                  <Calendar className="w-3 h-3 text-amber-400" />
                                  未填日期（前台隱藏）
                                </span>
                              )}
                              {isArchived && (
                                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-800 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <Archive className="w-2.5 h-2.5" />
                                  已封存
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                              <span>{act.difficulty || '百岳挑戰'}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 truncate max-w-[200px]">
                                {act.subtitle}
                              </span>
                            </div>
                          </td>

                          {/* Dates & Days */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {hasValidDates(act) ? (
                              <>
                                <div className="font-mono text-slate-200">
                                  {act.startDate} ~ {act.endDate}
                                </div>
                                <div className="text-slate-500 text-xs mt-0.5">
                                  共 {days} 天 {days > 1 ? `${days - 1} 夜` : '單日'}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-amber-400 text-xs font-bold font-mono">
                                  未填日期
                                </div>
                                <div className="text-slate-500 text-xs mt-0.5">
                                  前台完全隱藏
                                </div>
                              </>
                            )}
                          </td>

                          {/* Status & Quota */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isArchived ? (
                              <div>
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/80 font-bold text-xs">
                                  <Archive className="w-3 h-3 text-purple-400" />
                                  <span>已封存 (前台隱藏)</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  資料保留於後台
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full ${
                                      act.status === 'recruiting'
                                        ? 'bg-emerald-400'
                                        : act.status === 'full'
                                        ? 'bg-amber-400'
                                        : 'bg-slate-500'
                                    }`}
                                  />
                                  <span className="font-medium text-slate-200">
                                    {act.status === 'recruiting'
                                      ? '現正招生中'
                                      : act.status === 'full'
                                      ? '已額滿'
                                      : '籌辦截止'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                                  已報 {act.currentParticipants || 0} / 上限 {act.maxParticipants} 人
                                </div>
                                {!hasValidDates(act) && (
                                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    未填日期・前台隱藏
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Fee */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-orange-400">
                              NT$ {Number(act.fee || 0).toLocaleString()}
                              {act.feeItems && act.feeItems.length > 1 && (
                                <span className="text-xs font-normal text-orange-300 ml-1">起</span>
                              )}
                            </div>
                            {act.feeItems && act.feeItems.length > 1 && (
                              <div className="text-[10px] text-slate-400 font-sans">
                                共 {act.feeItems.length} 種費用方案
                              </div>
                            )}
                          </td>

                          {/* Action Buttons Column */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 開啟活動招生頁 */}
                              <button
                                type="button"
                                onClick={() => onViewActivityOnPublic(act.id)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                                title={isArchived ? "以管理員預覽模式開啟此已封存頁面" : "開啟公開招生頁"}
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                                <span className="hidden xl:inline">{isArchived ? '預覽頁面' : '開啟活動招生頁'}</span>
                              </button>

                              {/* 編輯活動 */}
                              <button
                                type="button"
                                onClick={() => handleEdit(act)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                                title="編輯活動基本資訊與行程"
                              >
                                <Edit className="w-3.5 h-3.5 text-orange-400" />
                                <span>編輯</span>
                              </button>

                              {/* 複製範本 */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTemplateId(act.id);
                                  setTemplateCustomTitle(`${act.title} (新梯次)`);
                                  setIsTemplatePickerOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                                title="複製此活動完整行程（可自訂新名稱，自動派發全新 Activity ID）"
                              >
                                <Copy className="w-3.5 h-3.5 text-orange-400" />
                                <span>複製範本</span>
                              </button>

                              {/* 封存 / 解除封存 */}
                              {isArchived ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnarchive(act)}
                                  className="px-2.5 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white rounded text-xs font-medium transition flex items-center gap-1 border border-purple-700 cursor-pointer"
                                  title="解除封存並重新於前台公開展示"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5 text-purple-300" />
                                  <span>解除封存</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setArchiveConfirmAct(act)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 rounded text-xs font-medium transition flex items-center gap-1 border border-slate-700 hover:border-purple-800 cursor-pointer"
                                  title="封存此已完登或已結束行程（前台完全隱藏，保留於後台日後參考與複製範本）"
                                >
                                  <Archive className="w-3.5 h-3.5 text-purple-400" />
                                  <span>封存</span>
                                </button>
                              )}

                              {/* 刪除活動 */}
                              <button
                                type="button"
                                onClick={() => setDeleteTargetActivity(act)}
                                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded text-xs font-semibold transition flex items-center gap-1 border border-red-800/60 cursor-pointer"
                                title="永久刪除此行程"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>刪除</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== 2. DETAILED INSPECTOR VIEW ==================== */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Sidebar Switcher */}
          <aside className="w-full lg:w-72 bg-[#0d1117] border-b lg:border-b-0 lg:border-r border-slate-800 p-4 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
                所有活動 ({activities.length})
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="p-1.5 bg-orange-600 rounded text-white hover:bg-orange-700 transition"
                  title="新增活動"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0">
              {activities.map((act) => {
                const isSelected = act.id === selectedActivityId;
                const isArchived = Boolean(act.isArchived || act.status === 'archived');
                return (
                  <div
                    key={act.id}
                    onClick={() => setSelectedActivityId(act.id)}
                    className={`p-3 rounded cursor-pointer transition whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink w-56 lg:w-full ${
                      isSelected
                        ? 'bg-slate-800 border-l-4 border-orange-500 rounded-r'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {act.title || '（未命名活動）'}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {isArchived ? (
                          <span title="已封存" className="text-purple-400">
                            <Archive className="w-3 h-3" />
                          </span>
                        ) : act.status === 'recruiting' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-mono">
                      <span>{act.id}</span>
                      <span>
                        {act.startDate && act.endDate
                          ? `${act.startDate.slice(5)} - ${act.endDate.slice(5)}`
                          : '未填日期 (前台隱藏)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800/80 hidden lg:block text-xs">
              <button
                type="button"
                onClick={() => setAdminViewMode('list')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs text-center font-medium transition cursor-pointer"
              >
                ← 返回活動總覽列表
              </button>
            </div>
          </aside>

          {/* Right Section: Inspector Details */}
          {selectedActivity ? (
            <section className="flex-1 flex flex-col overflow-hidden">
              {/* Top Inspector Bar */}
              <div className="p-4 sm:p-6 bg-[#0d1117] border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      {selectedActivity.title || '（未命名活動）'}
                    </h2>
                    {/* Prominent Date Range Badge beside Title */}
                    {hasValidDates(selectedActivity) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black font-mono rounded-lg bg-orange-950/90 text-orange-300 border-2 border-orange-500/80 shadow-md">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        {selectedActivity.startDate} ~ {selectedActivity.endDate}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-mono rounded-lg bg-amber-950/90 text-amber-300 border-2 border-amber-600/80 shadow-md">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        未填寫日期（前台完全隱藏）
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-orange-950/60 text-orange-400 border border-orange-800">
                      {selectedActivity.id}
                    </span>
                    {Boolean(selectedActivity.isArchived || selectedActivity.status === 'archived') ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-950/80 text-purple-300 border border-purple-800 flex items-center gap-1">
                        <Archive className="w-3 h-3 text-purple-400" />
                        已封存（前台隱藏）
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedActivity.status === 'recruiting'
                          ? '現正招生中'
                          : selectedActivity.status === 'full'
                          ? '已額滿'
                          : '籌辦截止'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    {selectedActivity.subtitle || '活動專屬獨立資料庫記錄'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewActivityOnPublic(selectedActivity.id)}
                    className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>
                      {selectedActivity.isArchived || !hasValidDates(selectedActivity)
                        ? '預覽活動頁 (前台隱藏中)'
                        : '開啟活動招生頁'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedActivity.id)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="複製公開網址"
                  >
                    <Link className="w-4 h-4 text-orange-400" />
                    <span>複製連結</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(selectedActivity)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 text-orange-500" />
                    <span>編輯活動</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(selectedActivity.id);
                      setTemplateCustomTitle(`${selectedActivity.title} (新梯次)`);
                      setIsTemplatePickerOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="以此活動完整行程複製為範本，建立新活動"
                  >
                    <Copy className="w-4 h-4 text-orange-400" />
                    <span>複製範本</span>
                  </button>

                  {Boolean(selectedActivity.isArchived || selectedActivity.status === 'archived') ? (
                    <button
                      type="button"
                      onClick={() => handleUnarchive(selectedActivity)}
                      className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white rounded text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-purple-700 cursor-pointer"
                      title="解除封存，重新在公開前台展示"
                    >
                      <ArchiveRestore className="w-4 h-4 text-purple-300" />
                      <span>解除封存</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setArchiveConfirmAct(selectedActivity)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 rounded text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-slate-700 hover:border-purple-800 cursor-pointer"
                      title="將已完登行程封存（前台隱藏，保留於後台）"
                    >
                      <Archive className="w-4 h-4 text-purple-400" />
                      <span>封存行程</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteTargetActivity(selectedActivity)}
                    className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 rounded text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border border-red-800/60 cursor-pointer"
                    title="永久刪除此行程"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>刪除行程</span>
                  </button>
                </div>
              </div>

              {/* Archive Banner Notice for Archived Activity */}
              {Boolean(selectedActivity.isArchived || selectedActivity.status === 'archived') && (
                <div className="bg-purple-950/60 border-b border-purple-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-200">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      此行程處於<b>「已封存」</b>狀態，前台已對遊客完全隱藏。完整數據妥善留存於後台，可供日後查閱或直接做為新梯次的複製範本。
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUnarchive(selectedActivity)}
                      className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>解除封存並重新上架</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(selectedActivity.id);
                        setTemplateCustomTitle(`${selectedActivity.title} (新梯次)`);
                        setIsTemplatePickerOpen(true);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-orange-300 font-bold rounded-lg transition flex items-center gap-1 border border-slate-700 cursor-pointer shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>複製為新活動範本</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Content Split: Details & Itinerary */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
                {/* Left Column: 4 Stat Boxes + Details Grid */}
                <div className="flex-[2] p-4 sm:p-6 flex flex-col gap-6">
                  {/* 4 Stat Boxes matching Professional Polish */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#161b22] p-4 rounded border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase mb-1">行程天數</div>
                      <div className="text-lg sm:text-xl font-bold text-white font-mono">
                        {selectedDays} 天 {selectedDays > 1 ? `${selectedDays - 1} 夜` : '單日'}
                      </div>
                    </div>

                    <div className="bg-[#161b22] p-4 rounded border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase mb-1 flex items-center justify-between">
                        <span>總步行預估</span>
                        {selectedActivity.itinerary?.some((d) => d.day === 0 || d.isTransitDay) && (
                          <span className="text-[10px] text-blue-400 font-medium bg-blue-950/60 px-1 py-0.2 rounded border border-blue-800/40">
                            不含 D0
                          </span>
                        )}
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white font-mono">
                        {selectedWalkTime} 小時
                      </div>
                    </div>

                    <div className="bg-[#161b22] p-4 rounded border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase mb-1">最高海拔</div>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {selectedActivity.maxAltitude || '3,349 m'}
                      </div>
                    </div>

                    <div className="bg-[#161b22] p-4 rounded border border-slate-800">
                      <div className="text-xs text-slate-500 uppercase mb-1 flex items-center justify-between">
                        <span>活動費用</span>
                        {selectedActivity.feeItems && selectedActivity.feeItems.length > 1 && (
                          <span className="text-[10px] text-orange-400 font-medium">共 {selectedActivity.feeItems.length} 種方案</span>
                        )}
                      </div>
                      {selectedActivity.feeItems && selectedActivity.feeItems.length > 1 ? (
                        <div className="space-y-1.5 mt-1.5">
                          {selectedActivity.feeItems.map((item, idx) => (
                            <div key={item.id || idx} className="flex justify-between items-center text-xs bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80">
                              <span className="text-slate-300 truncate pr-2 font-medium">{item.name || `方案 ${idx + 1}`}</span>
                              <span className="font-mono font-bold text-orange-400 shrink-0">NT$ {Number(item.amount || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-lg sm:text-xl font-bold text-orange-500 font-mono">
                          NT$ {Number(selectedActivity.fee || 0).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Information Box */}
                  <div className="bg-[#161b22] rounded border border-slate-800 flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        活動基本資訊
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleEdit(selectedActivity)}
                        className="text-xs text-orange-500 hover:underline"
                      >
                        修改欄位
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">活動 ID (唯一識別碼)</span>
                        <span className="font-mono text-orange-400 font-semibold">{selectedActivity.id}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">招生人數</span>
                        <span className="text-slate-200 font-medium font-mono">
                          {selectedActivity.maxParticipants} 人 (已報名 {selectedActivity.currentParticipants || 0} 人)
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">活動日期</span>
                        <span className="text-slate-200 font-mono">
                          {hasValidDates(selectedActivity)
                            ? `${selectedActivity.startDate} 至 ${selectedActivity.endDate}`
                            : '未填寫起訖日期（此行程於前台完全隱藏）'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">領隊 / 嚮導</span>
                        <span className="text-slate-200 font-medium">{selectedActivity.leader || '官方高山嚮導團隊'}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">集合地點與時間</span>
                        <span className="text-slate-200">
                          {selectedActivity.meetingLocation} ({selectedActivity.meetingTime})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">預估總里程</span>
                        <span className="text-slate-200 font-mono">{selectedActivity.distanceKm}</span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">活動簡述</span>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {selectedActivity.description}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">裝備與行前須知</span>
                        <p className="text-slate-300 text-xs whitespace-pre-line leading-relaxed font-mono bg-[#0d1117] p-3 rounded border border-slate-800">
                          {selectedActivity.gearNotice}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Day-by-Day Itinerary Preview */}
                <div className="flex-[3] p-4 sm:p-6 lg:border-l border-slate-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        行程時間表 ({selectedActivity.itinerary?.length || 0} 天)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        每日打卡點與預計耗時
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEdit(selectedActivity)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition"
                    >
                      編輯每日行程
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedActivity.itinerary?.map((day) => {
                      const isTransit = Boolean(day.isTransitDay || day.day === 0);
                      return (
                      <div
                        key={day.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isTransit
                            ? 'bg-[#0c1220] border-blue-900/60'
                            : 'bg-[#161b22] border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
                          <div className="flex items-center gap-2">
                            {isTransit ? (
                              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 font-bold text-xs rounded border border-blue-500/40 flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                <span>D0 交通日</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-orange-600/20 text-orange-400 font-bold text-xs rounded border border-orange-500/30">
                                Day {day.day}
                              </span>
                            )}
                            <span className="font-bold text-white text-sm">
                              {day.title || (isTransit ? 'D0 交通日（車程接駁／宿點整裝）' : `第 ${day.day} 天行程`)}
                            </span>
                          </div>
                          <span className={`text-xs font-mono ${isTransit ? 'text-blue-300' : 'text-slate-400'}`}>
                            {isTransit
                              ? `車程 ${day.estimatedHours || 0}h (不計入步程)`
                              : `預估 ${day.estimatedHours} 小時`}
                          </span>
                        </div>

                        {day.notes && (
                          <div className="text-xs text-slate-400 mb-3 bg-[#0d1117] px-3 py-1.5 rounded border border-slate-800/60">
                            {day.notes}
                          </div>
                        )}

                        <div className="space-y-2">
                          {day.checkpoints?.map((cp) => (
                            <div
                              key={cp.id}
                              className="flex items-start gap-2.5 text-xs"
                            >
                              <span className="font-mono text-orange-400 font-bold w-12 shrink-0 pt-0.5">
                                {cp.time}
                              </span>
                              <div className="flex-1">
                                <span className={`font-semibold ${cp.isHighlight ? 'text-orange-400 font-bold' : 'text-slate-200'}`}>
                                  {cp.location}
                                </span>
                                {cp.note && (
                                  <span className="text-slate-400 ml-2">
                                    — {cp.note}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              請從左側列表選擇活動或點擊右上角「新增活動」
            </div>
          )}
        </div>
      )}

      {/* Activity Editor Modal */}
      {isEditorOpen && editingActivity && (
        <ActivityEditorModal
          activity={editingActivity}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingActivity(null);
          }}
          onSave={(saved) => {
            handleSaveActivity(saved);
            setIsEditorOpen(false);
            setEditingActivity(null);
          }}
          onDelete={(actToDelete) => {
            setDeleteTargetActivity(actToDelete);
          }}
        />
      )}

      {/* Permanent Delete Confirmation Modal */}
      <DeleteConfirmModal
        activity={deleteTargetActivity}
        isOpen={Boolean(deleteTargetActivity)}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTargetActivity(null);
          }
        }}
        onConfirm={() => {
          if (deleteTargetActivity) {
            handleConfirmDelete(deleteTargetActivity);
          }
        }}
      />

      {/* Template Picker / New Activity Creation Modal */}
      {isTemplatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161b22] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0d1117]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    新增活動 - 選擇建立方式
                  </h3>
                  <p className="text-xs text-slate-400">
                    可從現有活動（包含已完登封存行程）複製完整時程範本，或建立全新空白行程
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTemplatePickerOpen(false);
                  setSelectedTemplateId('');
                  setTemplateCustomTitle('');
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Quick Choice Banner: Create Blank Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800 gap-3">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>建立全新空白活動</span>
                    <span className="text-[11px] font-normal text-slate-400">（從零開始手動規劃）</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    產生 1 天預設骨架，由您手動輸入自訂的活動名稱、集合時間與檢查點。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsTemplatePickerOpen(false);
                    handleCreateNew();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition shrink-0 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>建立空白活動</span>
                </button>
              </div>

              {/* Template Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 text-orange-400" />
                    <h4 className="text-sm font-bold text-white">
                      從現有活動複製行程範本 (推薦)
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      (共 {activities.length} 個行程可供參考)
                    </span>
                  </div>

                  {/* Search Template Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={templateSearchTerm}
                      onChange={(e) => setTemplateSearchTerm(e.target.value)}
                      placeholder="搜尋路線或活動..."
                      className="w-full bg-[#0d1117] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {activities
                    .filter((act) => {
                      if (!templateSearchTerm.trim()) return true;
                      const term = templateSearchTerm.toLowerCase();
                      return (
                        (act.title || '').toLowerCase().includes(term) ||
                        (act.subtitle && act.subtitle.toLowerCase().includes(term)) ||
                        act.id.toLowerCase().includes(term) ||
                        (act.difficulty && act.difficulty.toLowerCase().includes(term))
                      );
                    })
                    .map((act) => {
                      const days = getActivityDays(act);
                      const totalHours = calculateTotalHours(act.itinerary || []);
                      const isArchived = Boolean(act.isArchived || act.status === 'archived');
                      const isSelected = selectedTemplateId === act.id;
                      const checkpointCount = (act.itinerary || []).reduce(
                        (sum, d) => sum + (d.checkpoints?.length || 0),
                        0
                      );

                      return (
                        <div
                          key={act.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-orange-950/20 border-orange-500 shadow-lg'
                              : 'bg-[#0d1117] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-bold text-white text-sm">
                                  {act.title || '（未命名活動）'}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2 py-0.2 rounded">
                                  {act.id}
                                </span>
                                {isArchived ? (
                                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800 px-2 py-0.2 rounded flex items-center gap-1">
                                    <Archive className="w-2.5 h-2.5" />
                                    歷史封存行程
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.2 rounded">
                                    公開進行中
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mb-2">
                                {act.subtitle || '包含完整每日行程時間與檢查點'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {days} 天 {days > 1 ? `${days - 1} 夜` : '單日'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  總步程 {totalHours} 小時
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {checkpointCount} 個時程檢查點
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {act.difficulty || '百岳挑戰'}
                                </span>
                                {act.maxAltitude && (
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    標高 {act.maxAltitude}m
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTemplateId(act.id);
                                setTemplateCustomTitle(`${act.title} (新梯次)`);
                              }}
                              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-orange-600 text-white shadow'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                              <span>{isSelected ? '已選中此範本' : '選擇此範本'}</span>
                            </button>
                          </div>

                          {/* If selected, show customizable title input and instant duplicate button */}
                          {isSelected && (
                            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                              <div className="flex-1">
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  新活動名稱（可自訂新梯次標題）：
                                </label>
                                <input
                                  type="text"
                                  value={templateCustomTitle}
                                  onChange={(e) => setTemplateCustomTitle(e.target.value)}
                                  placeholder="請輸入新活動名稱..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDuplicateFromTemplate(act, templateCustomTitle)}
                                className="sm:self-end px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>確認複製並開啟編輯</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#0d1117] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsTemplatePickerOpen(false);
                  setSelectedTemplateId('');
                  setTemplateCustomTitle('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveConfirmAct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161b22] border border-purple-800/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-700 flex items-center justify-center text-purple-400">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">封存活動確認</h3>
                <p className="text-xs text-purple-300 font-mono">ID: {archiveConfirmAct.id}</p>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-xs space-y-2 text-slate-300">
              <p className="font-bold text-white text-sm">
                確定要將「{archiveConfirmAct.title || '未命名活動'}」封存？
              </p>
              <div className="space-y-1 text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                <p>• <b>前台完全隱藏</b>：一般訪客將無法在公開首頁與活動下拉選單看見此活動。</p>
                <p>• <b>完整保留歷史紀錄</b>：每日行程時間、步程與檢查點完整留存在後台。</p>
                <p>• <b>隨時複製或復原</b>：日後隨時可一鍵「解除封存」重新上架，或直接「以此複製為範本」。</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchiveConfirmAct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleArchive(archiveConfirmAct)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>確認封存 (前台隱藏)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
