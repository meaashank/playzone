/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Sparkles,
  Play,
  Pause,
  Award,
  Crown,
  Zap,
  Timer,
  ShoppingBag,
  Shield,
  Sliders,
  Compass,
  Star
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';
import {
  ThemeId,
  GameMode,
  Difficulty,
  ControlMode,
  Skin,
  Snake,
  Food,
  PowerUp,
  Particle,
  FloatingText,
  ARENA_SIZE,
  SEGMENT_SPACING,
  SKINS_LIST,
  THEME_STYLES
} from './SnakeGameData';

// --- SOUND SYNTHESIZER INTERFACE ---
class SnakeAudio {
  static play(type: 'click' | 'eat' | 'boost' | 'crash' | 'victory' | 'powerup' | 'kill', enabled: boolean) {
    if (!enabled) return;
    try {
      switch (type) {
        case 'eat':
          SoundEngine.play('snake_eat');
          break;
        case 'boost':
          SoundEngine.play('snake_boost');
          break;
        case 'crash':
          SoundEngine.play('snake_crash');
          break;
        case 'victory':
          SoundEngine.play('win');
          break;
        case 'powerup':
          SoundEngine.play('level_up');
          break;
        case 'kill':
          SoundEngine.play('coin');
          break;
        default:
          SoundEngine.play('click');
          break;
      }
    } catch (e) {
      console.warn('Audio ignored:', e);
    }
  }
}

interface SnakeGameProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  onAddCoins: (amount: number) => void;
  onAddXP: (amount: number) => void;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({
  onBack,
  theme: appTheme,
  soundEnabled,
  onAddCoins,
  onAddXP
}) => {
  const isDark = appTheme === 'dark';

  // Game configuration states
  const [activeTheme, setActiveTheme] = useState<ThemeId>('neon');
  const [gameMode, setGameMode] = useState<GameMode>('bordered');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [controlMode, setControlMode] = useState<ControlMode>(() => {
    const saved = localStorage.getItem('snake-control-mode');
    return (saved === 'click' || saved === 'follow') ? saved : 'follow';
  });
  const [sensitivity, setSensitivity] = useState<number>(() => {
    const saved = localStorage.getItem('snake-sensitivity');
    return saved ? parseFloat(saved) : 0.08;
  });
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'skins'>('settings');

  // Coins & Skins persistency states
  const [localCoins, setLocalCoins] = useState<number>(() => {
    const saved = localStorage.getItem('snake-rush-coins');
    return saved ? parseInt(saved, 10) : 350; // default initial balance to explore skins shop
  });
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('snake-rush-unlocked-skins');
    return saved ? JSON.parse(saved) : ['classic-neon', 'forest-viper'];
  });
  const [equippedSkinId, setEquippedSkinId] = useState<string>(() => {
    const saved = localStorage.getItem('snake-rush-equipped-skin');
    return saved ? saved : 'classic-neon';
  });

  // Game states
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-rush-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeSurvived, setTimeSurvived] = useState(0);

  // Active power-ups state for UI progress rendering
  const [powerUpTimers, setPowerUpTimers] = useState<{
    magnet: number;
    shield: number;
    multiplier: number;
    speed: number;
  }>({ magnet: 0, shield: 0, multiplier: 0, speed: 0 });

  // Rewards layout payouts
  const [rewardCoins, setRewardCoins] = useState(0);
  const [rewardXP, setRewardXP] = useState(0);

  // References for rendering and high-performance gameplay loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<Snake>({
    id: 'player',
    name: 'YOU',
    isBot: false,
    x: ARENA_SIZE / 2,
    y: ARENA_SIZE / 2,
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    speed: 2.6,
    score: 0,
    length: 12,
    body: [],
    pathHistory: [],
    color: '#6366f1',
    isBoosting: false,
    pendingGrowth: 0,
    skinId: 'classic-neon'
  });

  const botsRef = useRef<Snake[]>([]);
  const foodRef = useRef<Food[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cameraRef = useRef({ x: ARENA_SIZE / 2, y: ARENA_SIZE / 2, zoom: 1 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; isPlayer: boolean }[]>([]);

  // Vibration and Audio triggers
  const playSound = (type: 'click' | 'eat' | 'boost' | 'crash' | 'victory' | 'powerup' | 'kill') => {
    SnakeAudio.play(type, soundOn);
  };

  const getSkinData = (id: string): Skin => {
    return SKINS_LIST.find(s => s.id === id) || SKINS_LIST[0];
  };

  // Persists skin and coin state on changes
  useEffect(() => {
    localStorage.setItem('snake-rush-coins', localCoins.toString());
  }, [localCoins]);

  useEffect(() => {
    localStorage.setItem('snake-rush-unlocked-skins', JSON.stringify(unlockedSkinIds));
  }, [unlockedSkinIds]);

  useEffect(() => {
    localStorage.setItem('snake-rush-equipped-skin', equippedSkinId);
    playerRef.current.skinId = equippedSkinId;
    playerRef.current.color = getSkinData(equippedSkinId).primaryColor;
  }, [equippedSkinId]);

  useEffect(() => {
    localStorage.setItem('snake-control-mode', controlMode);
  }, [controlMode]);

  useEffect(() => {
    localStorage.setItem('snake-sensitivity', sensitivity.toString());
  }, [sensitivity]);

  // Angle Lerp across wrapping boundaries
  const lerpAngle = (current: number, target: number, rate: number) => {
    let diff = target - current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * rate;
  };

  // Generate a path history segment positioning
  const updateBodySegments = (snake: Snake) => {
    const spacing = SEGMENT_SPACING * Math.sqrt(Math.min(1.8, 1.0 + (snake.length - 12) * 0.005));
    const h = snake.pathHistory;

    h.unshift({ x: snake.x, y: snake.y });

    const maxHistoryNeeded = Math.max(800, snake.length * 30);
    if (h.length > maxHistoryNeeded) {
      h.length = maxHistoryNeeded;
    }

    const segments: { x: number; y: number }[] = [{ x: snake.x, y: snake.y }];
    let lastPt = { x: snake.x, y: snake.y };
    let hIdx = 1;
    let distAccum = 0;

    for (let i = 1; i < snake.length; i++) {
      let found = false;
      while (hIdx < h.length) {
        const pt = h[hIdx];
        const dx = pt.x - lastPt.x;
        const dy = pt.y - lastPt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (distAccum + dist >= spacing) {
          const needed = spacing - distAccum;
          const ratio = needed / (dist || 1);
          const exactPt = {
            x: lastPt.x + dx * ratio,
            y: lastPt.y + dy * ratio
          };
          segments.push(exactPt);
          lastPt = exactPt;
          distAccum = 0;
          hIdx++;
          found = true;
          break;
        } else {
          distAccum += dist;
          lastPt = pt;
          hIdx++;
        }
      }
      if (!found) {
        const fallback = h[h.length - 1] || { x: snake.x, y: snake.y };
        segments.push({ x: fallback.x, y: fallback.y });
        lastPt = fallback;
      }
    }
    snake.body = segments;
  };

  // Spawn random food
  const generateFoodPellet = (id: string, forceX?: number, forceY?: number, valueMultiplier = 1): Food => {
    const rx = forceX !== undefined ? forceX : Math.random() * (ARENA_SIZE - 60) + 30;
    const ry = forceY !== undefined ? forceY : Math.random() * (ARENA_SIZE - 60) + 30;
    const colors = ['#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#c084fc', '#f87171', '#22d3ee'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const isSuper = Math.random() < 0.08;

    return {
      id,
      x: rx,
      y: ry,
      color: isSuper ? '#fbbf24' : col,
      value: isSuper ? 10 * valueMultiplier : 3 * valueMultiplier,
      size: isSuper ? 8 : 4.5,
      pulsePhase: Math.random() * Math.PI * 2
    };
  };

  // Spawn a floating text notification
  const addFloatingText = (text: string, x: number, y: number, color = '#22c55e') => {
    floatingTextsRef.current.push({
      id: `text-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      alpha: 1,
      scale: 1,
      vy: -1.2,
      life: 0,
      maxLife: 45
    });
  };

  // Spawn dynamic power-up
  const spawnPowerUpItem = (id: string, type?: 'magnet' | 'shield' | 'multiplier' | 'speed'): PowerUp => {
    const types: ('magnet' | 'shield' | 'multiplier' | 'speed')[] = ['magnet', 'shield', 'multiplier', 'speed'];
    const selectedType = type || types[Math.floor(Math.random() * types.length)];
    const px = Math.random() * (ARENA_SIZE - 120) + 60;
    const py = Math.random() * (ARENA_SIZE - 120) + 60;

    const styling = {
      magnet: { color: '#fbbf24', icon: '🧲' },
      shield: { color: '#c084fc', icon: '🛡️' },
      multiplier: { color: '#60a5fa', icon: '✨' },
      speed: { color: '#f87171', icon: '⚡' }
    };

    return {
      id,
      type: selectedType,
      x: px,
      y: py,
      color: styling[selectedType].color,
      size: 15,
      icon: styling[selectedType].icon,
      pulsePhase: Math.random() * Math.PI * 2
    };
  };

  // Spawn premium particle bursts
  const spawnExplosion = (x: number, y: number, color: string, count = 15, trailType = 'normal') => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 3.5,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.floor(Math.random() * 20),
        trailType
      });
    }
  };

  // Generate bot snake
  const generateBot = (id: string): Snake => {
    const botColors = ['#f43f5e', '#10b981', '#3b82f6', '#fbbf24', '#a855f7', '#06b6d4', '#f97316'];
    const botNames = ['VenomSlither', 'Worminator', 'ApexCobra', 'ToxicMamba', 'GalaxyWorm', 'TurboSnaker', 'NeonPython', 'SlitherGamer'];
    const bSkin = SKINS_LIST[Math.floor(Math.random() * SKINS_LIST.length)];
    
    const bx = Math.random() * (ARENA_SIZE - 400) + 200;
    const by = Math.random() * (ARENA_SIZE - 400) + 200;
    const bAngle = Math.random() * Math.PI * 2;
    const col = bSkin.primaryColor;
    const name = botNames[Math.floor(Math.random() * botNames.length)] + ` #${Math.floor(Math.random() * 900 + 100)}`;

    const bot: Snake = {
      id,
      name,
      isBot: true,
      x: bx,
      y: by,
      angle: bAngle,
      targetAngle: bAngle,
      speed: 2.1 + Math.random() * 0.7,
      score: 0,
      length: 12 + Math.floor(Math.random() * 28),
      body: [],
      pathHistory: [],
      color: col,
      isBoosting: false,
      botDecisionTimer: 0,
      pendingGrowth: 0,
      skinId: bSkin.id
    };

    for (let i = 0; i < bot.length * 6; i++) {
      bot.pathHistory.push({
        x: bx - Math.cos(bAngle) * i * 3,
        y: by - Math.sin(bAngle) * i * 3
      });
    }
    updateBodySegments(bot);
    return bot;
  };

  // Handle bot death and food scatter
  const spawnDeathFoodTrail = (snake: Snake) => {
    snake.body.forEach((seg, idx) => {
      if (idx % 2 === 0) {
        foodRef.current.push({
          id: `death-food-${snake.id}-${idx}-${Date.now()}`,
          x: seg.x + (Math.random() - 0.5) * 16,
          y: seg.y + (Math.random() - 0.5) * 16,
          color: snake.color,
          value: 12,
          size: 7.5,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    });
  };

  // Setup round
  const startGame = () => {
    playSound('click');
    triggerVibration('medium');

    const equippedSkin = getSkinData(equippedSkinId);

    // Initial player structure
    playerRef.current = {
      id: 'player',
      name: 'YOU',
      isBot: false,
      x: ARENA_SIZE / 2,
      y: ARENA_SIZE / 2,
      angle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      speed: 2.6,
      score: 0,
      length: 12,
      body: [],
      pathHistory: [],
      color: equippedSkin.primaryColor,
      isBoosting: false,
      pendingGrowth: 0,
      skinId: equippedSkinId,
      magnetExpires: 0,
      shieldExpires: 0,
      multiplierExpires: 0,
      speedExpires: 0
    };

    for (let i = 0; i < 80; i++) {
      playerRef.current.pathHistory.push({
        x: ARENA_SIZE / 2,
        y: ARENA_SIZE / 2 + i * 3
      });
    }
    updateBodySegments(playerRef.current);

    // Initial setup arrays
    const foodArr: Food[] = [];
    for (let i = 0; i < 350; i++) {
      foodArr.push(generateFoodPellet(`food-${i}`));
    }
    foodRef.current = foodArr;

    const pUps: PowerUp[] = [];
    for (let i = 0; i < 5; i++) {
      pUps.push(spawnPowerUpItem(`powerup-init-${i}`));
    }
    powerUpsRef.current = pUps;

    // Drifting space dust particles
    const spaceDust: Particle[] = [];
    for (let i = 0; i < 70; i++) {
      spaceDust.push({
        x: Math.random() * ARENA_SIZE,
        y: Math.random() * ARENA_SIZE,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        color: 'rgba(255, 255, 255, 0.15)',
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
        life: 0,
        maxLife: 1000,
        isDust: true
      });
    }
    particlesRef.current = spaceDust;

    // Spawn 6 dynamic bots
    const botsArr: Snake[] = [];
    for (let i = 0; i < 7; i++) {
      botsArr.push(generateBot(`bot-${i}`));
    }
    botsRef.current = botsArr;

    floatingTextsRef.current = [];
    cameraRef.current = { x: ARENA_SIZE / 2, y: ARENA_SIZE / 2, zoom: 1 };
    
    setScore(0);
    setTimeSurvived(0);
    setRewardCoins(0);
    setRewardXP(0);
    setGameState('playing');

    addFloatingText('VENOM ARENA DEPLOYED!', ARENA_SIZE / 2, ARENA_SIZE / 2 - 30, '#10b981');
  };

  const handleGameOver = () => {
    playSound('crash');
    triggerVibration('heavy');
    setGameState('over');

    const finalScore = playerRef.current.score;
    const coins = Math.floor(finalScore / 3.0);
    const xp = Math.floor(finalScore / 2.0);

    setRewardCoins(coins);
    setRewardXP(xp);

    // Add directly to local balance and sync to App
    if (coins > 0) {
      setLocalCoins(prev => prev + coins);
      onAddCoins(coins);
    }
    if (xp > 0) {
      onAddXP(xp);
    }

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('snake-rush-highscore', finalScore.toString());
      playSound('victory');
    }
  };

  // Buy Skin action handler
  const handleBuySkin = (skin: Skin) => {
    if (localCoins >= skin.price) {
      setLocalCoins(prev => prev - skin.price);
      setUnlockedSkinIds(prev => [...prev, skin.id]);
      setEquippedSkinId(skin.id);
      playSound('powerup');
      triggerVibration('medium');
    } else {
      playSound('crash');
    }
  };

  // Keyboard steers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const p = playerRef.current;
      const turnAmount = 0.55;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          p.targetAngle -= turnAmount;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          p.targetAngle += turnAmount;
          break;
        case ' ':
          e.preventDefault();
          p.isBoosting = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        playerRef.current.isBoosting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Touch Virtual controls
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    touchCurrentRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'playing' || !touchStartRef.current) return;
    const t = e.touches[0];
    touchCurrentRef.current = { x: t.clientX, y: t.clientY };

    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      playerRef.current.targetAngle = Math.atan2(dy, dx);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    touchCurrentRef.current = null;
  };

  // Ticking time survivors & active powerups display updater
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeSurvived(prev => prev + 1);

      // Extract current active power-up states
      const now = Date.now();
      const p = playerRef.current;
      
      const magnetLeft = p.magnetExpires && p.magnetExpires > now ? Math.ceil((p.magnetExpires - now) / 1000) : 0;
      const shieldLeft = p.shieldExpires && p.shieldExpires > now ? Math.ceil((p.shieldExpires - now) / 1000) : 0;
      const multiplierLeft = p.multiplierExpires && p.multiplierExpires > now ? Math.ceil((p.multiplierExpires - now) / 1000) : 0;
      const speedLeft = p.speedExpires && p.speedExpires > now ? Math.ceil((p.speedExpires - now) / 1000) : 0;

      setPowerUpTimers({
        magnet: magnetLeft,
        shield: shieldLeft,
        multiplier: multiplierLeft,
        speed: speedLeft
      });
    }, 200);

    return () => clearInterval(timer);
  }, [gameState]);

  // Main Canvas updates & Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateAndRender = () => {
      const width = canvas.width;
      const height = canvas.height;
      const themeData = THEME_STYLES[activeTheme];

      // --- 1. PHYSICS UPDATE ---
      if (gameState === 'playing') {
        const p = playerRef.current;
        const now = Date.now();

        // Magnetic Attraction
        const isMagnetActive = p.magnetExpires && p.magnetExpires > now;
        if (isMagnetActive) {
          const pullRadius = 180;
          foodRef.current.forEach(food => {
            const dx = p.x - food.x;
            const dy = p.y - food.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pullRadius) {
              const pullForce = (pullRadius - dist) * 0.12; // accelerate towards player head
              food.x += (dx / dist) * pullForce;
              food.y += (dy / dist) * pullForce;
            }
          });

          powerUpsRef.current.forEach(pUp => {
            const dx = p.x - pUp.x;
            const dy = p.y - pUp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pullRadius) {
              const pullForce = (pullRadius - dist) * 0.08;
              pUp.x += (dx / dist) * pullForce;
              pUp.y += (dy / dist) * pullForce;
            }
          });
        }

        // Speed settings & boosts
        const isSpeedActive = p.speedExpires && p.speedExpires > now;
        let currentBaseSpeed = difficulty === 'hyper' ? 3.2 : difficulty === 'easy' ? 2.0 : 2.6;
        if (isSpeedActive) {
          currentBaseSpeed *= 1.45; // speeds up for free
        }

        if (p.isBoosting && p.score > 12) {
          p.speed = currentBaseSpeed * 1.7;
          // Spawn boost sparks
          if (Math.random() < 0.15) {
            if (!isSpeedActive) {
              p.score = Math.max(0, p.score - 1);
              setScore(p.score);
            }
            const tail = p.body[p.body.length - 1] || p;
            foodRef.current.push(generateFoodPellet(`trail-${Date.now()}`, tail.x, tail.y, 0.5));
            
            // Spark effect matching skin trail
            const pSkin = getSkinData(p.skinId);
            spawnExplosion(tail.x, tail.y, pSkin.primaryColor, 2, pSkin.trailType);
            playSound('boost');
            triggerVibration('tick');
          }
        } else {
          p.speed = currentBaseSpeed;
          p.isBoosting = false;
        }

        // Steer player with custom turn sensitivity
        p.angle = lerpAngle(p.angle, p.targetAngle, sensitivity);
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        // Boundaries check
        if (gameMode === 'bordered') {
          if (p.x < 15 || p.x > ARENA_SIZE - 15 || p.y < 15 || p.y > ARENA_SIZE - 15) {
            handleGameOver();
            return;
          }
        } else {
          if (p.x < 0) p.x = ARENA_SIZE;
          if (p.x > ARENA_SIZE) p.x = 0;
          if (p.y < 0) p.y = ARENA_SIZE;
          if (p.y > ARENA_SIZE) p.y = 0;
        }

        // Player Growth interp
        if (p.pendingGrowth >= 1) {
          p.length += 1;
          p.pendingGrowth -= 1;
        }
        updateBodySegments(p);

        // Player eating food
        const pRadius = 14 * Math.min(1.8, 1.0 + (p.length - 12) * 0.005);
        const isX2Active = p.multiplierExpires && p.multiplierExpires > now;

        foodRef.current = foodRef.current.filter(food => {
          const dx = food.x - p.x;
          const dy = food.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pRadius + food.size + 4) {
            const finalVal = isX2Active ? food.value * 2 : food.value;
            p.score += finalVal;
            setScore(p.score);
            p.pendingGrowth += finalVal * 0.16;

            playSound('eat');
            triggerVibration('tick');
            spawnExplosion(food.x, food.y, food.color, 4);

            if (food.value > 8) {
              addFloatingText(`+${finalVal} MASS`, food.x, food.y - 12, '#fbbf24');
            }
            return false;
          }
          return true;
        });

        // Respawn basic food if counts drop
        while (foodRef.current.length < 350) {
          foodRef.current.push(generateFoodPellet(`respawn-${Date.now()}-${Math.random()}`));
        }

        // Eat Power-ups
        powerUpsRef.current = powerUpsRef.current.filter(pUp => {
          const dx = pUp.x - p.x;
          const dy = pUp.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pRadius + pUp.size + 6) {
            playSound('powerup');
            triggerVibration('medium');
            spawnExplosion(pUp.x, pUp.y, pUp.color, 20, 'magic');

            const duration = 15000; // 15 seconds
            const futureTime = Date.now() + duration;

            if (pUp.type === 'magnet') {
              p.magnetExpires = futureTime;
              addFloatingText('MAGNET ACTIVE! 🧲', pUp.x, pUp.y, '#fbbf24');
            } else if (pUp.type === 'shield') {
              p.shieldExpires = futureTime;
              addFloatingText('ENERGY SHIELD ACTIVE! 🛡️', pUp.x, pUp.y, '#c084fc');
            } else if (pUp.type === 'multiplier') {
              p.multiplierExpires = futureTime;
              addFloatingText('2X MASS ACTIVE! ✨', pUp.x, pUp.y, '#60a5fa');
            } else if (pUp.type === 'speed') {
              p.speedExpires = futureTime;
              addFloatingText('ADRENALINE RUSH! ⚡', pUp.x, pUp.y, '#f87171');
            }

            return false;
          }
          return true;
        });

        // Respawn powerups if eaten
        while (powerUpsRef.current.length < 5) {
          powerUpsRef.current.push(spawnPowerUpItem(`powerup-respawn-${Date.now()}-${Math.random()}`));
        }

        // Crashing into own self
        if (p.length > 25) {
          const isShieldActive = p.shieldExpires && p.shieldExpires > now;
          for (let i = 20; i < p.body.length; i++) {
            const seg = p.body[i];
            const dx = seg.x - p.x;
            const dy = seg.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pRadius * 0.72) {
              if (isShieldActive) {
                p.shieldExpires = 0; // shatter
                spawnExplosion(p.x, p.y, '#c084fc', 25, 'magic');
                addFloatingText('SHIELD SHATTERED! 🛡️', p.x, p.y - 20, '#ef4444');
                p.speedExpires = Date.now() + 1500; // safe speed burst
                break;
              } else {
                handleGameOver();
                return;
              }
            }
          }
        }

        // --- BOTS PHYSICS & COLLISION DECISIONS ---
        const activeBots = botsRef.current;
        for (let bIdx = activeBots.length - 1; bIdx >= 0; bIdx--) {
          const bot = activeBots[bIdx];
          const isBotShieldActive = bot.shieldExpires && bot.shieldExpires > now;

          // occasional boost
          bot.isBoosting = bot.length > 25 && Math.random() < 0.01;
          const bSpeedMultiplier = bot.isBoosting ? 1.6 : 1.0;
          const baseBotSpd = (difficulty === 'hyper' ? 2.6 : difficulty === 'easy' ? 1.8 : 2.2) * bSpeedMultiplier;
          bot.speed = baseBotSpd;

          // decision trees
          bot.botDecisionTimer = (bot.botDecisionTimer || 0) + 1;
          if (bot.botDecisionTimer > 20) {
            bot.botDecisionTimer = 0;

            // 1. Slither towards nearest food or power-up
            let closestItem = null;
            let closestDist = 450;

            // Find closest food
            foodRef.current.forEach(food => {
              const dx = food.x - bot.x;
              const dy = food.y - bot.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < closestDist) {
                closestDist = dist;
                closestItem = food;
              }
            });

            // If a powerup is nearby, bots prioritize it aggressively!
            powerUpsRef.current.forEach(pUp => {
              const dx = pUp.x - bot.x;
              const dy = pUp.y - bot.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < closestDist + 80) {
                closestDist = dist;
                closestItem = pUp;
              }
            });

            if (closestItem) {
              bot.targetAngle = Math.atan2((closestItem as any).y - bot.y, (closestItem as any).x - bot.x);
            } else {
              bot.targetAngle += (Math.random() - 0.5) * 1.5;
            }

            // 2. Obstacles avoidances
            const avoidDist = 95;
            const allSnakes = [p, ...activeBots];

            allSnakes.forEach(other => {
              if (other.id === bot.id) return;
              other.body.forEach((seg, idx) => {
                if (idx < 2) return;
                const dx = seg.x - bot.x;
                const dy = seg.y - bot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < avoidDist) {
                  const angleToSeg = Math.atan2(dy, dx);
                  // Steer outwards aggressively
                  bot.targetAngle = angleToSeg + Math.PI + (Math.random() - 0.5) * 0.6;
                  // Bot boosts to escape tight spots
                  if (bot.length > 18) bot.isBoosting = true;
                }
              });
            });

            // 3. Wall boundaries
            if (bot.x < 150) bot.targetAngle = 0;
            else if (bot.x > ARENA_SIZE - 150) bot.targetAngle = Math.PI;
            if (bot.y < 150) bot.targetAngle = Math.PI / 2;
            else if (bot.y > ARENA_SIZE - 150) bot.targetAngle = -Math.PI / 2;
          }

          // Steer bot
          bot.angle = lerpAngle(bot.angle, bot.targetAngle, 0.09);
          bot.x += Math.cos(bot.angle) * bot.speed;
          bot.y += Math.sin(bot.angle) * bot.speed;

          // Boundary wraps / wall kills
          if (gameMode === 'bordered') {
            if (bot.x < 15 || bot.x > ARENA_SIZE - 15 || bot.y < 15 || bot.y > ARENA_SIZE - 15) {
              spawnExplosion(bot.x, bot.y, bot.color, 15);
              spawnDeathFoodTrail(bot);
              activeBots[bIdx] = generateBot(bot.id);
              continue;
            }
          } else {
            if (bot.x < 0) bot.x = ARENA_SIZE;
            if (bot.x > ARENA_SIZE) bot.x = 0;
            if (bot.y < 0) bot.y = ARENA_SIZE;
            if (bot.y > ARENA_SIZE) bot.y = 0;
          }

          if (bot.pendingGrowth >= 1) {
            bot.length += 1;
            bot.pendingGrowth -= 1;
          }
          updateBodySegments(bot);

          // Bot eat food
          const botRadius = 14 * Math.min(1.8, 1.0 + (bot.length - 12) * 0.005);
          foodRef.current = foodRef.current.filter(food => {
            const dx = food.x - bot.x;
            const dy = food.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < botRadius + food.size + 4) {
              bot.score += food.value;
              bot.pendingGrowth += food.value * 0.16;
              return false;
            }
            return true;
          });

          // Bot eats power-ups!
          powerUpsRef.current = powerUpsRef.current.filter(pUp => {
            const dx = pUp.x - bot.x;
            const dy = pUp.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < botRadius + pUp.size + 4) {
              const futureTime = Date.now() + 12000;
              if (pUp.type === 'shield') bot.shieldExpires = futureTime;
              else if (pUp.type === 'magnet') bot.magnetExpires = futureTime;
              spawnExplosion(pUp.x, pUp.y, pUp.color, 10, 'magic');
              return false; // consumed
            }
            return true;
          });

          // Collisions decisions: Bot hits player body segments
          let botCrashed = false;
          p.body.forEach((seg, idx) => {
            if (idx < 2) return;
            const dx = seg.x - bot.x;
            const dy = seg.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < botRadius * 0.72 + 10) {
              botCrashed = true;
            }
          });

          // Bot hits other bots segments
          activeBots.forEach(otherBot => {
            if (otherBot.id === bot.id) return;
            otherBot.body.forEach((seg, idx) => {
              if (idx < 2) return;
              const dx = seg.x - bot.x;
              const dy = seg.y - bot.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < botRadius * 0.72 + 10) {
                botCrashed = true;
              }
            });
          });

          // Player hits Bot segments (Player death warning)
          bot.body.forEach((seg, idx) => {
            if (idx < 2) return;
            const dx = seg.x - p.x;
            const dy = seg.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pRadius * 0.72 + 8) {
              const isPlayerShieldActive = p.shieldExpires && p.shieldExpires > now;
              if (isPlayerShieldActive) {
                // Break player shield, save player life!
                p.shieldExpires = 0;
                spawnExplosion(p.x, p.y, '#c084fc', 30, 'magic');
                addFloatingText('SHIELD BLOCKED COLLISION! 🛡️', p.x, p.y - 20, '#a855f7');
                p.speedExpires = Date.now() + 2000; // temporary escape hyper speed
                // redirect player angle opposite direction
                p.targetAngle = Math.atan2(p.y - seg.y, p.x - seg.x);
              } else {
                handleGameOver();
                return;
              }
            }
          });

          if (botCrashed) {
            if (isBotShieldActive) {
              bot.shieldExpires = 0; // shatter
              spawnExplosion(bot.x, bot.y, '#c084fc', 15);
              bot.targetAngle = bot.angle + Math.PI; // bounce
            } else {
              spawnExplosion(bot.x, bot.y, bot.color, 18, 'normal');
              spawnDeathFoodTrail(bot);
              playSound('kill');
              addFloatingText('SQUASHED!', bot.x, bot.y - 15, '#22c55e');
              // Replace bot
              activeBots[bIdx] = generateBot(bot.id);
            }
          }
        }

        // Realtime rankings recalculation
        const allSnakes = [p, ...activeBots].map(s => ({
          name: s.name,
          score: s.score,
          isPlayer: s.id === 'player'
        }));
        allSnakes.sort((a, b) => b.score - a.score);
        setLeaderboard(allSnakes.slice(0, 5));

        // Camera smoothly moves and scales
        cameraRef.current.x += (p.x - cameraRef.current.x) * 0.08;
        cameraRef.current.y += (p.y - cameraRef.current.y) * 0.08;

        const targetZoom = Math.max(0.42, 1.05 - (p.length - 12) * 0.0042);
        cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.025;
      }

      // --- 2. RENDERING STEPS ---
      ctx.fillStyle = themeData.boardBg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Apply camera zoom/follow
      ctx.translate(width / 2, height / 2);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // Arena background tiles grid lines
      const gridSpacing = 80;
      const viewLeft = cameraRef.current.x - width / (2 * cameraRef.current.zoom);
      const viewRight = cameraRef.current.x + width / (2 * cameraRef.current.zoom);
      const viewTop = cameraRef.current.y - height / (2 * cameraRef.current.zoom);
      const viewBottom = cameraRef.current.y + height / (2 * cameraRef.current.zoom);

      const startX = Math.floor(viewLeft / gridSpacing) * gridSpacing;
      const endX = Math.ceil(viewRight / gridSpacing) * gridSpacing;
      const startY = Math.floor(viewTop / gridSpacing) * gridSpacing;
      const endY = Math.ceil(viewBottom / gridSpacing) * gridSpacing;

      ctx.strokeStyle = themeData.gridLine;
      ctx.lineWidth = 1;

      for (let x = Math.max(0, startX); x <= Math.min(ARENA_SIZE, endX); x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, Math.max(0, viewTop));
        ctx.lineTo(x, Math.min(ARENA_SIZE, viewBottom));
        ctx.stroke();
      }
      for (let y = Math.max(0, startY); y <= Math.min(ARENA_SIZE, endY); y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(Math.max(0, viewLeft), y);
        ctx.lineTo(Math.min(ARENA_SIZE, viewRight), y);
        ctx.stroke();
      }

      // Border bounds
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE);

      // Threat boundary overlay alert
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fillRect(0, 0, ARENA_SIZE, 24);
      ctx.fillRect(0, 0, 24, ARENA_SIZE);
      ctx.fillRect(ARENA_SIZE - 24, 0, 24, ARENA_SIZE);
      ctx.fillRect(0, ARENA_SIZE - 24, ARENA_SIZE, 24);

      // Draw normal Food Pellets
      foodRef.current.forEach(food => {
        if (food.x < viewLeft - 30 || food.x > viewRight + 30 || food.y < viewTop - 30 || food.y > viewBottom + 30) return;

        const pulse = 1.0 + Math.sin(Date.now() / 140 + food.pulsePhase) * 0.16;
        const radius = food.size * pulse;

        ctx.save();
        ctx.fillStyle = food.color;

        if (food.value > 5) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = food.color;
        }

        ctx.beginPath();
        ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // glossy dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(food.x - radius * 0.3, food.y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Draw Power-Up Capsules
      powerUpsRef.current.forEach(pUp => {
        if (pUp.x < viewLeft - 40 || pUp.x > viewRight + 40 || pUp.y < viewTop - 40 || pUp.y > viewBottom + 40) return;

        const pulseScale = 1.0 + Math.sin(Date.now() / 200 + pUp.pulsePhase) * 0.22;
        const currentRad = pUp.size * pulseScale;

        ctx.save();
        // outer glow ring
        ctx.shadowBlur = 18;
        ctx.shadowColor = pUp.color;
        ctx.fillStyle = pUp.color;
        ctx.beginPath();
        ctx.arc(pUp.x, pUp.y, currentRad, 0, Math.PI * 2);
        ctx.fill();

        // inner capsule bubble
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(pUp.x, pUp.y, currentRad * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // draw icon symbol
        ctx.fillStyle = pUp.color;
        ctx.font = `bold ${Math.floor(currentRad * 0.85)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pUp.icon, pUp.x, pUp.y);

        ctx.restore();
      });

      // Render Snakes (Backwards overlap)
      const renderSnakeEntity = (snake: Snake) => {
        const baseRad = 13;
        const scaleFactor = Math.min(1.8, 1.0 + (snake.length - 12) * 0.005);
        const headRadius = baseRad * 1.15 * scaleFactor;
        const skin = getSkinData(snake.skinId);

        const len = snake.body.length;

        // Draw body segments backwards
        for (let i = len - 1; i >= 1; i--) {
          const seg = snake.body[i];
          if (!seg) continue;

          if (seg.x < viewLeft - 50 || seg.x > viewRight + 50 || seg.y < viewTop - 50 || seg.y > viewBottom + 50) continue;

          const segmentRadius = baseRad * scaleFactor * (1.0 - (i / len) * 0.32);

          // Organic lateral wave wiggle physics!
          const wiggleAmp = 4.2 * Math.min(1.5, scaleFactor);
          const segmentWiggle = Math.sin(Date.now() * 0.012 - i * 0.3) * wiggleAmp * (i / len);

          const nextSeg = snake.body[i - 1] || snake;
          const segAngle = Math.atan2(seg.y - nextSeg.y, seg.x - nextSeg.x);
          const drawX = seg.x + Math.cos(segAngle + Math.PI / 2) * segmentWiggle;
          const drawY = seg.y + Math.sin(segAngle + Math.PI / 2) * segmentWiggle;

          ctx.save();

          // Apply segment shadow depths
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 4;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';

          // Style rendering depending on Skin types
          if (skin.type === 'rainbow') {
            const hue = (Date.now() * 0.12 - i * 12) % 360;
            ctx.fillStyle = `hsla(${hue}, 95%, 60%, 1)`;
          } else if (skin.type === 'magma') {
            const glowPct = 0.5 + 0.5 * Math.sin(Date.now() * 0.005 - i * 0.4);
            ctx.fillStyle = i % 2 === 0 ? skin.primaryColor : `rgba(${255 * glowPct}, ${60 * glowPct + 20}, 10, 1)`;
          } else if (skin.type === 'venom') {
            ctx.fillStyle = skin.primaryColor;
            ctx.strokeStyle = skin.secondaryColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else if (skin.type === 'dragon') {
            ctx.fillStyle = skin.primaryColor;
            ctx.strokeStyle = '#e11d48';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else if (skin.type === 'matrix') {
            ctx.fillStyle = i % 3 === 0 ? '#10b981' : '#022c22';
          } else if (skin.type === 'gradient') {
            ctx.fillStyle = i % 2 === 0 ? skin.primaryColor : skin.secondaryColor;
          } else {
            ctx.fillStyle = skin.primaryColor;
          }

          ctx.beginPath();
          ctx.arc(drawX, drawY, segmentRadius, 0, Math.PI * 2);
          ctx.fill();

          // glossy bubble overlays
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.beginPath();
          ctx.arc(drawX - segmentRadius * 0.2, drawY - segmentRadius * 0.2, segmentRadius * 0.24, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // Draw Head
        ctx.save();
        ctx.fillStyle = skin.primaryColor;

        // Head glowing aura
        ctx.shadowBlur = 20;
        ctx.shadowColor = skin.glowColor || skin.primaryColor;

        // Draw active energy shields bubbles
        const isShieldActive = snake.shieldExpires && snake.shieldExpires > Date.now();
        if (isShieldActive) {
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 4;
          ctx.shadowBlur = 24;
          ctx.shadowColor = '#c084fc';
          ctx.beginPath();
          ctx.arc(snake.x, snake.y, headRadius * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(snake.x, snake.y, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Expressive rotating eyeballs pointing forward
        const angle = snake.angle;
        const eyeOffset = headRadius * 0.44;
        const spread = 0.52;

        const eyeLX = snake.x + Math.cos(angle - spread) * eyeOffset;
        const eyeLY = snake.y + Math.sin(angle - spread) * eyeOffset;
        const eyeRX = snake.x + Math.cos(angle + spread) * eyeOffset;
        const eyeRY = snake.y + Math.sin(angle + spread) * eyeOffset;

        const isBlinking = Math.sin(Date.now() / 600 + parseFloat(snake.id.replace(/\D/g, '') || '0')) > 0.94;

        if (!isBlinking) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(eyeLX, eyeLY, headRadius * 0.25, 0, Math.PI * 2);
          ctx.arc(eyeRX, eyeRY, headRadius * 0.25, 0, Math.PI * 2);
          ctx.fill();

          // Custom pupils styles
          ctx.fillStyle = skin.eyeColor || '#000000';
          const pupilLookX = Math.cos(angle) * (headRadius * 0.07);
          const pupilLookY = Math.sin(angle) * (headRadius * 0.07);

          ctx.beginPath();
          if (skin.pupilStyle === 'slit') {
            // Cat eye slits
            ctx.rect(eyeLX + pupilLookX - 1.2, eyeLY + pupilLookY - headRadius * 0.16, 2.4, headRadius * 0.32);
            ctx.rect(eyeRX + pupilLookX - 1.2, eyeRY + pupilLookY - headRadius * 0.16, 2.4, headRadius * 0.32);
          } else if (skin.pupilStyle === 'laser') {
            ctx.arc(eyeLX + pupilLookX, eyeLY + pupilLookY, headRadius * 0.08, 0, Math.PI * 2);
            ctx.arc(eyeRX + pupilLookX, eyeRY + pupilLookY, headRadius * 0.08, 0, Math.PI * 2);
          } else {
            ctx.arc(eyeLX + pupilLookX, eyeLY + pupilLookY, headRadius * 0.12, 0, Math.PI * 2);
            ctx.arc(eyeRX + pupilLookX, eyeRY + pupilLookY, headRadius * 0.12, 0, Math.PI * 2);
          }
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(eyeLX - 4, eyeLY);
          ctx.lineTo(eyeLX + 4, eyeLY);
          ctx.moveTo(eyeRX - 4, eyeRY);
          ctx.lineTo(eyeRX + 4, eyeRY);
          ctx.stroke();
        }

        // Little dynamic tongues flickers
        const flicking = Math.sin(Date.now() / 240) > 0.65;
        if (flicking) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          const tongueStartX = snake.x + Math.cos(angle) * headRadius;
          const tongueStartY = snake.y + Math.sin(angle) * headRadius;
          const tongueEndX = snake.x + Math.cos(angle) * (headRadius + 9);
          const tongueEndY = snake.y + Math.sin(angle) * (headRadius + 9);
          ctx.moveTo(tongueStartX, tongueStartY);
          ctx.lineTo(tongueEndX, tongueEndY);
          ctx.stroke();
        }

        // Leaderboard golden crown overlay
        const isLeader = leaderboard[0]?.name === snake.name;
        if (isLeader) {
          ctx.save();
          ctx.translate(snake.x, snake.y - headRadius * 1.5);
          ctx.rotate(Math.sin(Date.now() / 150) * 0.08);
          ctx.fillStyle = '#f59e0b';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-10, 5);
          ctx.lineTo(-14, -8);
          ctx.lineTo(-4, -2);
          ctx.lineTo(0, -15);
          ctx.lineTo(4, -2);
          ctx.lineTo(14, -8);
          ctx.lineTo(10, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Bot names overhead
        if (snake.isBot) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(snake.name, snake.x, snake.y - headRadius * 1.35);
        }

        ctx.restore();
      };

      // Draw active bots & player
      botsRef.current.forEach(bot => renderSnakeEntity(bot));
      renderSnakeEntity(playerRef.current);

      // Render Floating texts alerts
      const floatingTexts = floatingTextsRef.current;
      for (let k = floatingTexts.length - 1; k >= 0; k--) {
        const ft = floatingTexts[k];
        ft.life++;
        ft.x += 0;
        ft.y += ft.vy;
        ft.alpha = 1.0 - ft.life / ft.maxLife;

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'black 12px monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8;
        ctx.shadowColor = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.life >= ft.maxLife) {
          floatingTexts.splice(k, 1);
        }
      }

      // 4. Update and Draw Particles
      const particles = particlesRef.current;
      for (let k = particles.length - 1; k >= 0; k--) {
        const p = particles[k];
        p.life++;

        if (p.isDust) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = ARENA_SIZE;
          if (p.x > ARENA_SIZE) p.x = 0;
          if (p.y < 0) p.y = ARENA_SIZE;
          if (p.y > ARENA_SIZE) p.y = 0;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.alpha = 1.0 - p.life / p.maxLife;
        }

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.isDust ? p.alpha : Math.max(0, p.alpha);
        
        // draw different particle styles depending on trail
        ctx.beginPath();
        if (p.trailType === 'magic') {
          // star-shaped sparkles
          ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        } else if (p.trailType === 'digital') {
          // digital square binary bits
          ctx.rect(p.x, p.y, p.size * 1.5, p.size * 1.5);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();

        if (!p.isDust && p.life >= p.maxLife) {
          particles.splice(k, 1);
        }
      }

      ctx.restore(); // end camera transformation

      // --- 3. HUD CANVAS RENDER STEPS ---
      // Draw radar mini-map
      if (gameState === 'playing') {
        drawRadarMinimap(ctx, playerRef.current, botsRef.current, powerUpsRef.current, width, height);
      }

      // Joystick visual overlay
      if (touchStartRef.current && touchCurrentRef.current) {
        const tStart = touchStartRef.current;
        const tCurr = touchCurrentRef.current;
        const dx = tCurr.x - tStart.x;
        const dy = tCurr.y - tStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 50;

        const steerX = tStart.x;
        const steerY = tStart.y;
        const knobX = tStart.x + (dx / (dist || 1)) * Math.min(maxRadius, dist);
        const knobY = tStart.y + (dy / (dist || 1)) * Math.min(maxRadius, dist);

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(steerX, steerY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = themeData.bodyStart;
        ctx.shadowBlur = 10;
        ctx.shadowColor = themeData.bodyStart;
        ctx.beginPath();
        ctx.arc(knobX, knobY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(updateAndRender);
    };

    const drawRadarMinimap = (
      ctx: CanvasRenderingContext2D,
      p: Snake,
      bots: Snake[],
      powerups: PowerUp[],
      width: number,
      height: number
    ) => {
      const radarRadius = 65;
      const margin = 20;
      const rx = margin + radarRadius;
      const ry = height - margin - radarRadius;

      ctx.save();
      // BG
      ctx.fillStyle = 'rgba(5, 7, 15, 0.75)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rx, ry, radarRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Grids lines sweep
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry, radarRadius * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rx - radarRadius, ry);
      ctx.lineTo(rx + radarRadius, ry);
      ctx.moveTo(rx, ry - radarRadius);
      ctx.lineTo(rx, ry + radarRadius);
      ctx.stroke();

      const toRadar = (cx: number, cy: number) => {
        const mappedX = (cx / ARENA_SIZE) * 2 - 1;
        const mappedY = (cy / ARENA_SIZE) * 2 - 1;
        return {
          x: rx + mappedX * radarRadius * 0.9,
          y: ry + mappedY * radarRadius * 0.9
        };
      };

      // Draw Power-ups
      powerups.forEach(pUp => {
        const pt = toRadar(pUp.x, pUp.y);
        ctx.fillStyle = pUp.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Bots
      bots.forEach(bot => {
        const pt = toRadar(bot.x, bot.y);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player
      const pPt = toRadar(p.x, p.y);
      ctx.fillStyle = '#10b981';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      ctx.arc(pPt.x, pPt.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeTheme, difficulty, gameMode, soundOn, sensitivity]);

  // Desktop mouse steering follow mode
  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameState !== 'playing' || controlMode !== 'follow') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        playerRef.current.targetAngle = Math.atan2(dy, dx);
      }
    }
  };

  return (
    <div
      id="snake-game-screen"
      className={`absolute inset-0 flex flex-col z-20 overflow-hidden text-slate-100 bg-gradient-to-b ${THEME_STYLES[activeTheme].bgClass}`}
    >
      {/* HEADER ROW */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-black/20 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              playSound('click');
              onBack();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-white/90">Venom Rush Arena</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-full text-[10.5px] font-black text-amber-400">
            <span>⭐</span>
            <span>{localCoins}</span>
          </div>

          <button
            onClick={() => {
              playSound('click');
              setSoundOn(s => !s);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('settings');
              setShowConfig(true);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* CORE VIEWPORT */}
      <div className="flex-1 flex flex-col items-center justify-between relative overflow-hidden w-full">
        {/* HUD BARS */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none select-none items-start">
            {/* Top Left: Score panel */}
            <div className="bg-black/55 border border-white/10 backdrop-blur-lg px-4 py-3 rounded-2xl flex items-center space-x-3 shadow-lg pointer-events-auto">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center">
                <Zap size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[8px] font-black tracking-widest text-white/50 uppercase block">SCORE</span>
                <span className="font-mono text-base font-black text-white leading-none">{score}</span>
              </div>
            </div>

            {/* Top Center: Timer badge */}
            <div className="bg-black/55 border border-white/10 backdrop-blur-lg px-3.5 py-2.5 rounded-full flex items-center space-x-1.5 shadow-lg">
              <Timer size={13} className="text-indigo-400" />
              <span className="font-mono text-[10px] font-bold tracking-wider text-slate-100">
                {Math.floor(timeSurvived / 60).toString().padStart(2, '0')}
                :{(timeSurvived % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Top Right: Real-time arena slither leaderboard */}
            <div className="bg-black/65 border border-white/10 backdrop-blur-lg px-4 py-3 shadow-xl w-44 pointer-events-auto text-left flex flex-col space-y-1">
              <span className="text-[8px] font-black tracking-wider text-amber-400 uppercase flex items-center space-x-1">
                <Crown size={10} className="fill-amber-400" />
                <span>ARENA LEADERBOARD</span>
              </span>
              <div className="flex flex-col space-y-0.5">
                {leaderboard.map((leader, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center text-[9px] font-bold truncate ${
                      leader.isPlayer ? 'text-emerald-300 font-extrabold border-l-2 border-emerald-500 pl-1' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate max-w-[100px]">
                      {i + 1}. {leader.name}
                    </span>
                    <span className="font-mono">{leader.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE POWER-UPS HUD LISTING */}
        {gameState === 'playing' && (
          <div className="absolute top-20 left-4 z-20 flex flex-col space-y-1.5 pointer-events-none">
            {powerUpTimers.magnet > 0 && (
              <div className="bg-[#fbbf24]/25 border border-[#fbbf24]/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center space-x-2 text-[#fbbf24] animate-pulse">
                <span className="text-xs">🧲</span>
                <span className="text-[8px] font-black tracking-widest uppercase">Magnet ({powerUpTimers.magnet}s)</span>
              </div>
            )}
            {powerUpTimers.shield > 0 && (
              <div className="bg-[#c084fc]/25 border border-[#c084fc]/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center space-x-2 text-[#c084fc] animate-pulse">
                <span className="text-xs">🛡️</span>
                <span className="text-[8px] font-black tracking-widest uppercase">Shield ({powerUpTimers.shield}s)</span>
              </div>
            )}
            {powerUpTimers.multiplier > 0 && (
              <div className="bg-[#60a5fa]/25 border border-[#60a5fa]/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center space-x-2 text-[#60a5fa] animate-pulse">
                <span className="text-xs">✨</span>
                <span className="text-[8px] font-black tracking-widest uppercase">2X Mass ({powerUpTimers.multiplier}s)</span>
              </div>
            )}
            {powerUpTimers.speed > 0 && (
              <div className="bg-[#f87171]/25 border border-[#f87171]/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center space-x-2 text-[#f87171] animate-pulse">
                <span className="text-xs">⚡</span>
                <span className="text-[8px] font-black tracking-widest uppercase">RUSH ({powerUpTimers.speed}s)</span>
              </div>
            )}
          </div>
        )}

        {/* CANVAS LAYOUT */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
          onMouseDown={(e) => {
            if (gameState !== 'playing' || controlMode !== 'click') return;
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const dx = e.clientX - centerX;
              const dy = e.clientY - centerY;
              playerRef.current.targetAngle = Math.atan2(dy, dx);
            }
          }}
          className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden"
        >
          <canvas ref={canvasRef} width={800} height={800} className="w-full h-full block" />

          {/* VIRTUAL BOOST SPEED BUTTON */}
          {gameState === 'playing' && (
            <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center space-y-1">
              <button
                onTouchStart={() => {
                  playerRef.current.isBoosting = true;
                }}
                onTouchEnd={() => {
                  playerRef.current.isBoosting = false;
                }}
                onMouseDown={() => {
                  playerRef.current.isBoosting = true;
                }}
                onMouseUp={() => {
                  playerRef.current.isBoosting = false;
                }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 border-2 border-white/20 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all select-none cursor-pointer"
              >
                <Zap size={22} className="text-white fill-white animate-bounce" />
                <span className="text-[7.5px] font-black text-white/90 tracking-widest uppercase">BOOST</span>
              </button>
              <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest leading-none">
                SPACEBAR OR HOLD TO RUSH
              </span>
            </div>
          )}

          {/* OVERLAYS */}
          <AnimatePresence>
            {gameState === 'ready' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md z-30"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600 flex items-center justify-center text-4xl mb-3 border border-emerald-400/30 animate-pulse relative">
                  🐍
                  <span className="absolute -top-1.5 -right-1 animate-bounce text-base">👑</span>
                </div>

                <h3 className="text-2xl font-black tracking-wider text-emerald-400 uppercase leading-none mb-1">
                  Venom Rush .io
                </h3>
                <p className="text-[10px] text-indigo-300 tracking-widest font-mono uppercase mb-5">
                  Ultra Premium slither arena
                </p>

                {/* Info summary */}
                <div className="max-w-xs bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2.5 text-left mb-6 text-[10px] text-slate-300 leading-normal">
                  <div className="flex items-start space-x-2">
                    <span className="text-amber-400">🛡️</span>
                    <p>
                      <strong>Active Power-ups:</strong> Eat magnets 🧲, shields 🛡️, multipliers ✨ and speed boots ⚡!
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-400">🎯</span>
                    <p>
                      <strong>Steering Choice:</strong> Swap between continuous cursor following and classic keys settings!
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-pink-400">🎭</span>
                    <p>
                      <strong>Premium Skins:</strong> Earn Stars to purchase elite reptile skins with custom particle trails!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2.5 w-full max-w-[220px]">
                  <button
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center space-x-1.5 shadow-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Enter Slither Arena</span>
                  </button>

                  <button
                    onClick={() => {
                      playSound('click');
                      setActiveTab('skins');
                      setShowConfig(true);
                    }}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-2"
                  >
                    <ShoppingBag size={13} />
                    <span>Unlock Skins Shop</span>
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === 'paused' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md z-30"
              >
                <span className="text-3xl mb-2">⏸️</span>
                <h4 className="text-base font-black tracking-widest text-slate-100 uppercase leading-none">
                  Arena Paused
                </h4>
                <button
                  onClick={() => {
                    playSound('click');
                    setGameState('playing');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-8 py-3 rounded-xl active:scale-95 transition-all cursor-pointer mt-4"
                >
                  Resume
                </button>
              </motion.div>
            )}

            {gameState === 'over' && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-5 text-center backdrop-blur-md z-30"
              >
                <span className="text-4xl mb-2 animate-bounce">💥</span>
                <h3 className="text-lg font-black tracking-wider text-red-500 uppercase leading-none">
                  Reptile Disintegrated
                </h3>
                <p className="text-[9px] font-mono text-slate-400 tracking-widest uppercase mb-4 mt-1">
                  You crashed in the toxic arena
                </p>

                {/* Stats */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl px-5 py-4 my-2 w-full max-w-[230px] text-left flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>Survival Time:</span>
                    <span className="font-mono text-white font-black">
                      {Math.floor(timeSurvived / 60).toString().padStart(2, '0')}
                      :{(timeSurvived % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-white/5 pb-2">
                    <span>Final Mass:</span>
                    <span className="font-mono text-indigo-300 font-black text-xs">{score}</span>
                  </div>
                  {rewardCoins > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold pt-1">
                      <span>Stars Earned:</span>
                      <span className="font-mono font-black">+{rewardCoins} ⭐</span>
                    </div>
                  )}
                  {rewardXP > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-indigo-400 font-bold">
                      <span>XP Earned:</span>
                      <span className="font-mono font-black">+{rewardXP} XP</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={startGame}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold text-[10.5px] px-6 py-3.5 rounded-xl flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw size={12} />
                    <span>Re-enter Arena</span>
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setGameState('ready');
                    }}
                    className="bg-white/10 hover:bg-white/15 text-white font-extrabold text-[10.5px] px-6 py-3.5 rounded-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Lobby
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DRAWER FOR SETTINGS & SKINS */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 z-40 flex items-end"
          >
            <div className="absolute inset-0" onClick={() => setShowConfig(false)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className={`w-full max-h-[85%] rounded-t-[32px] p-6 text-left shadow-2xl relative z-10 border-t border-white/10 overflow-y-auto ${
                isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-950 text-slate-50'
              }`}
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-4 border-b border-white/10 pb-1 w-[80%]">
                  <button
                    onClick={() => {
                      playSound('click');
                      setActiveTab('settings');
                    }}
                    className={`text-xs uppercase font-black tracking-wider pb-2 transition-all ${
                      activeTab === 'settings'
                        ? 'border-b-2 border-emerald-400 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setActiveTab('skins');
                    }}
                    className={`text-xs uppercase font-black tracking-wider pb-2 transition-all flex items-center space-x-1.5 ${
                      activeTab === 'skins'
                        ? 'border-b-2 border-amber-400 text-amber-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🎭 Premium Skins</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowConfig(false)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-extrabold text-xs active:scale-90 hover:bg-white/15 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* TAB 1: GAMEPLAY SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4 pb-6">
                  {/* Control mode */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Steering Control Mode
                    </span>
                    <div className="flex space-x-2">
                      {[
                        { id: 'follow', title: 'Continuous Follow', desc: 'Snake head follows mouse cursor' },
                        { id: 'click', title: 'Classic Click', desc: 'Click/drag to point direction' }
                      ].map(mode => {
                        const active = controlMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => {
                              playSound('click');
                              setControlMode(mode.id as ControlMode);
                            }}
                            className={`flex-1 p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                              active
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md font-extrabold'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-[10px] block font-black leading-tight">{mode.title}</span>
                            <span className="text-[8px] text-white/60 block mt-0.5 leading-none">{mode.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Steering Turn Sensitivity Slider */}
                  <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <Sliders size={12} className="text-emerald-400" />
                        <span>Steering Turn Sensitivity</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {Math.round((sensitivity / 0.08) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.04"
                      max="0.16"
                      step="0.01"
                      value={sensitivity}
                      onChange={e => setSensitivity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                      <span>STABLE TURNS</span>
                      <span>AGILE VENOM</span>
                    </div>
                  </div>

                  {/* Themes background styles selection */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Arena Layout Theme
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(THEME_STYLES) as ThemeId[]).map(themeId => {
                        const style = THEME_STYLES[themeId];
                        const active = activeTheme === themeId;
                        return (
                          <button
                            key={themeId}
                            onClick={() => {
                              playSound('click');
                              setActiveTheme(themeId);
                            }}
                            className={`p-2.5 rounded-2xl flex items-center space-x-2 border transition-all cursor-pointer text-left ${
                              active
                                ? 'bg-indigo-600 border-indigo-500 text-white font-extrabold'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            <span className="text-sm">{style.icon}</span>
                            <span className="text-[10px] truncate leading-tight">{style.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Walls border mode */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Walls Crash Mode
                    </span>
                    <div className="flex space-x-2">
                      {[
                        { id: 'bordered', label: 'Solid Lethal Walls' },
                        { id: 'infinite', label: 'Infinite Wrap' }
                      ].map(mode => {
                        const active = gameMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => {
                              playSound('click');
                              setGameMode(mode.id as GameMode);
                            }}
                            className={`flex-1 py-2.5 rounded-2xl border text-center transition-all text-[9.5px] font-black uppercase tracking-wider cursor-pointer ${
                              active
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            {mode.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SKINS SHOP */}
              {activeTab === 'skins' && (
                <div className="space-y-3 pb-6">
                  <div className="flex justify-between items-center bg-amber-500/10 px-4 py-2.5 rounded-2xl border border-amber-500/20 mb-3">
                    <span className="text-[9.5px] font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Star size={12} className="fill-amber-400 animate-spin" />
                      <span>YOUR STAR COINS</span>
                    </span>
                    <span className="font-mono font-black text-amber-300 text-sm">{localCoins} ⭐</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {SKINS_LIST.map(skin => {
                      const isUnlocked = unlockedSkinIds.includes(skin.id);
                      const isEquipped = equippedSkinId === skin.id;

                      return (
                        <div
                          key={skin.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                            isEquipped
                              ? 'bg-amber-500/10 border-amber-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 text-left">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-inner relative"
                              style={{ backgroundColor: skin.primaryColor, boxShadow: `0 0 10px ${skin.glowColor}` }}
                            >
                              {skin.icon}
                              {isEquipped && (
                                <span className="absolute -top-1 -right-1 text-[8px] bg-amber-400 text-slate-950 px-1 rounded-full font-black uppercase tracking-widest">
                                  EQ
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[10px] font-black uppercase leading-tight tracking-wider text-slate-100 flex items-center space-x-1">
                                <span>{skin.name}</span>
                              </h4>
                              <p className="text-[8px] text-slate-400 leading-tight mt-0.5 max-w-[150px] truncate">
                                {skin.description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            {isUnlocked ? (
                              <button
                                onClick={() => {
                                  playSound('click');
                                  setEquippedSkinId(skin.id);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  isEquipped
                                    ? 'bg-amber-400 text-slate-950 shadow-md'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                                }`}
                              >
                                {isEquipped ? 'Equipped' : 'Equip'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBuySkin(skin)}
                                disabled={localCoins < skin.price}
                                className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer ${
                                  localCoins >= skin.price
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md'
                                    : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                                }`}
                              >
                                <span>Buy {skin.price}</span>
                                <span className="text-[8px]">⭐</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowConfig(false)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-center shadow-lg active:scale-95"
              >
                Confirm CUSTOMIZATION
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
