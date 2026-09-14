import React, { useState } from 'react';
import { Clock, MapPin, Flag, CheckCircle2, Footprints, Flame, Sparkles, SlidersHorizontal, Car } from 'lucide-react';
import { ItineraryDay, calculateTotalHours } from '../types';

interface ItineraryTimelineProps {
  itinerary: ItineraryDay[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itinerary }) => {
  const [selectedDayTab, setSelectedDayTab] = useState<number | 'all'>('all');

  const totalHours = calculateTotalHours(itinerary || []);
  const safeItinerary = itinerary || [];

  if (safeItinerary.length === 0) {
    return (
      <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-8 text-center" id="itinerary-section">
        <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-slate-400 mb-3 border border-slate-700/60">
          <Footprints className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-200">目前尚無排定時程</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          詳細行程時間與路線節點將由領隊視實際天候、路況與團員體能調整，請以行前通知為準。
        </p>
      </div>
    );
  }

  const hasTransit = safeItinerary.some((d) => d.day === 0 || d.isTransitDay);
  const normalDays = safeItinerary.filter((d) => !d.isTransitDay && d.day !== 0);

  const displayedDays = selectedDayTab === 'all'
    ? safeItinerary
    : safeItinerary.filter((d) => d.day === selectedDayTab);

  return (
    <div className="space-y-6" id="itinerary-section">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161b22] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Footprints className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                行程詳細時間表 {hasTransit ? `(含 D0 交通日，共 ${itinerary.length} 天)` : `(Day 1 ～ Day ${itinerary.length})`}
              </h3>
              <p className="text-xs text-slate-400">
                專業高山領隊實地勘查測繪時程，含重要休整點與步程預估
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#0c0e12] border border-orange-500/30 rounded-xl px-4 py-2.5">
          <Clock className="w-5 h-5 text-orange-400 shrink-0" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span>預估總步程</span>
              {hasTransit && (
                <span className="text-blue-400 font-normal lowercase tracking-normal text-[10px] bg-blue-950/60 px-1 py-0.2 rounded border border-blue-800/40">
                  不含 D0 交通日
                </span>
              )}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-white font-mono">
              {totalHours} 小時
            </div>
          </div>
        </div>
      </div>

      {/* Day Filter Tabs Navigation Bar */}
      <div className="w-full max-w-full min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
            <span>天數導覽</span>
            <span className="text-[11px] text-slate-500 font-normal">
              (共 {itinerary.length} 天{hasTransit ? '，含 D0 交通日' : ''}，點擊快速切換或檢視全覽)
            </span>
          </div>
        </div>

        {/* Multi-line Wrapping Track Container */}
        <div className="w-full rounded-xl bg-[#11141a]/90 p-2 sm:p-2.5 border border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 select-none">
            {/* All Days button */}
            <button
              type="button"
              id="day-tab-all"
              onClick={() => setSelectedDayTab('all')}
              className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm ${
                selectedDayTab === 'all'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/50'
                  : 'bg-[#161b22] text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/70'
              }`}
            >
              全覽 (全部天數)
            </button>

            {/* Individual Day Buttons: D0, Day 1 ~ Day N */}
            {itinerary.map((d) => {
              const isSelected = selectedDayTab === d.day;
              const isTransit = Boolean(d.isTransitDay || d.day === 0);
              return (
                <button
                  key={d.id}
                  id={`day-tab-${d.day}`}
                  type="button"
                  onClick={() => setSelectedDayTab(d.day)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 shadow-sm ${
                    isSelected
                      ? isTransit
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-400/50'
                        : 'bg-orange-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/50'
                      : isTransit
                        ? 'bg-[#101726] text-blue-300 hover:bg-blue-950/80 hover:text-white border border-blue-800/60'
                        : 'bg-[#161b22] text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/70'
                  }`}
                >
                  {isTransit ? (
                    <>
                      <Car className="w-3.5 h-3.5 text-blue-400" />
                      <span>D0 交通日</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                        isSelected ? 'bg-blue-700/60 text-blue-100' : 'bg-blue-950 text-blue-300'
                      }`}>
                        車程
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Day {d.day}</span>
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-normal ${
                          isSelected
                            ? 'bg-orange-700/60 text-orange-100'
                            : 'bg-[#0d1117] text-slate-400 border border-slate-800'
                        }`}
                      >
                        {d.estimatedHours}h
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Days Stack */}
      <div className="space-y-6">
        {displayedDays.map((dayItem) => {
          const isTransit = Boolean(dayItem.isTransitDay || dayItem.day === 0);
          return (
          <div
            key={dayItem.id}
            className={`rounded-xl p-5 sm:p-6 transition-all shadow-sm ${
              isTransit
                ? 'bg-[#0b101c] border border-blue-900/60 hover:border-blue-700'
                : 'bg-[#161b22] border border-slate-800 hover:border-slate-700'
            }`}
            id={`itinerary-day-${dayItem.day}`}
          >
            {/* Day Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                {isTransit ? (
                  <span className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs font-mono shadow-md">
                    <Car className="w-4 h-4" />
                    <span>D0 交通日</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 text-white font-black text-sm font-mono shadow-md">
                    D{dayItem.day}
                  </span>
                )}
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {dayItem.title || (isTransit ? 'D0 交通日（車程接駁／宿點整裝）' : `第 ${dayItem.day} 天行程`)}
                  </h4>
                  {dayItem.notes && (
                    <p className="text-xs text-slate-400 mt-0.5">{dayItem.notes}</p>
                  )}
                </div>
              </div>

              {isTransit ? (
                <div className="flex items-center gap-2 self-start sm:self-auto bg-blue-950/40 border border-blue-800/60 rounded-lg px-3 py-1.5 text-xs text-blue-200">
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-400">當日預估車程：</span>
                  <span className="text-blue-300 font-bold font-mono">
                    {dayItem.estimatedHours ? `${dayItem.estimatedHours} 小時` : '專車接駁'}
                  </span>
                  <span className="text-[10px] bg-blue-900/80 text-blue-200 px-1.5 py-0.5 rounded font-medium ml-1">
                    交通日不計入步程
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 self-start sm:self-auto bg-[#0c0e12] border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-slate-400">當日預估步程：</span>
                  <span className="text-orange-400 font-bold font-mono">
                    {dayItem.estimatedHours} 小時
                  </span>
                </div>
              )}
            </div>

            {/* Checkpoints Timeline */}
            <div className={`mt-6 relative pl-6 sm:pl-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-3 before:w-0.5 before:bg-gradient-to-b ${
              isTransit
                ? 'before:from-blue-500 before:via-slate-700 before:to-slate-800'
                : 'before:from-orange-500 before:via-slate-700 before:to-slate-800'
            }`}>
              <div className="space-y-4">
                {dayItem.checkpoints && dayItem.checkpoints.length > 0 ? (
                  dayItem.checkpoints.map((cp, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === dayItem.checkpoints.length - 1;
                    const isSpecial = cp.isHighlight || isFirst || isLast;

                    return (
                      <div
                        key={cp.id || idx}
                        className="relative group flex items-start gap-3 sm:gap-4"
                      >
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isTransit
                              ? isSpecial
                                ? 'bg-blue-500 text-slate-950 ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-600 group-hover:border-blue-400'
                              : isSpecial
                                ? 'bg-orange-500 text-slate-950 ring-4 ring-orange-500/20 shadow-md shadow-orange-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-600 group-hover:border-orange-400'
                          }`}
                        >
                          {isFirst ? (
                            isTransit ? <Car className="w-2.5 h-2.5 fill-current" /> : <Flag className="w-2.5 h-2.5 fill-current" />
                          ) : isLast ? (
                            <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSpecial ? 'bg-slate-950' : 'bg-slate-400'}`} />
                          )}
                        </div>

                        {/* Node Content */}
                        <div className={`w-full rounded-xl p-3 sm:p-3.5 border transition-all ${
                          isTransit
                            ? isSpecial
                              ? 'bg-[#0c1322] border-blue-800/40 hover:border-blue-700/60'
                              : 'bg-[#0c1322]/60 border-slate-800 hover:border-slate-700'
                            : isSpecial
                              ? 'bg-[#0c0e12] border-orange-500/30 hover:border-orange-500/50'
                              : 'bg-[#0c0e12]/60 border-slate-800 hover:border-slate-700'
                        }`}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs sm:text-sm font-bold font-mono px-2 py-0.5 rounded ${
                                isTransit
                                  ? 'text-blue-300 bg-blue-950/60 border border-blue-700/40'
                                  : 'text-orange-400 bg-orange-950/50 border border-orange-700/40'
                              }`}>
                                {cp.time}
                              </span>
                              <span className={`text-sm sm:text-base font-semibold text-white transition-colors ${
                                isTransit ? 'group-hover:text-blue-300' : 'group-hover:text-orange-300'
                              }`}>
                                {cp.location}
                              </span>
                            </div>

                            {isSpecial && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                isTransit
                                  ? 'text-blue-300 bg-blue-500/10 border-blue-500/20'
                                  : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                              }`}>
                                <Sparkles className="w-2.5 h-2.5" />
                                {isFirst
                                  ? (isTransit ? '集合出發點' : '出發點')
                                  : isLast
                                    ? (isTransit ? '夜宿整備點' : '當日終點 / 營地')
                                    : '中途停靠 / 休息點'}
                              </span>
                            )}
                          </div>

                          {cp.note && (
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              {cp.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">尚未建立節點資訊</p>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
