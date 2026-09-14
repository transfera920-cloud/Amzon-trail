import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  seedIfDatabaseEmpty,
  getAllActivities,
  getActivityById,
  upsertActivity,
  syncAllActivities,
  deleteActivity
} from './src/db/activities.ts';
import {
  hasValidDates,
  generateActivityPageTitle,
  generateActivityMetaDescription,
  getActivityCanonicalUrl,
  generateActivityJsonLd
} from './src/utils/seo.ts';
import { Activity } from './src/types.ts';

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderNotFoundHtml(activityId: string, req: express.Request): string {
  return `<!doctype html>
<html lang="zh-TW" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>找不到此活動行程｜404 Not Found｜亞馬遜國家山岳協會</title>
  <meta name="description" content="抱歉，您所查詢的登山活動 ID 不存在或已被主辦單位移入封存。請回到首頁查看最新招生活動行程。" />
  <meta name="robots" content="noindex, follow" />
  <style>
    body { background-color: #0c0e12; color: #cbd5e1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; text-align: center; }
    .card { background-color: #161b22; border: 1px solid #334155; border-radius: 1rem; max-width: 32rem; width: 100%; padding: 2.5rem 1.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; background-color: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #ffffff; margin: 0 0 0.75rem 0; }
    p { font-size: 0.875rem; color: #94a3b8; line-height: 1.6; margin: 0 0 1.5rem 0; }
    .code { font-family: monospace; background: #0c0e12; padding: 0.2rem 0.4rem; border-radius: 0.25rem; color: #fdba74; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background-color: #ea580c; color: #ffffff; font-weight: 700; border-radius: 0.75rem; text-decoration: none; transition: background-color 0.2s; }
    .btn:hover { background-color: #c2410c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">404 NOT FOUND</div>
    <h1>找不到此登山活動行程</h1>
    <p>抱歉，您所查詢的活動識別碼 <span class="code">${escapeHtml(activityId)}</span> 目前不存在於系統資料庫，或已被主辦單位封存下架。</p>
    <a href="/" class="btn">返回首頁瀏覽最新活動</a>
  </div>
</body>
</html>`;
}

function renderActivityPageHtml(template: string, activity: Activity, baseUrl: string): string {
  const title = generateActivityPageTitle(activity);
  const description = generateActivityMetaDescription(activity);
  const canonicalUrl = getActivityCanonicalUrl(baseUrl, activity.id);
  const jsonLd = generateActivityJsonLd(activity, baseUrl);
  const coverImage = activity.coverImage || '';

  // 決定活動狀態文字與日期說明
  const hasDates = hasValidDates(activity);
  const statusText = activity.status === 'full' ? '已額滿' : activity.status === 'closed' ? '已截止報名' : '招生中';
  const dateText = hasDates ? `${activity.startDate} 至 ${activity.endDate}` : '尚未安排活動日期，敬請留意後續活動公告';
  const daysText = activity.days ? `${activity.days} 天` : '未載明';
  const feeText = activity.fee ? `NT$ ${Number(activity.fee).toLocaleString()}` : '請洽主辦單位';

  // 預先渲染路線時間軸（如果存在）
  let itineraryPrerenderHtml = '';
  if (Array.isArray(activity.itinerary) && activity.itinerary.length > 0) {
    itineraryPrerenderHtml = `
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem;">詳細每日行程與路線檢點</h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${activity.itinerary.map((day: any) => `
            <div style="padding: 1rem; background-color: #161b22; border: 1px solid #1e293b; border-radius: 0.5rem;">
              <h3 style="font-size: 1.05rem; color: #f97316; font-weight: 700; margin: 0 0 0.5rem 0;">${escapeHtml(day.dayTitle || `第 ${day.day} 天`)}</h3>
              ${day.route ? `<p style="color: #cbd5e1; font-size: 0.95rem; margin: 0 0 0.5rem 0;"><strong>路線：</strong>${escapeHtml(day.route)}</p>` : ''}
              ${day.description ? `<p style="color: #94a3b8; font-size: 0.875rem; line-height: 1.6; margin: 0;">${escapeHtml(day.description)}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  // 預先渲染裝備須知
  let gearPrerenderHtml = '';
  if (activity.gearNotice) {
    gearPrerenderHtml = `
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem;">裝備須知與行前叮嚀</h2>
        <div style="line-height: 1.7; color: #94a3b8; white-space: pre-line; font-size: 0.9rem;">${escapeHtml(activity.gearNotice)}</div>
      </section>
    `;
  }

  // 無日期活動專屬公告區塊
  const undatedNoticeHtml = !hasDates ? `
    <div style="background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #fcd34d; padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem; font-size: 0.95rem;">
      <strong>活動排程公告：</strong>目前尚未安排活動日期，敬請留意後續活動公告。
    </div>
  ` : '';

  // 組合 Prerender Body（包含唯一 H1、活動名稱、介紹、路線資訊等）
  const prerenderBody = `
    <main class="server-prerender-shell" style="min-height: 100vh; background-color: #0c0e12; color: #cbd5e1; padding: 2rem 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <article style="max-width: 1000px; margin: 0 auto;">
        <header style="margin-bottom: 1.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 1.5rem;">
          <div style="margin-bottom: 0.75rem;">
            <a href="/" style="color: #f97316; text-decoration: none; font-weight: 700; font-size: 0.95rem;">← 返回亞馬遜國家山岳協會首頁</a>
          </div>
          <h1 style="font-size: 2rem; font-weight: 800; color: #ffffff; margin: 0 0 0.5rem 0; line-height: 1.25;">${escapeHtml(activity.title)}</h1>
          ${activity.subtitle ? `<p style="font-size: 1.1rem; color: #94a3b8; margin: 0;">${escapeHtml(activity.subtitle)}</p>` : ''}
        </header>

        ${undatedNoticeHtml}

        <section style="background-color: #161b22; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 2rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.875rem;">
            <div><strong style="color: #f97316;">活動狀態：</strong><span>${escapeHtml(statusText)}</span></div>
            <div><strong style="color: #f97316;">起訖日期：</strong><span>${escapeHtml(dateText)}</span></div>
            <div><strong style="color: #f97316;">行程天數：</strong><span>${escapeHtml(daysText)}</span></div>
            <div><strong style="color: #f97316;">活動費用：</strong><span>${escapeHtml(feeText)}</span></div>
            ${activity.difficulty ? `<div><strong style="color: #f97316;">路線難度：</strong><span>${escapeHtml(activity.difficulty)}</span></div>` : ''}
            ${activity.meetingLocation ? `<div><strong style="color: #f97316;">集合地點：</strong><span>${escapeHtml(activity.meetingLocation)}</span></div>` : ''}
          </div>
        </section>

        <section style="margin-bottom: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem;">行程簡介與路線特色</h2>
          <div style="line-height: 1.7; color: #cbd5e1; white-space: pre-line; font-size: 0.95rem;">
            ${escapeHtml(activity.description || activity.subtitle || '亞馬遜國家山岳協會精心規劃之高山百岳經典行程。')}
          </div>
        </section>

        ${itineraryPrerenderHtml}

        ${gearPrerenderHtml}
      </article>
    </main>
  `;

  let html = template;

  // 1. Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // 2. Meta Description
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // 3. Open Graph
  html = html.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );

  // 4. 追加 Canonical、Robots、og:url、og:image、JSON-LD
  const injectedHeadElements = [
    `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `    <meta name="robots" content="index, follow, max-image-preview:large" />`,
    `    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    coverImage ? `    <meta property="og:image" content="${escapeHtml(coverImage)}" />` : '',
    `    <script type="application/ld+json" id="activity-jsonld">${JSON.stringify(jsonLd)}</script>`
  ].filter(Boolean).join('\n');

  html = html.replace(/<\/head>/i, `${injectedHeadElements}\n  </head>`);

  // 5. 替換 <div id="root"></div> 為預渲染內容
  html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${prerenderBody}</div>`);

  return html;
}

async function startServer() {
  // 伺服器啟動時，僅在資料庫完全為 0 筆記錄時進行第一次初始化遷移
  // 一旦資料庫已有資料，絕對不執行覆蓋！
  await seedIfDatabaseEmpty();

  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with generous limits for rich activity itineraries
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Prevent browser caching for real-time mobile/desktop sync
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Health check endpoint (報告雲端資料庫狀態與筆數)
  app.get('/api/health', async (_req, res) => {
    try {
      const activities = await getAllActivities();
      res.json({
        status: 'ok',
        database: 'cloud_sql_postgresql',
        timestamp: new Date().toISOString(),
        activityCount: activities.length
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        database: 'cloud_sql_postgresql',
        error: err?.message || 'Database connection error'
      });
    }
  });

  // GET all activities (直接從唯一正式資料來源 Cloud SQL 讀取)
  app.get('/api/activities', async (_req, res) => {
    try {
      const activities = await getAllActivities();
      res.json({
        success: true,
        source: 'cloud_sql_database',
        count: activities.length,
        updatedAt: new Date().toISOString(),
        activities
      });
    } catch (err: any) {
      console.error('[API] Failed to fetch activities from Cloud SQL:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch activities from cloud database' });
    }
  });

  // GET single activity by ID
  app.get('/api/activities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const found = await getActivityById(id);
      if (!found) {
        return res.status(404).json({ success: false, error: `Activity ${id} not found in database` });
      }
      res.json({ success: true, activity: found });
    } catch (err: any) {
      console.error(`[API] Failed to get activity ${req.params.id}:`, err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to get activity from database' });
    }
  });

  // POST /api/activities: Bulk save or update full activities list
  app.post('/api/activities', async (req, res) => {
    try {
      const payload = req.body;
      const incomingActivities = Array.isArray(payload) ? payload : payload?.activities;

      if (!Array.isArray(incomingActivities)) {
        return res.status(400).json({ success: false, error: 'Invalid activities payload: must be an array' });
      }

      // 真正寫入雲端資料庫，移除不在清單中的項目
      const savedList = await syncAllActivities(incomingActivities);
      console.log(`[API] Successfully synchronized ${savedList.length} activities to Cloud SQL.`);

      res.json({
        success: true,
        count: savedList.length,
        updatedAt: new Date().toISOString(),
        activities: savedList
      });
    } catch (err: any) {
      console.error('[API] Server error saving activities to Cloud SQL:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to save activities to cloud database' });
    }
  });

  // PUT /api/activities/:id: Upsert or update a single activity directly in Cloud SQL
  app.put('/api/activities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedActivity = req.body?.activity || req.body;
      if (!updatedActivity || typeof updatedActivity !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid activity data' });
      }

      updatedActivity.id = id;
      const saved = await upsertActivity(updatedActivity);
      const all = await getAllActivities();

      res.json({
        success: true,
        activity: saved,
        count: all.length
      });
    } catch (err: any) {
      console.error(`[API] Failed to update activity ${req.params.id} in Cloud SQL:`, err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to update activity in cloud database' });
    }
  });

  // DELETE /api/activities/:id directly in Cloud SQL
  app.delete('/api/activities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await deleteActivity(id);
      if (!ok) {
        return res.status(404).json({ success: false, error: `Activity ${id} not found in database` });
      }

      const remaining = await getAllActivities();
      console.log(`[API] Successfully deleted activity ${id} from Cloud SQL. Remaining: ${remaining.length}`);
      res.json({ success: true, count: remaining.length, activities: remaining });
    } catch (err: any) {
      console.error(`[API] Failed to delete activity ${req.params.id}:`, err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to delete activity from cloud database' });
    }
  });

  function getRequestBaseUrl(req: express.Request): string {
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    if (process.env.APP_URL && process.env.APP_URL.startsWith('http') && !host.includes('localhost')) {
      return process.env.APP_URL.replace(/\/+$/, '');
    }
    return `${protocol}://${host}`;
  }

  // Robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl = getRequestBaseUrl(req);
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml
`);
  });

  // Dynamic Sitemap.xml (包含所有非封存之有效活動頁面：招生活動與未定日期活動均收錄)
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const activities = await getAllActivities();

      // 嚴格原則：僅排除封存活動；無論是否排定日期，所有有效活動均完整收錄於 sitemap
      const validActivities = activities.filter(
        (a) => !a.isArchived && a.status !== 'archived'
      );

      const today = new Date().toISOString().split('T')[0];

      const urls = [
        `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
        ...validActivities.map((a) => {
          const isRecruitingWithDate = hasValidDates(a);
          const priority = isRecruitingWithDate ? '0.9' : '0.7';
          const changefreq = isRecruitingWithDate ? 'daily' : 'weekly';
          const lastmod = a.updatedAt ? a.updatedAt.split('T')[0] : today;
          return `  <url>\n    <loc>${baseUrl}/activity/${encodeURIComponent(a.id)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
        })
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (err: any) {
      console.error('[Sitemap] Failed to generate sitemap:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Vite server in development mode
  let vite: any = null;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // 第三層活動詳細頁 Server-Side SEO 注入路由
  app.get('/activity/:id', async (req, res, next) => {
    try {
      const id = req.params.id;
      const activity = await getActivityById(id);

      // 若活動不存在或已封存：嚴格回傳 404 Not Found，絕不 fallback 至第一筆活動
      if (!activity || activity.isArchived || activity.status === 'archived') {
        const notFoundHtml = renderNotFoundHtml(id, req);
        return res.status(404).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(notFoundHtml);
      }

      const baseUrl = getRequestBaseUrl(req);

      const indexPath = process.env.NODE_ENV !== 'production'
        ? path.join(process.cwd(), 'index.html')
        : (fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
            ? path.join(process.cwd(), 'dist', 'index.html')
            : path.join(process.cwd(), 'index.html'));

      let template = fs.readFileSync(indexPath, 'utf-8');
      let injectedHtml = renderActivityPageHtml(template, activity, baseUrl);

      if (vite) {
        injectedHtml = await vite.transformIndexHtml(req.originalUrl, injectedHtml);
      }

      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(injectedHtml);
    } catch (err) {
      console.error(`[SEO Server] Failed to serve activity page ${req.params.id}:`, err);
      next(err);
    }
  });

  // Vite middleware for development vs static build for production
  if (vite) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cloud Server] Mountain Association CMS connected to Cloud SQL running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
