// ============================================================================
// Jeongseon Plush Game (정선 인형뽑기) - Full Standalone Engine
// Depth-Synchronized Laser-Targeted Claw Kinematics
// Economy Balance: 1000 / 2500 / 5000 KRW
// ============================================================================

function safeRoundRect(ctx, x, y, width, height, radius = 8) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = {
      tl: radius.tl || 0,
      tr: radius.tr || 0,
      br: radius.br || 0,
      bl: radius.bl || 0
    };
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

function getFloorScreenY(cabinetY) {
  return 140 + (cabinetY - 50) * 0.93;
}

// --- 1. Plushies & Rarity Database (Scaled for 1,000 / 2,500 / 5,000) ---
const RARITY = {
  COMMON: { name: '일반', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)', border: '#22c55e' },
  UNCOMMON: { name: '고급', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.2)', border: '#3b82f6' },
  RARE: { name: '희귀', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.2)', border: '#a855f7' },
  EPIC: { name: '전설', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: '#d97706' },
  LEGENDARY: { name: '신화', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)', border: '#db2777' }
};

const PLUSHIE_DATABASE = {
  potato: {
    id: 'potato',
    name: '정선 알감자',
    subname: '포슬포슬 감자 인형',
    emoji: '🥔',
    rarity: 'COMMON',
    basePrice: 3500, // 1회 1,000원 대비 3.5배 수익!
    weight: 1.0,
    radius: 28,
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
    basePrice: 4800, // 4.8배 수익!
    weight: 1.1,
    radius: 30,
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
    basePrice: 8500,
    weight: 1.2,
    radius: 30,
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
    basePrice: 12000,
    weight: 1.25,
    radius: 31,
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
    basePrice: 20000,
    weight: 1.4,
    radius: 34,
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
    basePrice: 32000,
    weight: 1.35,
    radius: 32,
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
    basePrice: 55000,
    weight: 1.5,
    radius: 35,
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
    basePrice: 95000,
    weight: 1.6,
    radius: 36,
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
    basePrice: 160000,
    weight: 1.8,
    radius: 38,
    bgColor: '#fef08a',
    borderColor: '#eab308',
    desc: '하이원 잭팟에서만 나오는 묵직한 순금 골드바!'
  }
};

// 1,000 / 2,500 / 5,000 KRW Tier Configurations
const CLAW_MACHINES = [
  {
    id: 'market',
    name: '제1관: 정선 5일장 머신',
    subtitle: '감자 & 옥수수 가득!',
    cost: 1000,
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
    cost: 2500,
    minUnlockEarnings: 15000,
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
    cost: 5000,
    minUnlockEarnings: 50000,
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

function drawPlushieEmoji(ctx, p, x, y, size = 30, angle = 0, isShiny = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.75, size * 0.85, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  const template = PLUSHIE_DATABASE[p.id] || PLUSHIE_DATABASE.potato;
  const bg = template.bgColor || '#fef08a';
  const border = template.borderColor || '#ca8a04';

  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isShiny ? '#facc15' : border;
  ctx.lineWidth = isShiny ? 4 : 3;
  if (isShiny) {
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = `${Math.round(size * 1.15)}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.emoji || template.emoji || '🧸', 0, 2);

  if (isShiny) {
    ctx.font = `${Math.round(size * 0.55)}px sans-serif`;
    ctx.fillText('✨', size * 0.55, -size * 0.55);
  }

  ctx.restore();
}

// --- 2. Audio Manager ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.bgm = null;
    this.isMuted = false;
    this.sfxVolume = 0.7;
    this.bgmVolume = 0.5;
    this.initDone = false;
    this.bgmPlaying = false;
  }

  init() {
    if (this.initDone) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }

      const bgmPath = encodeURI('Plushie_in_the_Chute (1).mp3');
      this.bgm = new Audio(bgmPath);
      this.bgm.loop = true;
      this.bgm.volume = this.bgmVolume;

      this.initDone = true;
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  unlock() {
    if (!this.initDone) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.bgm && !this.bgmPlaying && !this.isMuted) {
      this.playBgm();
    }
  }

  playBgm() {
    if (!this.initDone) this.init();
    if (this.bgm && !this.isMuted) {
      this.bgm.play().then(() => {
        this.bgmPlaying = true;
      }).catch(e => {
        console.log('Audio autoplay prevented:', e);
      });
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      if (this.isMuted) {
        this.bgm.pause();
        this.bgmPlaying = false;
      } else {
        this.playBgm();
      }
    }
    return this.isMuted;
  }

  playCoinInsert() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.4);
    });
  }

  playMotorHum(duration = 0.12, pitch = 220) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, t);
    gain.gain.setValueAtTime(0.07 * this.sfxVolume, t);
    gain.gain.linearRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  playDropWhoosh() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.45);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  playClawGrip() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playWinChime(rarity = 'COMMON') {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const notes = ['LEGENDARY', 'EPIC'].includes(rarity)
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] 
      : [523.25, 659.25, 783.99, 1046.50];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);
      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.55);
    });
  }

  playMiss() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.35);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playChaChing() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [1567.98, 2093.00].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);
      gain.gain.setValueAtTime(0.4 * this.sfxVolume, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.65);
    });
  }

  playClick() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

const soundManager = new SoundManager();

// --- 3. Claw Engine ---
class ClawEngine {
  constructor(canvas, onCatchCallback, onDropMissCallback, onTimerExpireCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onCatch = onCatchCallback;
    this.onDropMiss = onDropMissCallback;
    this.onTimerExpire = onTimerExpireCallback;

    this.width = 640;
    this.height = 520;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.bounds = {
      minX: 70,
      maxX: 570,
      minY: 50,
      maxY: 330,
      topZ: 15,
      chute: { x: 120, y: 300, radius: 48 }
    };

    this.credits = 0;
    this.timeRemaining = 0;

    this.claw = {
      x: 320,
      y: 180,
      z: 15,
      targetZ: 160,
      swayX: 0,
      swayY: 0,
      swayVx: 0,
      swayVy: 0,
      prongAngle: 0.75,
      targetProngAngle: 0.75,
      state: 'WAITING_COIN',
      grippedPlushie: null,
      gripStrengthFactor: 1.0
    };

    this.upgrades = {
      gripPower: 1,
      moveSpeed: 1,
      luckCharm: 0,
      magnetSkillUnlocked: false
    };

    this.currentMachine = CLAW_MACHINES[0];
    this.plushieList = [];
    this.particles = [];
    this.floatingTexts = [];

    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.isMagneticActive = false;
    this.magneticTimer = 0;
    this.motorSoundTimer = 0;
    this.stateTimer = 0;

    this.initPlushies();
  }

  setMachine(machine) {
    this.currentMachine = machine;
    this.initPlushies();
  }

  setUpgrades(upgrades) {
    this.upgrades = { ...this.upgrades, ...upgrades };
  }

  insertCoin() {
    this.credits = 1;
    this.timeRemaining = 30;
    this.claw.state = 'IDLE';
    this.claw.targetProngAngle = 0.75;
    this.addFloatingText('🪙 코인 투입! 조작 시작 (30초)', this.claw.x, 70, '#fde047', 22);
  }

  initPlushies() {
    this.plushieList = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      this.spawnPlushie();
    }
  }

  spawnPlushie(specificId = null) {
    let chosenId = specificId;
    if (!chosenId) {
      const totalWeight = this.currentMachine.plushiePool.reduce((acc, p) => acc + p.weight, 0);
      let rand = Math.random() * totalWeight;
      for (const item of this.currentMachine.plushiePool) {
        if (rand < item.weight) {
          chosenId = item.id;
          break;
        }
        rand -= item.weight;
      }
    }

    const template = PLUSHIE_DATABASE[chosenId] || PLUSHIE_DATABASE.potato;
    const shinyChance = 0.06 + (this.upgrades.luckCharm * 0.04);
    const isShiny = Math.random() < shinyChance;

    let px, py;
    let attempts = 0;
    do {
      px = this.bounds.minX + 25 + Math.random() * (this.bounds.maxX - this.bounds.minX - 50);
      py = this.bounds.minY + 20 + Math.random() * (this.bounds.maxY - this.bounds.minY - 40);
      attempts++;
    } while (
      attempts < 12 &&
      Math.hypot(px - this.bounds.chute.x, py - this.bounds.chute.y) < this.bounds.chute.radius + 35
    );

    const plushie = {
      id: template.id,
      name: template.name,
      subname: template.subname,
      emoji: template.emoji,
      rarity: template.rarity,
      basePrice: template.basePrice,
      price: Math.round(template.basePrice * (isShiny ? 1.5 : 1)),
      weight: template.weight,
      radius: template.radius,
      bgColor: template.bgColor,
      borderColor: template.borderColor,
      desc: template.desc,
      isShiny: isShiny,
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: 0,
      angle: (Math.random() - 0.5) * 0.3,
      isGripped: false,
      isFallingInChute: false
    };

    this.plushieList.push(plushie);
    return plushie;
  }

  activateMagneticPulse() {
    if (!this.upgrades.magnetSkillUnlocked || this.isMagneticActive) return;
    this.isMagneticActive = true;
    this.magneticTimer = 180;
    soundManager.playCoinInsert();
    this.addFloatingText('🧲 마그넷 펄스 가동!', this.claw.x, getFloorScreenY(this.claw.y) - 30, '#38bdf8', 20);
  }

  triggerDrop() {
    if (this.credits <= 0) {
      soundManager.playMiss();
      this.addFloatingText('⚠️ 먼저 동전을 넣어주세요!', this.width / 2, this.height / 2, '#ef4444', 22);
      return false;
    }

    if (this.claw.state !== 'IDLE') return false;

    const laserFloorY = getFloorScreenY(this.claw.y);
    let calculatedTargetZ = Math.max(30, laserFloorY - 110);

    for (const p of this.plushieList) {
      if (p.isFallingInChute) continue;
      const plushieScreenY = getFloorScreenY(p.y);
      const d = Math.hypot(this.claw.x - p.x, laserFloorY - plushieScreenY);
      if (d < p.radius + 15) {
        calculatedTargetZ -= (p.radius * 0.35);
        break;
      }
    }

    this.claw.targetZ = calculatedTargetZ;
    this.claw.state = 'DESCENDING';
    this.claw.targetProngAngle = 0.85;
    soundManager.playDropWhoosh();
    return true;
  }

  update(deltaTime = 1) {
    const claw = this.claw;
    const speed = 2.6 + (this.upgrades.moveSpeed * 0.7);

    if (claw.state === 'IDLE' && this.credits > 0) {
      this.timeRemaining -= (deltaTime * 0.016);
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.triggerDrop();
      }
    }

    if (this.isMagneticActive) {
      this.magneticTimer -= deltaTime;
      if (this.magneticTimer <= 0) {
        this.isMagneticActive = false;
      } else {
        for (const p of this.plushieList) {
          if (!p.isGripped && !p.isFallingInChute) {
            const dx = claw.x - p.x;
            const dy = claw.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 220 && dist > 5) {
              p.vx += (dx / dist) * 0.45;
              p.vy += (dy / dist) * 0.45;
            }
          }
        }
      }
    }

    switch (claw.state) {
      case 'WAITING_COIN': {
        claw.targetProngAngle = 0.75;
        claw.prongAngle += (claw.targetProngAngle - claw.prongAngle) * 0.1;
        break;
      }

      case 'IDLE': {
        let moved = false;
        let moveVx = 0;
        let moveVy = 0;

        if (this.keys.left) {
          claw.x -= speed;
          moveVx = -speed;
          moved = true;
        }
        if (this.keys.right) {
          claw.x += speed;
          moveVx = speed;
          moved = true;
        }
        if (this.keys.up) {
          claw.y -= speed * 0.85;
          moveVy = -speed * 0.85;
          moved = true;
        }
        if (this.keys.down) {
          claw.y += speed * 0.85;
          moveVy = speed * 0.85;
          moved = true;
        }

        claw.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, claw.x));
        claw.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, claw.y));

        claw.swayVx += (moveVx * 0.08 - claw.swayX * 0.05);
        claw.swayVy += (moveVy * 0.08 - claw.swayY * 0.05);
        claw.swayVx *= 0.88;
        claw.swayVy *= 0.88;
        claw.swayX += claw.swayVx;
        claw.swayY += claw.swayVy;

        if (moved) {
          this.motorSoundTimer += deltaTime;
          if (this.motorSoundTimer > 7) {
            soundManager.playMotorHum(0.1, 220 + (claw.x % 40));
            this.motorSoundTimer = 0;
          }
        }

        claw.prongAngle += (claw.targetProngAngle - claw.prongAngle) * 0.2;
        break;
      }

      case 'DESCENDING': {
        claw.z += 4.8;
        claw.swayX *= 0.92;
        claw.swayY *= 0.92;

        if (claw.z >= claw.targetZ) {
          claw.z = claw.targetZ;
          claw.state = 'GRABBING';
          claw.targetProngAngle = 0.15;
          this.stateTimer = 40;
          soundManager.playClawGrip();
        }
        break;
      }

      case 'GRABBING': {
        claw.prongAngle += (claw.targetProngAngle - claw.prongAngle) * 0.22;
        this.stateTimer -= deltaTime;

        if (this.stateTimer <= 0) {
          let bestTarget = null;
          let bestDist = 9999;
          const laserY = getFloorScreenY(claw.y);

          for (const p of this.plushieList) {
            if (p.isFallingInChute) continue;
            const pScreenY = getFloorScreenY(p.y);
            const dist = Math.hypot(claw.x - p.x, laserY - pScreenY);
            if (dist < p.radius + 24 && dist < bestDist) {
              bestDist = dist;
              bestTarget = p;
            }
          }

          if (bestTarget) {
            const gripPowerBonus = 0.25 + (this.upgrades.gripPower * 0.20);
            const weightPenalty = bestTarget.weight * 0.32;
            const alignmentBonus = Math.max(0, 1 - (bestDist / (bestTarget.radius + 24)));
            const luckBonus = this.upgrades.luckCharm * 0.05;

            const gripQuality = (gripPowerBonus + alignmentBonus * 0.60 + luckBonus) - weightPenalty;

            if (gripQuality >= 0.35 || Math.random() < 0.72 + gripQuality * 0.25) {
              claw.grippedPlushie = bestTarget;
              bestTarget.isGripped = true;
              claw.gripStrengthFactor = Math.min(1.0, Math.max(0.4, gripQuality));
              this.addFloatingText('🎯 잡았다!', claw.x, laserY - 45, '#facc15', 22);
            } else {
              this.addFloatingText('미끄러짐... 💦', claw.x, laserY - 45, '#f87171', 20);
              soundManager.playMiss();
            }
          }

          claw.state = 'ASCENDING';
        }
        break;
      }

      case 'ASCENDING': {
        claw.z -= 4.2;

        if (claw.grippedPlushie && claw.gripStrengthFactor < 0.6) {
          if (claw.z < claw.targetZ * 0.5 && Math.random() < 0.02) {
            const p = claw.grippedPlushie;
            p.isGripped = false;
            p.vz = 2.5;
            p.vx = (Math.random() - 0.5) * 2;
            p.vy = (Math.random() - 0.5) * 2;
            claw.grippedPlushie = null;
            this.addFloatingText('앗! 놓쳤다! 😭', claw.x, getFloorScreenY(claw.y) - 30, '#ef4444', 22);
            soundManager.playMiss();
            if (this.onDropMiss) this.onDropMiss();
          }
        }

        if (claw.z <= this.bounds.topZ) {
          claw.z = this.bounds.topZ;
          claw.state = 'RETURNING';
        }
        break;
      }

      case 'RETURNING': {
        const targetX = this.bounds.chute.x;
        const targetY = this.bounds.chute.y;
        const dx = targetX - claw.x;
        const dy = targetY - claw.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          claw.x += (dx / dist) * speed * 1.3;
          claw.y += (dy / dist) * speed * 1.3;
          claw.swayX = (dx / dist) * 2.5;
          claw.swayY = (dy / dist) * 2.5;
        } else {
          claw.x = targetX;
          claw.y = targetY;
          claw.swayX *= 0.7;
          claw.swayY *= 0.7;
          claw.state = 'RELEASING';
          this.stateTimer = 30;
        }
        break;
      }

      case 'RELEASING': {
        claw.targetProngAngle = 0.85;
        claw.prongAngle += (claw.targetProngAngle - claw.prongAngle) * 0.25;
        this.stateTimer -= deltaTime;

        if (claw.grippedPlushie) {
          const p = claw.grippedPlushie;
          p.isGripped = false;
          p.isFallingInChute = true;
          p.vz = 3.5;
          claw.grippedPlushie = null;
          this.triggerCatchSuccess(p);
        }

        if (this.stateTimer <= 0) {
          claw.state = 'RESETTING';
        }
        break;
      }

      case 'RESETTING': {
        const targetX = 320;
        const targetY = 180;
        const dx = targetX - claw.x;
        const dy = targetY - claw.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          claw.x += (dx / dist) * speed * 1.6;
          claw.y += (dy / dist) * speed * 1.6;
        } else {
          claw.x = targetX;
          claw.y = targetY;
          this.credits = 0;
          claw.state = 'WAITING_COIN';
        }
        break;
      }
    }

    // Plushies Physics & Sorting
    for (let i = this.plushieList.length - 1; i >= 0; i--) {
      const p = this.plushieList[i];

      if (p.isGripped) {
        p.x = claw.x + claw.swayX * 0.75;
        p.screenY = 55 + claw.z + 52;
        p.angle = claw.swayX * 0.06;
      } else if (p.isFallingInChute) {
        p.screenY += p.vz;
        p.vz += 0.45;
        p.angle += 0.12;
        p.radius *= 0.95;

        if (p.screenY > 480 || p.radius < 4) {
          this.plushieList.splice(i, 1);
          setTimeout(() => this.spawnPlushie(), 1000);
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.85;
        p.vy *= 0.85;

        p.x = Math.max(this.bounds.minX + 15, Math.min(this.bounds.maxX - 15, p.x));
        p.y = Math.max(this.bounds.minY + 15, Math.min(this.bounds.maxY - 15, p.y));

        p.screenY = getFloorScreenY(p.y);

        for (let j = i + 1; j < this.plushieList.length; j++) {
          const other = this.plushieList[j];
          if (other.isGripped || other.isFallingInChute) continue;

          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const dist = Math.hypot(dx, dy);
          const minDist = (p.radius + other.radius) * 0.82;

          if (dist < minDist && dist > 0.1) {
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            p.x -= nx * overlap;
            p.y -= ny * overlap;
            other.x += nx * overlap;
            other.y += ny * overlap;
          }
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += 0.2;
      part.life -= deltaTime;
      part.size *= 0.96;
      if (part.life <= 0 || part.size < 0.5) {
        this.particles.splice(i, 1);
      }
    }

    // Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const txt = this.floatingTexts[i];
      txt.y += txt.vy;
      txt.opacity -= 0.02 * deltaTime;
      if (txt.opacity <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  triggerCatchSuccess(plushie) {
    soundManager.playWinChime(plushie.rarity);
    const chuteScreenY = getFloorScreenY(this.bounds.chute.y);
    this.createConfetti(this.bounds.chute.x, chuteScreenY, 45);

    const priceText = `+₩${plushie.price.toLocaleString()}`;
    this.addFloatingText(`🎉 ${plushie.name} 획득!`, this.bounds.chute.x, chuteScreenY - 70, '#facc15', 24);
    this.addFloatingText(priceText, this.bounds.chute.x, chuteScreenY - 35, '#4ade80', 22);

    if (this.onCatch) {
      this.onCatch(plushie);
    }
  }

  createConfetti(x, y, count = 35) {
    const colors = ['#f43f5e', '#38bdf8', '#facc15', '#4ade80', '#c084fc', '#fb923c'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 5,
        life: 50 + Math.random() * 30
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffffff', fontSize = 18) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.2,
      opacity: 1.0,
      color,
      fontSize
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawArcadeInterior();
    this.drawPrizeChute();
    this.drawLaserCrosshair();

    const sorted = [...this.plushieList].sort((a, b) => a.y - b.y);
    for (const p of sorted) {
      if (p.isGripped) continue;
      const sy = p.screenY || getFloorScreenY(p.y);
      drawPlushieEmoji(ctx, p, p.x, sy, p.radius, p.angle, p.isShiny);
    }

    this.drawClawAssembly();

    if (this.claw.grippedPlushie) {
      const p = this.claw.grippedPlushie;
      drawPlushieEmoji(ctx, p, p.x, p.screenY, p.radius, p.angle, p.isShiny);
    }

    this.drawGlassAndNeon();
    this.drawHUDOverlay();
    this.drawEffects();
  }

  drawArcadeInterior() {
    const ctx = this.ctx;
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#110e24');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.20)';
    ctx.lineWidth = 1.5;
    for (let x = 60; x <= 580; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 140);
      ctx.lineTo(x, 440);
      ctx.stroke();
    }
    for (let y = 50; y <= 330; y += 35) {
      const sy = getFloorScreenY(y);
      ctx.beginPath();
      ctx.moveTo(60, sy);
      ctx.lineTo(580, sy);
      ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(70, 45);
    ctx.lineTo(570, 45);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.claw.x, 40);
    ctx.lineTo(this.claw.x, 70);
    ctx.stroke();
  }

  drawPrizeChute() {
    const ctx = this.ctx;
    const { chute } = this.bounds;
    const cy = getFloorScreenY(chute.y);

    ctx.save();
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.ellipse(chute.x, cy, chute.radius * 1.15, chute.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁 배출구 WIN', chute.x, cy);
    ctx.restore();
  }

  drawLaserCrosshair() {
    const ctx = this.ctx;
    const laserY = getFloorScreenY(this.claw.y);

    ctx.save();

    const pulse = Math.sin(Date.now() * 0.008) * 3;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(this.claw.x, laserY, 26 + pulse, 13 + pulse * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.claw.x, laserY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(this.claw.x, 55 + this.claw.z);
    ctx.lineTo(this.claw.x, laserY);
    ctx.stroke();

    ctx.restore();
  }

  drawClawAssembly() {
    const ctx = this.ctx;
    const claw = this.claw;
    const clawY = 55 + claw.z;
    const clawX = claw.x + claw.swayX;

    ctx.save();

    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.fillRect(claw.x - 24, 35, 48, 20);
    ctx.strokeRect(claw.x - 24, 35, 48, 20);

    ctx.fillStyle = this.credits > 0 ? (claw.state === 'IDLE' ? '#22c55e' : '#f59e0b') : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(claw.x, 45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(claw.x, 55);
    ctx.lineTo(clawX, clawY);
    ctx.stroke();

    ctx.translate(clawX, clawY);

    if (this.isMagneticActive) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 15, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillRect(-7, 0, 14, 20);

    const angle = claw.prongAngle;
    const pLen1 = 34;
    const pLen2 = 28;

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left Prong
    ctx.save();
    ctx.translate(-7, 20);
    ctx.rotate(-angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-pLen1 * 0.7, pLen1);
    ctx.lineTo(pLen2 * 0.35, pLen1 + pLen2 * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pLen2 * 0.35, pLen1 + pLen2 * 0.8, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Prong
    ctx.save();
    ctx.translate(7, 20);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pLen1 * 0.7, pLen1);
    ctx.lineTo(-pLen2 * 0.35, pLen1 + pLen2 * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-pLen2 * 0.35, pLen1 + pLen2 * 0.8, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Back Center Prong
    ctx.save();
    ctx.translate(0, 18);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, pLen1 * 1.1);
    ctx.lineTo(0, pLen1 * 1.1 + pLen2 * 0.5);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  drawGlassAndNeon() {
    const ctx = this.ctx;
    const sheen = ctx.createLinearGradient(0, 0, this.width, this.height);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    sheen.addColorStop(0.3, 'rgba(255, 255, 255, 0.10)');
    sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.02)');
    sheen.addColorStop(0.7, 'rgba(255, 255, 255, 0.06)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = this.currentMachine.neonColor || '#fde047';
    ctx.lineWidth = 4;
    ctx.shadowColor = this.currentMachine.themeColor || '#eab308';
    ctx.shadowBlur = 14;
    ctx.strokeRect(6, 6, this.width - 12, this.height - 12);
    ctx.shadowBlur = 0;
  }

  drawHUDOverlay() {
    const ctx = this.ctx;

    if (this.credits <= 0) {
      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      if (blink) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        safeRoundRect(ctx, this.width / 2 - 180, 20, 360, 48, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 20px "Outfit", sans-serif, "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪙 코인을 넣어주세요! (INSERT COIN)', this.width / 2, 44);
        ctx.restore();
      }
    } else if (this.claw.state === 'IDLE') {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      safeRoundRect(ctx, this.width / 2 - 140, 20, 280, 44, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.timeRemaining <= 5 ? '#ef4444' : '#38bdf8';
      ctx.font = 'bold 18px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⏱️ 남은 시간: ${Math.ceil(this.timeRemaining)}초 | 조작 중`, this.width / 2, 42);
      ctx.restore();
    }
  }

  drawEffects() {
    const ctx = this.ctx;
    for (const part of this.particles) {
      ctx.save();
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const txt of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, txt.opacity);
      ctx.fillStyle = txt.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.font = `bold ${txt.fontSize}px 'Outfit', sans-serif, 'Noto Sans KR'`;
      ctx.textAlign = 'center';
      ctx.fillText(txt.text, txt.x, txt.y);
      ctx.restore();
    }
  }
}

// --- 4. Main Game Logic Class ---
class JeongseonPlushGame {
  constructor() {
    this.canvas = document.getElementById('clawCanvas');
    this.engine = null;

    this.money = 5000;
    this.careerEarnings = 0;
    this.totalPlays = 0;
    this.totalCatches = 0;

    this.bag = [];
    this.bagCapacity = 6;
    this.currentMachineIndex = 0;

    this.upgrades = {
      gripPower: 1,
      moveSpeed: 1,
      bagLevel: 1,
      luckCharm: 0,
      magnetSkill: false
    };

    // Scaled Upgrade Costs
    this.upgradeCosts = {
      gripPower: [0, 5000, 15000, 40000, 100000],
      moveSpeed: [0, 3000, 10000, 25000, 60000],
      bagLevel: [0, 6000, 20000, 50000],
      luckCharm: [8000, 25000, 60000, 150000, 350000],
      magnetSkill: 15000
    };

    this.bagCapacities = [6, 12, 24, 50];

    this.quotes = {
      start: "정선 인형뽑기장에 온 걸 환영해! 동전을 넣고 인형을 뽑아 투명 가방을 채워보자!",
      coin: ["동전 투입 완료! 30초 안에 방향키로 조준하고 Spacebar를 눌러봐! 🎯", "딸깍! 코인이 들어갔어! 집중해서 인형을 노려보자!"],
      catch: ["우와 잡았다!! 투명 가방에 쏙 들어갔어! ✨", "대박! 이걸 뽑다니 손맛 최고다! 💖", "야호! 장터에 비싸게 팔아서 돈을 벌자!"],
      miss: ["으앙 아깝다.. 거의 다 건졌는데! 💦", "집게를 더 강화하면 안 놓칠 텐데..", "괜찮아! 다음엔 꼭 뽑을 수 있어!"],
      sell: ["장터에서 돈을 잔뜩 벌었어! 💰", "투명 가방이 가벼워진 대신 지갑이 빵빵해졌다!", "우와아 부자가 되어가는 중이야!"],
      broke: ["앗, 돈이 부족해! 가방에 있는 인형을 장터에 팔아서 돈을 마련하자!"]
    };

    this.init();
  }

  init() {
    this.loadSave();

    this.engine = new ClawEngine(
      this.canvas,
      (plushie) => this.handleCatch(plushie),
      () => this.handleMiss(),
      () => this.handleTimerExpire()
    );

    this.updateEngineParams();
    this.bindEvents();
    this.renderAll();
    this.setCharacterSpeech(this.quotes.start);

    const unlockAudioOnce = () => {
      soundManager.unlock();
      window.removeEventListener('click', unlockAudioOnce);
      window.removeEventListener('keydown', unlockAudioOnce);
      window.removeEventListener('touchstart', unlockAudioOnce);
    };
    window.addEventListener('click', unlockAudioOnce);
    window.addEventListener('keydown', unlockAudioOnce);
    window.addEventListener('touchstart', unlockAudioOnce);

    let lastTime = performance.now();
    const loop = (time) => {
      const delta = Math.min((time - lastTime) / 16.666, 2.0);
      lastTime = time;

      this.engine.update(delta);
      this.engine.draw();
      this.drawTransparentBackpack();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateEngineParams() {
    this.engine.setMachine(CLAW_MACHINES[this.currentMachineIndex]);
    this.engine.setUpgrades({
      gripPower: this.upgrades.gripPower,
      moveSpeed: this.upgrades.moveSpeed,
      luckCharm: this.upgrades.luckCharm,
      magnetSkillUnlocked: this.upgrades.magnetSkill
    });
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      soundManager.unlock();

      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.engine.keys.left = true;
        e.preventDefault();
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.engine.keys.right = true;
        e.preventDefault();
      }
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        this.engine.keys.up = true;
        e.preventDefault();
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.engine.keys.down = true;
        e.preventDefault();
      }
      if (e.code === 'KeyC' || e.code === 'Digit1') {
        e.preventDefault();
        this.insertCoinAction();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleSpacebar();
      }
      if (e.code === 'KeyQ') {
        this.engine.activateMagneticPulse();
      }
      if (e.code === 'KeyB') {
        this.openBagModal();
      }
      if (e.code === 'KeyU') {
        this.openUpgradeModal();
      }
      if (e.code === 'KeyM') {
        this.toggleSound();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.engine.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.engine.keys.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.engine.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.engine.keys.down = false;
    });

    this.bindTouchControls();

    document.getElementById('btnInsertCoin')?.addEventListener('click', () => this.insertCoinAction());
    document.getElementById('btnDrop')?.addEventListener('click', () => this.handleSpacebar());
    document.getElementById('btnMagnet')?.addEventListener('click', () => this.engine.activateMagneticPulse());
    document.getElementById('btnOpenBag')?.addEventListener('click', () => this.openBagModal());
    document.getElementById('btnOpenUpgrade')?.addEventListener('click', () => this.openUpgradeModal());
    document.getElementById('btnOpenCatalog')?.addEventListener('click', () => this.openCatalogModal());
    document.getElementById('btnSoundToggle')?.addEventListener('click', () => this.toggleSound());
    document.getElementById('btnSellAll')?.addEventListener('click', () => this.sellAllPlushies());

    document.querySelectorAll('.machine-tab-btn').forEach((btn, index) => {
      btn.addEventListener('click', () => this.switchMachine(index));
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });
  }

  bindTouchControls() {
    const bindBtn = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        soundManager.unlock();
        this.engine.keys[key] = true;
      };
      const end = (e) => {
        e.preventDefault();
        this.engine.keys[key] = false;
      };
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end);
    };

    bindBtn('btnJoyUp', 'up');
    bindBtn('btnJoyDown', 'down');
    bindBtn('btnJoyLeft', 'left');
    bindBtn('btnJoyRight', 'right');
  }

  insertCoinAction() {
    soundManager.unlock();

    if (this.engine.credits > 0) {
      this.showToast('ℹ️ 이미 코인이 투입되어 있습니다! 조준 후 [SPACE]를 누르세요.');
      return;
    }

    const machine = CLAW_MACHINES[this.currentMachineIndex];

    if (this.bag.length >= this.bagCapacity) {
      soundManager.playMiss();
      this.setCharacterSpeech("투명 가방이 꽉 찼어! 먼저 가방의 인형을 장터에 팔아줘!");
      this.openBagModal();
      return;
    }

    if (this.money < machine.cost) {
      soundManager.playMiss();
      this.setCharacterSpeech(this.quotes.broke);
      this.showToast(`💰 코인이 부족합니다! (${machine.name}: ₩${machine.cost.toLocaleString()} 필요)`);
      return;
    }

    this.money -= machine.cost;
    this.totalPlays++;
    soundManager.playCoinInsert();
    this.engine.insertCoin();

    const quote = this.quotes.coin[Math.floor(Math.random() * this.quotes.coin.length)];
    this.setCharacterSpeech(quote);
    this.showToast(`🪙 코인 투입 완료! (-₩${machine.cost.toLocaleString()}) 조작을 시작합니다.`);

    this.renderHUD();
    this.saveGame();
  }

  handleSpacebar() {
    if (this.engine.credits <= 0) {
      this.insertCoinAction();
      return;
    }
    this.engine.triggerDrop();
  }

  handleCatch(plushie) {
    this.totalCatches++;
    this.bag.push({
      ...plushie,
      catchTime: Date.now()
    });

    const quote = this.quotes.catch[Math.floor(Math.random() * this.quotes.catch.length)];
    this.setCharacterSpeech(`🎉 ${plushie.name} 획득! ${quote}`);
    this.showToast(`✨ [${RARITY[plushie.rarity].name}] ${plushie.name} 획득! (+₩${plushie.price.toLocaleString()})`);

    this.renderHUD();
    this.saveGame();
  }

  handleMiss() {
    const quote = this.quotes.miss[Math.floor(Math.random() * this.quotes.miss.length)];
    this.setCharacterSpeech(quote);
  }

  handleTimerExpire() {
    this.showToast('⏱️ 제한 시간이 종료되어 자동으로 집게가 내려갑니다!');
  }

  switchMachine(index) {
    const target = CLAW_MACHINES[index];
    if (this.careerEarnings < target.minUnlockEarnings) {
      soundManager.playMiss();
      this.showToast(`🔒 누적 수익 ₩${target.minUnlockEarnings.toLocaleString()} 이상 달성 시 해금됩니다!`);
      return;
    }

    this.currentMachineIndex = index;
    soundManager.playClick();
    this.updateEngineParams();

    document.querySelectorAll('.machine-tab-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === index);
    });

    document.getElementById('machineNameDisplay').textContent = target.name;
    document.getElementById('machineCostDisplay').textContent = `₩${target.cost.toLocaleString()} / 회`;

    this.setCharacterSpeech(`${target.name}에 도착했어! 좋은 인형들을 뽑아보자! 🎯`);
    this.renderHUD();
  }

  sellPlushie(index) {
    if (index < 0 || index >= this.bag.length) return;
    const p = this.bag[index];
    const earned = p.price;

    this.money += earned;
    this.careerEarnings += earned;
    this.bag.splice(index, 1);

    soundManager.playChaChing();
    this.showToast(`💵 ${p.name} 판매 완료! +₩${earned.toLocaleString()}`);

    const quote = this.quotes.sell[Math.floor(Math.random() * this.quotes.sell.length)];
    this.setCharacterSpeech(quote);

    this.renderAll();
    this.renderBagModalList();
    this.saveGame();
  }

  sellAllPlushies() {
    if (this.bag.length === 0) {
      this.showToast('가방에 판매할 인형이 없습니다!');
      return;
    }

    let totalEarned = 0;
    const bulkBonusRate = this.bag.length >= 5 ? 1.15 : 1.0;

    for (const p of this.bag) {
      totalEarned += p.price;
    }
    const finalEarned = Math.round(totalEarned * bulkBonusRate);
    const count = this.bag.length;

    this.money += finalEarned;
    this.careerEarnings += finalEarned;
    this.bag = [];

    soundManager.playChaChing();
    this.showToast(`💰 인형 ${count}개 일괄 판매 완료! +₩${finalEarned.toLocaleString()} ${bulkBonusRate > 1.0 ? '(대량 보너스 +15%!)' : ''}`);

    this.setCharacterSpeech(`대박! 인형 ${count}개를 팔아서 ₩${finalEarned.toLocaleString()}을 벌었어! 🥳💸`);

    this.renderAll();
    this.renderBagModalList();
    this.saveGame();
  }

  buyUpgrade(type) {
    soundManager.unlock();

    if (type === 'magnetSkill') {
      const cost = this.upgradeCosts.magnetSkill;
      if (this.upgrades.magnetSkill) {
        this.showToast('이미 습득한 스킬입니다!');
        return;
      }
      if (this.money < cost) {
        soundManager.playMiss();
        this.showToast('골드가 부족합니다!');
        return;
      }
      this.money -= cost;
      this.upgrades.magnetSkill = true;
      soundManager.playWinChime('EPIC');
      this.showToast('🧲 정선 자석 펄스 스킬 습득! [Q] 키 또는 스킬 버튼으로 사용!');
      this.updateEngineParams();
      this.renderAll();
      this.renderUpgradeModalList();
      this.saveGame();
      return;
    }

    const currentLevel = this.upgrades[type];
    const maxLevel = type === 'bagLevel' ? 4 : 5;
    if (currentLevel >= maxLevel) {
      this.showToast('최대 레벨에 도달했습니다!');
      return;
    }

    const cost = this.upgradeCosts[type][currentLevel];
    if (this.money < cost) {
      soundManager.playMiss();
      this.showToast('골드가 부족합니다!');
      return;
    }

    this.money -= cost;
    this.upgrades[type]++;

    if (type === 'bagLevel') {
      this.bagCapacity = this.bagCapacities[this.upgrades.bagLevel - 1];
    }

    soundManager.playWinChime('RARE');
    this.showToast(`✨ 강화 성공! [${this.getUpgradeName(type)}] Lv.${this.upgrades[type]}`);
    this.setCharacterSpeech("강화 성공! 이제 인형뽑기가 훨씬 쉬워졌어! 💪");

    this.updateEngineParams();
    this.renderAll();
    this.renderUpgradeModalList();
    this.saveGame();
  }

  getUpgradeName(type) {
    const names = {
      gripPower: '강화 고무 집게 (악력)',
      moveSpeed: '고속 갠트리 모터',
      bagLevel: '투명 가방 용량 확장',
      luckCharm: '정선 아리랑 행운 부적',
      magnetSkill: '정선 자석 펄스'
    };
    return names[type] || type;
  }

  renderAll() {
    this.renderHUD();
    this.renderMachineTabs();
  }

  renderHUD() {
    document.getElementById('moneyDisplay').textContent = `₩${this.money.toLocaleString()}`;
    document.getElementById('careerEarningsDisplay').textContent = `₩${this.careerEarnings.toLocaleString()}`;
    document.getElementById('bagCountDisplay').textContent = `${this.bag.length} / ${this.bagCapacity}`;

    const magnetBtn = document.getElementById('btnMagnet');
    if (magnetBtn) {
      magnetBtn.style.display = this.upgrades.magnetSkill ? 'inline-flex' : 'none';
    }
  }

  renderMachineTabs() {
    document.querySelectorAll('.machine-tab-btn').forEach((btn, idx) => {
      const machine = CLAW_MACHINES[idx];
      const isLocked = this.careerEarnings < machine.minUnlockEarnings;
      btn.classList.toggle('locked', isLocked);
      btn.querySelector('.lock-badge')?.remove();
      if (isLocked) {
        const badge = document.createElement('span');
        badge.className = 'lock-badge';
        badge.textContent = `🔒 ₩${machine.minUnlockEarnings.toLocaleString()}`;
        btn.appendChild(badge);
      }
    });
  }

  setCharacterSpeech(text) {
    const bubble = document.getElementById('speechBubble');
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.remove('pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
    }
  }

  showToast(msg) {
    const toast = document.getElementById('gameToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  toggleSound() {
    soundManager.unlock();
    const isMuted = soundManager.toggleMute();
    const btn = document.getElementById('btnSoundToggle');
    if (btn) {
      btn.innerHTML = isMuted ? '🔇 음소거 해제' : '🔊 사운드 ON';
    }
  }

  drawTransparentBackpack() {
    const bagCanvas = document.getElementById('bagCanvas');
    if (!bagCanvas) return;
    const ctx = bagCanvas.getContext('2d');
    const w = bagCanvas.width;
    const h = bagCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const pad = 12;
    const bagW = w - pad * 2;
    const bagH = h - pad * 2 - 20;

    ctx.save();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(253, 224, 71, 0.4)';
    ctx.shadowBlur = 10;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    safeRoundRect(ctx, pad, pad + 20, bagW, bagH, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    safeRoundRect(ctx, pad + 10, pad + 15, bagW - 20, 12, 6);
    ctx.fill();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(w / 2, pad + 14, 25, Math.PI, 0, false);
    ctx.stroke();
    ctx.restore();

    const count = this.bag.length;
    if (count === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('투명 가방이 비어있어요', w / 2, h / 2 + 10);
      ctx.fillText('동전을 넣고 인형을 뽑아보세요!', w / 2, h / 2 + 32);
      return;
    }

    const cols = 4;
    const itemSize = 18;
    this.bag.forEach((p, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = pad + 35 + col * 40;
      const y = pad + 60 + row * 38;

      const wobble = Math.sin(Date.now() * 0.003 + idx) * 3;
      drawPlushieEmoji(ctx, p, x, y + wobble, itemSize, 0, p.isShiny);
    });

    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.18)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = grad;
    safeRoundRect(ctx, pad, pad + 20, bagW, bagH, 22);
    ctx.fill();
    ctx.restore();
  }

  openBagModal() {
    soundManager.playClick();
    this.renderBagModalList();
    document.getElementById('bagModal').classList.add('active');
  }

  renderBagModalList() {
    const listEl = document.getElementById('bagItemList');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (this.bag.length === 0) {
      listEl.innerHTML = '<div class="empty-msg">투명 가방에 담긴 인형이 없습니다. 인형을 뽑아보세요!</div>';
      return;
    }

    this.bag.forEach((p, idx) => {
      const rarityInfo = RARITY[p.rarity];
      const itemEl = document.createElement('div');
      itemEl.className = 'bag-item-card';
      itemEl.innerHTML = `
        <div class="item-icon-wrapper">
          <canvas width="50" height="50"></canvas>
        </div>
        <div class="item-info">
          <div class="item-header">
            <span class="item-name">${p.emoji || '🧸'} ${p.name}</span>
            <span class="rarity-badge" style="background:${rarityInfo.bg}; color:${rarityInfo.color}; border:1px solid ${rarityInfo.border}">
              ${rarityInfo.name}
            </span>
          </div>
          <div class="item-desc">${p.subname}</div>
          <div class="item-price">판매가: <b>₩${p.price.toLocaleString()}</b></div>
        </div>
        <button class="btn-sell-single" data-index="${idx}">판매 💰</button>
      `;

      listEl.appendChild(itemEl);

      const canvas = itemEl.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawPlushieEmoji(ctx, p, 25, 25, 18, 0, p.isShiny);
      }

      itemEl.querySelector('.btn-sell-single')?.addEventListener('click', () => {
        this.sellPlushie(idx);
      });
    });
  }

  openUpgradeModal() {
    soundManager.playClick();
    this.renderUpgradeModalList();
    document.getElementById('upgradeModal').classList.add('active');
  }

  renderUpgradeModalList() {
    const container = document.getElementById('upgradeList');
    if (!container) return;
    container.innerHTML = '';

    const upgradeTypes = [
      {
        key: 'gripPower',
        name: '강화 고무 집게 (악력 UP)',
        desc: '집게의 힘이 강해져 무거운 인형도 잘 놓치지 않습니다.',
        level: this.upgrades.gripPower,
        max: 5,
        cost: this.upgradeCosts.gripPower[this.upgrades.gripPower] || 0
      },
      {
        key: 'moveSpeed',
        name: '고속 갠트리 모터 (이동속도 UP)',
        desc: '집게 조작 이동 속도가 빨라집니다.',
        level: this.upgrades.moveSpeed,
        max: 5,
        cost: this.upgradeCosts.moveSpeed[this.upgrades.moveSpeed] || 0
      },
      {
        key: 'bagLevel',
        name: '투명 가방 용량 확장',
        desc: `가방 슬롯을 확장합니다. (현재 ${this.bagCapacity}칸 → 다음 ${this.bagCapacities[this.upgrades.bagLevel] || 'MAX'}칸)`,
        level: this.upgrades.bagLevel,
        max: 4,
        cost: this.upgradeCosts.bagLevel[this.upgrades.bagLevel] || 0
      },
      {
        key: 'luckCharm',
        name: '정선 아리랑 행운 부적',
        desc: '반짝이는 황금/샤이니 인형(1.5배 가치) 등장 확률이 증가합니다.',
        level: this.upgrades.luckCharm,
        max: 5,
        cost: this.upgradeCosts.luckCharm[this.upgrades.luckCharm] || 0
      },
      {
        key: 'magnetSkill',
        name: '정선 자석 펄스 스킬 (액티브)',
        desc: '[Q] 키 또는 스킬 버튼으로 주변 인형을 집게로 끌어당깁니다.',
        level: this.upgrades.magnetSkill ? 1 : 0,
        max: 1,
        cost: this.upgradeCosts.magnetSkill
      }
    ];

    upgradeTypes.forEach(upg => {
      const isMax = upg.level >= upg.max;
      const canAfford = this.money >= upg.cost && !isMax;

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-header">
          <div class="upgrade-title">${upg.name}</div>
          <div class="upgrade-level">Lv.${upg.level} / ${upg.max}</div>
        </div>
        <div class="upgrade-desc">${upg.desc}</div>
        <div class="upgrade-footer">
          <span class="upgrade-cost">${isMax ? '최고 레벨 (MAX)' : `비용: ₩${upg.cost.toLocaleString()}`}</span>
          <button class="btn-upgrade-action ${canAfford ? 'active' : 'disabled'}" data-key="${upg.key}" ${isMax || !canAfford ? 'disabled' : ''}>
            ${isMax ? '완료' : '강화하기 ✨'}
          </button>
        </div>
      `;

      container.appendChild(card);
      card.querySelector('.btn-upgrade-action')?.addEventListener('click', () => {
        this.buyUpgrade(upg.key);
      });
    });
  }

  openCatalogModal() {
    soundManager.playClick();
    const container = document.getElementById('catalogList');
    if (!container) return;
    container.innerHTML = '';

    Object.values(PLUSHIE_DATABASE).forEach(p => {
      const rarityInfo = RARITY[p.rarity];
      const card = document.createElement('div');
      card.className = 'catalog-card';
      card.innerHTML = `
        <div class="catalog-thumb">
          <canvas width="60" height="60"></canvas>
        </div>
        <div class="catalog-info">
          <div class="catalog-name-row">
            <span class="catalog-name">${p.emoji || '🧸'} ${p.name}</span>
            <span class="rarity-badge" style="background:${rarityInfo.bg}; color:${rarityInfo.color}; border:1px solid ${rarityInfo.border}">
              ${rarityInfo.name}
            </span>
          </div>
          <div class="catalog-desc">${p.desc}</div>
          <div class="catalog-val">기본 가치: <b>₩${p.basePrice.toLocaleString()}</b> | 무게: ${p.weight}kg</div>
        </div>
      `;

      container.appendChild(card);
      const canvas = card.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawPlushieEmoji(ctx, p, 30, 30, 22, 0, false);
      }
    });

    document.getElementById('catalogModal').classList.add('active');
  }

  saveGame() {
    try {
      const data = {
        money: this.money,
        careerEarnings: this.careerEarnings,
        totalPlays: this.totalPlays,
        totalCatches: this.totalCatches,
        bag: this.bag.map(p => ({ id: p.id, isShiny: p.isShiny, price: p.price })),
        upgrades: this.upgrades,
        currentMachineIndex: this.currentMachineIndex
      };
      localStorage.setItem('jeongseon_plush_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Save error:', e);
    }
  }

  loadSave() {
    try {
      const raw = localStorage.getItem('jeongseon_plush_save');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.money === 'number') this.money = data.money;
      if (typeof data.careerEarnings === 'number') this.careerEarnings = data.careerEarnings;
      if (typeof data.totalPlays === 'number') this.totalPlays = data.totalPlays;
      if (typeof data.totalCatches === 'number') this.totalCatches = data.totalCatches;
      if (data.upgrades) this.upgrades = { ...this.upgrades, ...data.upgrades };
      this.bagCapacity = this.bagCapacities[this.upgrades.bagLevel - 1] || 6;

      if (Array.isArray(data.bag)) {
        this.bag = data.bag.map(item => {
          const t = PLUSHIE_DATABASE[item.id] || PLUSHIE_DATABASE.potato;
          return {
            ...t,
            price: item.price || t.basePrice,
            isShiny: item.isShiny || false
          };
        });
      }
    } catch (e) {
      console.warn('Load save error:', e);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.game = new JeongseonPlushGame();
  });
} else {
  window.game = new JeongseonPlushGame();
}
