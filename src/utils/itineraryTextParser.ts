import { ItineraryDay, ItineraryCheckpoint, calculateTotalHours } from '../types';

export const SAMPLE_NAN_DA_WU_ITINERARY_TEXT = `第一天

10:00 停車場登山口
12:03 文丁山叉路口休息
12:47 休息後出發
15:11 佳興山莊

當日預估步程：5.2 小時

第二天

05:00 出發
06:07 吐蛇流登山口
06:10 吐蛇流營地
06:17 可營地
06:32 崩塌拉繩
06:41 捷徑
06:49 登山口離開林道
08:01 稜線
08:47 進入芒草區陡上
09:33 芒草續上
10:52 脫離芒草
11:27 南大武前峰
11:41 危稜
12:30 南大武山2841m
13:04 下山
13:26 回到危稜
13:41 回到前峰
14:00 進芒草區
16:17 回到林道
16:29 過崩塌
16:42 吐蛇流山登山口
16:46 吐蛇流山1584m
16:53 接回林道
17:41 佳興山莊

當日預估步程：12.7 小時

第三天

06:00 出發回家
07:20 文丁山登山口
07:32 文丁山877m
07:59 回到登山口
08:08 上背包下山
08:26 祖靈聖地出口(禁入)
08:45 祖靈聖地入口(禁入)
09:20 回到溪床
09:36 回到鐵門
09:38 停車場登山口

當日預估步程：3.6 小時

預估總步程：21.5 小時`;

const CHINESE_NUMBER_MAP: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
};

/**
 * Strips markdown symbols, bullet points, blockquotes and decorative wrappers:
 * e.g. "#### 第一天" -> "第一天"
 * e.g. "**10:00｜停車場登山口**" -> "10:00｜停車場登山口"
 * e.g. "*當日預估步程：**5.2 小時***" -> "當日預估步程：5.2 小時"
 * e.g. "**預估總步程／TOTAL TIME：21.5 小時**" -> "預估總步程／TOTAL TIME：21.5 小時"
 */
export function cleanLineFormatting(raw: string): string {
  let s = raw.trim();
  // Strip blockquote markers
  s = s.replace(/^>+\s*/, '');
  // Strip markdown headers (#, ##, ###, ####)
  s = s.replace(/^#{1,6}\s*/, '');
  // Strip bullet markers (-, *, +, •, ·, 1., 1))
  s = s.replace(/^[-*+•·]\s+/, '');
  s = s.replace(/^\d+[\.、\)]\s*/, '');
  // Strip markdown asterisks, underscores, backticks, tildes
  s = s.replace(/[*_~`]/g, '');
  return s.trim();
}

/**
 * Parses Chinese numeral string like "第一天" or "第十二天" into number.
 * Supports D0 / Day 0 / 第0天 / 交通日 as day 0.
 */
function parseDayNumber(str: string): number | null {
  if (/(?:第[0零]天|D0\b|Day\s*0\b|交通日)/i.test(str)) {
    return 0;
  }

  const matchCn = str.match(/第([一二三四五六七八九十\d]+)天/);
  if (matchCn) {
    const val = matchCn[1];
    if (/^\d+$/.test(val)) return parseInt(val, 10);
    if (CHINESE_NUMBER_MAP[val]) return CHINESE_NUMBER_MAP[val];
    // Handle simple two-digit Chinese numbers e.g. 十一, 二十
    if (val.startsWith('十') && val.length === 2) {
      return 10 + (CHINESE_NUMBER_MAP[val[1]] || 0);
    }
  }

  const matchEn = str.match(/(?:day|d)\s*(\d+)/i);
  if (matchEn) {
    return parseInt(matchEn[1], 10);
  }

  return null;
}

/**
 * Format number into Chinese Day title e.g. 0 -> "D0 交通日", 1 -> "第一天", 2 -> "第二天"
 */
export function formatDayNumberToChinese(dayNum: number, isTransitDay?: boolean): string {
  if (dayNum === 0 || isTransitDay) {
    return 'D0 交通日';
  }
  const cnNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (dayNum >= 1 && dayNum <= 10) {
    return `第${cnNums[dayNum]}天`;
  }
  if (dayNum > 10 && dayNum < 20) {
    return `第十${cnNums[dayNum - 10]}天`;
  }
  return `第 ${dayNum} 天`;
}

export interface ParseItineraryResult {
  success: boolean;
  itinerary: ItineraryDay[];
  totalHours: number;
  totalCheckpoints: number;
  rawParsedTotalHours?: number;
  warnings: string[];
}

/**
 * Intelligent parser that converts plain text or Markdown itinerary format into structured ItineraryDay[]
 */
export function parseItineraryText(text: string): ParseItineraryResult {
  if (!text || !text.trim()) {
    return {
      success: false,
      itinerary: [],
      totalHours: 0,
      totalCheckpoints: 0,
      warnings: ['輸入內容為空，請貼上行程文字檔內容。']
    };
  }

  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const days: ItineraryDay[] = [];
  const warnings: string[] = [];

  let currentDay: Partial<ItineraryDay> | null = null;
  let currentCheckpoints: ItineraryCheckpoint[] = [];
  let dayIndex = 1;
  let parsedTotalHours: number | undefined;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = cleanLineFormatting(rawLine);
    if (!cleanLine) continue;

    // Helper to peek ahead for next non-empty cleaned line
    const peekNextCleanLine = (startIdx: number): { nextIdx: number; clean: string } | null => {
      for (let j = startIdx; j < lines.length; j++) {
        const c = cleanLineFormatting(lines[j]);
        if (c) return { nextIdx: j, clean: c };
      }
      return null;
    };

    // 1. Check for Overall Total Estimated Hours (e.g. "預估總步程／TOTAL TIME：21.5 小時", "總步程：21.5 小時")
    // Case 1A: Single line
    const totalHoursMatch = cleanLine.match(/(?:預估)?總(?:步程|時程|時間)(?:[／/][a-zA-Z\s]+)?[：:\s]+([0-9.]+)/i);
    if (totalHoursMatch) {
      parsedTotalHours = parseFloat(totalHoursMatch[1]);
      continue;
    }
    // Case 1B: Label on this line (e.g. "預估總步程 / TOTAL TIME"), hours on the next line (e.g. "21.5 小時")
    if (/(?:預估)?總(?:步程|時程|時間)(?:[／/][a-zA-Z\s]+)?[:：]?$/i.test(cleanLine)) {
      const next = peekNextCleanLine(i + 1);
      if (next) {
        const numMatch = next.clean.match(/^([0-9.]+)(?:\s*小時|\s*hr|\s*h)?$/i);
        if (numMatch) {
          parsedTotalHours = parseFloat(numMatch[1]);
          i = next.nextIdx;
          continue;
        }
      }
    }

    // 2. Check for Day header (e.g. "第一天", "#### 第一天", "Day 1", "D1", "D0 交通日", "交通日", optionally with title)
    const dayNum = parseDayNumber(cleanLine);
    const isTransitExplicit = dayNum === 0 || /(?:D0\b|Day\s*0\b|交通日|前行日|車程日)/i.test(cleanLine);
    const isDayHeader = isTransitExplicit || dayNum !== null || /^(?:第[零0一二三四五六七八九十\d]+天|Day\s*\d+|D\d+)/i.test(cleanLine);

    if (isDayHeader) {
      // Finalize previous day if existed
      if (currentDay) {
        finalizeCurrentDay(currentDay, currentCheckpoints, days);
      }

      const assignedDay = isTransitExplicit ? 0 : (dayNum !== null ? dayNum : dayIndex);
      if (!isTransitExplicit) {
        dayIndex = assignedDay + 1;
      }

      // Extract optional title after day header (e.g. "第一天 停車場登山口至佳興山莊", "D0 交通日 台北出發宿民宿")
      const titleMatch = cleanLine.replace(/^(?:第[零0一二三四五六七八九十\d]+天|Day\s*\d+|D\d+|交通日|前行日|車程日)[:：\s-]*/i, '').trim();

      currentDay = {
        id: `day-${assignedDay}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        day: assignedDay,
        isTransitDay: isTransitExplicit || assignedDay === 0,
        title: titleMatch || (isTransitExplicit ? '交通日（車程接駁／宿點整裝）' : ''),
        estimatedHours: 0,
        checkpoints: []
      };
      currentCheckpoints = [];
      continue;
    }

    // 3. Check for Daily Estimated Hours / Transit hours (e.g. "當日預估步程：5.2 小時", "預估車程：3 小時", "當日預估車程：3.5 小時")
    // Case 3A: Single line
    const dayHoursMatch = cleanLine.match(/(?:當日)?(?:預估)?(?:步程|車程|時程|時間|行走時間)(?:[／/][a-zA-Z\s]+)?[：:\s]+([0-9.]+)/i);
    if (dayHoursMatch) {
      if (currentDay) {
        currentDay.estimatedHours = parseFloat(dayHoursMatch[1]);
      }
      continue;
    }
    // Case 3B: Label on this line (e.g. "當日預估步程："), hours on the next line (e.g. "5.2 小時")
    if (/(?:當日)?(?:預估)?(?:步程|車程|時程|時間|行走時間)(?:[／/][a-zA-Z\s]+)?[:：]?$/i.test(cleanLine)) {
      const next = peekNextCleanLine(i + 1);
      if (next) {
        const numMatch = next.clean.match(/^([0-9.]+)(?:\s*小時|\s*hr|\s*h)?$/i);
        if (numMatch) {
          if (currentDay) {
            currentDay.estimatedHours = parseFloat(numMatch[1]);
          }
          i = next.nextIdx;
          continue;
        }
      }
    }

    // 4. Check for Checkpoint line:
    // Supports:
    // - "10:00｜停車場登山口" (full-width vertical pipe)
    // - "10:00 | 停車場登山口" (half-width vertical pipe)
    // - "10:00 停車場登山口" (space separated)
    // - "10:00 - 停車場登山口" (dash separated)
    // - "10:00: 停車場登山口" (colon separated)
    // - "**10:00｜停車場登山口**" (markdown bold cleaned)
    // - Separate lines:
    //   Line 1: "10:00"
    //   Line 2: "停車場登山口"
    let timeStr: string | null = null;
    let locationStr: string | null = null;

    const checkpointMatch = cleanLine.match(/^([0-2]?\d[:：][0-5]\d)(?:\s*[｜|—–\-~]\s*|\s*[:：](?!\d)\s*|\s+)(.+)$/);
    if (checkpointMatch) {
      timeStr = checkpointMatch[1];
      locationStr = checkpointMatch[2];
    } else {
      // Check if current line is strictly a time e.g. "10:00", "05:00", "5:00", "12:03"
      const timeOnlyMatch = cleanLine.match(/^([0-2]?\d[:：][0-5]\d)$/);
      if (timeOnlyMatch) {
        const next = peekNextCleanLine(i + 1);
        if (next) {
          const nextDayNum = parseDayNumber(next.clean);
          const nextIsDayHeader = nextDayNum !== null || /^(?:第[一二三四五六七八九十\d]+天|Day\s*\d+|D\d+)/i.test(next.clean);
          const nextIsTime = /^([0-2]?\d[:：][0-5]\d)/.test(next.clean);
          const nextIsHours = /(?:預估)?(?:總|當日)?(?:步程|時程|時間)/i.test(next.clean);

          if (!nextIsDayHeader && !nextIsTime && !nextIsHours) {
            timeStr = timeOnlyMatch[1];
            locationStr = next.clean;
            i = next.nextIdx; // Consume location line
          }
        }
      }
    }

    if (timeStr && locationStr) {
      timeStr = timeStr.replace('：', ':');
      // Normalize single digit hour e.g. 5:00 -> 05:00
      if (/^\d:/.test(timeStr)) {
        timeStr = '0' + timeStr;
      }

      // Clean any accidental leading or trailing pipe or punctuation from location
      locationStr = locationStr.trim().replace(/^[｜|—–\-~:]\s*/, '').replace(/[｜|—–\-~:]$/, '').trim();

      // If no current day was declared yet, create Day 1 automatically
      if (!currentDay) {
        currentDay = {
          id: `day-1-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          day: 1,
          title: '',
          estimatedHours: 0,
          checkpoints: []
        };
        currentCheckpoints = [];
        dayIndex = 2;
      }

      // Check for highlight cues (mountain peak elevation e.g. 2841m, 1584m, 877m, or summit)
      const hasElevation = /\d{3,4}\s*m/i.test(locationStr);
      const isSummit = /山頂|主峰|前峰|大武山|百岳/i.test(locationStr);
      const isWarning = /危稜|崩塌|禁入/i.test(locationStr);

      // Extract optional note if location contains parenthesis or note keywords
      let note: string | undefined = undefined;
      const noteMatch = locationStr.match(/[（(]([^）)]+)[）)]/);
      if (noteMatch) {
        note = noteMatch[1];
      } else if (hasElevation) {
        const ele = locationStr.match(/(\d{3,4}\s*m)/i);
        if (ele) note = `海拔標高 ${ele[1]}`;
      } else if (isWarning) {
        note = '地形注意：小心通過';
      }

      currentCheckpoints.push({
        id: `cp-${currentDay.day || 1}-${currentCheckpoints.length + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        time: timeStr,
        location: locationStr,
        note: note,
        isHighlight: hasElevation || isSummit
      });
      continue;
    }

    // 5. If line has text but didn't match checkpoints, it might be day notes
    if (currentDay && !currentDay.notes && cleanLine.length > 2) {
      currentDay.notes = cleanLine;
    }
  }

  // Finalize last day
  if (currentDay) {
    finalizeCurrentDay(currentDay, currentCheckpoints, days);
  }

  // Sort days by day number
  days.sort((a, b) => a.day - b.day);

  // Auto calculate total hours if not explicitly found
  const calculatedTotal = days.reduce((sum, d) => {
    const val = typeof d.estimatedHours === 'number'
      ? d.estimatedHours
      : parseFloat(String(d.estimatedHours).replace(/[^\d.]/g, '')) || 0;
    return sum + val;
  }, 0);

  const roundedCalculatedTotal = Math.round(calculatedTotal * 10) / 10;
  const finalTotal = parsedTotalHours !== undefined ? parsedTotalHours : roundedCalculatedTotal;

  const totalCheckpoints = days.reduce((acc, d) => acc + (d.checkpoints?.length || 0), 0);

  if (days.length === 0) {
    warnings.push('未解析出任何有效行程日，請確認格式包含如「第一天」、「第二天」等天數標題。');
  } else if (totalCheckpoints === 0) {
    warnings.push('未解析出時間節點，請確認時間節點格式（支援同列如「10:00 地點」或分兩列如「10:00」下一列「地點」）。');
  }

  return {
    success: days.length > 0 && totalCheckpoints > 0,
    itinerary: days,
    totalHours: finalTotal,
    totalCheckpoints,
    rawParsedTotalHours: parsedTotalHours,
    warnings
  };
}

/**
 * Helper to finalize day title and auto-estimate hours if missing
 */
function finalizeCurrentDay(
  currentDay: Partial<ItineraryDay>,
  checkpoints: ItineraryCheckpoint[],
  days: ItineraryDay[]
) {
  // If title was not provided, auto-generate from first & last checkpoint
  if (!currentDay.title) {
    if (checkpoints.length >= 2) {
      const rawFirst = checkpoints[0].location;
      const firstCleaned = rawFirst.replace(/^[-\s]*(?:出發|整裝|起點)\s*/, '').replace(/\s*(?:出發|整裝|起點).*$/, '').trim();
      const first = firstCleaned || rawFirst;

      const rawLast = checkpoints[checkpoints.length - 1].location;
      const lastCleaned = rawLast.replace(/^[-\s]*(?:抵達|夜宿|紮營|返回)\s*/, '').replace(/\s*(?:抵達|夜宿|紮營|返回).*$/, '').trim();
      const last = lastCleaned || rawLast;

      // Look for a peak in between, prioritizing the highest mountain peak
      const mountainCandidates = checkpoints.slice(1, -1).filter((cp) => {
        const loc = cp.location;
        if (/登山口|叉路|岔路|山莊|營地|出發|回到|過崩塌|拉繩|捷徑|林道/i.test(loc)) return false;
        return cp.isHighlight || /山|峰|稜|嶺/i.test(loc);
      });

      let peakCp: ItineraryCheckpoint | undefined;
      if (mountainCandidates.length > 0) {
        mountainCandidates.sort((a, b) => {
          const eleA = parseInt((a.location.match(/(\d{3,4})\s*m/i) || [])[1] || '0', 10);
          const eleB = parseInt((b.location.match(/(\d{3,4})\s*m/i) || [])[1] || '0', 10);
          return eleB - eleA;
        });
        peakCp = mountainCandidates[0];
      }

      if (peakCp && first !== peakCp.location && last !== peakCp.location) {
        const peakName = peakCp.location.replace(/(\d+m).*/, '$1').trim();
        currentDay.title = `${first} → ${peakName} → ${last}`;
      } else if (first && last && first !== last) {
        currentDay.title = `${first} → ${last}`;
      } else {
        currentDay.title = first || last || `第 ${currentDay.day || days.length + 1} 天行程`;
      }
    } else if (checkpoints.length === 1) {
      currentDay.title = checkpoints[0].location;
    } else {
      currentDay.title = `第 ${currentDay.day || days.length + 1} 天行程`;
    }
  }

  // If estimatedHours was not parsed, calculate from start & end time
  const isTransit = Boolean(currentDay.isTransitDay || currentDay.day === 0);
  if (!currentDay.estimatedHours || Number(currentDay.estimatedHours) === 0) {
    if (isTransit) {
      currentDay.estimatedHours = 0;
    } else if (checkpoints.length >= 2) {
      const startMinutes = timeToMinutes(checkpoints[0].time);
      const endMinutes = timeToMinutes(checkpoints[checkpoints.length - 1].time);
      if (startMinutes !== null && endMinutes !== null && endMinutes >= startMinutes) {
        const hours = (endMinutes - startMinutes) / 60;
        currentDay.estimatedHours = Math.round(hours * 10) / 10;
      } else {
        currentDay.estimatedHours = 6.0;
      }
    } else {
      currentDay.estimatedHours = 6.0;
    }
  }

  const assignedDay = isTransit ? 0 : (currentDay.day !== undefined ? currentDay.day : days.length + 1);

  days.push({
    id: currentDay.id || `day-${assignedDay}`,
    day: assignedDay,
    isTransitDay: isTransit,
    title: currentDay.title,
    estimatedHours: currentDay.estimatedHours,
    notes: currentDay.notes,
    checkpoints: checkpoints
  });
}

function timeToMinutes(t: string): number | null {
  const parts = t.split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return null;
}

/**
 * Converts structured ItineraryDay[] into the exact clean text format requested
 */
export function formatItineraryToText(itinerary: ItineraryDay[]): string {
  if (!itinerary || itinerary.length === 0) return '';

  const blocks: string[] = [];

  itinerary.forEach((dayItem) => {
    const isTransit = Boolean(dayItem.isTransitDay || dayItem.day === 0);
    const dayHeader = formatDayNumberToChinese(dayItem.day, isTransit);
    const checkpointLines = (dayItem.checkpoints || []).map(
      (cp) => `${cp.time}｜${cp.location}`
    );

    const estHours = typeof dayItem.estimatedHours === 'number'
      ? dayItem.estimatedHours
      : parseFloat(String(dayItem.estimatedHours).replace(/[^\d.]/g, '')) || 0;

    const parts: string[] = [dayHeader];
    if (checkpointLines.length > 0) {
      parts.push(checkpointLines.join('\n'));
    }
    if (isTransit) {
      if (estHours > 0) {
        parts.push(`當日預估車程：${estHours} 小時（交通日不列入步程時間）`);
      } else {
        parts.push(`當日預估車程：交通接駁整裝（不列入步程時間）`);
      }
    } else if (estHours > 0) {
      parts.push(`當日預估步程：${estHours} 小時`);
    }

    blocks.push(parts.join('\n\n'));
  });

  const totalHours = calculateTotalHours(itinerary);

  return blocks.join('\n\n') + `\n\n預估總步程：${totalHours} 小時`;
}
