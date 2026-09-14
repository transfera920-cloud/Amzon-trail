import React from 'react';
import { AlertTriangle, Trash2, Calendar, Clock, DollarSign, Loader2, X } from 'lucide-react';
import { Activity, getActivityDays } from '../types';

interface DeleteConfirmModalProps {
  activity: Activity | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  activity,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !activity) return null;

  const days = getActivityDays(activity);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md sm:max-w-lg bg-[#161b22] border-2 border-red-500/60 rounded-2xl p-6 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top subtle red alert line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/80 flex items-center justify-center shrink-0 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                確認永久刪除行程？
              </h3>
              <p className="text-xs text-red-400 font-medium mt-0.5">
                此操作將自 Cloud SQL 雲端資料庫永久抹除，無法復原
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity Details Card */}
        <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 mb-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2 py-0.5 rounded text-xs">
              {activity.id}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              難度：{activity.difficulty || '未指定'}
            </span>
          </div>

          <div className="text-base font-bold text-white">
            {activity.title}
          </div>

          {activity.subtitle && (
            <div className="text-xs text-slate-400 line-clamp-1">
              {activity.subtitle}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate">
                {activity.startDate && activity.endDate
                  ? `${activity.startDate} ~ ${activity.endDate}`
                  : '未設定日期'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{days} 天 {days > 1 ? `${days - 1} 夜` : '單日'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>NT$ {(activity.fee || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>狀態：{activity.status === 'recruiting' ? '招生中' : activity.status === 'full' ? '已額滿' : activity.isArchived ? '已封存' : '截止'}</span>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3.5 mb-6 text-xs text-red-300/90 leading-relaxed">
          <p className="font-bold text-red-300 mb-1.5 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            重要提醒：
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
            <li>刪除後，該活動之路程規劃、費用細項及備忘資訊將全數清除。</li>
            <li>前台遊客與後台管理介面將完全移除該行程。</li>
            <li>若您僅想在官網前台隱藏此行程，建議使用<strong className="text-purple-300 font-semibold">「封存行程」</strong>功能，資料仍可安全留存供日後複製範本。</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在從雲端刪除...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>確定永久刪除</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
