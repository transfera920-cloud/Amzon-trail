import React, { useMemo } from 'react';
import { Mountain, Compass, ShieldCheck, ChevronDown, LogIn, ExternalLink, Sparkles } from 'lucide-react';
import { Activity } from '../types';

interface HeaderProps {
  activities: Activity[];
  activeActivityId: string;
  onSelectActivity: (id: string) => void;
  currentView: 'public' | 'admin';
  onChangeView: (view: 'public' | 'admin') => void;
  isAdminLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activities,
  activeActivityId,
  onSelectActivity,
  currentView,
  onChangeView,
  isAdminLoggedIn,
}) => {
  // Sort activities chronologically by startDate
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const dateA = a.startDate || '';
      const dateB = b.startDate || '';
      return dateA.localeCompare(dateB);
    });
  }, [activities]);

  return (
    <header className="sticky top-0 z-40 bg-[#161b22] border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand matching Professional Polish */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onChangeView('public')}
            id="brand-logo-btn"
          >
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-orange-500 transition-colors shrink-0">
              A
            </div>
            <div className="flex items-baseline">
              <span className="text-lg md:text-xl font-bold tracking-tight text-white uppercase">
                亞馬遜國家山岳協會
              </span>
              <span className="text-slate-500 font-normal text-xs md:text-sm ml-2 hidden sm:inline">
                | 登山活動
              </span>
            </div>
          </div>

          {/* Navigation Links matching Professional Polish design */}
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="flex items-center gap-1 sm:gap-4 text-xs sm:text-sm font-medium">
              <button
                type="button"
                onClick={() => onChangeView('public')}
                className={`py-5 px-2 transition-colors border-b-2 ${
                  currentView === 'public'
                    ? 'text-orange-500 border-orange-500 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                公開網頁預覽
              </button>

              <button
                type="button"
                onClick={() => onChangeView('admin')}
                className={`py-5 px-2 transition-colors border-b-2 ${
                  currentView === 'admin'
                    ? 'text-orange-500 border-orange-500 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                後台管理
              </button>
            </nav>

            {/* Center Activity Selector (for public view) - Eye-catching & with clear Tips */}
            {currentView === 'public' && sortedActivities.length > 0 && (
              <div className="hidden md:flex items-center gap-2.5">
                {/* Visual Hint Badge */}
                <div className="relative group">
                  <div className="flex items-center gap-2 bg-[#161b22] hover:bg-[#1a202c] border-2 border-orange-500/70 hover:border-orange-400 rounded-xl px-3 py-1.5 shadow-lg shadow-orange-950/40 transition-all duration-200">
                    <Compass className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-xs text-orange-300 font-bold shrink-0 hidden sm:inline">近期行程：</span>

                    {/* Prominent Dropdown sorted by date */}
                    <div className="relative flex items-center">
                      <select
                        id="header-activity-select"
                        value={activeActivityId}
                        onChange={(e) => onSelectActivity(e.target.value)}
                        aria-label="選擇活動"
                        className="bg-transparent text-xs sm:text-sm text-white font-bold pr-7 pl-1 py-0.5 focus:outline-none cursor-pointer appearance-none max-w-[190px] lg:max-w-[240px] xl:max-w-[280px] truncate"
                      >
                        {sortedActivities.map((act) => (
                          <option key={act.id} value={act.id} className="bg-[#161b22] text-white py-1">
                            {act.title || '（未命名活動）'} {act.startDate && act.endDate ? `(${act.startDate} ~ ${act.endDate})` : '(未排定日期)'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-orange-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:scale-110" />
                    </div>

                    {/* Activity Count Pill */}
                    {sortedActivities.length > 1 && (
                      <span className="hidden lg:inline-flex text-[10px] font-bold text-orange-300 bg-orange-950/80 px-1.5 py-0.5 rounded border border-orange-500/40 shrink-0">
                        共 {sortedActivities.length} 場
                      </span>
                    )}
                  </div>

                  {/* Pulsing Hint Tooltip / Badge */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden xl:flex items-center pointer-events-none z-50 whitespace-nowrap">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold text-amber-200 bg-amber-950/95 border border-amber-500/50 rounded-full shadow-lg animate-pulse">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      提示：點擊下拉可切換活動
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status indicator when admin is logged in (no duplicate button) */}
            {isAdminLoggedIn && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-full font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>管理員模式</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-selector when on public view - Prominent with visual hint */}
        {currentView === 'public' && sortedActivities.length > 0 && (
          <div className="md:hidden py-2 px-3 border-t border-slate-800 bg-[#0d1117] flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <Compass className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs text-orange-300 font-bold">近期行程：</span>
            </div>
            <div className="relative flex-1 max-w-[230px]">
              <select
                id="header-mobile-activity-select"
                value={activeActivityId}
                onChange={(e) => onSelectActivity(e.target.value)}
                aria-label="選擇活動"
                className="w-full bg-[#161b22] text-xs text-orange-200 font-bold border border-orange-500/60 rounded-lg px-2.5 py-1 pr-6 focus:outline-none appearance-none truncate shadow-sm"
              >
                {sortedActivities.map((act) => (
                  <option key={act.id} value={act.id} className="bg-[#161b22] text-white">
                    {act.title || '（未命名活動）'} {act.startDate && act.endDate ? `(${act.startDate} ~ ${act.endDate})` : '(未排定日期)'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-orange-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
