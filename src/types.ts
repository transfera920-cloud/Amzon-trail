export const DEFAULT_LINE_URL = 'https://lin.ee/64ollTa';

export interface ItineraryCheckpoint {
  id: string;
  time: string; // e.g. "10:00"
  location: string; // e.g. "雲天宮登山口"
  note?: string; // Optional landmark detail
  isHighlight?: boolean;
}

export interface ItineraryDay {
  id: string;
  day: number; // 0 for D0 交通日, 1, 2, 3...
  title?: string; // e.g. "登山口 → 天池山莊" or "D0 交通日（接駁／住宿整裝）"
  estimatedHours: number | string; // e.g. 7.5 or "7.5"
  notes?: string;
  checkpoints: ItineraryCheckpoint[];
  isTransitDay?: boolean; // D0 交通日選項，不列入步程時間
}

export interface FeeItem {
  id: string;
  name: string; // 純文字欄位，例如「一般山友」、「早鳥優惠」、「會員價」
  amount: number; // 費用 (NT$)
  note?: string; // 選填說明
}

export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  startDate: string; // YYYY-MM-DD (非必填)
  endDate: string; // YYYY-MM-DD (非必填)
  days?: number; // 行程天數 (支援依起訖日期自動計算，亦支援手動 KEY IN)
  lineUrl: string; // 固定官方諮詢 LINE
  lineGroupUrl?: string; // 專屬 LINE 群組連結 (點擊 LINE 立即報名進入)
  fee: number;
  feeItems?: FeeItem[];
  feeNote?: string;
  leader: string;
  maxParticipants: number;
  currentParticipants: number;
  meetingLocation: string;
  meetingTime: string;
  distanceKm: string;
  elevationGain: string;
  elevationLoss: string;
  maxAltitude: string;
  videoUrl: string;
  coverImage: string;
  difficulty: string;
  status: 'recruiting' | 'full' | 'closed' | 'archived';
  isArchived?: boolean;
  archivedAt?: string;
  description?: string;
  gearNotice?: string;
  itinerary: ItineraryDay[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Calculate itinerary days from start/end dates or use manual days.
 * e.g., 2026-10-09 to 2026-10-13 = 5 days, or manual days if provided.
 */
export function calculateDays(startDate?: string, endDate?: string, manualDays?: number): number {
  if (typeof manualDays === 'number' && manualDays > 0) {
    return manualDays;
  }
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Get active days for an activity, preferring explicit manual days if set
 */
export function getActivityDays(activity?: Partial<Activity> | null): number {
  if (!activity) return 1;
  if (typeof activity.days === 'number' && activity.days > 0) {
    return activity.days;
  }
  return calculateDays(activity.startDate, activity.endDate);
}

/**
 * Calculates total estimated walking hours across all days.
 * Excludes D0 交通日 (day === 0 or isTransitDay === true) from walking hours.
 */
export function calculateTotalHours(itinerary: ItineraryDay[]): number {
  if (!itinerary || itinerary.length === 0) return 0;
  const total = itinerary.reduce((sum, day) => {
    // 支援 D0 交通日選項，不列入步程時間
    if (day.isTransitDay || day.day === 0) {
      return sum;
    }
    const val = typeof day.estimatedHours === 'number'
      ? day.estimatedHours
      : parseFloat(String(day.estimatedHours).replace(/[^\d.]/g, '')) || 0;
    return sum + val;
  }, 0);
  return Math.round(total * 10) / 10;
}
