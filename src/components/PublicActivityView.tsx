import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  Compass,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Mountain,
  Video,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  Share2,
  PhoneCall,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Copy,
  Info,
  HelpCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Activity, calculateDays, calculateTotalHours, getActivityDays, DEFAULT_LINE_URL } from '../types';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl, extractYouTubeId } from '../utils/youtube';
import { ItineraryTimeline } from './ItineraryTimeline';

interface PublicActivityViewProps {
  activity: Activity;
  onOpenAdmin: () => void;
  activities?: Activity[];
  onSelectActivity?: (id: string) => void;
}

export const PublicActivityView: React.FC<PublicActivityViewProps> = ({
  activity,
  onOpenAdmin,
  activities,
  onSelectActivity,
}) => {
  const [copied, setCopied] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);

  // Auto-calculated or manually specified days
  const calculatedDays = getActivityDays(activity);
  const totalWalkingHours = calculateTotalHours(activity.itinerary);
  const hasDates = Boolean(
    activity.startDate &&
    activity.startDate.trim() !== '' &&
    activity.endDate &&
    activity.endDate.trim() !== ''
  );

  // 固定官方 LINE 諮詢超連結 (固定為 https://lin.ee/64ollTa)
  const officialLineConsultUrl = DEFAULT_LINE_URL;

  // 活動專屬 LINE 群組連結 (後台輸入後，前台「LINE 立即報名」直接導向此群組；若未填寫則自動連至官方客服)
  const registrationLineUrl = (activity.lineGroupUrl && activity.lineGroupUrl.trim()) || DEFAULT_LINE_URL;

  // Robust YouTube URL processing (plays smoothly on Desktop & Mobile browsers)
  const embedUrl = getYouTubeEmbedUrl(activity.videoUrl);
  const watchUrl = getYouTubeWatchUrl(activity.videoUrl);
  const videoId = extractYouTubeId(activity.videoUrl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 依出發日期排序近期行程（與導覽列下拉選單之活動篩選與排序邏輯完全一致）
  const sortedActivities = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    return [...activities].sort((a, b) => {
      const dateA = a.startDate || '';
      const dateB = b.startDate || '';
      return dateA.localeCompare(dateB);
    });
  }, [activities]);

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-200 pb-28 md:pb-16">
      {/* 近期行程 直接陳列選擇區塊 */}
      {sortedActivities.length > 0 && (
        <section
          id="recent-activities-section"
          aria-label="近期行程直接選擇區塊"
          className="border-b border-slate-800 bg-[#0d1117] py-6 sm:py-7 px-4 sm:px-6 lg:px-8 relative z-20"
        >
          <div className="max-w-7xl mx-auto">
            {/* 區塊標題 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      近期行程
                    </h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30">
                      現正招生 {sortedActivities.length} 場
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    直接點擊下方行程卡片即可切換瀏覽該登山行程與詳細資訊
                  </p>
                </div>
              </div>
            </div>

            {/* 卡片網格：桌機多欄排列，手機自動響應式排列無橫向捲軸 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {sortedActivities.map((act) => {
                const isActive = act.id === activity.id;
                const actDays = getActivityDays(act);
                return (
                  <a
                    key={act.id}
                    id={`recent-activity-card-${act.id}`}
                    href={`/activity/${act.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSelectActivity) {
                        onSelectActivity(act.id);
                      }
                    }}
                    className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#1a202c] border-orange-500 shadow-lg shadow-orange-950/40 ring-1 ring-orange-500/60'
                        : 'bg-[#161b22] hover:bg-[#1c222b] border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* 上方：狀態標籤與天數 */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            act.status === 'full'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : act.status === 'closed'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              act.status === 'full'
                                ? 'bg-rose-400'
                                : act.status === 'closed'
                                ? 'bg-slate-400'
                                : 'bg-emerald-400 animate-pulse'
                            }`}
                          />
                          {act.status === 'full' ? '已額滿' : act.status === 'closed' ? '已截止' : '招生中'}
                        </span>

                        {isActive ? (
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-950/80 border border-orange-500/50 px-1.5 py-0.5 rounded">
                            目前瀏覽中
                          </span>
                        ) : (
                          actDays > 0 && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {actDays} 天 {actDays > 1 ? `${actDays - 1} 夜` : '單日'}
                            </span>
                          )
                        )}
                      </div>

                      {/* 中間：活動標題 */}
                      <h3 className={`font-bold text-sm sm:text-base leading-snug line-clamp-2 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-100 group-hover:text-orange-400'
                      }`}>
                        {act.title}
                      </h3>

                      {/* 日期 */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-2 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span>{act.startDate} ~ {act.endDate}</span>
                      </div>
                    </div>

                    {/* 下方：費用與查看行程按鈕 */}
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">
                        {act.fee ? `NT$ ${Number(act.fee).toLocaleString()}` : ''}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold transition-all ${
                        isActive ? 'text-orange-400' : 'text-orange-400 group-hover:text-orange-300'
                      }`}>
                        查看行程
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Hero Banner Section */}
      <div className="relative overflow-hidden border-b border-slate-800">
        {/* Background Image with mountain gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={activity.coverImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80'}
            alt={activity.title}
            className="w-full h-full object-cover opacity-20 filter brightness-75 scale-105 transform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e12] via-[#0c0e12]/85 to-transparent" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#0c0e12]/60 to-[#0c0e12]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-14 md:pb-16">
          {/* Title & Meta Cluster: 招生進度、行程及日期擺在一起，大小與原本一致，不蓋過主題 */}
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {activity.title}
              </h1>

              {/* 招生進度與行程及日期 擺在一起 (大小與原本相同，精緻適中) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. 招生進度 */}
                {hasDates ? (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm ${
                      activity.status === 'full'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : activity.status === 'closed'
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                    title="活動招生進度"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        activity.status === 'full'
                          ? 'bg-rose-400'
                          : activity.status === 'closed'
                          ? 'bg-slate-400'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    <span>
                      {activity.status === 'recruiting' ? '招生中' : activity.status === 'full' ? '已額滿' : '已截止'}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono">
                      {activity.currentParticipants || 0}/{activity.maxParticipants || 12} 人
                      {activity.status === 'recruiting' && activity.maxParticipants > (activity.currentParticipants || 0) && (
                        <span className="text-emerald-400 ml-1">
                          (餘 {activity.maxParticipants - (activity.currentParticipants || 0)})
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm bg-amber-500/10 text-amber-300 border-amber-500/30"
                    title="活動尚未排定日期"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                    <span>未定日期（籌備中）</span>
                    <span className="text-amber-500/70">·</span>
                    <span className="text-amber-200/80">敬請留意公告</span>
                  </div>
                )}

                {/* 2. 行程天數與難度 */}
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#161b22] text-slate-200 border border-slate-700 shadow-sm"
                  title="行程規劃與難度"
                >
                  <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="font-bold font-mono">
                    {calculatedDays > 0 ? `${calculatedDays} 天 ${calculatedDays > 1 ? `${calculatedDays - 1} 夜` : '單日'}` : '行程規劃中'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-300">{activity.difficulty || '百岳高級挑戰'}</span>
                </div>

                {/* 3. 活動日期區間 */}
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/30 shadow-sm"
                  title="活動日期區間"
                >
                  <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="font-mono font-bold text-white tracking-wide">
                    {hasDates
                      ? `${activity.startDate} ~ ${activity.endDate}`
                      : '目前尚未安排活動日期，敬請留意後續活動公告。'}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-1 text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">
              {activity.subtitle || '中央山脈高山草原、水鹿聚落與金色高山湖泊之極致巡禮'}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3.5 flex flex-col hover:border-slate-700 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" /> 行程天數
              </span>
              <span className="text-lg md:text-xl font-bold text-white font-mono mt-1">
                {calculatedDays > 0 ? `${calculatedDays} 天` : (activity.days ? `${activity.days} 天` : '待定')}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 truncate">
                {hasDates
                  ? `${activity.startDate} ~ ${activity.endDate}`
                  : '目前尚未安排活動日期'}
              </span>
            </div>

            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3.5 flex flex-col hover:border-slate-700 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-orange-400" /> 預計里程
              </span>
              <span className="text-lg md:text-xl font-bold text-white font-mono mt-1">
                {activity.distanceKm || '約 52 km'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">實測GPS航跡</span>
            </div>

            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3.5 flex flex-col hover:border-slate-700 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> 累積爬升
              </span>
              <span className="text-lg md:text-xl font-bold text-orange-400 font-mono mt-1">
                {activity.elevationGain || '+3,850 m'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">總上坡高度</span>
            </div>

            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3.5 flex flex-col hover:border-slate-700 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> 累積下降
              </span>
              <span className="text-lg md:text-xl font-bold text-amber-400 font-mono mt-1">
                {activity.elevationLoss || '-4,200 m'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">總下坡高度</span>
            </div>

            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3.5 flex flex-col hover:border-slate-700 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-orange-400" /> 最高海拔
              </span>
              <span className="text-lg md:text-xl font-bold text-white font-mono mt-1">
                {activity.maxAltitude || '3,349 m'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">全稜脊樑最高點</span>
            </div>

            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3.5 flex flex-col hover:border-slate-700 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" /> 預估總步程
              </span>
              <span className="text-lg md:text-xl font-bold text-white font-mono mt-1">
                {totalWalkingHours} 小時
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {activity.itinerary?.some((d) => d.day === 0 || d.isTransitDay) ? '各日加總(排除D0交通日)' : '各日加總推估'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (8 cols): Description, Itinerary, Media, Notes */}
          <div className="lg:col-span-8 min-w-0 space-y-8">

            {/* Core Overview & Description */}
            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  活動特色介紹
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-[#0c0e12] hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copied ? '已複製連結' : '分享活動'}
                  </button>
                </div>
              </div>

              <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {activity.description || '能高安東軍縱走為台灣最著名的經典高山百岳縱走路線之一。沿途飽覽能高主山、能高南峰、光頭山、白石山、安東軍山等百岳，並深入白石池、萬里池、屯鹿池等珍貴高山天然湖泊，常能遇見成群野生水鹿棲息，景色絕美壯麗。'}
              </div>

              {/* Recruitment Progress Bar */}
              {hasDates ? (
                <div className="mt-6 pt-5 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <span className="text-slate-400 font-medium">招生進度：</span>
                    <span className="text-white font-bold">
                      已報名 <span className="text-orange-400 font-mono">{activity.currentParticipants || 0}</span> / 限額 <span className="font-mono">{activity.maxParticipants || 12}</span> 人
                      {activity.maxParticipants > (activity.currentParticipants || 0) ? (
                        <span className="text-orange-400 ml-1.5 font-normal">
                          (尚餘 {activity.maxParticipants - (activity.currentParticipants || 0)} 名額)
                        </span>
                      ) : (
                        <span className="text-amber-400 ml-1.5 font-normal">(已額滿候補中)</span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#0c0e12] rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round(((activity.currentParticipants || 0) / (activity.maxParticipants || 12)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-6 pt-5 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs sm:text-sm p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>目前尚未安排活動日期，敬請留意後續活動公告。</span>
                    </span>
                    <a
                      href={officialLineConsultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold underline shrink-0 ml-2"
                    >
                      LINE 洽詢出隊
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Video Section (活動影音紀實) */}
            {activity.videoUrl && (
              <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5 flex-wrap gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-red-500" />
                    <span>活動路線影音紀實</span>
                    <span className="text-xs font-normal text-slate-400 font-mono hidden sm:inline">
                      {videoId ? `(ID: ${videoId})` : ''}
                    </span>
                  </h2>
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 font-medium bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
                  >
                    <span>在 YouTube 開啟觀看</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {embedUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black shadow-lg">
                      <iframe
                        src={embedUrl}
                        title={`${activity.title} 路線實況影音`}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Mobile & Desktop Fallback notice bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 bg-[#0c0e12] p-3 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        若手機或瀏覽器安全設定限制內嵌播放，請直接點擊：
                      </span>
                      <a
                        href={watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        開啟 YouTube App / 網頁播放 <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-[#0c0e12] border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">點擊觀看高畫質登山影片</div>
                        <div className="text-xs text-slate-400 truncate max-w-md font-mono">{activity.videoUrl}</div>
                      </div>
                    </div>
                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>在 YouTube 開啟</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Day 1 -> Day N Itinerary Timeline (行程表) */}
            <ItineraryTimeline itinerary={activity.itinerary} />

            {/* Equipment & Important Notices */}
            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800 mb-5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                行前必備裝備與安全須知
              </h2>

              <div className="space-y-4 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {activity.gearNotice || (
                  `1. 個人重裝登山裝備：需具備高山舒適溫度 -5°C 睡袋、充氣或蛋巢睡墊、高抗風雙人或單人帳篷（由協會公裝統籌分配或自備）。
2. 兩截式登山防雨衣褲：嚴禁輕便雨衣；山區午後雷陣雨或風強溫低，防水保暖為生命安全第一道防線。
3. 涉溪裝備：本行程包含萬大南溪涉溪路段，請備妥水陸兩用溯溪鞋與備用排汗襪。
4. 頭燈與備用電池：頭燈必須隨身攜帶，禁止使用手機手電筒替代。
5. 體能要求：此為高級縱走路線，每日行進步程約 7～13 小時，報名前請自主進行重裝爬樓梯或郊山負重鍛鍊。`
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Info Card & LINE CTA */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Main Booking Card */}
              <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl">
                <div className="pb-5 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400 font-medium">活動報名費用</span>
                    {activity.feeItems && activity.feeItems.length > 1 && (
                      <span className="text-[11px] font-bold text-orange-400 bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded-full">
                        共 {activity.feeItems.length} 種方案
                      </span>
                    )}
                  </div>

                  {/* 多費用項目清單或單一費用展示 */}
                  {activity.feeItems && activity.feeItems.length > 0 && (activity.feeItems.length > 1 || (activity.feeItems[0].name && activity.feeItems[0].name.trim() !== '')) ? (
                    <div className="space-y-2 mt-2">
                      {activity.feeItems.map((item, idx) => (
                        <div
                          key={item.id || `fee-disp-${idx}`}
                          className="flex items-center justify-between bg-[#0d1117] border border-slate-800/90 rounded-xl p-2.5 px-3 hover:border-slate-700 transition-colors"
                        >
                          <span className="text-xs sm:text-sm font-bold text-slate-200 truncate pr-2">
                            {item.name || `費用方案 ${idx + 1}`}
                          </span>
                          <div className="flex items-baseline gap-1 shrink-0 font-mono">
                            <span className="text-base sm:text-lg font-black text-orange-400">
                              NT$ {Number(item.amount || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">/人</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-orange-400 font-mono">
                        NT$ {Number(activity.fee || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">/ 每人</span>
                    </div>
                  )}

                  {activity.feeNote && (
                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-[#0c0e12] p-2.5 rounded-lg border border-slate-800">
                      {activity.feeNote}
                    </p>
                  )}
                </div>

                {/* Specifics list */}
                <div className="py-5 space-y-4 text-xs sm:text-sm border-b border-slate-800">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 text-xs">活動起訖日期</div>
                      <div className="text-slate-100 font-semibold font-mono text-xs sm:text-sm">
                        {hasDates
                          ? `${activity.startDate} 至 ${activity.endDate}`
                          : '目前尚未安排活動日期，敬請留意後續活動公告。'}
                      </div>
                      <div className="text-[11px] text-orange-400 font-medium mt-0.5">
                        {hasDates && calculatedDays > 0
                          ? `共 ${calculatedDays} 天行程（依日期自動換算）`
                          : (activity.days ? `行程規劃天數：${activity.days} 天` : '待排定出隊日期')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 text-xs">專業領隊嚮導</div>
                      <div className="text-slate-100 font-semibold">
                        {activity.leader || '亞馬遜國家山岳協會特派領隊'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 text-xs">招募人數配額</div>
                      <div className="text-slate-100 font-semibold">
                        上限 {activity.maxParticipants || 12} 人（精緻小隊高規格安全）
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 text-xs">集合地點</div>
                      <div className="text-slate-100 font-semibold">
                        {activity.meetingLocation || '台中烏日高鐵站'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 text-xs">集合時間</div>
                      <div className="text-slate-100 font-semibold">
                        {activity.meetingTime || '07:30 準時集合出發'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary LINE Call-to-action Buttons */}
                <div className="pt-5 space-y-3">
                  {/* Button 1: LINE 立即報名 / LINE 洽詢活動 */}
                  <a
                    id="btn-line-registration-desktop"
                    href={registrationLineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-base rounded-xl shadow-lg shadow-[#06C755]/20 hover:shadow-[#06C755]/30 transition-all transform active:scale-95 cursor-pointer"
                    title={hasDates ? (activity.lineGroupUrl ? '點擊加入本活動專屬 LINE 群組立即報名' : '點擊前往 LINE 官方報名') : '此活動尚未排定日期，歡迎點擊前往 LINE 官方洽詢或追蹤後續開團公告'}
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>{hasDates ? 'LINE 立即報名' : 'LINE 洽詢活動 / 留意公告'}</span>
                    {hasDates && activity.lineGroupUrl && (
                      <span className="text-[10px] bg-black/20 text-white font-medium px-2 py-0.5 rounded-full">
                        專屬群組
                      </span>
                    )}
                  </a>

                  {/* Button 2: 報名諮詢與常見問答（固定為 https://lin.ee/64ollTa） */}
                  <a
                    id="btn-line-consultation-link"
                    href={officialLineConsultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white bg-[#1a2230] hover:bg-[#222d40] rounded-xl border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-center gap-2 group shadow-sm cursor-pointer"
                    title="點擊前往 LINE 官方帳號進行報名諮詢與常見問答 (https://lin.ee/64ollTa)"
                  >
                    <MessageCircle className="w-4 h-4 text-[#06C755] group-hover:scale-110 transition-transform" />
                    <span>報名諮詢與常見問答</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                  </a>

                  {/* Button 3: 查看常見登山 Q&A 彈窗 */}
                  <button
                    type="button"
                    onClick={() => setShowLineModal(true)}
                    className="w-full py-2 px-3 text-xs font-medium text-slate-400 hover:text-orange-400 hover:bg-slate-800/60 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
                    <span>查看完整報名須知與常見問答 (FAQ)</span>
                  </button>
                </div>
              </div>

              {/* Admin Quick Entry Box */}
              <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <div className="font-semibold text-slate-200">活動資料維護</div>
                  <div>欲修改日程、費用或行程請前往</div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="px-3.5 py-1.5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 text-xs font-semibold rounded-lg border border-orange-500/30 transition-colors cursor-pointer"
                >
                  進入管理後台
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Sticky Bottom Bar (手機版固定在畫面下方顯示報名與諮詢按鈕) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0e12]/95 backdrop-blur-lg border-t border-slate-800 px-3.5 py-3 shadow-2xl">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[10px] text-slate-400 font-medium">
              {activity.feeItems && activity.feeItems.length > 1
                ? `活動費用 (共 ${activity.feeItems.length} 種方案)`
                : '活動費用'}
            </span>
            <span className="text-base font-black text-orange-400 font-mono whitespace-nowrap">
              NT$ {activity.feeItems && activity.feeItems.length > 1
                ? `${Math.min(...activity.feeItems.map(f => Number(f.amount) || 0)).toLocaleString()} 起`
                : Number(activity.fee || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <a
              id="btn-faq-mobile"
              href={officialLineConsultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-[#161b22] border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0"
              title="報名諮詢與常見問答 (固定 LINE 官方客服)"
            >
              <Info className="w-3.5 h-3.5 text-orange-400" />
              <span>諮詢問答</span>
            </a>

            <a
              id="btn-line-registration-mobile"
              href={registrationLineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#06C755] active:bg-[#05b34c] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#06C755]/30 transition-transform active:scale-95 text-center whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>{hasDates ? 'LINE 報名' : 'LINE 洽詢'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* LINE Registration & FAQ Guide Modal */}
      {showLineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#161b22] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#06C755] flex items-center justify-center text-white shadow-md">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">報名諮詢與常見問答 (FAQ)</h3>
                  <div className="text-[11px] text-slate-400">亞馬遜國家山岳協會官方線上客服</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLineModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
              {/* LINE Link card: Official consultation */}
              <div className="bg-[#0c0e12] p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#06C755]" />
                    官方固定 LINE 諮詢超連結：
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    固定客服
                  </span>
                </div>
                <div className="font-mono text-xs text-orange-400 break-all bg-[#161b22] px-3 py-2 rounded-lg border border-slate-700/60 select-all">
                  {officialLineConsultUrl}
                </div>
                <p className="text-[11px] text-slate-400">
                  常見問答諮詢請加入上方官方 LINE 好友，傳送訊息將有專業高山總領隊即時為您解答。
                </p>
              </div>

              {/* Dedicated Group URL card (if configured) */}
              {activity.lineGroupUrl && (
                <div className="bg-[#0c0e12] p-4 rounded-xl border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#06C755]" />
                      本活動專屬 LINE 群組：
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                      梯次專用
                    </span>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 break-all bg-[#161b22] px-3 py-2 rounded-lg border border-emerald-500/20 select-all">
                    {activity.lineGroupUrl}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    點選前台「LINE 立即報名」將直接邀請您加入此梯次專屬群組。
                  </p>
                </div>
              )}

              {/* FAQ Section */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-400" />
                  登山隊員常見問答 (FAQ)
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800/80">
                    <div className="font-semibold text-white mb-1 text-xs">Q1：報名流程與繳費方式為何？</div>
                    <div className="text-slate-400 leading-relaxed">
                      點擊超連結加入官方 LINE 後，提供姓名、電話、身分證字號、緊急聯絡人以供入山申辦。確認中籤或成團後，由專員提供官方銀行帳號完成訂金與尾款匯款。
                    </div>
                  </div>

                  <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800/80">
                    <div className="font-semibold text-white mb-1 text-xs">Q2：沒有百岳長程經驗可以參加嗎？</div>
                    <div className="text-slate-400 leading-relaxed">
                      本活動難度為「{activity.difficulty}」。建議平時有定期有氧訓練或百岳單日行程經驗。若有疑慮可先於 LINE 向領隊諮詢體能評估建議。
                    </div>
                  </div>

                  <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800/80">
                    <div className="font-semibold text-white mb-1 text-xs">Q3：入山入園許可證未抽中如何處理？</div>
                    <div className="text-slate-400 leading-relaxed">
                      若遇山屋或營地抽籤未中，領隊團隊將於 LINE 群組第一時間通知，隊員可選擇全額退費或順延至下一梯次備用日期。
                    </div>
                  </div>

                  <div className="bg-[#0d1117] p-3 rounded-lg border border-slate-800/80">
                    <div className="font-semibold text-white mb-1 text-xs">Q4：天候不佳或颱風警報的退費原則？</div>
                    <div className="text-slate-400 leading-relaxed">
                      出發前若發布陸上颱風警報或國家公園封山，活動全額扣除已發生的行政與保險規費後全數退款，以山友生命安全為最高準則。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <a
                href={registrationLineUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowLineModal(false)}
                className="flex-1 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-center font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#06C755]/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>LINE 立即報名</span>
              </a>
              <a
                href={officialLineConsultUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowLineModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center font-semibold text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>官方諮詢</span>
              </a>
              <button
                type="button"
                onClick={() => setShowLineModal(false)}
                className="px-4 py-2.5 bg-[#0c0e12] hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
