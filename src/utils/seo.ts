import { Activity } from '../types';

/**
 * 檢查活動是否填寫了完整的起訖日期
 */
export function hasValidDates(activity?: Activity | null): boolean {
  return Boolean(
    activity &&
    activity.startDate &&
    activity.startDate.trim() !== '' &&
    activity.endDate &&
    activity.endDate.trim() !== ''
  );
}

/**
 * 從起訖日期中提取年份 (例如 "2027-04-10" -> "2027")
 */
export function extractStartYear(startDate?: string): string | null {
  if (!startDate) return null;
  const match = startDate.trim().match(/^(\d{4})/);
  return match ? match[1] : null;
}

/**
 * 產生第三層活動詳細頁的 Title
 * - 有日期時：「${activity.title}｜${startYear}登山活動與行程｜亞馬遜國家山岳協會」
 * - 沒有日期時：「${activity.title}｜登山活動與行程｜亞馬遜國家山岳協會」（絕不虛構年份）
 */
export function generateActivityPageTitle(activity: Activity): string {
  const title = (activity.title || '登山活動').trim();
  const year = hasValidDates(activity) ? extractStartYear(activity.startDate) : null;

  if (year) {
    return `${title}｜${year}登山活動與行程｜亞馬遜國家山岳協會`;
  }
  return `${title}｜登山活動與行程｜亞馬遜國家山岳協會`;
}

/**
 * 產生第三層活動詳細頁的 Meta Description
 * 必須使用資料庫中實際存在的資料自動產生：
 * - 有日期時：包含活動名稱、活動日期、活動天數、活動介紹、招生狀態、費用
 * - 沒有日期時：不虛構日期，描述活動名稱、路線特色、登山活動類型、未定日期公告提示
 */
export function generateActivityMetaDescription(activity: Activity): string {
  const title = (activity.title || '登山活動').trim();
  const rawDesc = (activity.description || activity.subtitle || '').replace(/\s+/g, ' ').trim();
  const shortDesc = rawDesc ? (rawDesc.length > 90 ? rawDesc.slice(0, 90) + '...' : rawDesc) : '';

  if (hasValidDates(activity)) {
    const daysText = activity.days ? `，行程共 ${activity.days} 天` : '';
    const feeText = activity.fee ? `，費用 NT$ ${Number(activity.fee).toLocaleString()}` : '';
    const statusText = activity.status === 'full' ? '【目前已額滿】' : activity.status === 'closed' ? '【已截止報名】' : '【現正公開招生中】';
    return `${statusText}【${title}】亞馬遜國家山岳協會登山行程。活動日期：${activity.startDate} 至 ${activity.endDate}${daysText}${feeText}。${shortDesc || '提供完整登山行程時間軸、百岳路線資訊與裝備須知，歡迎線上諮詢報名。'}`;
  }

  // 無日期：絕不虛構日期與年份
  return `【${title}】亞馬遜國家山岳協會經典登山行程與百岳活動。${shortDesc || '提供高山百岳路線規劃、路程時間軸、里程爬升數據與行前裝備指南。'}目前尚未安排出隊活動日期，敬請留意後續最新活動公告。`;
}

/**
 * 取得活動頁的標準 Canonical 絕對網址
 */
export function getActivityCanonicalUrl(baseUrl: string, activityId: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/activity/${encodeURIComponent(activityId)}`;
}

/**
 * 產生結構化資料 JSON-LD
 * - 有實際活動日期時：產生合法合規的 Event JSON-LD
 * - 沒有活動日期時：絕不產生虛構的 Event startDate/endDate，改為合規的 BreadcrumbList 與 WebPage
 */
export function generateActivityJsonLd(activity: Activity, baseUrl: string): object {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const activityUrl = getActivityCanonicalUrl(cleanBase, activity.id);
  const title = (activity.title || '登山活動').trim();
  const description = generateActivityMetaDescription(activity);
  const coverImage = activity.coverImage || `${cleanBase}/og-default.jpg`;

  if (hasValidDates(activity)) {
    // 具有真實日期 -> 產生 Event 結構化資料
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': title,
      'description': description,
      'startDate': activity.startDate,
      'endDate': activity.endDate,
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'location': {
        '@type': 'Place',
        'name': activity.meetingLocation || '集合地點詳見活動說明',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': activity.meetingLocation || '台灣',
          'addressCountry': 'TW'
        }
      },
      'image': [coverImage],
      'url': activityUrl,
      'organizer': {
        '@type': 'Organization',
        'name': '亞馬遜國家山岳協會',
        'url': cleanBase
      },
      'offers': {
        '@type': 'Offer',
        'url': activityUrl,
        'price': activity.fee || 0,
        'priceCurrency': 'TWD',
        'availability': activity.status === 'full'
          ? 'https://schema.org/SoldOut'
          : activity.status === 'closed'
          ? 'https://schema.org/Discontinued'
          : 'https://schema.org/InStock',
        'validFrom': activity.createdAt || '2025-01-01'
      }
    };
  }

  // 無日期活動 -> 產生 BreadcrumbList 與 WebPage 結構化資料，不輸出缺漏日期的 Event
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': '亞馬遜國家山岳協會',
            'item': cleanBase
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': title,
            'item': activityUrl
          }
        ]
      },
      {
        '@type': 'WebPage',
        '@id': activityUrl,
        'url': activityUrl,
        'name': generateActivityPageTitle(activity),
        'description': description,
        'isPartOf': {
          '@type': 'WebSite',
          'name': '亞馬遜國家山岳協會｜登山活動招生管理系統',
          'url': cleanBase
        },
        'publisher': {
          '@type': 'Organization',
          'name': '亞馬遜國家山岳協會',
          'url': cleanBase
        }
      }
    ]
  };
}
