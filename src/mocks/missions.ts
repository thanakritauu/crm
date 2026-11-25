/** ภารกิจ (ต้นฉบับ: event / mission) */
export type MissionStatus = "not_started" | "in_progress" | "completed" | "expired";
/** coin = ภารกิจสะสมคอยน์ (Figma): คอยน์แยกของภารกิจนั้น ใช้แลกรางวัลในภารกิจเดียวกัน */
export type MissionType = "stamp" | "quiz" | "receipt" | "checkin" | "coin";

export type Mission = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  start_date: string;
  end_date: string;
  progress: number;
  target: number;
  reward_coins: number;
  /** ไล่สีภาพปก (แทนรูปจริงที่ไม่มีสิทธิ์เข้าถึง) */
  cover: [string, string];
  /** รูปตัวอย่าง (จากภารกิจจริงของ Charmiss Club ใน public/images/missions) — ไม่มี = ภาพไล่สี */
  image?: string;
  conditions: string[];
  /** id ของรางวัลที่แลกได้หลังทำภารกิจสำเร็จ */
  reward_ids: string[];
  members_only?: boolean;
  has_leaderboard?: boolean;
  /** แสดงในแถบ "ภารกิจสำคัญ" (TabSlide) ด้านบนหน้า /mission */
  important?: boolean;
  /** ขั้นตอนการทำภารกิจ (แท็บ "ขั้นตอน" — ต้นฉบับ how_to เป็น HTML จาก Quill) */
  how_to?: string[];
  /** คำถามของภารกิจแบบ quiz (ต้นฉบับดึงทีละข้อจาก quiz-service) */
  quiz?: QuizQuestion[];
  /** คอยน์ที่ต้องใช้แลกของรางวัลหลังทำภารกิจสำเร็จ (0 = ใช้สิทธิ์ฟรี) */
  redeem_coins?: number;
  /** ระยะเวลาการแลกของรางวัล */
  redeem_start?: string;
  redeem_end?: string;
  /** ภารกิจสะสมคอยน์: กติกาการได้คอยน์ (บูลเล็ต) · รางวัลที่แลกด้วยคอยน์ของภารกิจ · คอยน์ต่อการสะสม 1 ครั้ง · คอยน์เริ่มต้น (mock) */
  coin_rules?: string[];
  coin_rewards?: { reward_id: string; coins: number }[];
  coins_per_collect?: number;
  coin_balance?: number;
  /** รางวัลที่แลกด้วยคอยน์ไปแล้ว (mock เริ่มต้น) */
  redeemed_rewards?: string[];
};

export type QuizQuestion = {
  question: string;
  hint: string;
  choices: string[];
  /** index ของคำตอบที่ถูก */
  answer: number;
};

export const missions: Mission[] = [
  {
    id: "cm-201",
    title: "ภารกิจสะสมคอยน์ ใช้แลกของรางวัลสุดคุ้ม!",
    subtitle: "สะสมคอยน์จากการซื้อสินค้าที่ร่วมรายการ",
    description: "สะสมแล้ว แลกรางวัลด้านล่างได้เลย",
    type: "coin",
    status: "in_progress",
    start_date: "2026-11-01",
    end_date: "2026-12-31",
    progress: 0,
    target: 0,
    reward_coins: 0,
    cover: ["#FCD6E2", "#F1336E"],
    image: "/images/missions/m03.jpg",
    conditions: ["คอยน์ใช้ได้เฉพาะภารกิจนี้", "แลกของรางวัลได้ภายในระยะเวลาการแลก", "ของรางวัลมีจำนวนจำกัด"],
    reward_ids: [],
    coin_rules: ["ซื้อลิปรุ่นพาวเวอร์พลัปเกิล 1 ชิ้น ได้รับ 10 คอยน์", "ซื้อครีมกันแดด 1 ชิ้น ได้รับ 5 คอยน์"],
    coin_rewards: [
      { reward_id: "r-003", coins: 5 },
      { reward_id: "r-001", coins: 20 },
    ],
    coins_per_collect: 10,
    coin_balance: 10,
    redeem_start: "2026-11-01",
    redeem_end: "2027-01-15",
    important: true,
  },
  {
    id: "cm-202",
    title: "ภารกิจสะสมคอยน์ เดือนตุลาคม",
    subtitle: "หมดเขตแลกรางวัลแล้ว",
    description: "สะสมแล้ว แลกรางวัลด้านล่างได้เลย",
    type: "coin",
    status: "expired",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    progress: 0,
    target: 0,
    reward_coins: 0,
    cover: ["#FFE9CC", "#FF9300"],
    image: "/images/missions/m04.jpg",
    conditions: ["คอยน์ใช้ได้เฉพาะภารกิจนี้"],
    reward_ids: [],
    coin_rules: ["ซื้อลิปรุ่นพาวเวอร์พลัปเกิล 1 ชิ้น ได้รับ 10 คอยน์", "ซื้อครีมกันแดด 1 ชิ้น ได้รับ 5 คอยน์"],
    coin_rewards: [
      { reward_id: "r-003", coins: 5 },
      { reward_id: "r-002", coins: 5 },
    ],
    coins_per_collect: 10,
    coin_balance: 0,
    redeemed_rewards: ["r-002"],
    redeem_start: "2026-10-01",
    redeem_end: "2026-11-10",
  },
  {
    id: "m-001",
    title: "ซื้อครบ 398.- เก็บใบเสร็จแลกส่วนลด!",
    subtitle: "โปรโมชั่นพิเศษ 15 วัน 300 สิทธิเท่านั้น 🔥",
    description: "ช้อปสินค้า Charmiss ที่ร้านค้าที่ร่วมรายการ ทุก 299 บาทต่อใบเสร็จ รับ 1 แสตมป์ สะสมครบ 5 ดวงแลกรับ Charmiss Lip Tint ฟรี 1 ชิ้น",
    type: "stamp",
    status: "in_progress",
    start_date: "2026-11-01",
    end_date: "2026-12-31",
    progress: 3,
    target: 5,
    reward_coins: 50,
    cover: ["#FCD6E2", "#F1336E"],
    conditions: [
      "1 ใบเสร็จ ยอดซื้อ 299 บาทขึ้นไป รับ 1 แสตมป์",
      "อัปโหลดใบเสร็จภายใน 7 วันหลังซื้อ",
      "จำกัด 1 สิทธิ์ต่อสมาชิก",
    ],
    reward_ids: ["r-004"],
    has_leaderboard: true,
    how_to: [
      "ซื้อสินค้า Charmiss ที่ร้านค้าที่ร่วมรายการ ยอดรวม 299 บาทขึ้นไปต่อใบเสร็จ",
      "กด \"สะสมคอยน์จากภารกิจ\" แล้วถ่ายรูปหรืออัปโหลดใบเสร็จ",
      "รอระบบตรวจสอบ รับแสตมป์ 1 ดวงต่อใบเสร็จ",
      "สะสมครบ 5 ดวง กดแลกของรางวัลได้ทันที",
    ],
    redeem_coins: 0,
    redeem_start: "2026-11-01",
    redeem_end: "2027-01-31",
    image: "/images/missions/m01.jpg",
  },
  {
    id: "m-002",
    title: "ร่วมโหวต Character สำหรับ Collection ใหม่!!!",
    subtitle: "ร่วมโหวต Character ที่คุณชอบที่สุดสำหรับ Collection ใหม่!!! แล้วรับของรางวัลได้ที่ Booth Charmiss",
    description: "ตอบคำถามเกี่ยวกับคุชชั่นรุ่นใหม่ให้ถูกทั้ง 3 ข้อ รับคอยน์ทันที",
    type: "quiz",
    status: "not_started",
    start_date: "2026-11-10",
    end_date: "2026-11-30",
    progress: 0,
    target: 3,
    reward_coins: 20,
    cover: ["#E4DCFF", "#7650FF"],
    conditions: ["ตอบได้ 1 ครั้งต่อสมาชิก", "ต้องตอบถูกทั้ง 3 ข้อ"],
    reward_ids: [],
    how_to: ["กด \"เริ่มเลย\" เพื่อเข้าสู่กิจกรรมตอบคำถาม", "ตอบคำถามทีละข้อจนครบ 3 ข้อ", "ตอบถูกครบ รับ 20 คอยน์ทันที"],
    quiz: [
      {
        question: "Charmiss Glow Airy Cushion มีค่าการปกป้องแสงแดดเท่าไร?",
        hint: "ดูได้ที่ฝาตลับคุชชั่น",
        choices: ["SPF15 PA++", "SPF30 PA+++", "SPF50+ PA++++", "ไม่มีสารกันแดด"],
        answer: 2,
      },
      {
        question: "ผิวแบบไหนที่ Glow Airy Cushion ให้ลุคหลังทา?",
        hint: "ชื่อรุ่นบอกใบ้อยู่แล้ว",
        choices: ["ผิวแมตต์ไร้เงา", "ผิวโกลว์ฉ่ำวาว บางเบา", "ผิวกึ่งแมตต์ ปกปิดหนา", "ผิวซาตินสีเข้ม"],
        answer: 1,
      },
      {
        question: "ควรตบคุชชั่นอย่างไรให้เมคอัพติดทนที่สุด?",
        hint: "ทาทีละน้อยดีกว่าทาหนาครั้งเดียว",
        choices: ["ปาดเนื้อคุชชั่นแรงๆ ครั้งเดียว", "ตบเบาๆ บางๆ แล้วค่อยเพิ่มเฉพาะจุด", "ผสมน้ำก่อนทาทุกครั้ง", "ทาหลังแต่งตาเสร็จเท่านั้น"],
        answer: 1,
      },
    ],
    image: "/images/missions/m14.png",
  },
  {
    id: "m-003",
    title: "ลุ้นเป็น 1 ใน 45 Lucky Fans รับสิทธิ์ใกล้ชิดสุดพิเศษ! จัดดอกไม้กับ “เก่ง-น้ำปิง”",
    subtitle: "ปลูกหัวใจให้บานสะพรั่งในกิจกรรมสุดพิเศษ “Charmiss Blooming Heart With Keng -Namping”",
    description: "เข้า Charmiss Club ทุกวันติดต่อกัน 7 วัน รับ 30 คอยน์",
    type: "checkin",
    status: "in_progress",
    start_date: "2026-11-01",
    end_date: "2026-11-30",
    progress: 4,
    target: 7,
    reward_coins: 30,
    cover: ["#FFE9CC", "#FF9300"],
    conditions: ["ต้องเช็คอินติดต่อกัน หากขาด 1 วันจะเริ่มนับใหม่"],
    reward_ids: [],
    how_to: ["เปิด Charmiss Club ผ่าน LINE ทุกวัน", "ระบบนับวันเช็คอินอัตโนมัติ", "ครบ 7 วันติดต่อกัน รับ 30 คอยน์"],
    image: "/images/missions/m12.jpg",
  },
  {
    id: "m-004",
    title: "อัปโหลดใบเสร็จเพื่อลุ้นเข้าร่วมกิจกรรม ผิว Win ฟินไนต์เอ้าท์กับ วิน เมธวิน",
    subtitle: "ซื้อคุชชั่น Charmiss ที่ EVEANDBOY พร้อมสิทธิ์ลุ้นเป็น Lucky Fans",
    description: "ซื้อ Charmiss Longwear Foundation แล้วอัปโหลดใบเสร็จ รับ 100 คอยน์",
    type: "receipt",
    status: "completed",
    start_date: "2026-10-01",
    end_date: "2026-11-15",
    progress: 1,
    target: 1,
    reward_coins: 100,
    cover: ["#FCD6E2", "#7650FF"],
    conditions: ["1 ใบเสร็จต่อ 1 สิทธิ์"],
    reward_ids: ["r-005"],
    members_only: true,
    has_leaderboard: true,
    how_to: ["ซื้อ Charmiss Longwear Foundation ช่องทางใดก็ได้", "อัปโหลดรูปใบเสร็จที่เห็นชื่อสินค้าชัดเจน", "รับ 100 คอยน์ และสิทธิ์แลกของรางวัล"],
    redeem_coins: 0,
    redeem_start: "2026-10-01",
    redeem_end: "2026-12-31",
    image: "/images/missions/m13.jpg",
  },
  {
    id: "m-005",
    title: "9.9 Charmiss Sales!!",
    subtitle: "ลงทะเบียนรับคูปอง Charmiss 9.9 Sales ทาง SMS ได้เลย",
    description: "ภารกิจพิเศษช่วงฮาโลวีน",
    type: "stamp",
    status: "expired",
    start_date: "2026-10-15",
    end_date: "2026-10-31",
    progress: 1,
    target: 3,
    reward_coins: 40,
    cover: ["#E5E7EB", "#9CA3AF"],
    conditions: [],
    reward_ids: [],
    image: "/images/missions/m15.png",
  },
  // ภารกิจจริงที่หมดเวลาแล้ว (ชื่อ/รูปจากหน้า /mission จริง 18 พ.ย. 2569)
  { id: "m-006", title: "ซื้อครบ 199.- เก็บใบเสร็จแลกส่วนลด!", subtitle: "โปรโมชั่นพิเศษ 15 วัน 200 สิทธิเท่านั้น 🔥", description: "โปรโมชั่นพิเศษ 15 วัน 200 สิทธิเท่านั้น 🔥", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m02.jpg", conditions: [], reward_ids: [] },
  { id: "m-007", title: "ลุ้นเป็น 1 ใน Lucky Fans 20 ท่าน กิจกรรม CHARMISS PLAYGROUND with FOURTH at Beautrium", subtitle: "ลุ้นเป็น 1 ใน Lucky Fans 20 ท่าน", description: "ลุ้นเป็น 1 ใน Lucky Fans 20 ท่าน", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m03.jpg", conditions: [], reward_ids: [] },
  { id: "m-008", title: "ลุ้นvdo call เป็น 1 ใน 5 ผู้โชคดีในกิจกรรมCharmiss Iconic Glow Video Call with Fourth", subtitle: "ลุ้นเป็น 1 ใน 5 ผู้โชคดีในกิจกรรม Charmiss Iconic Glow Video Call with Fourth", description: "ลุ้นเป็น 1 ใน 5 ผู้โชคดีในกิจกรรม Charmiss Iconic Glow Video Call with Fourth", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m04.jpg", conditions: [], reward_ids: [] },
  { id: "m-009", title: "Beautrium - ลุ้นเป็น 1 ใน 25 ผู้โชคดีในกิจกรรม Lovely Island with Thee-Wave ปากฉ่ำติดเกาะกับธีร์-เวฟ", subtitle: "จะเกิดอะไรขึ้น?! เมื่อ 2 หนุ่ม ‘ธีร์ ธีรติ’ และ ‘เวฟ ธนภัทร’ ต้องมาติดเกาะ #CharmissParadiseisland ด้วยกัน! 🏝️💖", description: "จะเกิดอะไรขึ้น?! เมื่อ 2 หนุ่ม ‘ธีร์ ธีรติ’ และ ‘เวฟ ธนภัทร’ ต้องมาติดเกาะ #CharmissParadiseisland ด้วยกัน! 🏝️💖", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m05.jpg", conditions: [], reward_ids: [] },
  { id: "m-010", title: "Line Shopping - ลุ้นเป็น 1 ใน 25 ผู้โชคดีในกิจกรรม Lovely Island with Thee-Wave ปากฉ่ำติดเกาะกับธีร์-เวฟ", subtitle: "จะเกิดอะไรขึ้น?! เมื่อ 2 หนุ่ม ‘ธีร์ ธีรติ’ และ ‘เวฟ ธนภัทร’ ต้องมาติดเกาะ #CharmissParadiseisland ด้วยกัน! 🏝️💖", description: "จะเกิดอะไรขึ้น?! เมื่อ 2 หนุ่ม ‘ธีร์ ธีรติ’ และ ‘เวฟ ธนภัทร’ ต้องมาติดเกาะ #CharmissParadiseisland ด้วยกัน! 🏝️💖", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m06.jpg", conditions: [], reward_ids: [] },
  { id: "m-011", title: "ร่วมเป็น 1 ใน 20 Super Fans และ 30 Lucky Fans ในกิจกรรม Ormazing Paradise ผิวใสออร่าสวยสะกดทุกสายตา กับ ‘ออม กรณ์นภัส’", subtitle: "🎁 ร่วมเป็น 1 ใน 20 Super Fans ที่ได้โมเมนต์สุด Exclusive ภายในงาน กับ ‘ออม กรณ์นภัส’", description: "🎁 ร่วมเป็น 1 ใน 20 Super Fans ที่ได้โมเมนต์สุด Exclusive ภายในงาน กับ ‘ออม กรณ์นภัส’", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m07.jpg", conditions: [], reward_ids: [] },
  { id: "m-012", title: "อัปโหลดใบเสร็จเพื่อลุ้นเข้าร่วมกิจกรรม \"ผิว Win ฟินไนต์เอ้าท์\" กับ วิน เมธวิน", subtitle: "ผิว WIN ฟินไนต์เอ้าท์ กับ วิน เมธวิน!", description: "ผิว WIN ฟินไนต์เอ้าท์ กับ วิน เมธวิน!", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m08.png", conditions: [], reward_ids: [] },
  { id: "m-013", title: "ลุ้น VDO call ใบเสร็จในกิจกรรม Charmiss Perfect Heart Perfect Show แมตต์นี้ ผิวพร้อมโชว์ with Tle - Firstone", subtitle: "ขั้นตอนการอัปโหลดใบเสร็จ:", description: "ขั้นตอนการอัปโหลดใบเสร็จ:", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m09.jpg", conditions: [], reward_ids: [] },
  { id: "m-014", title: "อัปโหลดใบเสร็จในกิจกรรม Charmiss Perfect Heart Perfect Show แมตต์นี้ ผิวพร้อมโชว์ with Tle - Firstone", subtitle: "ขั้นตอนการอัปโหลดใบเสร็จ:", description: "ขั้นตอนการอัปโหลดใบเสร็จ:", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m10.jpg", conditions: [], reward_ids: [] },
  { id: "m-015", title: "ลุ้นเป็น 1 ใน 15 Lucky Fans รับสิทธิ์ใกล้ชิดสุดพิเศษ! จัดดอกไม้กับ “เก่ง-น้ำปิง”", subtitle: "ปลูกหัวใจให้บานสะพรั่งในกิจกรรมสุดพิเศษ “Charmiss Blooming Heart With Keng -Namping”", description: "ปลูกหัวใจให้บานสะพรั่งในกิจกรรมสุดพิเศษ “Charmiss Blooming Heart With Keng -Namping”", type: "receipt", status: "expired", start_date: "2026-09-01", end_date: "2026-10-31", progress: 0, target: 1, reward_coins: 0, cover: ["#E5E7EB", "#9CA3AF"], image: "/images/missions/m11.jpg", conditions: [], reward_ids: [] },
];

/** โค้ดของรางวัลที่ได้หลังทำภารกิจสำเร็จ (หน้า mission/redeem-detail) */
export const missionCouponCodes: Record<string, string> = {
  "m-001": "CHMLIP-5STAMP",
  "m-004": "CHM-LW100-7QK2",
};

export type LeaderboardEntry = { rank: number; name: string; coins: number; me?: boolean };

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Mint", coins: 1280 },
  { rank: 2, name: "Fah", coins: 1145 },
  { rank: 3, name: "Bam", coins: 990 },
  { rank: 4, name: "Nune", coins: 870 },
  { rank: 5, name: "Kwan", coins: 760 },
  { rank: 6, name: "Praew", coins: 705 },
  { rank: 7, name: "Ice", coins: 640 },
  { rank: 8, name: "Namwan", coins: 590 },
  { rank: 9, name: "Jane", coins: 512 },
  { rank: 10, name: "Gift", coins: 455 },
  { rank: 12, name: "พลอย (คุณ)", coins: 320, me: true },
];
