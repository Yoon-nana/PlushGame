// clawEngine.js - 2.5D Isometric Physics Claw Machine Engine with Emoji Plushies & Coin System

import { PLUSHIE_DATABASE, CLAW_MACHINES, drawPlushieEmoji } from './plushies.js';
import { soundManager } from './audio.js';

export class ClawEngine {
  constructor(canvas, onCatchCallback, onDropMissCallback, onTimerExpireCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onCatch = onCatchCallback;
    this.onDropMiss = onDropMissCallback;
    this.onTimerExpire = onTimerExpireCallback;

    // Viewport Fixed Resolution
    this.width = 640;
    this.height = 520;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Machine Interior 3D boundaries
    // X: 50 (left) to 580 (right)
    // Y: 40 (back) to 340 (front)
    // Z: 20 (top) to 360 (floor)
    this.bounds = {
      minX: 70,
      maxX: 570,
      minY: 50,
      maxY: 330,
      topZ: 25,
      floorZ: 340,
      chute: { x: 120, y: 280, radius: 50 }
    };

    // Credit & Timer System
    this.credits = 0;
    this.timeRemaining = 0; // seconds

    // Claw Position & State
    this.claw = {
      x: 320,
      y: 180,
      z: 25,
      swayX: 0,
      swayY: 0,
      swayVx: 0,
      swayVy: 0,
      prongAngle: 0.75, // open: 0.75, closed: 0.15
      targetProngAngle: 0.75,
      state: 'WAITING_COIN', // WAITING_COIN, IDLE, DESCENDING, GRABBING, ASCENDING, RETURNING, RELEASING, RESETTING
      grippedPlushie: null,
      gripStrengthFactor: 1.0
    };

    // Upgrades
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

    // Keys
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

  // Insert Coin: Add Credit & Start Play Timer
  insertCoin() {
    this.credits = 1;
    this.timeRemaining = 30; // 30 seconds
    this.claw.state = 'IDLE';
    this.claw.targetProngAngle = 0.75;
    this.addFloatingText('🪙 코인 투입! 조작 시작 (30초)', this.claw.x, 80, '#fde047', 22);
  }

  initPlushies() {
    this.plushieList = [];
    const count = 22; // 22 plushies in pile
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
      px = this.bounds.minX + 30 + Math.random() * (this.bounds.maxX - this.bounds.minX - 60);
      py = this.bounds.minY + 30 + Math.random() * (this.bounds.maxY - this.bounds.minY - 60);
      attempts++;
    } while (
      attempts < 12 &&
      Math.hypot(px - this.bounds.chute.x, py - this.bounds.chute.y) < this.bounds.chute.radius + 40
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
      z: this.bounds.floorZ - 10 - (Math.random() * 20),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
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
    this.addFloatingText('🧲 마그넷 펄스 가동!', this.claw.x, this.claw.y - 20, '#38bdf8', 20);
  }

  triggerDrop() {
    if (this.credits <= 0) {
      soundManager.playMiss();
      this.addFloatingText('⚠️ 먼저 동전을 넣어주세요!', this.width / 2, this.height / 2, '#ef4444', 22);
      return false;
    }

    if (this.claw.state !== 'IDLE') return false;

    this.claw.state = 'DESCENDING';
    this.claw.targetProngAngle = 0.85;
    soundManager.playDropWhoosh();
    return true;
  }

  // --- Main Update Loop ---
  update(deltaTime = 1) {
    const claw = this.claw;
    const speed = 2.6 + (this.upgrades.moveSpeed * 0.7);

    // Timer Countdown during IDLE state
    if (claw.state === 'IDLE' && this.credits > 0) {
      this.timeRemaining -= (deltaTime * 0.016);
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.triggerDrop(); // Auto drop when time expires
      }
    }

    // Magnetic Pulse Pull
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

    // State Machine
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
        claw.z += 4.6;
        claw.swayX *= 0.93;
        claw.swayY *= 0.93;

        let hitPlushie = null;
        for (const p of this.plushieList) {
          const d = Math.hypot(claw.x - p.x, claw.y - p.y);
          if (d < p.radius + 18 && claw.z >= (p.z - p.radius * 0.65)) {
            hitPlushie = p;
            break;
          }
        }

        if (claw.z >= this.bounds.floorZ - 25 || hitPlushie) {
          claw.state = 'GRABBING';
          claw.targetProngAngle = 0.15; // Grip shut
          this.stateTimer = 45;
          soundManager.playClawGrip();
        }
        break;
      }

      case 'GRABBING': {
        claw.prongAngle += (claw.targetProngAngle - claw.prongAngle) * 0.2;
        this.stateTimer -= deltaTime;

        if (this.stateTimer <= 0) {
          let bestTarget = null;
          let bestDist = 9999;

          for (const p of this.plushieList) {
            if (p.isFallingInChute) continue;
            const dist = Math.hypot(claw.x - p.x, claw.y - p.y);
            if (dist < p.radius + 25 && dist < bestDist) {
              bestDist = dist;
              bestTarget = p;
            }
          }

          if (bestTarget) {
            const gripPowerBonus = 0.25 + (this.upgrades.gripPower * 0.20);
            const weightPenalty = bestTarget.weight * 0.35;
            const alignmentBonus = Math.max(0, 1 - (bestDist / (bestTarget.radius + 25)));
            const luckBonus = this.upgrades.luckCharm * 0.05;

            const gripQuality = (gripPowerBonus + alignmentBonus * 0.55 + luckBonus) - weightPenalty;

            if (gripQuality >= 0.35 || Math.random() < 0.70 + gripQuality * 0.25) {
              claw.grippedPlushie = bestTarget;
              bestTarget.isGripped = true;
              claw.gripStrengthFactor = Math.min(1.0, Math.max(0.4, gripQuality));
              this.addFloatingText('🎯 잡았다!', claw.x, claw.y - 45, '#facc15', 22);
            } else {
              this.addFloatingText('미끄러짐... 💦', claw.x, claw.y - 45, '#f87171', 20);
              soundManager.playMiss();
            }
          }

          claw.state = 'ASCENDING';
        }
        break;
      }

      case 'ASCENDING': {
        claw.z -= 4.0;

        if (claw.grippedPlushie && claw.gripStrengthFactor < 0.6) {
          if (claw.z < this.bounds.floorZ - 130 && Math.random() < 0.02) {
            const p = claw.grippedPlushie;
            p.isGripped = false;
            p.vz = 2.5;
            p.vx = (Math.random() - 0.5) * 2;
            p.vy = (Math.random() - 0.5) * 2;
            claw.grippedPlushie = null;
            this.addFloatingText('앗! 놓쳤다! 😭', claw.x, claw.y - 30, '#ef4444', 22);
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
          this.credits = 0; // Credit consumed
          claw.state = 'WAITING_COIN';
        }
        break;
      }
    }

    // Update Plushie Physics
    for (let i = this.plushieList.length - 1; i >= 0; i--) {
      const p = this.plushieList[i];

      if (p.isGripped) {
        p.x = claw.x + claw.swayX * 0.75;
        p.y = claw.y + claw.swayY * 0.75;
        p.z = claw.z + 50;
        p.angle = claw.swayX * 0.06;
      } else if (p.isFallingInChute) {
        p.z += p.vz;
        p.vz += 0.45;
        p.angle += 0.12;
        p.radius *= 0.95;

        if (p.z > this.bounds.floorZ + 120 || p.radius < 4) {
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

        for (let j = i + 1; j < this.plushieList.length; j++) {
          const other = this.plushieList[j];
          if (other.isGripped || other.isFallingInChute) continue;

          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const dist = Math.hypot(dx, dy);
          const minDist = (p.radius + other.radius) * 0.84;

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

    // Update Particles
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

    // Update Floating Texts
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
    this.createConfetti(this.bounds.chute.x, this.bounds.chute.y, 45);

    const priceText = `+₩${plushie.price.toLocaleString()}`;
    this.addFloatingText(`🎉 ${plushie.name} 획득!`, this.bounds.chute.x, this.bounds.chute.y - 70, '#facc15', 24);
    this.addFloatingText(priceText, this.bounds.chute.x, this.bounds.chute.y - 35, '#4ade80', 22);

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

  // --- Rendering Pipeline ---
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Arcade Interior Wall & Flooring
    this.drawArcadeInterior();

    // 2. Prize Chute Hole
    this.drawPrizeChute();

    // 3. Target Laser Crosshair on Floor
    this.drawLaserCrosshair();

    // 4. Draw Plushie Pile (Sorted by Y for depth)
    const sorted = [...this.plushieList].sort((a, b) => a.y - b.y);
    for (const p of sorted) {
      if (p.isGripped) continue;
      drawPlushieEmoji(ctx, p, p.x, p.y + p.z * 0.15, p.radius, p.angle, p.isShiny);
    }

    // 5. Claw Assembly (Top Gantry, Cable, Carriage, 3 Prongs)
    this.drawClawAssembly();

    // 6. Draw Gripped Plushie in Claw
    if (this.claw.grippedPlushie) {
      const p = this.claw.grippedPlushie;
      drawPlushieEmoji(ctx, p, p.x, p.y + p.z * 0.15, p.radius, p.angle, p.isShiny);
    }

    // 7. Glass Reflections & Neon Cabinet Frame
    this.drawGlassAndNeon();

    // 8. On-screen Status / Coin Prompt / Timer
    this.drawHUDOverlay();

    // 9. Particles & Floating Texts
    this.drawEffects();
  }

  drawArcadeInterior() {
    const ctx = this.ctx;

    // Background Gradient (Dark Arcade Vibe)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#110e24');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Floor Isometric Grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.lineWidth = 1.5;
    for (let x = 60; x <= 580; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 100; y <= 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(580, y);
      ctx.stroke();
    }

    // Top Chrome Rails
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(70, 45);
    ctx.lineTo(570, 45);
    ctx.stroke();

    // Moving Carriage Rail
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
    const cy = chute.y + 35;

    ctx.save();
    // Chute Glow
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.ellipse(chute.x, cy, chute.radius * 1.15, chute.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Prize Drop Arrow / Text
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁 배출구 WIN', chute.x, cy);
    ctx.restore();
  }

  drawLaserCrosshair() {
    const ctx = this.ctx;
    const groundY = this.claw.y + this.bounds.floorZ * 0.15 + 30;

    ctx.save();
    // Red Laser Target Circle on Floor
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(this.claw.x, groundY, 28, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Center Cross
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.claw.x, groundY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawClawAssembly() {
    const ctx = this.ctx;
    const claw = this.claw;
    const clawY = 55 + claw.z;
    const clawX = claw.x + claw.swayX;

    ctx.save();

    // 1. Top Carriage Box
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.fillRect(claw.x - 24, 35, 48, 20);
    ctx.strokeRect(claw.x - 24, 35, 48, 20);

    // Motor Indicator LED
    ctx.fillStyle = this.credits > 0 ? (claw.state === 'IDLE' ? '#22c55e' : '#f59e0b') : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(claw.x, 45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Extending Braided Cable
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(claw.x, 55);
    ctx.lineTo(clawX, clawY);
    ctx.stroke();

    // 3. Claw Swivel Head
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

    // Chrome Top Cap
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Piston Cylinder
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-7, 0, 14, 20);

    // 4. Three-Prong Articulated Claws (Chrome + Red Tips)
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
    // Rubber grip tip
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
    // Rubber grip tip
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

    // Glass Sheen Reflection
    const sheen = ctx.createLinearGradient(0, 0, this.width, this.height);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    sheen.addColorStop(0.3, 'rgba(255, 255, 255, 0.10)');
    sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.02)');
    sheen.addColorStop(0.7, 'rgba(255, 255, 255, 0.06)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, this.width, this.height);

    // Neon Border
    ctx.strokeStyle = this.currentMachine.neonColor || '#fde047';
    ctx.lineWidth = 4;
    ctx.shadowColor = this.currentMachine.themeColor || '#eab308';
    ctx.shadowBlur = 14;
    ctx.strokeRect(6, 6, this.width - 12, this.height - 12);
    ctx.shadowBlur = 0;
  }

  drawHUDOverlay() {
    const ctx = this.ctx;

    // If waiting for coin, display blinking arcade prompt
    if (this.credits <= 0) {
      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      if (blink) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.roundRect(this.width / 2 - 180, 20, 360, 48, 14);
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
      // Show Time Remaining Counter
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.roundRect(this.width / 2 - 140, 20, 280, 44, 12);
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

    // Particles
    for (const part of this.particles) {
      ctx.save();
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating Texts
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
