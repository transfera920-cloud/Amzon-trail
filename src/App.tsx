import React, { useState, useEffect, useCallback } from 'react';
import { Activity } from './types';
import {
  loadActivities,
  saveActivities,
  fetchActivitiesFromCloud,
  checkAdminAuth,
  setAdminAuth,
  getSavedActiveActivityId,
  setSavedActiveActivityId,
  getActivityPublicUrl
} from './utils/storage';
import { Header } from './components/Header';
import { PublicActivityView } from './components/PublicActivityView';
import { AdminPortal } from './components/AdminPortal';
import { useActivitySeo } from './utils/useActivitySeo';
import { hasValidDates } from './utils/seo';
import { Mountain, MessageCircle, ShieldCheck, Mail, Phone, MapPin, Compass, ExternalLink } from 'lucide-react';

/**
 * Parse route from browser location supporting pathname, hash, and search params.
 * e.g. /activity/activity_001 or ?activity=activity_001
 */
function parseLocation(): { activityId?: string; view?: 'public' | 'admin' } {
  if (typeof window === 'undefined') return {};
  
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const params = new URLSearchParams(window.location.search);

  let activityId: string | undefined;
  let view: 'public' | 'admin' | undefined;

  // 1. Path match: /activity/activity_001 or /activity/123
  const pathMatch = pathname.match(/\/activity\/([^/?#]+)/i);
  if (pathMatch) {
    activityId = pathMatch[1];
  } else if (pathname.startsWith('/admin')) {
    view = 'admin';
  }

  // 2. Hash match: #/activity/activity_001
  if (!activityId) {
    const hashMatch = hash.match(/#\/?activity\/([^/?#]+)/i);
    if (hashMatch) {
      activityId = hashMatch[1];
    } else if (hash.includes('admin')) {
      view = 'admin';
    }
  }

  // 3. Query params: ?activity=activity_001
  if (!activityId && params.get('activity')) {
    activityId = params.get('activity') || undefined;
  }

  if (!view && params.get('view') === 'admin') {
    view = 'admin';
  }

  // Map legacy ID if found
  if (activityId === 'nenggao-andongjun') {
    activityId = 'activity_001';
  }

  return { activityId, view };
}

export default function App() {
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities());

  const [activeActivityId, setActiveActivityId] = useState<string>(() => {
    const route = parseLocation();
    if (route.activityId) return route.activityId;

    const savedId = getSavedActiveActivityId();
    if (savedId && savedId !== 'nenggao-andongjun') return savedId;

    return 'activity_001';
  });

  const [currentView, setCurrentView] = useState<'public' | 'admin'>(() => {
    const route = parseLocation();
    return route.view === 'admin' ? 'admin' : 'public';
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => checkAdminAuth());
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Cloud Synchronization: Fetch latest activities from shared Cloud database
  const syncWithCloud = useCallback(async () => {
    try {
      setIsCloudSyncing(true);
      const cloudActivities = await fetchActivitiesFromCloud();
      if (cloudActivities && cloudActivities.length > 0) {
        setActivities(cloudActivities);
      }
    } catch (err) {
      console.warn('[App] Background cloud sync error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  // 1. Initial cloud fetch on page load (ensures mobile receives latest PC edits)
  useEffect(() => {
    syncWithCloud();
  }, [syncWithCloud]);

  // 2. Refresh when mobile browser or PC tab is refocused / unhidden
  useEffect(() => {
    const handleFocus = () => syncWithCloud();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithCloud();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Periodic polling every 15 seconds to keep devices synchronized in real time
    const timer = setInterval(syncWithCloud, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(timer);
    };
  }, [syncWithCloud]);

  // 4. Listen for immediate local updates
  useEffect(() => {
    const handleLocalUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setActivities(e.detail);
      }
    };
    window.addEventListener('amazon_activities_changed', handleLocalUpdate);
    return () => window.removeEventListener('amazon_activities_changed', handleLocalUpdate);
  }, []);

  // Keep active activity synchronized with available activities list
  useEffect(() => {
    if (activities.length > 0) {
      const exists = activities.some((a) => a.id === activeActivityId);
      if (!exists) {
        // Default to activity_001 if available, otherwise first activity
        const fallback = activities.find((a) => a.id === 'activity_001') || activities[0];
        setActiveActivityId(fallback.id);
      }
    }
  }, [activities, activeActivityId]);

  // Sync URL state whenever activeActivityId or currentView changes
  const updateUrl = useCallback((actId: string, view: 'public' | 'admin') => {
    setSavedActiveActivityId(actId);
    try {
      const newPath = `/activity/${actId}${view === 'admin' ? '?view=admin' : ''}`;
      // Only pushState if URL changed to avoid spamming history
      const currentFull = window.location.pathname + window.location.search;
      if (currentFull !== newPath) {
        window.history.pushState({ activityId: actId, view }, '', newPath);
      }
    } catch {
      // Fallback for sandboxed if pushState is restricted
    }
  }, []);

  useEffect(() => {
    updateUrl(activeActivityId, currentView);
  }, [activeActivityId, currentView, updateUrl]);

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = parseLocation();
      if (route.activityId) {
        setActiveActivityId(route.activityId);
      }
      if (route.view) {
        setCurrentView(route.view);
      } else {
        setCurrentView('public');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 前台「目前招生活動列表」（僅包含已排定有效日期且未封存的活動）
  const recruitingActivities = activities.filter(
    (a) => !a.isArchived && a.status !== 'archived' && hasValidDates(a)
  );

  // 所有非封存活動（包含未排定日期的活動，其專屬頁與 SEO 均正常開放）
  const unarchivedActivities = activities.filter(
    (a) => !a.isArchived && a.status !== 'archived'
  );

  // 檢查目前指定活動之狀態
  const currentRequestedActivity = activities.find((a) => a.id === activeActivityId);
  const isCurrentActivityArchived = Boolean(
    currentRequestedActivity &&
      (currentRequestedActivity.isArchived || currentRequestedActivity.status === 'archived')
  );
  const isCurrentActivityMissingDates = Boolean(
    currentRequestedActivity && !hasValidDates(currentRequestedActivity)
  );

  // 檢查是否在 URL 顯式請求了某個活動 ID，但該 ID 不存在於 activities 資料庫中
  const isRequestedActivityNotFound = Boolean(
    activeActivityId && activities.length > 0 && !currentRequestedActivity
  );

  // 決定目前顯示之活動實體：
  // 1. 後台模式：直接顯示指定或第一筆活動
  // 2. 已登入管理員：可檢視任意活動（含封存與未定日期）
  // 3. 一般訪客：
  //    - 若指定活動為不存在：回傳 null 顯示 404 Not Found（嚴禁 fallback 至其他活動）
  //    - 若指定活動為已封存：由封存通知畫面處理
  //    - 若指定活動為正常（不論是否有日期）：均正常顯示專屬活動頁
  //    - 若未指定或首頁根目錄：優先以招生活動為主，無招生活動則顯示首筆未封存活動
  const activeActivity =
    currentView === 'admin'
      ? activities.find((a) => a.id === activeActivityId) || activities[0] || null
      : isAdminLoggedIn
      ? activities.find((a) => a.id === activeActivityId) || recruitingActivities[0] || activities[0] || null
      : isRequestedActivityNotFound || isCurrentActivityArchived
      ? null
      : currentRequestedActivity || (activeActivityId ? null : recruitingActivities[0] || unarchivedActivities[0] || null);

  // 同步執行 SEO 標題、Meta 描述、標準網址與 JSON-LD 結構化資料更新
  useActivitySeo(activeActivity, currentView);

  const handleSelectActivity = (id: string) => {
    setActiveActivityId(id);
    updateUrl(id, currentView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewActivityOnPublic = (id: string) => {
    setActiveActivityId(id);
    setCurrentView('public');
    updateUrl(id, 'public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateActivities = (updated: Activity[]) => {
    setActivities(updated);
    saveActivities(updated);
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
  };

  const handleLogout = () => {
    setAdminAuth(false);
    setIsAdminLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-300 flex flex-col font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden w-full">
      {/* Universal Header - 前台選單僅列出目前排定日期之招生活動，管理者則列出全部 */}
      <Header
        activities={currentView === 'public' ? recruitingActivities : activities}
        activeActivityId={activeActivity ? activeActivity.id : activeActivityId}
        onSelectActivity={handleSelectActivity}
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          if (view === 'public' && isCurrentActivityArchived && recruitingActivities.length > 0) {
            setActiveActivityId(recruitingActivities[0].id);
            updateUrl(recruitingActivities[0].id, 'public');
          } else {
            updateUrl(activeActivityId, view);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-full min-w-0">
        {currentView === 'public' ? (
          isRequestedActivityNotFound ? (
            /* 404 Not Found Notice when visitor navigates to an invalid/non-existent activity ID */
            <div className="max-w-xl mx-auto px-4 py-20 text-center">
              <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-4">
                <div className="w-12 h-12 bg-rose-950/80 border border-rose-800/80 rounded-full flex items-center justify-center mx-auto text-rose-400 text-xl font-bold">
                  ⚠️
                </div>
                <div className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-full">
                  404 NOT FOUND
                </div>
                <h2 className="text-xl font-bold text-white">找不到此活動行程</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  您所查詢的活動識別碼「<span className="text-orange-400 font-mono font-semibold">{activeActivityId}</span>」不存在於系統資料庫或已被移除。
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (recruitingActivities.length > 0) {
                        handleSelectActivity(recruitingActivities[0].id);
                      } else {
                        window.location.href = '/';
                      }
                    }}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition shadow cursor-pointer"
                  >
                    返回首頁瀏覽最新活動
                  </button>
                </div>
              </div>
            </div>
          ) : isCurrentActivityArchived && !isAdminLoggedIn ? (
            /* Archived Notice for Visitors attempting to access an archived activity directly */
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
              <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-4">
                <div className="w-12 h-12 bg-purple-950/80 border border-purple-800/80 rounded-full flex items-center justify-center mx-auto text-purple-400 text-xl font-bold">
                  📦
                </div>
                <h2 className="text-xl font-bold text-white">此登山活動已完登封存</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  您所查詢的活動行程已圓滿結束並由主辦單位移入封存資料庫，前台已停止對外展示與招生。
                </p>
                {recruitingActivities.length > 0 ? (
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => handleSelectActivity(recruitingActivities[0].id)}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition shadow cursor-pointer"
                    >
                      瀏覽現正招生活動：{recruitingActivities[0].title}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">目前尚無其他公開活動</div>
                )}
              </div>
            </div>
          ) : activeActivity ? (
            <div>
              {/* If Admin is viewing an archived activity in public view */}
              {isCurrentActivityArchived && isAdminLoggedIn && (
                <div className="bg-purple-950/90 border-b border-purple-800 text-purple-200 text-xs px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold bg-purple-900 px-2 py-0.5 rounded border border-purple-700">管理員預覽</span>
                    <span>此活動已設定為「已封存」，一般訪客在前台不可見此頁面。</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('admin')}
                    className="underline text-purple-300 hover:text-white ml-2 cursor-pointer"
                  >
                    返回後台管理
                  </button>
                </div>
              )}
              {/* If Admin is viewing an activity with missing dates in public view */}
              {isCurrentActivityMissingDates && isAdminLoggedIn && (
                <div className="bg-amber-950/90 border-b border-amber-800 text-amber-200 text-xs px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold bg-amber-900 px-2 py-0.5 rounded border border-amber-700">管理員提示</span>
                    <span>此活動目前未排定日期，前台招生列表暫不列出，但專屬詳細頁正常開放瀏覽與收錄。</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('admin')}
                    className="underline text-amber-300 hover:text-white ml-2 cursor-pointer"
                  >
                    前往後台排定日期
                  </button>
                </div>
              )}
              <PublicActivityView
                activity={activeActivity}
                activities={recruitingActivities}
                onSelectActivity={handleSelectActivity}
                onOpenAdmin={() => {
                  setCurrentView('admin');
                  updateUrl(activeActivity.id, 'admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">目前尚無活動資料</div>
          )
        ) : (
          <AdminPortal
            activities={activities}
            onUpdateActivities={handleUpdateActivities}
            onViewActivityOnPublic={handleViewActivityOnPublic}
            isAdminLoggedIn={isAdminLoggedIn}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Professional Polish Footer */}
      <footer className="bg-[#161b22] border-t border-slate-700 py-6 sm:py-8 px-4 sm:px-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              A
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight uppercase">
                亞馬遜國家山岳協會 <span className="text-slate-500 font-normal text-xs ml-1">| 登山活動招生管理系統</span>
              </div>
              <div className="text-[11px] text-slate-500 tracking-wider uppercase">
                Amazon National Mountain Association Management System v1.1.0
              </div>
            </div>
          </div>

          {/* Quick Active Activity Status */}
          {activeActivity && (
            <div className="flex items-center gap-2 text-xs bg-[#0d1117] border border-slate-800 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">目前預覽活動：</span>
              <span className="font-semibold text-white">{activeActivity.title}</span>
              <span className="font-mono text-orange-400 text-[11px]">({activeActivity.id})</span>
            </div>
          )}

          <div className="flex items-center gap-6 text-slate-400">
            <span className="text-slate-500">
              © {new Date().getFullYear()} 亞馬遜國家山岳協會. 系統已啟用多活動獨立架構.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
