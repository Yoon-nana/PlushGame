// plushies.js - Emoji Plushie Database & Renderers

export const RARITY = {
  COMMON: { name: '일반', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)', border: '#22c55e' },
  UNCOMMON: { name: '고급', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.2)', border: '#3b82f6' },
  RARE: { name: '희귀', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.2)', border: '#a855f7' },
  EPIC: { name: '전설', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: '#d97706' },
  LEGENDARY: { name: '신화', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)', border: '#db2777' }
};

export const PLUSHIE_DATABASE = {
  potato: {
    id: 'potato',
    name: '정선 알감자',
    subname: '포슬포슬 감자 인형',
    emoji: '🥔',
    rarity: 'COMMON',
    basePrice: 2500,
    weight: 1.0,
    radius: 30,
    bgColor: '#fef08a',
    borderColor: '#ca8a04',
    desc: '정선 고랭지 알감자 인형! 포슬포슬한 촉감의 인기 인형.'
  },

  corn: {
    id: 'corn',
    name: '정선 찰옥수수',
    subname: '쫀득쫀득 옥수수 인형',
    emoji: '🌽',
    rarity: 'COMMON',
    basePrice: 3000,
    weight: 1.1,
    radius: 32,
    bgColor: '#fef9c3',
    borderColor: '#eab308',
    desc: '정선의 대표 명물 찰옥수수! 노란 알갱이가 매력적입니다.'
  },

  apple: {
    id: 'apple',
    name: '정선 꿀사과',
    subname: '달콤아삭 사과 인형',
    emoji: '🍎',
    rarity: 'UNCOMMON',
    basePrice: 5000,
    weight: 1.2,
    radius: 32,
    bgColor: '#fee2e2',
    borderColor: '#ef4444',
    desc: '소녀의 모자 패턴과 똑같은 정선 고랭지 꿀사과 인형.'
  },

  squirrel: {
    id: 'squirrel',
    name: '도토리 다람쥐',
    subname: '볼빵빵 다람쥐 인형',
    emoji: '🐿️',
    rarity: 'UNCOMMON',
    basePrice: 6500,
    weight: 1.25,
    radius: 33,
    bgColor: '#ffedd5',
    borderColor: '#ea580c',
    desc: '가리왕산 도토리를 잔뜩 문 볼빵빵 귀여운 다람쥐 인형.'
  },

  mountain: {
    id: 'mountain',
    name: '민둥산 억새요정',
    subname: '은빛 억새 산 인형',
    emoji: '⛰️',
    rarity: 'RARE',
    basePrice: 9000,
    weight: 1.4,
    radius: 36,
    bgColor: '#e0f2fe',
    borderColor: '#0284c7',
    desc: '가을 은빛 억새가 장관을 이루는 정선 민둥산의 정령 인형.'
  },

  otter: {
    id: 'otter',
    name: '동강 아기 수달',
    subname: '1급수 아기 수달 인형',
    emoji: '🦦',
    rarity: 'RARE',
    basePrice: 12000,
    weight: 1.35,
    radius: 34,
    bgColor: '#fef3c7',
    borderColor: '#b45309',
    desc: '정선 동강 맑은 물에 사는 귀여운 천연기념물 아기 수달.'
  },

  trout: {
    id: 'trout',
    name: '정선 황금 송어',
    subname: '황금빛 1급수 송어',
    emoji: '🐟',
    rarity: 'EPIC',
    basePrice: 22000,
    weight: 1.5,
    radius: 36,
    bgColor: '#fef08a',
    borderColor: '#f59e0b',
    desc: '정선 오장폭포 맑은 물의 전설적인 황금 송어 인형!'
  },

  piggy: {
    id: 'piggy',
    name: '정선 대박 복돼지',
    subname: '행운의 황금 복돼지',
    emoji: '🐷',
    rarity: 'LEGENDARY',
    basePrice: 38000,
    weight: 1.6,
    radius: 38,
    bgColor: '#fce7f3',
    borderColor: '#ec4899',
    desc: '뽑으면 대박 부자가 된다는 전설의 황금 코인 복돼지!'
  },

  goldbar: {
    id: 'goldbar',
    name: '하이원 골드바',
    subname: '초고가 순금 골드바',
    emoji: '💰',
    rarity: 'LEGENDARY',
    basePrice: 50000,
    weight: 1.8,
    radius: 40,
    bgColor: '#fef08a',
    borderColor: '#eab308',
    desc: '하이원 잭팟에서만 나오는 묵직한 순금 골드바!'
  }
};

// Draw Plushie Function (Emoji-based with 3D cushion base, shadow, and sparkles)
export function drawPlushieEmoji(ctx, p, x, y, size = 32, angle = 0, isShiny = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 1. Soft Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.75, size * 0.85, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Shiny Aura
  if (isShiny) {
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 14;
  }

  // 3. Plushie Cushion Base Circle / Capsule
  const template = PLUSHIE_DATABASE[p.id] || PLUSHIE_DATABASE.potato;
  const bg = template.bgColor || '#fef08a';
  const border = template.borderColor || '#ca8a04';

  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isShiny ? '#facc15' : border;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 4. Big Vibrant Emoji
  ctx.font = `${Math.round(size * 1.15)}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.emoji || template.emoji || '🧸', 0, 2);

  // 5. Shiny / Special Badge
  if (isShiny) {
    ctx.font = `${Math.round(size * 0.55)}px sans-serif`;
    ctx.fillText('✨', size * 0.55, -size * 0.55);
  }

  ctx.restore();
}

// Machine Definitions
export const CLAW_MACHINES = [
  {
    id: 'market',
    name: '제1관: 정선 5일장 머신',
    subtitle: '감자 & 옥수수 가득!',
    cost: 500,
    minUnlockEarnings: 0,
    themeColor: '#eab308',
    neonColor: '#fde047',
    plushiePool: [
      { id: 'potato', weight: 40 },
      { id: 'corn', weight: 35 },
      { id: 'apple', weight: 15 },
      { id: 'squirrel', weight: 10 }
    ]
  },
  {
    id: 'mountain',
    name: '제2관: 민둥산 자연 머신',
    subtitle: '억새 & 수달의 숲',
    cost: 1000,
    minUnlockEarnings: 8000,
    themeColor: '#06b6d4',
    neonColor: '#38bdf8',
    plushiePool: [
      { id: 'apple', weight: 25 },
      { id: 'squirrel', weight: 25 },
      { id: 'mountain', weight: 30 },
      { id: 'otter', weight: 20 }
    ]
  },
  {
    id: 'luxury',
    name: '제3관: 하이원 럭셔리 골드',
    subtitle: '황금 송어 & 대박 복돼지 잭팟!',
    cost: 2500,
    minUnlockEarnings: 25000,
    themeColor: '#ec4899',
    neonColor: '#f472b6',
    plushiePool: [
      { id: 'mountain', weight: 20 },
      { id: 'otter', weight: 20 },
      { id: 'trout', weight: 30 },
      { id: 'piggy', weight: 20 },
      { id: 'goldbar', weight: 10 }
    ]
  }
];
