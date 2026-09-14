import React, { useState } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Clock,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Mountain,
  Link as LinkIcon,
  Video,
  ListOrdered,
  Sparkles,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Compass,
  Archive,
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  LayoutGrid,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Car
} from 'lucide-react';
import { Activity, FeeItem, ItineraryDay, ItineraryCheckpoint, calculateDays, calculateTotalHours, DEFAULT_LINE_URL } from '../types';
import { getYouTubeEmbedUrl, extractYouTubeId } from '../utils/youtube';
import {
  parseItineraryText,
  formatItineraryToText,
  SAMPLE_NAN_DA_WU_ITINERARY_TEXT,
  ParseItineraryResult
} from '../utils/itineraryTextParser';

interface ActivityEditorModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export const ActivityEditorModal: React.FC<ActivityEditorModalProps> = ({
  activity,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Activity>(() => {
    const cloned: Activity = JSON.parse(JSON.stringify(activity));
    if (!cloned.feeItems) {
      cloned.feeItems = cloned.fee ? [{ id: `fee-init-${Date.now()}`, name: '標準費用', amount: cloned.fee }] : [];
    }
    return cloned;
  });
  const [activeTab, setActiveTab] = useState<'basics' | 'itinerary' | 'stats' | 'notices'>('basics');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Full Text File Mode state
  const [itineraryMode, setItineraryMode] = useState<'visual' | 'text'>('visual');
  const [rawItineraryText, setRawItineraryText] = useState(() => formatItineraryToText(activity.itinerary || []));
  const [parseResult, setParseResult] = useState<ParseItineraryResult | null>(() => parseItineraryText(formatItineraryToText(activity.itinerary || [])));
  const [copiedText, setCopiedText] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState(false);
  const [showParsedDetail, setShowParsedDetail] = useState(true);

  if (!isOpen) return null;

  // Auto-calculated values
  const autoDays = calculateDays(formData.startDate, formData.endDate);
  const currentDays = typeof formData.days === 'number' && formData.days > 0 ? formData.days : autoDays;
  const totalHours = calculateTotalHours(formData.itinerary);

  const handleStartDateChange = (val: string) => {
    setFormData((prev) => {
      const nextEndDate = prev.endDate;
      let nextDays = prev.days;
      if (val && nextEndDate) {
        nextDays = calculateDays(val, nextEndDate);
      }
      return {
        ...prev,
        startDate: val,
        days: nextDays,
        updatedAt: new Date().toISOString()
      };
    });
  };

  const handleEndDateChange = (val: string) => {
    setFormData((prev) => {
      const nextStartDate = prev.startDate;
      let nextDays = prev.days;
      if (nextStartDate && val) {
        nextDays = calculateDays(nextStartDate, val);
      }
      return {
        ...prev,
        endDate: val,
        days: nextDays,
        updatedAt: new Date().toISOString()
      };
    });
  };

  const handleFieldChange = (field: keyof Activity, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString()
      };
      if (field === 'status') {
        if (value === 'archived') {
          updated.isArchived = true;
          updated.archivedAt = prev.archivedAt || new Date().toISOString();
        } else {
          updated.isArchived = false;
        }
      }
      return updated;
    });
  };

  // Fee Item handlers (新增費用欄位、前方填寫純文字名稱)
  const handleAddFeeItem = () => {
    const newItem: FeeItem = {
      id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      amount: 0,
    };
    setFormData((prev) => {
      const currentItems = prev.feeItems || [];
      const updated = [...currentItems, newItem];
      return {
        ...prev,
        feeItems: updated,
        fee: updated[0]?.amount ?? prev.fee ?? 0,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleRemoveFeeItem = (index: number) => {
    setFormData((prev) => {
      const currentItems = prev.feeItems || [];
      const updated = currentItems.filter((_, idx) => idx !== index);
      return {
        ...prev,
        feeItems: updated,
        fee: updated[0]?.amount ?? 0,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleFeeItemChange = (index: number, field: 'name' | 'amount' | 'note', value: any) => {
    setFormData((prev) => {
      const currentItems = prev.feeItems ? [...prev.feeItems] : [];
      if (!currentItems[index]) return prev;

      currentItems[index] = {
        ...currentItems[index],
        [field]: field === 'amount' ? (value === '' ? '' : Number(value) || 0) : value,
      };

      return {
        ...prev,
        feeItems: currentItems,
        fee: currentItems[0]?.amount !== undefined && currentItems[0]?.amount !== '' ? Number(currentItems[0].amount) : prev.fee,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Itinerary Day handlers (Supports D0 交通日選項，不列入步程時間)
  const renumberDays = (days: ItineraryDay[]): ItineraryDay[] => {
    let normalDayCount = 1;
    return days.map((d) => {
      if (d.isTransitDay || d.day === 0) {
        return { ...d, day: 0, isTransitDay: true };
      }
      return { ...d, day: normalDayCount++, isTransitDay: false };
    });
  };

  const handleAddTransitDay = () => {
    const hasD0 = formData.itinerary.some((d) => d.day === 0 || d.isTransitDay);
    if (hasD0) {
      alert('行程中已包含 D0 交通日！若需調整，請直接在現有 D0 卡片中編輯。');
      return;
    }
    const newTransitDay: ItineraryDay = {
      id: `day-0-${Date.now()}`,
      day: 0,
      isTransitDay: true,
      title: '交通日（車程接駁／夜宿整裝）',
      estimatedHours: '0',
      notes: '前行專車接駁與宿點整裝，不列入登山步程時間',
      checkpoints: [
        {
          id: `cp-0-1-${Date.now()}`,
          time: '19:00',
          location: '出發點集合整裝',
          note: '專車接駁出發'
        },
        {
          id: `cp-0-2-${Date.now()}`,
          time: '22:30',
          location: '抵達民宿／宿點',
          note: '夜宿整裝準備明日起登'
        }
      ]
    };
    // Prepend D0 to the top of the itinerary
    setFormData((prev) => ({
      ...prev,
      itinerary: renumberDays([newTransitDay, ...prev.itinerary])
    }));
  };

  const handleToggleTransitDay = (dayIndex: number) => {
    setFormData((prev) => {
      const copy = [...prev.itinerary];
      const target = copy[dayIndex];
      const nextIsTransit = !(target.isTransitDay || target.day === 0);

      copy[dayIndex] = {
        ...target,
        day: nextIsTransit ? 0 : 1,
        isTransitDay: nextIsTransit,
        title: nextIsTransit
          ? (target.title && !target.title.startsWith('第 ') ? target.title : '交通日（車程接駁／宿點整裝）')
          : (target.title === '交通日（車程接駁／宿點整裝）' ? '' : target.title)
      };

      return {
        ...prev,
        itinerary: renumberDays(copy)
      };
    });
  };

  const handleAddDay = () => {
    const normalDays = formData.itinerary.filter((d) => !d.isTransitDay && d.day !== 0);
    const nextDayNum = normalDays.length + 1;
    const newDay: ItineraryDay = {
      id: `day-${Date.now()}-${nextDayNum}`,
      day: nextDayNum,
      isTransitDay: false,
      title: `第 ${nextDayNum} 天行程`,
      estimatedHours: '7.0',
      notes: '',
      checkpoints: [
        {
          id: `cp-${Date.now()}-1`,
          time: '07:00',
          location: '營地出發',
          note: '整裝起行'
        }
      ]
    };
    setFormData((prev) => ({
      ...prev,
      itinerary: renumberDays([...prev.itinerary, newDay])
    }));
  };

  const handleRemoveDay = (dayIndex: number) => {
    const updated = formData.itinerary.filter((_, idx) => idx !== dayIndex);
    setFormData((prev) => ({ ...prev, itinerary: renumberDays(updated) }));
  };

  const handleDayChange = (dayIndex: number, field: keyof ItineraryDay, value: any) => {
    setFormData((prev) => {
      const copy = [...prev.itinerary];
      copy[dayIndex] = { ...copy[dayIndex], [field]: value };
      return { ...prev, itinerary: copy };
    });
  };

  // Checkpoint handlers
  const handleAddCheckpoint = (dayIndex: number) => {
    const newCp: ItineraryCheckpoint = {
      id: `cp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: '12:00',
      location: '重要休息點 / 展望峰',
      note: '休息補給',
      isHighlight: false
    };
    setFormData((prev) => {
      const copy = [...prev.itinerary];
      copy[dayIndex] = {
        ...copy[dayIndex],
        checkpoints: [...copy[dayIndex].checkpoints, newCp]
      };
      return { ...prev, itinerary: copy };
    });
  };

  const handleRemoveCheckpoint = (dayIndex: number, cpIndex: number) => {
    setFormData((prev) => {
      const copy = [...prev.itinerary];
      copy[dayIndex] = {
        ...copy[dayIndex],
        checkpoints: copy[dayIndex].checkpoints.filter((_, idx) => idx !== cpIndex)
      };
      return { ...prev, itinerary: copy };
    });
  };

  const handleCheckpointChange = (
    dayIndex: number,
    cpIndex: number,
    field: keyof ItineraryCheckpoint,
    value: any
  ) => {
    setFormData((prev) => {
      const copy = [...prev.itinerary];
      const cps = [...copy[dayIndex].checkpoints];
      cps[cpIndex] = { ...cps[cpIndex], [field]: value };
      copy[dayIndex] = { ...copy[dayIndex], checkpoints: cps };
      return { ...prev, itinerary: copy };
    });
  };

  // Text Mode handlers
  const handleSwitchToTextMode = () => {
    const formatted = formatItineraryToText(formData.itinerary || []);
    setRawItineraryText(formatted);
    const result = parseItineraryText(formatted);
    setParseResult(result);
    setItineraryMode('text');
  };

  const handleSwitchToVisualMode = () => {
    // If there is valid text in text mode, ensure it is parsed and synced before switching to visual mode
    if (rawItineraryText.trim()) {
      const result = parseItineraryText(rawItineraryText);
      setParseResult(result);
      if (result.success && result.itinerary.length > 0) {
        setFormData((prev) => ({
          ...prev,
          itinerary: result.itinerary,
          totalDays: result.itinerary.length
        }));
      }
    }
    setItineraryMode('visual');
  };

  const handleRawTextChange = (text: string) => {
    setRawItineraryText(text);
    if (!text.trim()) {
      setParseResult(null);
      setFormData((prev) => ({
        ...prev,
        itinerary: [],
        totalDays: 0
      }));
      return;
    }
    const result = parseItineraryText(text);
    setParseResult(result);
    // Real-time automatic synchronization into formData.itinerary and totalDays!
    if (result.success && result.itinerary.length > 0) {
      setFormData((prev) => ({
        ...prev,
        itinerary: result.itinerary,
        totalDays: result.itinerary.length
      }));
    }
  };

  const handleApplyParsedText = () => {
    if (!rawItineraryText.trim()) {
      setFormData((prev) => ({
        ...prev,
        itinerary: [],
        totalDays: 0
      }));
      setParseResult(null);
      setApplySuccessMsg(true);
      setTimeout(() => setApplySuccessMsg(false), 2000);
      return;
    }
    const result = parseItineraryText(rawItineraryText);
    setParseResult(result);
    if (result.itinerary && result.itinerary.length > 0) {
      setFormData((prev) => ({
        ...prev,
        itinerary: result.itinerary,
        totalDays: result.itinerary.length
      }));
      setApplySuccessMsg(true);
      setTimeout(() => setApplySuccessMsg(false), 2500);
    } else {
      setApplySuccessMsg(true);
      setTimeout(() => setApplySuccessMsg(false), 2000);
    }
  };

  const handleLoadNanDaWuSample = () => {
    setRawItineraryText(SAMPLE_NAN_DA_WU_ITINERARY_TEXT);
    const result = parseItineraryText(SAMPLE_NAN_DA_WU_ITINERARY_TEXT);
    setParseResult(result);
    if (result.success && result.itinerary.length > 0) {
      setFormData((prev) => ({
        ...prev,
        itinerary: result.itinerary,
        totalDays: result.itinerary.length
      }));
      setApplySuccessMsg(true);
      setTimeout(() => setApplySuccessMsg(false), 2500);
    }
  };

  const handleCopyRawText = async () => {
    try {
      await navigator.clipboard.writeText(rawItineraryText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyFormattedItinerary = async () => {
    const formatted = formatItineraryToText(formData.itinerary || []);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawItineraryText(content);
        const result = parseItineraryText(content);
        setParseResult(result);
        if (result.success && result.itinerary.length > 0) {
          setFormData((prev) => ({
            ...prev,
            itinerary: result.itinerary,
            totalDays: result.itinerary.length
          }));
          setApplySuccessMsg(true);
          setTimeout(() => setApplySuccessMsg(false), 2500);
        }
        setItineraryMode('text');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadTextFile = () => {
    const textToDownload = itineraryMode === 'text' ? rawItineraryText : formatItineraryToText(formData.itinerary || []);
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title || '行程表'}-完整時程文字檔.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let currentItinerary = formData.itinerary || [];
    // If currently in text mode and has text, ensure the latest parsed itinerary is used
    if (itineraryMode === 'text') {
      if (!rawItineraryText.trim()) {
        currentItinerary = [];
      } else {
        const parsed = parseItineraryText(rawItineraryText);
        if (parsed.itinerary && parsed.itinerary.length > 0) {
          currentItinerary = parsed.itinerary;
        }
      }
    }
    const validFeeItems = (formData.feeItems || []).map((item) => ({
      ...item,
      name: (item.name || '').trim(),
      amount: item.amount === '' ? 0 : (Number(item.amount) || 0),
    }));
    const primaryFee = validFeeItems.length > 0
      ? validFeeItems[0].amount
      : (typeof formData.fee === 'number' ? formData.fee : (Number(formData.fee) || 0));

    const finalDays = typeof formData.days === 'number'
      ? formData.days
      : (formData.startDate && formData.endDate ? calculateDays(formData.startDate, formData.endDate) : (formData.days ? Number(formData.days) : undefined));

    const finalData: Activity = {
      ...formData,
      title: (formData.title || '').trim(),
      subtitle: (formData.subtitle || '').trim(),
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      days: finalDays,
      fee: primaryFee,
      feeItems: validFeeItems,
      leader: formData.leader || '',
      maxParticipants: typeof formData.maxParticipants === 'number' ? formData.maxParticipants : (formData.maxParticipants ? Number(formData.maxParticipants) : 0),
      currentParticipants: typeof formData.currentParticipants === 'number' ? formData.currentParticipants : (formData.currentParticipants ? Number(formData.currentParticipants) : 0),
      meetingLocation: formData.meetingLocation || '',
      meetingTime: formData.meetingTime || '',
      distanceKm: formData.distanceKm || '',
      elevationGain: formData.elevationGain || '',
      elevationLoss: formData.elevationLoss || '',
      maxAltitude: formData.maxAltitude || '',
      videoUrl: formData.videoUrl || '',
      coverImage: formData.coverImage || '',
      difficulty: formData.difficulty || '',
      status: formData.status || 'recruiting',
      description: formData.description || '',
      gearNotice: formData.gearNotice || '',
      itinerary: currentItinerary || [],
      totalDays: currentItinerary && currentItinerary.length > 0 ? currentItinerary.length : formData.totalDays
    };
    onSave(finalData);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="bg-[#161b22] border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161b22] rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Mountain className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-lg text-white">編輯活動資料與行程時間軸</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              修改活動詳細參數、LINE 報名連結、集合資訊與 Day 1～Day N 行程節點
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0c0e12] px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'basics'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            基本資料與日期費用
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('itinerary')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'itinerary'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            行程時間表 (Day 1 ~ Day {formData.itinerary.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            登山數據與影音
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notices'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            特色說明與行前須知
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
          
          {/* TAB 1: Basics & Dates & Fees */}
          {activeTab === 'basics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    活動名稱
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="例：能高安東軍縱走（可留空）"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    活動副標題 / 宣傳亮點
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="例：中央山脈高山草原、水鹿聚落與金色高山湖泊之極致巡禮"
                  />
                </div>

                {/* Date range with automatic calculated duration (非必要條件，無星號) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      活動開始日期 <span className="text-emerald-400 font-normal text-[11px]">(非必填)</span>
                    </label>
                    {formData.startDate && (
                      <button
                        type="button"
                        onClick={() => handleStartDateChange('')}
                        className="text-[11px] text-slate-400 hover:text-red-400 transition cursor-pointer"
                        title="清除開始日期"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    required={false}
                    value={formData.startDate || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      活動結束日期 <span className="text-emerald-400 font-normal text-[11px]">(非必填)</span>
                    </label>
                    {formData.endDate && (
                      <button
                        type="button"
                        onClick={() => handleEndDateChange('')}
                        className="text-[11px] text-slate-400 hover:text-red-400 transition cursor-pointer"
                        title="清除結束日期"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    required={false}
                    value={formData.endDate || ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* 依開始與結束日期自動計算行程天數：除原本功能，開放手動 KEY IN 功能 */}
                <div className="sm:col-span-2 bg-[#0d1117] border border-orange-500/40 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-orange-300">
                          依開始與結束日期自動計算行程天數：
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5 block sm:inline">
                          (除系統依日期自動計算，亦開放手動 KEY IN 功能)
                        </span>
                      </div>
                    </div>

                    {/* 當有起訖日期時，提供一鍵「重新依日期自動計算」按鈕 */}
                    {formData.startDate && formData.endDate && (
                      <button
                        type="button"
                        onClick={() => {
                          const calculated = calculateDays(formData.startDate, formData.endDate);
                          handleFieldChange('days', calculated);
                        }}
                        className="text-xs text-orange-300 hover:text-white bg-orange-950/80 hover:bg-orange-900/90 border border-orange-700/80 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto font-medium"
                        title="依起訖日期重新自動計算天數"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                        <span>重新依日期自動計算 ({autoDays} 天)</span>
                      </button>
                    )}
                  </div>

                  {/* 手動 KEY IN 輸入框與即時天夜計算徽章 */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-200 whitespace-nowrap">
                        行程天數 (手動 KEY IN)：
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={formData.days !== undefined && formData.days !== null ? formData.days : (currentDays || '')}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              handleFieldChange('days', undefined);
                            } else {
                              const parsed = parseInt(raw, 10);
                              handleFieldChange('days', isNaN(parsed) ? undefined : parsed);
                            }
                          }}
                          className="w-20 bg-slate-900 border-2 border-orange-500/70 rounded-lg px-2.5 py-1.5 text-center text-sm font-black text-orange-300 font-mono focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40 shadow-inner"
                          placeholder="天數"
                        />
                        <span className="text-sm font-bold text-slate-200 font-mono">天</span>
                      </div>
                    </div>

                    {/* 天夜計算展示徽章 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-300 bg-orange-950/90 border border-orange-500/60 px-3 py-1.5 rounded-lg font-mono flex items-center gap-1.5 shadow-sm">
                        <span>
                          {currentDays} 天 {currentDays > 1 ? `${currentDays - 1} 夜` : '單日行程'}
                        </span>
                      </span>

                      {formData.startDate && formData.endDate && currentDays !== autoDays && (
                        <span className="text-[11px] text-amber-400 bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded font-mono">
                          (已手動自訂，起訖日期換算為 {autoDays} 天)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 未填寫日期時的提示 */}
                  {(!formData.startDate || !formData.endDate) && (
                    <div className="p-2.5 bg-amber-950/30 border border-amber-500/50 rounded-lg flex items-center justify-between text-xs text-amber-300">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>未填寫活動起訖日期：已自訂 {currentDays} 天行程，此行程於<strong>前台完全隱藏</strong>（補齊起訖日期後將自動公開）</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/90 border border-amber-600 px-2 py-0.5 rounded shrink-0">
                        前台隱藏中
                      </span>
                    </div>
                  )}
                </div>

                {/* 活動報名費用 (支援多欄位新增，費用前方有純文字欄位) */}
                <div className="sm:col-span-2 bg-[#0d1117] border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                          活動報名費用 (NT$)
                        </label>
                        <span className="text-[11px] text-orange-400 bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded-full font-medium">
                          支援多組方案
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        費用前面欄位可填寫純文字（如：一般山友、早鳥優惠、會員價），可點擊「新增費用欄位」依需求增加。
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-add-fee-item"
                      onClick={handleAddFeeItem}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-300 hover:text-white bg-orange-600/20 hover:bg-orange-600 border border-orange-500/50 hover:border-orange-500 rounded-lg shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      新增費用欄位
                    </button>
                  </div>

                  {/* 費用欄位清單 */}
                  <div className="space-y-2.5">
                    {formData.feeItems && formData.feeItems.length > 0 ? (
                      formData.feeItems.map((item, idx) => (
                        <div
                          key={item.id || `fee-item-${idx}`}
                          className="flex items-center gap-2 bg-[#161b22] border border-slate-700/80 hover:border-slate-600 rounded-xl p-2 sm:p-2.5 transition-colors"
                        >
                          {/* 序號標記 */}
                          <span className="text-xs font-mono font-bold text-slate-500 px-1 shrink-0">
                            #{idx + 1}
                          </span>

                          {/* 費用前面新增一欄可以填寫純文字 */}
                          <div className="flex-1 min-w-[120px]">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleFeeItemChange(idx, 'name', e.target.value)}
                              placeholder="純文字欄位 (例：一般山友、早鳥優惠、會員價)"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          {/* 費用數字欄位 (NT$) */}
                          <div className="relative w-36 sm:w-44 shrink-0">
                            <input
                              type="number"
                              value={item.amount === 0 ? '' : item.amount}
                              onChange={(e) => handleFeeItemChange(idx, 'amount', e.target.value)}
                              placeholder="費用金額"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 pr-10 text-xs sm:text-sm text-orange-400 font-mono font-bold focus:outline-none focus:border-orange-500 text-right"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                              NT$
                            </span>
                          </div>

                          {/* 刪除欄位按鈕 */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeeItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="刪除此費用欄位"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400 bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
                        尚未新增費用項目，請點擊上方「新增費用欄位」
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      活動狀態
                    </label>
                    {formData.status === 'archived' && (
                      <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                        <Archive className="w-3 h-3" />
                        已封存（前台隱藏）
                      </span>
                    )}
                  </div>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="recruiting">現正招生中 (Recruiting)</option>
                    <option value="full">已額滿 (Full)</option>
                    <option value="closed">已截止 (Closed)</option>
                    <option value="archived">📦 已封存 (Archived - 前台不公開，後台留存參考)</option>
                  </select>
                  {formData.status === 'archived' && (
                    <p className="mt-1 text-[11px] text-purple-300">
                      此行程已設定為封存。前台遊客將不可見此活動，資料將完整保留於後台，日後可隨時解除封存或做為複製範本。
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    費用包含項目備註
                  </label>
                  <input
                    type="text"
                    value={formData.feeNote || ''}
                    onChange={(e) => handleFieldChange('feeNote', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="例：包含：高山嚮導費、天池山莊住宿與搭伙、高額登山保險、專車接駁..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    專業領隊 / 嚮導團隊
                  </label>
                  <input
                    type="text"
                    value={formData.leader}
                    onChange={(e) => handleFieldChange('leader', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="例：亞馬遜高山領隊團隊（可留空）"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      招募人數上限
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants ?? ''}
                      onChange={(e) => handleFieldChange('maxParticipants', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="例：10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      目前已報名人數
                    </label>
                    <input
                      type="number"
                      value={formData.currentParticipants ?? ''}
                      onChange={(e) => handleFieldChange('currentParticipants', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="例：0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    集合地點
                  </label>
                  <input
                    type="text"
                    value={formData.meetingLocation}
                    onChange={(e) => handleFieldChange('meetingLocation', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="例：台中高鐵站 6 號出口（可留空）"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    集合時間
                  </label>
                  <input
                    type="text"
                    value={formData.meetingTime}
                    onChange={(e) => handleFieldChange('meetingTime', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="例：Day 1 上午 07:30（可留空）"
                  />
                </div>

                {/* 1. LINE 活動專屬群組連結 (前台「LINE 立即報名」按鈕專用) */}
                <div className="sm:col-span-2 bg-[#161b22] border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#06C755]" />
                      <span>活動專屬 LINE 群組連結（前台「LINE 立即報名」專用）</span>
                    </label>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
                      隊員報名專用
                    </span>
                  </div>
                  <input
                    type="text"
                    id="input-activity-line-group-url"
                    value={formData.lineGroupUrl || ''}
                    onChange={(e) => handleFieldChange('lineGroupUrl', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
                    placeholder="例如：https://line.me/ti/g2/xxxxxxxx 或 LINE 群組邀請網址"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong className="text-slate-300">功能說明：</strong>在此輸入本活動專屬 LINE 群組連結。山友在前台點選「<span className="text-[#06C755] font-bold">LINE 立即報名</span>」時，將直接打開此群組邀請加入。（若尚未建立群組或留空，則自動連結至官方客服）
                  </p>
                </div>

                {/* 2. 報名諮詢與常見問答 LINE 官方超連結 (固定為 https://lin.ee/64ollTa) */}
                <div className="sm:col-span-2 bg-[#161b22] border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-orange-400" />
                      <span>報名諮詢與常見問答 LINE 超連結（固定官方客服）</span>
                    </label>
                    <span className="text-[10px] bg-slate-800 text-orange-400 px-2 py-0.5 rounded border border-slate-700 font-medium">
                      固定官方帳號
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={DEFAULT_LINE_URL}
                      className="w-full bg-[#0c0e12] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-300 font-mono cursor-not-allowed select-all"
                    />
                    <a
                      href={DEFAULT_LINE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shrink-0 border border-slate-700 flex items-center gap-1 cursor-pointer"
                      title="測試開啟官方 LINE"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#06C755]" />
                      <span>測試</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    🔒 <strong className="text-slate-300">固定網址：</strong>官方諮詢與常見問答固定連結為 <span className="text-orange-400 font-mono font-semibold">{DEFAULT_LINE_URL}</span>，供山友在報名前進行領隊諮詢、裝備確認與入山行政詢問。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Day 1 ~ Day N Itinerary Timeline Manager (Dual-Mode: Visual Cards & Full Text Direct Input) */}
          {activeTab === 'itinerary' && (
            <div className="space-y-4">
              {/* Top Mode Switcher & Quick Tool Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#0c0e12] border border-slate-800 rounded-xl">
                {/* View Mode Toggle Pills */}
                <div className="flex items-center gap-1.5 bg-[#161b22] p-1 rounded-xl border border-slate-800 self-start">
                  <button
                    type="button"
                    onClick={handleSwitchToVisualMode}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      itineraryMode === 'visual'
                        ? 'bg-orange-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>視覺化卡片模式</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchToTextMode}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      itineraryMode === 'text'
                        ? 'bg-orange-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>完整文字檔直接輸入</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-950/90 text-orange-300 border border-orange-800/80 font-mono">
                      即時自動解析
                    </span>
                  </button>
                </div>

                {/* Right Quick Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  {itineraryMode === 'text' && (
                    <button
                      type="button"
                      onClick={handleLoadNanDaWuSample}
                      className="px-2.5 py-1.5 bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 border border-orange-800/80 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="快速載入南大武山 3 日文字檔完整範例"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>載入南大武山範本</span>
                    </button>
                  )}

                  <label
                    className="px-2.5 py-1.5 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="從電腦選取 .txt 行程文字檔"
                  >
                    <Upload className="w-3.5 h-3.5 text-orange-400" />
                    <span>匯入 .txt</span>
                    <input
                      type="file"
                      accept=".txt,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleDownloadTextFile}
                    className="px-2.5 py-1.5 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="將當前行程儲存為 .txt 檔案"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>下載 .txt</span>
                  </button>

                  <button
                    type="button"
                    onClick={itineraryMode === 'text' ? handleCopyRawText : handleCopyFormattedItinerary}
                    className="px-2.5 py-1.5 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="複製行程純文字到剪貼簿"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">已複製！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-orange-400" />
                        <span>複製文字</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* MODE 1: FULL TEXT FILE DIRECT INPUT */}
              {itineraryMode === 'text' && (
                <div className="space-y-3 bg-[#0c0e12] border border-slate-800 rounded-xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-400" />
                        <span>完整行程文字檔輸入 / 批次貼上解析</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        支援直接貼上包含「第一天 / 10:00 停車場登山口 / 當日預估步程：5.2 小時 / 預估總步程：21.5 小時」的行程格式
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleApplyParsedText}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                          parseResult?.success
                            ? 'bg-orange-600 hover:bg-orange-500 text-white'
                            : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>套用轉換至行程表</span>
                      </button>
                    </div>
                  </div>

                  {/* Notification Bar */}
                  {applySuccessMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl flex items-center gap-2 text-xs text-emerald-200 animate-fadeIn">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold">
                        成功套用！已同步轉換為 {formData.itinerary.length} 天行程與各檢查點資料，可隨時切換卡片模式微調。
                      </span>
                    </div>
                  )}

                  {/* Textarea Input */}
                  <div className="relative">
                    <textarea
                      value={rawItineraryText}
                      onChange={(e) => handleRawTextChange(e.target.value)}
                      placeholder={`第一天\n\n10:00 停車場登山口\n12:03 文丁山叉路口休息\n12:47 休息後出發\n15:11 佳興山莊\n\n當日預估步程：5.2 小時\n\n第二天\n\n05:00 出發\n...\n當日預估步程：12.7 小時\n\n預估總步程：21.5 小時`}
                      rows={16}
                      className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl p-4 font-mono text-xs sm:text-sm text-amber-200/90 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 leading-relaxed resize-y selection:bg-orange-600 selection:text-white"
                      spellCheck={false}
                    />
                  </div>

                  {/* Real-time Parser Feedback & Checkpoint Inspector */}
                  {parseResult && (
                    <div className="rounded-xl p-3.5 bg-[#161b22] border border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {parseResult.success ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              已即時自動同步至「行程日與時程節點」
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              格式提示
                            </span>
                          )}
                          <span className="text-xs text-slate-300 font-medium">
                            {parseResult.success
                              ? `共 ${parseResult.itinerary.length} 天・${parseResult.totalCheckpoints} 個節點`
                              : '支援同列「10:00 地點」或兩列「10:00」接「地點」'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-xs font-mono text-orange-400 font-bold bg-[#0c0e12] px-2.5 py-1 rounded-lg border border-slate-800">
                            預估總步程：{parseResult.totalHours} 小時
                          </div>

                          {parseResult.success && (
                            <button
                              type="button"
                              onClick={handleSwitchToVisualMode}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm"
                              title="前往卡片檢視各天詳細檢查點"
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                              <span>切換卡片模式微調 →</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {parseResult.warnings.length > 0 && (
                        <div className="text-[11px] text-amber-400/90 space-y-0.5 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/50">
                          {parseResult.warnings.map((w, idx) => (
                            <p key={idx}>• {w}</p>
                          ))}
                        </div>
                      )}

                      {/* Day Preview Badges & Expandable Checkpoint Inspector */}
                      {parseResult.success && parseResult.itinerary.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <span>已解析之行程天數與路線概要</span>
                              <span className="text-[10px] text-slate-400 font-normal">（已自動存入行程物件，儲存後直接更新前台）</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => setShowParsedDetail(!showParsedDetail)}
                              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>{showParsedDetail ? '收合節點明細' : `展開 ${parseResult.totalCheckpoints} 個節點明細`}</span>
                              {showParsedDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Day summary chips */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {parseResult.itinerary.map((d) => (
                              <div
                                key={d.day}
                                className="bg-[#0c0e12] border border-slate-800 p-2.5 rounded-xl space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-xs text-orange-400">Day {d.day}</span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-[#161b22] px-1.5 py-0.5 rounded border border-slate-800">
                                    {d.estimatedHours}h・{d.checkpoints?.length || 0}節點
                                  </span>
                                </div>
                                <div className="text-xs text-white font-medium truncate" title={d.title}>
                                  {d.title || `第 ${d.day} 天行程`}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Detailed Checkpoint Inspector Table when expanded */}
                          {showParsedDetail && (
                            <div className="mt-3 max-h-56 overflow-y-auto space-y-2.5 pr-1 rounded-xl bg-[#0c0e12] border border-slate-800/80 p-3">
                              {parseResult.itinerary.map((d) => (
                                <div key={d.day} className="space-y-1.5 pb-2.5 border-b border-slate-800/60 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between text-xs font-bold text-orange-300">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded bg-orange-600/30 text-orange-400 flex items-center justify-center font-mono text-[10px]">
                                        D{d.day}
                                      </span>
                                      <span>{d.title}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      預估 {d.estimatedHours} 小時・{d.checkpoints.length} 個節點
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pl-7 pt-0.5">
                                    {d.checkpoints.map((cp, cpIdx) => (
                                      <div
                                        key={cp.id || cpIdx}
                                        className={`text-[11px] px-2 py-0.5 rounded-lg border flex items-center gap-1.5 font-mono ${
                                          cp.isHighlight
                                            ? 'bg-orange-950/50 border-orange-600/70 text-orange-200 font-bold shadow-xs'
                                            : 'bg-[#161b22] border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <span className="text-orange-400 font-semibold">{cp.time}</span>
                                        <span>{cp.location}</span>
                                        {cp.isHighlight && (
                                          <span className="text-[9px] bg-orange-600 text-white px-1 rounded">
                                            標高/百岳
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                        <span className="text-slate-400">
                          文字變更已即時自動解析並同步；點擊右下方「儲存並同步發布」即可立即在前台生效。
                        </span>
                        <button
                          type="button"
                          onClick={handleApplyParsedText}
                          className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer shrink-0 ml-2"
                        >
                          手動強制重新解析 →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: VISUAL DAY-BY-DAY CARDS (Interactive) */}
              {itineraryMode === 'visual' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0c0e12] border border-slate-800 rounded-xl">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-orange-400" />
                        行程日與時程節點管理
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        可新增、刪除行程天數，並在每一天中管理具體時間、抵達地點與步程推估
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xs text-slate-400 bg-[#161b22] px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                        <span>加總步程：</span>
                        <span className="text-orange-400 font-bold font-mono text-sm">{totalHours} 小時</span>
                        {formData.itinerary.some((d) => d.day === 0 || d.isTransitDay) && (
                          <span className="text-blue-400 text-[11px] font-medium bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">
                            已排除 D0 交通日
                          </span>
                        )}
                      </div>

                      {!formData.itinerary.some((d) => d.day === 0 || d.isTransitDay) && (
                        <button
                          type="button"
                          onClick={handleAddTransitDay}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                          title="在行程最前面新增 D0 交通日（不列入步程時間）"
                        >
                          <Car className="w-3.5 h-3.5 text-blue-400" />
                          <span>+ 新增 D0 交通日</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleAddDay}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新增登山日 (Day {formData.itinerary.filter((d) => !d.isTransitDay && d.day !== 0).length + 1})</span>
                      </button>
                    </div>
                  </div>

                  {/* Day items list */}
                  <div className="space-y-6">
                    {formData.itinerary.map((dayItem, dayIdx) => {
                      const isTransit = Boolean(dayItem.isTransitDay || dayItem.day === 0);
                      return (
                      <div
                        key={dayItem.id || dayIdx}
                        className={`border rounded-xl p-5 space-y-4 shadow-sm transition-all ${
                          isTransit
                            ? 'bg-[#090d16] border-blue-900/50 shadow-blue-950/20'
                            : 'bg-[#0c0e12] border-slate-800'
                        }`}
                      >
                        {/* Day Controls Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {isTransit ? (
                              <span className="px-2.5 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm">
                                <Car className="w-3.5 h-3.5" />
                                <span>D0 交通日</span>
                              </span>
                            ) : (
                              <span className="w-8 h-8 rounded-lg bg-orange-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-sm">
                                D{dayItem.day}
                              </span>
                            )}

                            <div className="flex-1 min-w-[200px]">
                              <input
                                type="text"
                                value={dayItem.title || ''}
                                onChange={(e) => handleDayChange(dayIdx, 'title', e.target.value)}
                                placeholder={isTransit ? 'D0 交通日標題（如：專車接駁出發／夜宿民宿整裝）' : `第 ${dayItem.day} 天行程標題`}
                                className={`border rounded-lg px-2.5 py-1 text-xs text-white font-semibold w-full sm:w-80 focus:outline-none transition-colors ${
                                  isTransit
                                    ? 'bg-[#101726] border-blue-800/60 focus:border-blue-500'
                                    : 'bg-[#161b22] border-slate-700 focus:border-orange-500'
                                }`}
                              />
                            </div>

                            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-xs transition select-none ${
                              isTransit
                                ? 'bg-blue-950/40 border-blue-800/70 text-blue-300'
                                : 'bg-[#161b22] border-slate-700/80 text-slate-400 hover:border-slate-600'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isTransit}
                                onChange={() => handleToggleTransitDay(dayIdx)}
                                className="w-3.5 h-3.5 rounded text-blue-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                              />
                              <span className="font-medium">
                                {isTransit ? '已設為 D0 交通日' : '設為 D0 交通日'}
                              </span>
                              <span className="text-[10px] text-slate-500">(不計入步程)</span>
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            {isTransit ? (
                              <div className="flex items-center gap-1.5 bg-blue-950/50 border border-blue-800/60 rounded-lg px-2.5 py-1 text-xs text-blue-200">
                                <Car className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-slate-400">當日車程：</span>
                                <input
                                  type="text"
                                  value={dayItem.estimatedHours}
                                  onChange={(e) => handleDayChange(dayIdx, 'estimatedHours', e.target.value)}
                                  placeholder="0"
                                  className="w-12 bg-transparent text-blue-300 font-bold font-mono focus:outline-none text-right"
                                />
                                <span className="text-slate-400">小時</span>
                                <span className="text-[10px] bg-blue-900/80 text-blue-200 px-1.5 py-0.5 rounded font-medium ml-1">
                                  不計入步程
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-[#161b22] border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                                <Clock className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-slate-400">當日預估步程：</span>
                                <input
                                  type="text"
                                  value={dayItem.estimatedHours}
                                  onChange={(e) => handleDayChange(dayIdx, 'estimatedHours', e.target.value)}
                                  placeholder="7.5"
                                  className="w-12 bg-transparent text-orange-400 font-bold font-mono focus:outline-none text-right"
                                />
                                <span className="text-slate-400">小時</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveDay(dayIdx)}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="刪除此天行程"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Day Checkpoints */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>時間節點清單：</span>
                            <button
                              type="button"
                              onClick={() => handleAddCheckpoint(dayIdx)}
                              className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              新增節點
                            </button>
                          </div>

                          <div className="space-y-2">
                            {dayItem.checkpoints && dayItem.checkpoints.map((cp, cpIdx) => (
                              <div
                                key={cp.id || cpIdx}
                                className="grid grid-cols-12 gap-2 bg-[#161b22] p-2.5 rounded-xl border border-slate-800 items-center"
                              >
                                <div className="col-span-3 sm:col-span-2">
                                  <input
                                    type="text"
                                    value={cp.time}
                                    onChange={(e) => handleCheckpointChange(dayIdx, cpIdx, 'time', e.target.value)}
                                    placeholder="10:00"
                                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-lg px-2 py-1 text-xs text-orange-400 font-mono text-center focus:outline-none focus:border-orange-500"
                                  />
                                </div>

                                <div className="col-span-8 sm:col-span-4">
                                  <input
                                    type="text"
                                    value={cp.location}
                                    onChange={(e) => handleCheckpointChange(dayIdx, cpIdx, 'location', e.target.value)}
                                    placeholder="地點/登山口/營地/山頂"
                                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                                  />
                                </div>

                                <div className="col-span-10 sm:col-span-5">
                                  <input
                                    type="text"
                                    value={cp.note || ''}
                                    onChange={(e) => handleCheckpointChange(dayIdx, cpIdx, 'note', e.target.value)}
                                    placeholder="節點補充說明 (選填)"
                                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                                  />
                                </div>

                                <div className="col-span-2 sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCheckpoint(dayIdx, cpIdx)}
                                    className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Mountain Stats & Media */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                    預計里程
                  </label>
                  <input
                    type="text"
                    value={formData.distanceKm}
                    onChange={(e) => handleFieldChange('distanceKm', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="例：約 52 km（可留空）"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-orange-400" />
                    最高海拔
                  </label>
                  <input
                    type="text"
                    value={formData.maxAltitude}
                    onChange={(e) => handleFieldChange('maxAltitude', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="例：3,349 m (能高南峰)（可留空）"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                    累積爬升
                  </label>
                  <input
                    type="text"
                    value={formData.elevationGain}
                    onChange={(e) => handleFieldChange('elevationGain', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="例：+3,850 m（可留空）"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                    累積下降
                  </label>
                  <input
                    type="text"
                    value={formData.elevationLoss}
                    onChange={(e) => handleFieldChange('elevationLoss', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="例：-4,200 m（可留空）"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-red-500" />
                      <span>活動路線 YouTube 影音網址</span>
                    </label>
                    {formData.videoUrl && extractYouTubeId(formData.videoUrl) ? (
                      <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ✓ 已解析影片 ID: {extractYouTubeId(formData.videoUrl)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        支援 watch?v=、youtu.be/、Shorts 格式
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.videoUrl || ''}
                    onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="例：https://www.youtube.com/watch?v=e_WLvxR6-Ns 或 https://youtu.be/..."
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    系統已全面配置 <span className="text-orange-400 font-mono">playsinline=1</span> 與跨平台防阻擋參數，確保手機（LINE Webview、Safari、Chrome）與電腦均能順暢播放。
                  </p>

                  {/* Immediate Live Preview if YouTube video detected */}
                  {formData.videoUrl && getYouTubeEmbedUrl(formData.videoUrl) && (
                    <div className="mt-3 p-3 bg-[#0c0e12] rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>後台即時試播預覽：</span>
                        <a
                          href={formData.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:underline text-[11px]"
                        >
                          開新分頁測試
                        </a>
                      </div>
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black max-w-sm">
                        <iframe
                          src={getYouTubeEmbedUrl(formData.videoUrl)!}
                          title="Preview"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-orange-400" />
                    活動封面橫幅圖片網址 (Cover Image URL)
                  </label>
                  <input
                    type="text"
                    value={formData.coverImage || ''}
                    onChange={(e) => handleFieldChange('coverImage', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="例：https://images.unsplash.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    難度等級標籤
                  </label>
                  <input
                    type="text"
                    value={formData.difficulty || ''}
                    onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                    className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    placeholder="例：百岳高級縱走 / 體能等級 4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Notices & Description */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  活動特色與詳細介紹
                </label>
                <textarea
                  rows={6}
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 leading-relaxed"
                  placeholder="輸入活動路線特色、高山景觀、文化與生態說明..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  行前必備裝備與安全須知
                </label>
                <textarea
                  rows={6}
                  value={formData.gearNotice || ''}
                  onChange={(e) => handleFieldChange('gearNotice', e.target.value)}
                  className="w-full bg-[#0c0e12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 leading-relaxed"
                  placeholder="輸入必備裝備清單、睡袋規格、涉溪鞋要求與體能評估須知..."
                />
              </div>
            </div>
          )}

          {/* Scrollable Tab Content End */}
          </div>

          {/* Modal Footer Actions - Pinned & Never Obscured */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-[#0c0e12] flex items-center justify-between rounded-b-2xl z-10 shadow-lg">
            <div className="flex items-center gap-3">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(formData)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl border border-red-800/60 transition-colors cursor-pointer"
                  title="永久刪除此行程"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>刪除行程</span>
                </button>
              )}
              {saveSuccessMsg ? (
                <span className="text-xs font-bold text-emerald-400 animate-fade-in flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  活動資料儲存成功！已同步至資料庫。
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  💡 提示：所有欄位皆允許留空存檔，方便分段編輯或僅填寫已知資訊。
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                id="btn-save-activity-changes"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-950/40 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>儲存並同步發布</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
