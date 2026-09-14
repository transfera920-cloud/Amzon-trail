import { Activity, DEFAULT_LINE_URL } from '../types';

const STORAGE_KEY = 'amazon_mountains_activities_v1';
const AUTH_KEY = 'amazon_mountains_admin_auth_v1';
const ACTIVE_ACTIVITY_KEY = 'amazon_mountains_active_id_v1';

/**
 * Generate sequential, unique Activity ID such as activity_001, activity_002, etc.
 */
export function generateNextActivityId(existingActivities: Activity[] = []): string {
  let maxNum = 0;
  for (const act of existingActivities) {
    if (!act || !act.id) continue;
    const match = act.id.match(/^activity_(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  const formatted = String(nextNum).padStart(3, '0');
  let candidate = `activity_${formatted}`;

  let safety = 1;
  while (existingActivities.some((a) => a.id === candidate) && safety < 100) {
    candidate = `activity_${String(nextNum + safety).padStart(3, '0')}`;
    safety++;
  }

  return candidate;
}

/**
 * Clean activity parser without any hard-coded default overrides.
 * Preserves user-created, edited, or deleted data exactly as is.
 */
function cleanActivityList(list: any[]): Activity[] {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => item && typeof item === 'object' && item.id);
}

/**
 * Synchronously load cached activities from local storage ONLY for instant initial render
 * while the authoritative cloud database query completes.
 */
export function loadActivities(): Activity[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return cleanActivityList(parsed);
      }
    }
  } catch (err) {
    console.warn('[Cache] Could not parse local cache:', err);
  }
  return [];
}

/**
 * Save activities to local cache for instant offline UI and next-load rendering.
 */
function saveLocalActivitiesOnly(activities: Activity[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    }
  } catch (err) {
    console.error('Failed to save activities cache to localStorage:', err);
  }
}

/**
 * Asynchronously fetch activities from the shared Cloud Database API.
 * This is the SINGLE SOURCE OF TRUTH for PC, Mobile, and Tablet.
 */
export async function fetchActivitiesFromCloud(): Promise<Activity[]> {
  try {
    const res = await fetch(`/api/activities?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error(`Cloud Database API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    let cloudActivities: Activity[] = [];

    if (Array.isArray(data)) {
      cloudActivities = data;
    } else if (data && Array.isArray(data.activities)) {
      cloudActivities = data.activities;
    }

    const cleaned = cleanActivityList(cloudActivities);
    // Update local cache with real cloud data
    saveLocalActivitiesOnly(cleaned);
    notifySyncEvent('synced', cleaned);
    return cleaned;
  } catch (err) {
    console.warn('[Cloud Storage] Fetch from cloud database failed, using cached data:', err);
    notifySyncEvent('offline', loadActivities());
    return loadActivities();
  }
}

/**
 * Directly delete an activity from Cloud SQL via DELETE endpoint
 * and synchronize local caches and events immediately.
 */
export async function deleteActivityFromCloud(id: string): Promise<{ success: boolean; activities: Activity[] }> {
  try {
    const res = await fetch(`/api/activities/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Cloud Database API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const remaining = cleanActivityList(data.activities || []);
    saveLocalActivitiesOnly(remaining);
    notifySyncEvent('saved', remaining);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('amazon_activities_changed', { detail: remaining }));
    }
    return { success: true, activities: remaining };
  } catch (err) {
    console.error(`[Cloud Storage] Direct delete failed, falling back to sync:`, err);
    const current = loadActivities();
    const remaining = current.filter((a) => a.id !== id);
    const ok = await saveActivitiesToCloud(remaining);
    return { success: ok, activities: remaining };
  }
}

/**
 * Save activities to the shared Cloud Database API.
 * Confirms real cloud persistence before returning success.
 */
export async function saveActivitiesToCloud(activities: Activity[]): Promise<boolean> {
  try {
    const cleaned = cleanActivityList(activities);
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ activities: cleaned })
    });

    if (!res.ok) {
      throw new Error(`Cloud Database returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.activities)) {
      const persisted = cleanActivityList(data.activities);
      saveLocalActivitiesOnly(persisted);
      notifySyncEvent('saved', persisted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('amazon_activities_changed', { detail: persisted }));
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Cloud Storage] Failed to write activities to Cloud Database:', err);
    notifySyncEvent('error', activities);
    return false;
  }
}

/**
 * Primary save function: Writes to cloud database.
 */
export function saveActivities(activities: Activity[]): void {
  const cleaned = cleanActivityList(activities);
  // Update local cache optimistically
  saveLocalActivitiesOnly(cleaned);

  saveActivitiesToCloud(cleaned).catch((err) => {
    console.error('[Cloud Storage] Error during cloud save:', err);
  });
}

/**
 * Custom event notifier for UI sync indicators
 */
type SyncStatus = 'synced' | 'saving' | 'saved' | 'offline' | 'error';
function notifySyncEvent(status: SyncStatus, activities: Activity[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('amazon_cloud_sync_status', {
        detail: { status, timestamp: new Date().toISOString(), count: activities.length }
      })
    );
  }
}

export function createBlankActivity(existingActivities: Activity[] = []): Activity {
  const id = generateNextActivityId(existingActivities);
  const today = new Date().toISOString().split('T')[0];
  const next5 = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];

  return {
    id,
    title: '全新登山活動',
    subtitle: '專業領隊帶領・高山壯麗絕景',
    startDate: today,
    endDate: next5,
    lineUrl: DEFAULT_LINE_URL,
    fee: 15000,
    feeItems: [
      { id: `fee-${id}-1`, name: '標準報名費用', amount: 15000 }
    ],
    feeNote: '包含：高山嚮導費、山屋/營地帳篷、高山綜合保險、專車接駁、入山入園申辦。',
    leader: '亞馬遜國家山岳 專業領隊',
    maxParticipants: 10,
    currentParticipants: 0,
    meetingLocation: '台北車站 / 台中高鐵站',
    meetingTime: 'Day 1 上午 07:00',
    distanceKm: '約 30 km',
    elevationGain: '+2,500 m',
    elevationLoss: '-2,500 m',
    maxAltitude: '3,200 m',
    videoUrl: '',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    difficulty: '百岳中級',
    status: 'recruiting',
    description: '請輸入活動特色、登山路線、文化與高山生態說明...',
    gearNotice: '1. 必備個人裝備與睡袋、睡墊。\n2. 防風防雨登山衣褲、保暖頭盔與登山杖。\n3. 行動糧與水袋。',
    itinerary: [
      {
        id: `day-${id}-1`,
        day: 1,
        title: '登山口集合啟程 → 抵達營地',
        estimatedHours: '6.0',
        checkpoints: [
          { id: `cp-${id}-1-1`, time: '08:00', location: '登山口集合', note: '行前安全宣導與公裝查驗' },
          { id: `cp-${id}-1-2`, time: '14:30', location: '抵達第一夜營地', note: '紮營整補', isHighlight: true }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function duplicateActivity(
  original: Activity,
  existingActivities: Activity[] = [],
  customTitle?: string
): Activity {
  const newId = generateNextActivityId(existingActivities);
  const cloned: Activity = JSON.parse(JSON.stringify(original));
  cloned.id = newId;
  cloned.title = customTitle || `${original.title} (新梯次)`;
  cloned.currentParticipants = 0;
  cloned.isArchived = false;
  cloned.status = 'recruiting';
  delete cloned.archivedAt;
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();

  cloned.itinerary = (cloned.itinerary || []).map((d, dIdx) => ({
    ...d,
    id: `day-${newId}-${dIdx + 1}`,
    checkpoints: (d.checkpoints || []).map((cp, cpIdx) => ({
      ...cp,
      id: `cp-${newId}-${dIdx + 1}-${cpIdx + 1}`
    }))
  }));
  return cloned;
}

export function archiveActivity(id: string, activities: Activity[]): Activity[] {
  return activities.map((act) => {
    if (act.id === id) {
      return {
        ...act,
        isArchived: true,
        status: 'archived',
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return act;
  });
}

export function unarchiveActivity(id: string, activities: Activity[]): Activity[] {
  return activities.map((act) => {
    if (act.id === id) {
      return {
        ...act,
        isArchived: false,
        status: 'recruiting',
        updatedAt: new Date().toISOString()
      };
    }
    return act;
  });
}

// Admin Auth Helpers
export function checkAdminAuth(): boolean {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuth(isAuth: boolean): void {
  try {
    if (typeof window !== 'undefined') {
      if (isAuth) {
        localStorage.setItem(AUTH_KEY, 'true');
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  } catch (err) {
    console.error('Failed to set auth state:', err);
  }
}

export function getSavedActiveActivityId(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_ACTIVITY_KEY) : null;
  } catch {
    return null;
  }
}

export function setSavedActiveActivityId(id: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_ACTIVITY_KEY, id);
    }
  } catch (err) {
    console.error('Failed to save active id:', err);
  }
}

export function getActivityPublicPath(activityId: string): string {
  return `/activity/${activityId}`;
}

export function getActivityPublicUrl(activityId: string): string {
  if (typeof window === 'undefined') return `/activity/${activityId}`;
  return `${window.location.origin}/activity/${activityId}`;
}
