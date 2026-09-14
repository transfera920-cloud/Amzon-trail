import { db } from './index.ts';
import { activities } from './schema.ts';
import { eq, asc } from 'drizzle-orm';
import { Activity } from '../types.ts';
import fs from 'fs';
import path from 'path';

const INITIALIZED_FLAG_FILE = path.join(process.cwd(), 'data', '.db_initialized');

/**
 * 將目前資料庫最新活動狀態即時備份到磁碟檔案，確保即使在發布、部署或重新開機時，
 * 本地備份與雲端資料庫皆保持 100% 使用者最新編輯內容，絕不被預設範本覆蓋。
 */
export function syncDiskBackup(list: Activity[]): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const jsonStr = JSON.stringify(list, null, 2);
    fs.writeFileSync(path.join(dataDir, 'activities.json'), jsonStr, 'utf-8');
    fs.writeFileSync(path.join(dataDir, 'activities.backup.json'), jsonStr, 'utf-8');
  } catch (err) {
    console.warn('[Database] Warning: failed to sync disk backup:', err);
  }
}

// 將資料庫列轉換為前端 Activity 型別
function toActivityModel(row: any): Activity {
  return {
    id: row.id,
    title: row.title ?? '',
    subtitle: row.subtitle ?? '',
    startDate: row.startDate ?? '',
    endDate: row.endDate ?? '',
    days: typeof row.days === 'number' && row.days > 0 ? row.days : undefined,
    lineUrl: row.lineUrl ?? '',
    lineGroupUrl: row.lineGroupUrl || undefined,
    fee: Number(row.fee) || 0,
    feeItems: row.feeItems || [],
    feeNote: row.feeNote || undefined,
    leader: row.leader ?? '',
    maxParticipants: Number(row.maxParticipants) || 10,
    currentParticipants: Number(row.currentParticipants) || 0,
    meetingLocation: row.meetingLocation ?? '',
    meetingTime: row.meetingTime ?? '',
    distanceKm: row.distanceKm ?? '',
    elevationGain: row.elevationGain ?? '',
    elevationLoss: row.elevationLoss ?? '',
    maxAltitude: row.maxAltitude ?? '',
    videoUrl: row.videoUrl ?? '',
    coverImage: row.coverImage ?? '',
    difficulty: row.difficulty ?? '',
    status: row.status || 'recruiting',
    isArchived: Boolean(row.isArchived),
    archivedAt: row.archivedAt || undefined,
    description: row.description ?? '',
    gearNotice: row.gearNotice ?? '',
    itinerary: row.itinerary || [],
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
  };
}

// 唯一一次性的冷啟動檢查：僅在資料庫筆數完全為 0 且從未初始化時進行初始化遷移
// 發布或重啟時絕對不覆蓋使用者已編輯內容！
export async function seedIfDatabaseEmpty(): Promise<void> {
  try {
    // 檢查是否已標記初始化：一旦初始化過，發布、重啟、重新編譯時絕對不覆蓋編輯內容
    if (fs.existsSync(INITIALIZED_FLAG_FILE)) {
      console.log(`[Database] Database already initialized. Strictly preserving user edited content.`);
      return;
    }

    const existing = await db.select({ id: activities.id }).from(activities).limit(1);
    if (existing.length > 0) {
      console.log(`[Database] Cloud SQL already contains activities. Marking initialized and skipping seed.`);
      try {
        fs.writeFileSync(INITIALIZED_FLAG_FILE, new Date().toISOString(), 'utf-8');
      } catch {}
      return;
    }

    console.log(`[Database] First run: Cloud SQL is empty. Migrating initial backup data...`);

    // 優先讀取 ./data/activities.backup.json 或 ./data/activities.json
    let sourceActivities: Activity[] = [];
    const backupPath = path.join(process.cwd(), 'data', 'activities.backup.json');
    const normalPath = path.join(process.cwd(), 'data', 'activities.json');

    if (fs.existsSync(backupPath)) {
      sourceActivities = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    } else if (fs.existsSync(normalPath)) {
      sourceActivities = JSON.parse(fs.readFileSync(normalPath, 'utf-8'));
    }

    if (!Array.isArray(sourceActivities) || sourceActivities.length === 0) {
      console.warn(`[Database] No backup activities found to migrate.`);
      try {
        fs.writeFileSync(INITIALIZED_FLAG_FILE, new Date().toISOString(), 'utf-8');
      } catch {}
      return;
    }

    for (const act of sourceActivities) {
      await db.insert(activities).values({
        id: act.id,
        title: act.title,
        subtitle: act.subtitle || '',
        startDate: act.startDate || '',
        endDate: act.endDate || '',
        days: typeof act.days === 'number' && act.days > 0 ? act.days : null,
        lineUrl: act.lineUrl || 'https://lin.ee/64ollTa',
        lineGroupUrl: act.lineGroupUrl || null,
        fee: act.fee || 0,
        feeItems: act.feeItems || [],
        feeNote: act.feeNote || null,
        leader: act.leader || '',
        maxParticipants: act.maxParticipants || 10,
        currentParticipants: act.currentParticipants || 0,
        meetingLocation: act.meetingLocation || '',
        meetingTime: act.meetingTime || '',
        distanceKm: act.distanceKm || '',
        elevationGain: act.elevationGain || '',
        elevationLoss: act.elevationLoss || '',
        maxAltitude: act.maxAltitude || '',
        videoUrl: act.videoUrl || '',
        coverImage: act.coverImage,
        difficulty: act.difficulty || '',
        status: act.status || 'recruiting',
        isArchived: Boolean(act.isArchived),
        archivedAt: act.archivedAt || null,
        description: act.description || '',
        gearNotice: act.gearNotice || '',
        itinerary: act.itinerary || [],
      }).onConflictDoNothing();
    }

    console.log(`[Database] Successfully migrated ${sourceActivities.length} activities into Cloud SQL.`);
    try {
      fs.writeFileSync(INITIALIZED_FLAG_FILE, new Date().toISOString(), 'utf-8');
    } catch {}
  } catch (error) {
    console.error('[Database] Failed to seed/migrate activities to Cloud SQL:', error);
  }
}

// 取得所有活動 (純粹查詢 Cloud SQL，無任何覆寫邏輯)
export async function getAllActivities(): Promise<Activity[]> {
  try {
    const rows = await db.select().from(activities).orderBy(asc(activities.startDate));
    return rows.map(toActivityModel);
  } catch (error) {
    console.error('[Database] Query getAllActivities failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// 依 ID 取得單一活動
export async function getActivityById(id: string): Promise<Activity | null> {
  try {
    const rows = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    if (rows.length === 0) return null;
    return toActivityModel(rows[0]);
  } catch (error) {
    console.error(`[Database] Query getActivityById (${id}) failed:`, error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// 建立或更新單一活動
export async function upsertActivity(act: Activity): Promise<Activity> {
  try {
    const result = await db.insert(activities).values({
      id: act.id,
      title: act.title ?? '',
      subtitle: act.subtitle || '',
      startDate: act.startDate || '',
      endDate: act.endDate || '',
      days: typeof act.days === 'number' && act.days > 0 ? act.days : null,
      lineUrl: act.lineUrl ?? 'https://lin.ee/64ollTa',
      lineGroupUrl: act.lineGroupUrl || null,
      fee: typeof act.fee === 'number' ? act.fee : (Number(act.fee) || 0),
      feeItems: act.feeItems || [],
      feeNote: act.feeNote || null,
      leader: act.leader || '',
      maxParticipants: act.maxParticipants !== undefined && act.maxParticipants !== null ? Number(act.maxParticipants) : 10,
      currentParticipants: act.currentParticipants !== undefined && act.currentParticipants !== null ? Number(act.currentParticipants) : 0,
      meetingLocation: act.meetingLocation || '',
      meetingTime: act.meetingTime || '',
      distanceKm: act.distanceKm || '',
      elevationGain: act.elevationGain || '',
      elevationLoss: act.elevationLoss || '',
      maxAltitude: act.maxAltitude || '',
      videoUrl: act.videoUrl || '',
      coverImage: act.coverImage ?? '',
      difficulty: act.difficulty || '',
      status: act.status || 'recruiting',
      isArchived: Boolean(act.isArchived),
      archivedAt: act.archivedAt || null,
      description: act.description || '',
      gearNotice: act.gearNotice || '',
      itinerary: act.itinerary || [],
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: activities.id,
      set: {
        title: act.title ?? '',
        subtitle: act.subtitle || '',
        startDate: act.startDate || '',
        endDate: act.endDate || '',
        days: typeof act.days === 'number' && act.days > 0 ? act.days : null,
        lineUrl: act.lineUrl ?? 'https://lin.ee/64ollTa',
        lineGroupUrl: act.lineGroupUrl || null,
        fee: typeof act.fee === 'number' ? act.fee : (Number(act.fee) || 0),
        feeItems: act.feeItems || [],
        feeNote: act.feeNote || null,
        leader: act.leader || '',
        maxParticipants: act.maxParticipants !== undefined && act.maxParticipants !== null ? Number(act.maxParticipants) : 10,
        currentParticipants: act.currentParticipants !== undefined && act.currentParticipants !== null ? Number(act.currentParticipants) : 0,
        meetingLocation: act.meetingLocation || '',
        meetingTime: act.meetingTime || '',
        distanceKm: act.distanceKm || '',
        elevationGain: act.elevationGain || '',
        elevationLoss: act.elevationLoss || '',
        maxAltitude: act.maxAltitude || '',
        videoUrl: act.videoUrl || '',
        coverImage: act.coverImage ?? '',
        difficulty: act.difficulty || '',
        status: act.status || 'recruiting',
        isArchived: Boolean(act.isArchived),
        archivedAt: act.archivedAt || null,
        description: act.description || '',
        gearNotice: act.gearNotice || '',
        itinerary: act.itinerary || [],
        updatedAt: new Date(),
      },
    }).returning();

    const saved = toActivityModel(result[0]);
    // 異步同步磁碟備份檔案，確保發布部署時具備最新編輯副本
    getAllActivities().then(syncDiskBackup).catch(() => {});
    return saved;
  } catch (error) {
    console.error(`[Database] Upsert activity (${act.id}) failed:`, error);
    throw new Error('Database upsert failed.', { cause: error });
  }
}

// 批量儲存/同步活動 (管理員後台編輯、刪除或重新排序時使用)
export async function syncAllActivities(incomingList: Activity[]): Promise<Activity[]> {
  try {
    const incomingIds = new Set(incomingList.map((a) => a.id));
    const allExisting = await getAllActivities();

    // 確實刪除不在 incomingList 中的所有活動
    for (const existing of allExisting) {
      if (!incomingIds.has(existing.id)) {
        console.log(`[Database] syncAllActivities: removing deleted activity ${existing.id} from Cloud SQL`);
        await deleteActivity(existing.id);
      }
    }

    for (const act of incomingList) {
      await upsertActivity(act);
    }
    // 重新從資料庫取得最新結果確保完全一致
    const latest = await getAllActivities();
    syncDiskBackup(latest);
    return latest;
  } catch (error) {
    console.error('[Database] Sync all activities failed:', error);
    throw new Error('Database sync failed.', { cause: error });
  }
}

// 刪除活動
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    const deleted = await db.delete(activities).where(eq(activities.id, id)).returning({ id: activities.id });
    const success = deleted.length > 0;
    if (success) {
      getAllActivities().then(syncDiskBackup).catch(() => {});
    }
    return success;
  } catch (error) {
    console.error(`[Database] Delete activity (${id}) failed:`, error);
    throw new Error('Database delete failed.', { cause: error });
  }
}
