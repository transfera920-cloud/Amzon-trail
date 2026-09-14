import { Activity, DEFAULT_LINE_URL } from '../types';

export const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'activity_001',
    title: '能高安東軍縱走',
    subtitle: '中央山脈高山草原、水鹿聚落與金色高山湖泊之極致巡禮',
    startDate: '2026-10-09',
    endDate: '2026-10-13',
    lineUrl: DEFAULT_LINE_URL,
    fee: 21800,
    feeItems: [
      { id: 'fee-001-1', name: '一般山友價', amount: 21800 },
      { id: 'fee-001-2', name: '早鳥報名優惠', amount: 19800 },
      { id: 'fee-001-3', name: '老隊員專屬優惠', amount: 18800 }
    ],
    feeNote: '包含：全行程資深高山嚮導費、天池山莊山屋住宿與搭伙、高額登山綜合保險、台中高鐵至登山口專車接駁、慶功宴、入山入園行政申辦。',
    leader: '亞馬遜特種高山領隊團隊（總領隊：林教練 / 隨隊安全官 2 名）',
    maxParticipants: 12,
    currentParticipants: 8,
    meetingLocation: '高鐵台中站 6 號出口 / 埔里地理中心碑',
    meetingTime: 'Day 1 上午 07:30 準時集合',
    distanceKm: '約 52 km',
    elevationGain: '+3,850 m',
    elevationLoss: '-4,200 m',
    maxAltitude: '3,349 m (能高南峰)',
    videoUrl: 'https://www.youtube.com/watch?v=e_WLvxR6-Ns',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    difficulty: '百岳高級縱走（建議需具備至少 3 座以上百岳重裝過夜經驗）',
    status: 'recruiting',
    description: '能高安東軍縱走是台灣百岳中最負盛名的經典草原大縱走。從南投仁愛鄉屯原或雲天宮登山口啟程，縱走能高主峰、能高南峰、光頭山、白石山至安東軍山。沿線綿延不絕的箭竹高山大草原、白石池、萬里池、屯鹿池等高山湖泊，成群野生台灣水鹿相伴，最後下切萬大南溪溯溪出奧萬大。',
    gearNotice: '1. 需自備個人重裝睡袋（建議舒適溫度 -5°C）、睡墊、頭燈及備用電池。\n2. 必備兩截式高透氣登山雨衣雨褲、保暖羽絨衣、防風軟殼。\n3. 溯溪鞋或水陸兩用鞋（第五天下切萬大南溪涉溪使用）、登山杖兩支。\n4. 個人藥品、防曬用品、高熱量行動糧（5日份）。',
    itinerary: [
      {
        id: 'day-1',
        day: 1,
        title: '登山口整裝出發 → 雲海保線所 → 夜宿天池山莊',
        estimatedHours: '7.5',
        notes: '首日緩步上升適應高度，途經著名的雲海保線所與能高吊橋。',
        checkpoints: [
          { id: 'c-1-1', time: '10:00', location: '雲天宮登山口', note: '全員抵達登山口，清點公裝與入園查核後出發', isHighlight: true },
          { id: 'c-1-2', time: '14:00', location: '雲海保線所', note: '小休整補、午餐行動糧補充、補充飲水' },
          { id: 'c-1-3', time: '17:30', location: '天池山莊', note: '抵達「五星級」天池山莊，分配床位、享用晚餐與高山晚霞', isHighlight: true }
        ]
      },
      {
        id: 'day-2',
        day: 2,
        title: '縣界埡口 → 能高主峰 → 攀岩拉繩 → 能高南峰 → 南鞍營地',
        estimatedHours: '12.9',
        notes: '本行程最硬核的一天！包含垂直岩壁拉繩與連續陡上能高南峰。',
        checkpoints: [
          { id: 'c-2-1', time: '05:00', location: '天池山莊', note: '晨喚出發，迎著拂曉朝縣界埡口前進' },
          { id: 'c-2-2', time: '05:50', location: '縣界埡口', note: '光被八表紀念碑旁鞍部，展望中央山脈脊樑' },
          { id: 'c-2-3', time: '08:40', location: '卡賀爾山', note: '牛角造型奇岩，風勢強勁' },
          { id: 'c-2-4', time: '11:20', location: '能高山主峰', note: '標高 3,262m，三等三角點，大景環繞', isHighlight: true },
          { id: 'c-2-5', time: '11:40', location: '能高小屋遺址', note: '日治時期遺址，短暫停歇' },
          { id: 'c-2-6', time: '11:55', location: '台灣池營地', note: '形似台灣番薯形狀的高山水池' },
          { id: 'c-2-7', time: '12:25', location: '大陸池營地', note: '補充行動水' },
          { id: 'c-2-8', time: '13:30', location: '垂直岩壁拉繩', note: '近乎垂直的岩壁地形，全員互相照應拉繩攀爬', isHighlight: true },
          { id: 'c-2-9', time: '15:10', location: '能高南峰北嶺', note: '巨石險崖段' },
          { id: 'c-2-10', time: '16:35', location: '南峰岔路口', note: '卸下重裝輕裝攻頂' },
          { id: 'c-2-11', time: '16:40', location: '能高山南峰', note: '標高 3,349m，二等三角點，能高全稜最高峰！', isHighlight: true },
          { id: 'c-2-12', time: '16:45', location: '南峰岔路口', note: '返回岔路，上重裝' },
          { id: 'c-2-13', time: '17:55', location: '南峰南鞍營地', note: '抵達南鞍營地紮營，取水、晚餐與休整', isHighlight: true }
        ]
      },
      {
        id: 'day-3',
        day: 3,
        title: '南鞍營地 → 光頭山 → 白石池 → 白石山 → 萬里池 → 屯鹿池',
        estimatedHours: '9.3',
        notes: '高山湖泊與黃金大草原巡禮，此段是水鹿聚集最豐富的夢幻仙境。',
        checkpoints: [
          { id: 'c-3-1', time: '06:00', location: '南峰南鞍營地', note: '晨光露營啟程' },
          { id: 'c-3-2', time: '07:30', location: '3039鞍營地', note: '綠草如茵鞍部' },
          { id: 'c-3-3', time: '08:30', location: '光頭山', note: '標高 3,060m，三等三角點，草坡平緩廣闊', isHighlight: true },
          { id: 'c-3-4', time: '10:10', location: '白石池', note: '湖畔宛如明鏡，常遇親人水鹿群飲水嬉戲', isHighlight: true },
          { id: 'c-3-5', time: '12:20', location: '白石山', note: '標高 3,110m，三等三角點，俯瞰萬里池全貌', isHighlight: true },
          { id: 'c-3-6', time: '13:20', location: '萬里池', note: '台灣面積第二大的高山湖泊，穿梭沼澤草甸', isHighlight: true },
          { id: 'c-3-7', time: '15:20', location: '屯鹿池', note: '抵達屯鹿池畔紮營，欣賞夕陽水鹿金色草坡倒影', isHighlight: true }
        ]
      },
      {
        id: 'day-4',
        day: 4,
        title: '屯鹿池 → 登頂安東軍山 → 獵寮舊址 → 溪床營地',
        estimatedHours: '7.3',
        notes: '最後一座百岳安東軍山攻頂，隨後告別高山草原，一路陡降至溪谷森林。',
        checkpoints: [
          { id: 'c-4-1', time: '06:00', location: '屯鹿池', note: '拔營出發' },
          { id: 'c-4-2', time: '06:45', location: '三岔路口', note: '卸下大背包，輕裝攻頂安東軍山' },
          { id: 'c-4-3', time: '07:35', location: '安東軍山', note: '標高 3,068m，一等三角點，360度極致環景！', isHighlight: true },
          { id: 'c-4-4', time: '08:10', location: '三岔路口', note: '返回三岔路口，整裝開始進入連續陡下段' },
          { id: 'c-4-5', time: '09:30', location: '第一獵寮', note: '林道休息點' },
          { id: 'c-4-6', time: '10:20', location: '紅檜巨木', note: '千年紅檜神木，壯觀蒼鬱', isHighlight: true },
          { id: 'c-4-7', time: '11:30', location: '第二獵寮', note: '午間補給小休' },
          { id: 'c-4-8', time: '12:20', location: '大崩壁', note: '高繞崩塌地形，小心腳步碎石' },
          { id: 'c-4-9', time: '13:20', location: '溪床營地', note: '抵達萬大南溪溪床營地，享受清澈溪水與營火星空', isHighlight: true }
        ]
      },
      {
        id: 'day-5',
        day: 5,
        title: '溪床營地 → 涉水合匯點 → 越嶺松峰嶺 → 奧萬大吊橋平安賦歸',
        estimatedHours: '5.4',
        notes: '順溪床涉溪下行，穿越數個越嶺點與松峰嶺，抵達奧萬大森林遊樂區。',
        checkpoints: [
          { id: 'c-5-1', time: '06:00', location: '溪床營地', note: '整裝出發，換上水陸涉溪鞋' },
          { id: 'c-5-2', time: '06:10', location: '金杏真路岔路口', note: '萬大南溪支流' },
          { id: 'c-5-3', time: '06:35', location: '萬大南溪合匯點', note: '溪水寬闊，由領隊架設安全涉溪點' },
          { id: 'c-5-4', time: '07:10', location: '第二支流合匯點', note: '沿溪床礫石前進' },
          { id: 'c-5-5', time: '07:45', location: '第三支流合匯點', note: '短暫休憩' },
          { id: 'c-5-6', time: '08:30', location: '第四支流合匯點', note: '告別溪床，準備切入上攀越嶺步道' },
          { id: 'c-5-7', time: '09:20', location: '第一越嶺點', note: '之字形陡上越嶺' },
          { id: 'c-5-8', time: '10:10', location: '第二越嶺點', note: '林相轉為美麗楓林與松針林' },
          { id: 'c-5-9', time: '10:50', location: '第三越嶺點（松峰嶺）', note: '踏在厚實的松針地毯上，心情放鬆', isHighlight: true },
          { id: 'c-5-10', time: '11:25', location: '奧萬大吊橋', note: '抵達奧萬大森林遊樂區，圓滿完成 5 日長征！', isHighlight: true }
        ]
      }
    ]
  },
  {
    id: 'activity_002',
    title: '馬博橫斷長程縱走',
    subtitle: '中央山脈核心大斷崖・烏拉孟斷崖・馬利加南・馬博拉斯名峰巡禮',
    startDate: '2026-11-14',
    endDate: '2026-11-21',
    lineUrl: DEFAULT_LINE_URL,
    fee: 28800,
    feeItems: [
      { id: 'fee-002-1', name: '標準費用 (全包式)', amount: 28800 },
      { id: 'fee-002-2', name: '早鳥專案價', amount: 26800 }
    ],
    feeNote: '包含：資深高山探險嚮導團隊、山屋營位規劃、高額綜合登山保險、東埔及中平林道專車接駁、入山入園全套行政手續。',
    leader: '亞馬遜極限高山隊（總領隊：林教練 / 隨隊技術教練 2 名）',
    maxParticipants: 10,
    currentParticipants: 4,
    meetingLocation: '高鐵台中站 6 號出口 / 水里火車站',
    meetingTime: 'Day 1 上午 06:30 準時出發',
    distanceKm: '約 84 km',
    elevationGain: '+5,400 m',
    elevationLoss: '-5,800 m',
    maxAltitude: '3,785 m (馬博拉斯山)',
    videoUrl: 'https://www.youtube.com/watch?v=KR-93Wikan4',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    difficulty: '百岳特級長程縱走（四大障礙之一，需具備多日重裝過夜與懸崖拉繩經驗）',
    status: 'recruiting',
    description: '馬博橫斷名列台灣百岳四大障礙之一。路線橫亙於南投信義鄉與花蓮卓溪鄉之間，串連八通關山、秀姑巒山、馬博拉斯山、駒盆山、馬利加南山、馬布谷與喀西帕南山等名峰。沿途有秀姑坪白木林、險峻驚險的烏拉孟斷崖、塔馬斯府斷崖，以及被山友譽為仙境的馬布谷高山谷地。',
    gearNotice: '1. 必備岩盔與技術攀爬耐磨手套（通過烏拉孟斷崖及塔馬斯府斷崖必用）。\n2. 舒適溫度 -10°C 羽絨睡袋、充氣睡墊、兩截式高階耐磨雨衣褲。\n3. 8日完整高熱量行動糧、個人藥品、備用頭燈電池。\n4. 建議配備衛星通訊與個人 GPS 軌跡導航設備。',
    itinerary: [
      {
        id: 'mb-day-1',
        day: 1,
        title: '東埔登山口 → 雲龍瀑布 → 樂樂山屋 → 宿觀高坪',
        estimatedHours: '7.0',
        checkpoints: [
          { id: 'mb-c1', time: '08:00', location: '東埔登山口', note: '重裝整檢出發', isHighlight: true },
          { id: 'mb-c2', time: '11:30', location: '乙女瀑布', note: '林道午餐行動糧' },
          { id: 'mb-c3', time: '16:00', location: '觀高坪營地', note: '第一夜紮營適應高度', isHighlight: true }
        ]
      },
      {
        id: 'mb-day-2',
        day: 2,
        title: '觀高坪 → 八通關草原 → 八通關山 → 宿中央金礦山屋',
        estimatedHours: '8.0',
        checkpoints: [
          { id: 'mb-c4', time: '06:00', location: '觀高坪', note: '啟程高繞八通關西峰' },
          { id: 'mb-c5', time: '09:30', location: '八通關山登山口', note: '輕裝攻頂八通關山 (3,335m)', isHighlight: true },
          { id: 'mb-c6', time: '14:30', location: '中央金礦山屋', note: '抵達山屋整補水源', isHighlight: true }
        ]
      },
      {
        id: 'mb-day-3',
        day: 3,
        title: '中央金礦 → 白洋金礦 → 秀姑坪 → 登頂秀姑巒山 → 宿馬博山屋',
        estimatedHours: '9.5',
        checkpoints: [
          { id: 'mb-c7', time: '05:30', location: '中央金礦山屋', note: '晨光陡上' },
          { id: 'mb-c8', time: '09:00', location: '秀姑坪', note: '枯木白木林壯麗景致', isHighlight: true },
          { id: 'mb-c9', time: '11:00', location: '秀姑巒山', note: '中央山脈最高峰 3,805m！', isHighlight: true },
          { id: 'mb-c10', time: '15:30', location: '馬博拉斯山屋', note: '山屋紮營，備戰明日斷崖', isHighlight: true }
        ]
      },
      {
        id: 'mb-day-4',
        day: 4,
        title: '馬博山屋 → 登頂馬博拉斯山 → 輕裝駒盆山往返 → 宿馬博山屋',
        estimatedHours: '10.0',
        checkpoints: [
          { id: 'mb-c11', time: '05:00', location: '馬博山屋', note: '登頂馬博拉斯山 (3,785m)', isHighlight: true },
          { id: 'mb-c12', time: '08:30', location: '駒盆山', note: '標高 3,022m，展望郡大溪', isHighlight: true },
          { id: 'mb-c13', time: '15:30', location: '馬博山屋', note: '返抵山屋休整補充體力' }
        ]
      },
      {
        id: 'mb-day-5',
        day: 5,
        title: '馬博山屋 → 挑戰烏拉孟斷崖 → 馬利加南山 → 宿馬利加南山屋',
        estimatedHours: '8.5',
        checkpoints: [
          { id: 'mb-c14', time: '06:00', location: '馬博山屋出發', note: '全員佩戴岩盔與手套' },
          { id: 'mb-c15', time: '07:30', location: '烏拉孟斷崖', note: '極度險峻刀刃岩稜，全員依序拉繩通過', isHighlight: true },
          { id: 'mb-c16', time: '12:00', location: '馬利加南山', note: '標高 3,546m，氣勢磅礴', isHighlight: true },
          { id: 'mb-c17', time: '15:00', location: '馬利加南東峰山屋', note: '平安抵達山屋', isHighlight: true }
        ]
      },
      {
        id: 'mb-day-6',
        day: 6,
        title: '馬利加南東峰山屋 → 塔馬斯府斷崖 → 抵達絕美馬布谷山屋',
        estimatedHours: '7.5',
        checkpoints: [
          { id: 'mb-c18', time: '06:00', location: '山屋出發', note: '穿越巨石稜線' },
          { id: 'mb-c19', time: '08:30', location: '塔馬斯府斷崖', note: '裸露感十足的崩壁段', isHighlight: true },
          { id: 'mb-c20', time: '13:30', location: '馬布谷山屋', note: '高山綠茵廣闊谷地，宛如世外桃源', isHighlight: true }
        ]
      },
      {
        id: 'mb-day-7',
        day: 7,
        title: '馬布谷山屋 → 登頂喀西帕南山 → 太平谷 → 宿中平林道 35K 工寮',
        estimatedHours: '9.0',
        checkpoints: [
          { id: 'mb-c21', time: '05:30', location: '馬布谷啟程', note: '告別美麗谷地' },
          { id: 'mb-c22', time: '07:30', location: '喀西帕南山', note: '標高 3,276m，馬博最後百岳！', isHighlight: true },
          { id: 'mb-c23', time: '11:00', location: '太平谷', note: '乾涸石塊與青苔原始谷地' },
          { id: 'mb-c24', time: '15:30', location: '中平林道 35K 工寮', note: '林道紮營', isHighlight: true }
        ]
      },
      {
        id: 'mb-day-8',
        day: 8,
        title: '中平林道 35K → 通過大崩壁 → 19K 水泥橋接駁點 → 玉里慶功宴',
        estimatedHours: '6.0',
        checkpoints: [
          { id: 'mb-c25', time: '06:00', location: '35K 出發', note: '下切林道芒草路段' },
          { id: 'mb-c26', time: '12:00', location: '中平林道 19K 水泥橋', note: '專車接駁全員平安完登！', isHighlight: true }
        ]
      }
    ]
  },
  {
    id: 'activity_003',
    title: '奇萊東稜荒野縱走',
    subtitle: '台灣百岳四大障礙之一・原始冷杉巨林與極限耐力挑戰',
    startDate: '2026-11-20',
    endDate: '2026-11-25',
    lineUrl: DEFAULT_LINE_URL,
    fee: 24800,
    feeNote: '包含：高階探險嚮導 2 名、衛星通訊保障、全險、登山口接駁、慶功聚餐。',
    leader: '亞馬遜探險嚮導 高教練',
    maxParticipants: 8,
    currentParticipants: 5,
    meetingLocation: '台中高鐵站 / 埔里',
    meetingTime: 'Day 1 上午 07:00',
    distanceKm: '約 56 km',
    elevationGain: '+4,100 m',
    elevationLoss: '-5,900 m',
    maxAltitude: '3,560 m (奇萊北峰)',
    videoUrl: 'https://www.youtube.com/watch?v=2VgJTIVYeCM',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
    difficulty: '百岳極限縱走（四大障礙）',
    status: 'recruiting',
    description: '奇萊東稜為百岳四大障礙之一，包含奇萊北峰、磐石山、太魯閣大山、立霧主山、帕托魯山等五座百岳。穿越無窮無盡的極品箭竹海、倒木林、極限拉繩與研海林道下切中橫岳王亭。',
    gearNotice: '極限耐力縱走，建議自備防水手套、防割護膝、衛星通訊定位裝備。',
    itinerary: [
      {
        id: 'qldl-1',
        day: 1,
        title: '合歡山滑雪山莊 → 黑水塘 → 奇萊北峰 → 驚嘆號營地',
        estimatedHours: '9.0',
        checkpoints: [
          { id: 'ql-c1', time: '08:00', location: '奇萊登山口', note: '奇萊主北步道起點', isHighlight: true },
          { id: 'ql-c2', time: '13:00', location: '奇萊北峰', note: '標高 3,560m 一等三角點', isHighlight: true },
          { id: 'ql-c3', time: '17:00', location: '驚嘆號營地', note: '第一夜高山露營' }
        ]
      },
      {
        id: 'qldl-2',
        day: 2,
        title: '驚嘆號營地 → 磐石西峰 → 磐石山 → 鐵線斷崖 → 北鞍營地',
        estimatedHours: '8.5',
        checkpoints: [
          { id: 'ql-c4', time: '06:00', location: '驚嘆號營地', note: '出發' },
          { id: 'ql-c5', time: '09:00', location: '磐石山', note: '標高 3,106m', isHighlight: true },
          { id: 'ql-c6', time: '15:30', location: '北鞍營地', note: '水源穩定' }
        ]
      },
      {
        id: 'qldl-3',
        day: 3,
        title: '北鞍營地 → 輕裝登頂太魯閣大山 → 平安池',
        estimatedHours: '8.0',
        checkpoints: [
          { id: 'ql-c7', time: '05:30', location: '北鞍營地', note: '輕裝啟程' },
          { id: 'ql-c8', time: '08:00', location: '太魯閣大山', note: '標高 3,283m，二等三角點', isHighlight: true },
          { id: 'ql-c9', time: '14:30', location: '平安池', note: '高山森林甘泉大水池', isHighlight: true }
        ]
      },
      {
        id: 'qldl-4',
        day: 4,
        title: '平安池 → 大石公 → 立霧主山 → 乾水池營地',
        estimatedHours: '7.5',
        checkpoints: [
          { id: 'ql-c10', time: '06:00', location: '平安池', note: '出發' },
          { id: 'ql-c11', time: '10:00', location: '立霧主山', note: '標高 3,070m，全山皆大理石岩', isHighlight: true },
          { id: 'ql-c12', time: '14:30', location: '乾水池營地', note: '紮營' }
        ]
      },
      {
        id: 'qldl-5',
        day: 5,
        title: '乾水池營地 → 輕裝帕托魯山 → 研海林道 12K 工寮',
        estimatedHours: '10.0',
        checkpoints: [
          { id: 'ql-c13', time: '05:00', location: '三岔路口', note: '輕裝攻頂' },
          { id: 'ql-c14', time: '08:30', location: '帕托魯山', note: '標高 3,101m，東稜最後百岳', isHighlight: true },
          { id: 'ql-c15', time: '16:00', location: '研海林道 12K 工寮', note: '廢棄工寮營地' }
        ]
      },
      {
        id: 'qldl-6',
        day: 6,
        title: '12K 工寮 → 索道頭 → 岳王亭吊橋 → 榮耀平安歸來',
        estimatedHours: '6.5',
        checkpoints: [
          { id: 'ql-c16', time: '06:00', location: '12K 工寮', note: '終極下切' },
          { id: 'ql-c17', time: '10:00', location: '流籠頭 / 岳王亭吊橋', note: '抵達中橫公路岳王亭，圓滿完攀！', isHighlight: true }
        ]
      }
    ]
  },
  {
    id: 'activity_004',
    title: '中央尖山 溯溪攀登縱走',
    subtitle: '台灣第一尖・三尖之首・中央山脈最雄偉金字塔巨峰',
    startDate: '2026-11-06',
    endDate: '2026-11-09',
    lineUrl: DEFAULT_LINE_URL,
    fee: 16800,
    feeNote: '包含：全行程資深高山嚮導、南湖溪木屋/中央尖溪木屋紮營協作、專車接駁、入園行政手續。',
    leader: '亞馬遜技術攀登領隊 陳教練',
    maxParticipants: 10,
    currentParticipants: 6,
    meetingLocation: '宜蘭羅東火車站後站 / 勝光登山口',
    meetingTime: 'Day 1 上午 06:30',
    distanceKm: '約 38 km',
    elevationGain: '+3,200 m',
    elevationLoss: '-3,200 m',
    maxAltitude: '3,705 m (中央尖山)',
    videoUrl: 'https://www.youtube.com/watch?v=d2CjDj7lbpI',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    difficulty: '百岳特級挑戰（碎石陡坡與連續涉水）',
    status: 'recruiting',
    description: '中央尖山海拔 3,705 公尺，與大霸尖山、達芬尖山並列為「台灣三尖之首」。南壁如刀削斧劈，北側高聳如金字塔，以碎石大崩壁與中央尖溪溯溪聞名，是許多登山者心目中最令人敬畏的高山殿堂。',
    gearNotice: '1. 岩盔（必備，攀爬中央尖碎石坡防落石使用）。\n2. 溯溪鞋或菜瓜布底防滑鞋。\n3. 高耐磨登山長褲與厚底羊毛襪。',
    itinerary: [
      {
        id: 'zyj-day-1',
        day: 1,
        title: '勝光登山口 → 雲稜山莊 → 宿南湖溪木屋',
        estimatedHours: '8.0',
        checkpoints: [
          { id: 'zyj-c1', time: '07:00', location: '勝光登山口', note: '出發整裝', isHighlight: true },
          { id: 'zyj-c2', time: '11:30', location: '多加神山 / 木杆鞍部', note: '林道分岔路口' },
          { id: 'zyj-c3', time: '15:30', location: '南湖溪木屋', note: '抵達南湖溪畔紮營', isHighlight: true }
        ]
      },
      {
        id: 'zyj-day-2',
        day: 2,
        title: '南湖溪木屋 → 越嶺點 → 中央尖溪木屋',
        estimatedHours: '6.0',
        checkpoints: [
          { id: 'zyj-c4', time: '06:30', location: '南湖溪木屋', note: '換溯溪鞋啟程' },
          { id: 'zyj-c5', time: '09:00', location: '南湖中央尖越嶺鞍部', note: '陡上越嶺' },
          { id: 'zyj-c6', time: '13:00', location: '中央尖溪木屋營地', note: '紮營並巡查溪水狀況', isHighlight: true }
        ]
      },
      {
        id: 'zyj-day-3',
        day: 3,
        title: '中央尖溪木屋 → 主峰碎石坡 → 登頂中央尖山 → 回木屋',
        estimatedHours: '10.5',
        checkpoints: [
          { id: 'zyj-c7', time: '04:30', location: '中央尖溪木屋', note: '戴頭燈沿溪床上溯' },
          { id: 'zyj-c8', time: '08:00', location: '中央尖主東鞍部碎石坡', note: '戴岩盔小心落石', isHighlight: true },
          { id: 'zyj-c9', time: '09:30', location: '中央尖山山頂', note: '標高 3,705m，台灣三尖之首！', isHighlight: true },
          { id: 'zyj-c10', time: '15:30', location: '中央尖溪木屋', note: '安全返抵營地慶祝' }
        ]
      },
      {
        id: 'zyj-day-4',
        day: 4,
        title: '中央尖溪木屋 → 南湖溪 → 木杆鞍部 → 勝光登山口',
        estimatedHours: '8.5',
        checkpoints: [
          { id: 'zyj-c11', time: '06:00', location: '中央尖溪木屋', note: '回程啟行' },
          { id: 'zyj-c12', time: '11:00', location: '木杆鞍部', note: '接回主線' },
          { id: 'zyj-c13', time: '15:00', location: '勝光登山口', note: '全員平安完登賦歸', isHighlight: true }
        ]
      }
    ]
  },
  {
    id: 'activity_005',
    title: '南大武山 3日百岳探險',
    subtitle: '屏東佳興林道・吐蛇流山・前峰危稜與南大武山 2,841m 原始荒野',
    startDate: '2026-10-24',
    endDate: '2026-10-26',
    lineUrl: DEFAULT_LINE_URL,
    fee: 14800,
    feeNote: '包含：全行程資深高山嚮導帶領、佳興山莊住宿安排、高鐵左營/屏東專車接駁、高額綜合登山保險、入山入園行政申辦。',
    leader: '亞馬遜探險領隊團隊（總領隊：林教練 / 隨隊安全官 1 名）',
    maxParticipants: 10,
    currentParticipants: 6,
    meetingLocation: '左營高鐵站 5 號出口 / 潮州火車站',
    meetingTime: 'Day 1 上午 07:30 準時集合出發',
    distanceKm: '約 36 km',
    elevationGain: '+2,450 m',
    elevationLoss: '-2,450 m',
    maxAltitude: '2,841 m (南大武山)',
    videoUrl: 'https://www.youtube.com/watch?v=e_WLvxR6-Ns',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    difficulty: '百岳中高級挑戰（芒草區陡升、前峰危稜與長時程耐力）',
    status: 'recruiting',
    description: '南大武山海拔 2,841 公尺，與北大武山同為屏東地標名峰。路線從泰武鄉佳興林道起登，途經文丁山、吐蛇流山，進入原始芒草陡坡、南大武前峰危稜，登頂壯闊孤絕的南大武山，是資深山友探尋百岳原始荒野的經典路線。',
    gearNotice: '1. 需穿著長袖排汗衣與耐磨長褲，必備厚手套（穿梭芒草區防割傷使用）。\n2. 兩截式登山雨衣褲、頭燈及備用電池、保暖羽絨外套。\n3. 3日份高熱量行動糧、個人常備藥品、登山杖兩支。',
    itinerary: [
      {
        id: 'ndw-day-1',
        day: 1,
        title: '停車場登山口 → 文丁山叉路口 → 佳興山莊',
        estimatedHours: '5.2',
        notes: '由停車場登山口整裝出發，緩升至佳興山莊夜宿。',
        checkpoints: [
          { id: 'ndw-1-1', time: '10:00', location: '停車場登山口', note: '登山口整裝出發', isHighlight: true },
          { id: 'ndw-1-2', time: '12:03', location: '文丁山叉路口休息', note: '午間行動糧小休' },
          { id: 'ndw-1-3', time: '12:47', location: '休息後出發', note: '整裝續行' },
          { id: 'ndw-1-4', time: '15:11', location: '佳興山莊', note: '抵達佳興山莊，入住休整備戰明日長征', isHighlight: true }
        ]
      },
      {
        id: 'ndw-day-2',
        day: 2,
        title: '佳興山莊 → 吐蛇流山 → 南大武前峰 → 登頂南大武山2841m → 佳興山莊',
        estimatedHours: '12.7',
        notes: '挑戰日！歷經崩塌拉繩、長距陡上芒草區、前峰危稜攀爬，攻頂南大武山。',
        checkpoints: [
          { id: 'ndw-2-1', time: '05:00', location: '出發', note: '晨喚戴頭燈出發' },
          { id: 'ndw-2-2', time: '06:07', location: '吐蛇流登山口', note: '抵達登山口' },
          { id: 'ndw-2-3', time: '06:10', location: '吐蛇流營地', note: '林間營地' },
          { id: 'ndw-2-4', time: '06:17', location: '可營地', note: '平坦空地' },
          { id: 'ndw-2-5', time: '06:32', location: '崩塌拉繩', note: '注意腳步小心拉繩通過', isHighlight: true },
          { id: 'ndw-2-6', time: '06:41', location: '捷徑', note: '林道捷徑' },
          { id: 'ndw-2-7', time: '06:49', location: '登山口離開林道', note: '切入原始山徑' },
          { id: 'ndw-2-8', time: '08:01', location: '稜線', note: '上至主稜，風勢漸強' },
          { id: 'ndw-2-9', time: '08:47', location: '進入芒草區陡上', note: '穿著長袖手套防割' },
          { id: 'ndw-2-10', time: '09:33', location: '芒草續上', note: '持續陡升攀登' },
          { id: 'ndw-2-11', time: '10:52', location: '脫離芒草', note: '出芒草林，展望開闊' },
          { id: 'ndw-2-12', time: '11:27', location: '南大武前峰', note: '前峰展望絕佳', isHighlight: true },
          { id: 'ndw-2-13', time: '11:41', location: '危稜', note: '兩側懸崖深谷，保持專注通過', isHighlight: true },
          { id: 'ndw-2-14', time: '12:30', location: '南大武山2841m', note: '標高 2,841m 二等三角點，全員登頂慶祝！', isHighlight: true },
          { id: 'ndw-2-15', time: '13:04', location: '下山', note: '開始原路折返下山' },
          { id: 'ndw-2-16', time: '13:26', location: '回到危稜', note: '謹慎通過危稜' },
          { id: 'ndw-2-17', time: '13:41', location: '回到前峰', note: '短暫小休' },
          { id: 'ndw-2-18', time: '14:00', location: '進芒草區', note: '下切芒草林' },
          { id: 'ndw-2-19', time: '16:17', location: '回到林道', note: '接回平緩林道' },
          { id: 'ndw-2-20', time: '16:29', location: '過崩塌', note: '通過拉繩崩塌段' },
          { id: 'ndw-2-21', time: '16:42', location: '吐蛇流山登山口', note: '輕裝叉路' },
          { id: 'ndw-2-22', time: '16:46', location: '吐蛇流山1584m', note: '順訪吐蛇流山 (1,584m)', isHighlight: true },
          { id: 'ndw-2-23', time: '16:53', location: '接回林道', note: '林道漫步' },
          { id: 'ndw-2-24', time: '17:41', location: '佳興山莊', note: '平安返回佳興山莊，熱食晚餐與休整', isHighlight: true }
        ]
      },
      {
        id: 'ndw-day-3',
        day: 3,
        title: '佳興山莊 → 文丁山877m → 祖靈聖地 → 停車場登山口賦歸',
        estimatedHours: '3.6',
        notes: '最後一日順訪文丁山，沿溪床與鐵門返回登山口圓滿完登。',
        checkpoints: [
          { id: 'ndw-3-1', time: '06:00', location: '出發回家', note: '整理行囊下山' },
          { id: 'ndw-3-2', time: '07:20', location: '文丁山登山口', note: '登山口卸背包' },
          { id: 'ndw-3-3', time: '07:32', location: '文丁山877m', note: '標高 877m 三等三角點', isHighlight: true },
          { id: 'ndw-3-4', time: '07:59', location: '回到登山口', note: '取回背包' },
          { id: 'ndw-3-5', time: '08:08', location: '上背包下山', note: '重裝續行下山' },
          { id: 'ndw-3-6', time: '08:26', location: '祖靈聖地出口(禁入)', note: '敬畏排灣族傳統聖地，遵守規定' },
          { id: 'ndw-3-7', time: '08:45', location: '祖靈聖地入口(禁入)', note: '聖地路段勿擅闖' },
          { id: 'ndw-3-8', time: '09:20', location: '回到溪床', note: '抵達寬闊溪床' },
          { id: 'ndw-3-9', time: '09:36', location: '回到鐵門', note: '通過管制鐵門' },
          { id: 'ndw-3-10', time: '09:38', location: '停車場登山口', note: '全員平安返回停車場登山口，接駁返程！', isHighlight: true }
        ]
      }
    ]
  }
];
