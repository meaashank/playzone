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
  Timer
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

// --- SOUND SYNTHESIZER ---
class SnakeAudio {
  static play(type: 'click' | 'eat' | 'boost' | 'crash' | 'victory', enabled: boolean) {
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
        default:
          SoundEngine.play('click');
          break;
      }
    } catch (e) {
      console.warn('Audio Context ignored:', e);
    }
  }
}

// --- TYPES ---
type ThemeId = 'neon' | 'forest' | 'space' | 'candy';
type GameMode = 'bordered' | 'infinite';
type Difficulty = 'easy' | 'normal' | 'hyper';

interface Snake {
  id: string;
  name: string;
  isBot: boolean;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  speed: number;
  score: number;
  length: number;
  body: { x: number; y: number }[];
  pathHistory: { x: number; y: number }[];
  color: string;
  isBoosting: boolean;
  botDecisionTimer?: number;
  pendingGrowth: number;
}

interface Food {
  id: string;
  x: number;
  y: number;
  color: string;
  value: number;
  size: number;
  pulsePhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  isDust?: boolean;
}

interface SnakeGameProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  onAddCoins: (amount: number) => void;
  onAddXP: (amount: number) => void;
}

const THEME_STYLES: Record<
  ThemeId,
  {
    name: string;
    icon: string;
    bgClass: string;
    boardBg: string;
    gridLine: string;
    headColor: string;
    bodyStart: string;
    bodyEnd: string;
    glowColor: string;
  }
> = {
  neon: {
    name: 'Neon Horizon',
    icon: '⚡',
    bgClass: 'from-slate-950 to-indigo-950',
    boardBg: '#05070f',
    gridLine: 'rgba(99, 102, 241, 0.05)',
    headColor: '#4f46e5',
    bodyStart: '#6366f1',
    bodyEnd: '#ec4899',
    glowColor: 'rgba(99, 102, 241, 0.4)'
  },
  forest: {
    name: 'Wild Jungle',
    icon: '🌿',
    bgClass: 'from-emerald-950 to-teal-950',
    boardBg: '#021510',
    gridLine: 'rgba(16, 185, 129, 0.05)',
    headColor: '#059669',
    bodyStart: '#10b981',
    bodyEnd: '#facc15',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  space: {
    name: 'Cosmic Void',
    icon: '🌌',
    bgClass: 'from-violet-950 to-fuchsia-950',
    boardBg: '#0a0212',
    gridLine: 'rgba(192, 38, 211, 0.05)',
    headColor: '#c026d3',
    bodyStart: '#d946ef',
    bodyEnd: '#3b82f6',
    glowColor: 'rgba(192, 38, 211, 0.4)'
  },
  candy: {
    name: 'Sugar Rush',
    icon: '🍭',
    bgClass: 'from-pink-900 to-rose-950',
    boardBg: '#17030e',
    gridLine: 'rgba(244, 63, 94, 0.05)',
    headColor: '#db2777',
    bodyStart: '#f43f5e',
    bodyEnd: '#f97316',
    glowColor: 'rgba(244, 63, 94, 0.4)'
  }
};

const ARENA_SIZE = 2400;
const SEGMENT_SPACING = 12;

export const SnakeGame: React.FC<SnakeGameProps> = ({
  onBack,
  theme: appTheme,
  soundEnabled,
  onAddCoins,
  onAddXP
}) => {
  const isDark = appTheme === 'dark';

  // Game Settings State
  const [activeTheme, setActiveTheme] = useState<ThemeId>('neon');
  const [gameMode, setGameMode] = useState<GameMode>('bordered');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [showConfig, setShowConfig] = useState(false);

  // Flow State
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-rush-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeSurvived, setTimeSurvived] = useState(0);

  // Rewards Payout
  const [rewardCoins, setRewardCoins] = useState(0);
  const [rewardXP, setRewardXP] = useState(0);

  // References to keep Canvas and Game calculations perfectly non-blocking
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
    pendingGrowth: 0
  });

  const botsRef = useRef<Snake[]>([]);
  const foodRef = useRef<Food[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef({ x: ARENA_SIZE / 2, y: ARENA_SIZE / 2, zoom: 1 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Active Leaderboard State
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; isPlayer: boolean }[]>([]);

  // Sound triggering helper
  const playSound = (type: 'click' | 'eat' | 'boost' | 'crash' | 'victory') => {
    SnakeAudio.play(type, soundOn);
  };

  // Helper: Angle Lerp across wrapping boundaries
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

    // Unshift current head position
    h.unshift({ x: snake.x, y: snake.y });

    // Limit history length to prevent leaks
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
    const colors = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const isSuper = Math.random() < 0.08;

    return {
      id,
      x: rx,
      y: ry,
      color: isSuper ? '#fbbf24' : col,
      value: isSuper ? 10 * valueMultiplier : 3 * valueMultiplier,
      size: isSuper ? 7 : 4,
      pulsePhase: Math.random() * Math.PI * 2
    };
  };

  // Spawn initial set of food
  const initFood = () => {
    const arr: Food[] = [];
    for (let i = 0; i < 350; i++) {
      arr.push(generateFoodPellet(`food-${i}`));
    }
    foodRef.current = arr;
  };

  // Setup drifting space dust
  const initSpaceDust = () => {
    const arr: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: Math.random() * ARENA_SIZE,
        y: Math.random() * ARENA_SIZE,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        color: 'rgba(255, 255, 255, 0.18)',
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
        life: 0,
        maxLife: 1000,
        isDust: true
      });
    }
    particlesRef.current = arr;
  };

  // Generate bot AI slitherers
  const generateBot = (id: string): Snake => {
    const botColors = ['#f43f5e', '#fb7185', '#10b981', '#34d399', '#3b82f6', '#60a5fa', '#fbbf24', '#facc15'];
    const botNames = ['Glider.io', 'NeonViper', 'CobraKai', 'Slinky', 'VenomKing', 'SlitherBot', 'StarEater', 'TurboWorm'];
    const bx = Math.random() * (ARENA_SIZE - 200) + 100;
    const by = Math.random() * (ARENA_SIZE - 200) + 100;
    const bAngle = Math.random() * Math.PI * 2;
    const col = botColors[Math.floor(Math.random() * botColors.length)];
    const name = botNames[Math.floor(Math.random() * botNames.length)] + ` #${Math.floor(Math.random() * 900 + 100)}`;

    const bot: Snake = {
      id,
      name,
      isBot: true,
      x: bx,
      y: by,
      angle: bAngle,
      targetAngle: bAngle,
      speed: 2.2 + Math.random() * 0.6,
      score: 0,
      length: 12 + Math.floor(Math.random() * 15),
      body: [],
      pathHistory: [],
      color: col,
      isBoosting: false,
      botDecisionTimer: 0,
      pendingGrowth: 0
    };

    // Prepopulate some initial path coordinates for smooth body curve on spawn
    for (let i = 0; i < bot.length * 6; i++) {
      bot.pathHistory.push({
        x: bx - Math.cos(bAngle) * i * 3,
        y: by - Math.sin(bAngle) * i * 3
      });
    }
    updateBodySegments(bot);
    return bot;
  };

  // Initial bots spawn
  const initBots = () => {
    const arr: Snake[] = [];
    for (let i = 0; i < 6; i++) {
      arr.push(generateBot(`bot-${i}`));
    }
    botsRef.current = arr;
  };

  // Spawn explosion particles on snake death
  const spawnExplosion = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.0;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.0 + Math.random() * 3.5,
        alpha: 1,
        life: 0,
        maxLife: 25 + Math.floor(Math.random() * 15)
      });
    }
  };

  // Spawn death food trail
  const spawnDeathFoodTrail = (snake: Snake) => {
    // Only spawn food every 2nd segment to avoid massive grouping
    snake.body.forEach((seg, idx) => {
      if (idx % 2 === 0) {
        foodRef.current.push({
          id: `death-food-${snake.id}-${idx}-${Date.now()}`,
          x: seg.x + (Math.random() - 0.5) * 15,
          y: seg.y + (Math.random() - 0.5) * 15,
          color: snake.color,
          value: 12,
          size: 7,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    });
  };

  // Setup/Reset Round
  const startGame = () => {
    playSound('click');
    triggerVibration('medium');

    // Player Init
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
      color: THEME_STYLES[activeTheme].bodyStart,
      isBoosting: false,
      pendingGrowth: 0
    };

    // Prepopulate starting path
    for (let i = 0; i < 80; i++) {
      playerRef.current.pathHistory.push({
        x: ARENA_SIZE / 2,
        y: ARENA_SIZE / 2 + i * 3
      });
    }
    updateBodySegments(playerRef.current);

    initFood();
    initSpaceDust();
    initBots();

    cameraRef.current = { x: ARENA_SIZE / 2, y: ARENA_SIZE / 2, zoom: 1 };
    setScore(0);
    setTimeSurvived(0);
    setRewardCoins(0);
    setRewardXP(0);
    setGameState('playing');
  };

  const handleGameOver = () => {
    playSound('crash');
    triggerVibration('heavy');
    setGameState('over');

    const finalScore = playerRef.current.score;
    const coins = Math.floor(finalScore / 3.5);
    const xp = Math.floor(finalScore / 2.5);

    setRewardCoins(coins);
    setRewardXP(xp);

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('snake-rush-highscore', finalScore.toString());
      playSound('victory');
    }

    if (coins > 0) onAddCoins(coins);
    if (xp > 0) onAddXP(xp);
  };

  // Steer controls for Keyboard & Mouse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const player = playerRef.current;
      const turnAmount = 0.65;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          player.targetAngle -= turnAmount;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          player.targetAngle += turnAmount;
          break;
        case ' ':
          e.preventDefault();
          player.isBoosting = true;
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

  // Touch handlers for Virtual Steering
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'playing' || !touchStartRef.current) return;
    const touch = e.touches[0];
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };

    // Calculate angle of drag relative to starting point
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      playerRef.current.targetAngle = Math.atan2(dy, dx);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    touchCurrentRef.current = null;
  };

  // Survival Timer increment
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeSurvived((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Core Game Update & Draw Loop (60 FPS requestAnimationFrame)
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

      // --- GAME PHYSICS STEP ---
      if (gameState === 'playing') {
        const p = playerRef.current;

        // Determine Speed & Boost lost
        let currentBaseSpeed = difficulty === 'hyper' ? 3.2 : difficulty === 'easy' ? 2.0 : 2.6;
        if (p.isBoosting && p.score > 12) {
          p.speed = currentBaseSpeed * 1.7;
          // Spawn food behind tail as penalty
          if (Math.random() < 0.12) {
            p.score = Math.max(0, p.score - 1);
            setScore(p.score);
            const tail = p.body[p.body.length - 1] || p;
            foodRef.current.push(generateFoodPellet(`trail-${Date.now()}`, tail.x, tail.y, 0.5));
            playSound('boost');
            triggerVibration('tick');
          }
        } else {
          p.speed = currentBaseSpeed;
          p.isBoosting = false;
        }

        // Steer Player
        p.angle = lerpAngle(p.angle, p.targetAngle, 0.08);
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        // Screen boundary safety logic
        if (gameMode === 'bordered') {
          if (p.x < 15 || p.x > ARENA_SIZE - 15 || p.y < 15 || p.y > ARENA_SIZE - 15) {
            handleGameOver();
            return;
          }
        } else {
          // Infinite Wrap
          if (p.x < 0) p.x = ARENA_SIZE;
          if (p.x > ARENA_SIZE) p.x = 0;
          if (p.y < 0) p.y = ARENA_SIZE;
          if (p.y > ARENA_SIZE) p.y = 0;
        }

        // Handle Player Growth interpolation
        if (p.pendingGrowth >= 1) {
          p.length += 1;
          p.pendingGrowth -= 1;
        }

        // Update player segments
        updateBodySegments(p);

        // Player eating food collision
        const pRadius = 14 * Math.min(1.8, 1.0 + (p.length - 12) * 0.005);
        foodRef.current = foodRef.current.filter((food) => {
          const dx = food.x - p.x;
          const dy = food.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pRadius + food.size + 3) {
            // Eat food
            p.score += food.value;
            setScore(p.score);
            p.pendingGrowth += food.value * 0.15;

            playSound('eat');
            triggerVibration('tick');
            spawnExplosion(food.x, food.y, food.color, 4);

            return false; // remove
          }
          return true; // keep
        });

        // Check if food falls below threshold, respawn
        while (foodRef.current.length < 350) {
          foodRef.current.push(generateFoodPellet(`food-respawn-${Date.now()}-${Math.random()}`));
        }

        // Player head touches own body collision check
        if (p.length > 22) {
          for (let i = 18; i < p.body.length; i++) {
            const segment = p.body[i];
            const dx = segment.x - p.x;
            const dy = segment.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pRadius * 0.7) {
              handleGameOver();
              return;
            }
          }
        }

        // --- BOTS GAMEPLAY LOOP & COLLISIONS ---
        const activeBots = botsRef.current;
        for (let bIdx = activeBots.length - 1; bIdx >= 0; bIdx--) {
          const bot = activeBots[bIdx];

          // Boost occasionally
          bot.isBoosting = bot.length > 25 && Math.random() < 0.005;
          const bSpeedMultiplier = bot.isBoosting ? 1.6 : 1.0;
          const baseBotSpd = (difficulty === 'hyper' ? 2.5 : difficulty === 'easy' ? 1.7 : 2.1) * bSpeedMultiplier;

          // Bot decision making (find closest food and avoid obstacles)
          bot.botDecisionTimer = (bot.botDecisionTimer || 0) + 1;
          if (bot.botDecisionTimer > 25) {
            bot.botDecisionTimer = 0;

            // 1. Slither towards nearest food
            let closestFood: Food | null = null;
            let closestDist = 400;

            foodRef.current.forEach((food) => {
              const dx = food.x - bot.x;
              const dy = food.y - bot.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < closestDist) {
                closestDist = dist;
                closestFood = food;
              }
            });

            if (closestFood) {
              bot.targetAngle = Math.atan2((closestFood as Food).y - bot.y, (closestFood as Food).x - bot.x);
            } else {
              // Drift/wander
              bot.targetAngle += (Math.random() - 0.5) * 1.5;
            }

            // 2. Obstacle Avoidance: Stay away from other snake's body segments
            const avoidDist = 90;
            const allSnakes = [p, ...activeBots];

            allSnakes.forEach((other) => {
              if (other.id === bot.id) return;
              other.body.forEach((seg, idx) => {
                // Check if segment is in front of bot
                const dx = seg.x - bot.x;
                const dy = seg.y - bot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < avoidDist) {
                  // Steer opposite direction!
                  const angleToSegment = Math.atan2(dy, dx);
                  bot.targetAngle = angleToSegment + Math.PI + (Math.random() - 0.5) * 0.4;
                }
              });
            });

            // 3. Boundary Avoidance
            if (bot.x < 150) bot.targetAngle = 0;
            else if (bot.x > ARENA_SIZE - 150) bot.targetAngle = Math.PI;
            if (bot.y < 150) bot.targetAngle = Math.PI / 2;
            else if (bot.y > ARENA_SIZE - 150) bot.targetAngle = -Math.PI / 2;
          }

          // Steer Bot
          bot.angle = lerpAngle(bot.angle, bot.targetAngle, 0.08);
          bot.x += Math.cos(bot.angle) * baseBotSpd;
          bot.y += Math.sin(bot.angle) * baseBotSpd;

          // Boundary wraps/crashes
          if (gameMode === 'bordered') {
            if (bot.x < 15 || bot.x > ARENA_SIZE - 15 || bot.y < 15 || bot.y > ARENA_SIZE - 15) {
              // Dies
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

          // Bot Growth interpolation
          if (bot.pendingGrowth >= 1) {
            bot.length += 1;
            bot.pendingGrowth -= 1;
          }

          updateBodySegments(bot);

          // Bot eat food
          const botRadius = 14 * Math.min(1.8, 1.0 + (bot.length - 12) * 0.005);
          foodRef.current = foodRef.current.filter((food) => {
            const dx = food.x - bot.x;
            const dy = food.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < botRadius + food.size + 3) {
              bot.score += food.value;
              bot.pendingGrowth += food.value * 0.15;
              return false; // consumed
            }
            return true;
          });

          // Head Collision Check: Bot hits Player body segments
          let botCrashed = false;
          p.body.forEach((seg, idx) => {
            if (idx < 2) return; // ignore neck
            const dx = seg.x - bot.x;
            const dy = seg.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < botRadius * 0.75 + 10) {
              botCrashed = true;
            }
          });

          // Head Collision Check: Bot hits other bot's body segments
          activeBots.forEach((otherBot) => {
            if (otherBot.id === bot.id) return;
            otherBot.body.forEach((seg, idx) => {
              const dx = seg.x - bot.x;
              const dy = seg.y - bot.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < botRadius * 0.75 + 10) {
                botCrashed = true;
              }
            });
          });

          // Player head touches bot body segments (Player dies!)
          bot.body.forEach((seg) => {
            const dx = seg.x - p.x;
            const dy = seg.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pRadius * 0.75 + 8) {
              handleGameOver();
              return;
            }
          });

          if (botCrashed) {
            spawnExplosion(bot.x, bot.y, bot.color, 15);
            spawnDeathFoodTrail(bot);
            // Replace bot
            activeBots[bIdx] = generateBot(bot.id);
          }
        }

        // Leaderboard Calculation
        const allSnakesForLeaderboard = [p, ...activeBots].map((s) => ({
          name: s.name,
          score: s.score,
          isPlayer: s.id === 'player'
        }));
        allSnakesForLeaderboard.sort((a, b) => b.score - a.score);
        setLeaderboard(allSnakesForLeaderboard.slice(0, 5));

        // Camera Smooth Target Follow & Zoom Scale based on snake length
        cameraRef.current.x += (p.x - cameraRef.current.x) * 0.08;
        cameraRef.current.y += (p.y - cameraRef.current.y) * 0.08;

        const targetZoom = Math.max(0.45, 1.0 - (p.length - 12) * 0.0035);
        cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.03;
      }

      // --- RENDERING LOOP ---
      ctx.fillStyle = themeData.boardBg;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Apply Camera Viewport transform
      ctx.translate(width / 2, height / 2);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // 1. Draw Grid Lines visible in current camera view
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

      // Vertical lines
      for (let x = Math.max(0, startX); x <= Math.min(ARENA_SIZE, endX); x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, Math.max(0, viewTop));
        ctx.lineTo(x, Math.min(ARENA_SIZE, viewBottom));
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = Math.max(0, startY); y <= Math.min(ARENA_SIZE, endY); y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(Math.max(0, viewLeft), y);
        ctx.lineTo(Math.min(ARENA_SIZE, viewRight), y);
        ctx.stroke();
      }

      // 2. Draw Arena Borders
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 12;
      ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE);

      // Corner alarm warnings
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(0, 0, ARENA_SIZE, 30);
      ctx.fillRect(0, 0, 30, ARENA_SIZE);
      ctx.fillRect(ARENA_SIZE - 30, 0, 30, ARENA_SIZE);
      ctx.fillRect(0, ARENA_SIZE - 30, ARENA_SIZE, 30);

      // 3. Draw Food Pellets
      foodRef.current.forEach((food) => {
        // Skip rendering if food is offscreen
        if (food.x < viewLeft - 30 || food.x > viewRight + 30 || food.y < viewTop - 30 || food.y > viewBottom + 30) {
          return;
        }

        const pulseScale = 1.0 + Math.sin(Date.now() / 150 + food.pulsePhase) * 0.15;
        const radius = food.size * pulseScale;

        ctx.save();
        ctx.fillStyle = food.color;

        // Shiny glow for larger or special foods
        if (food.value > 5) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = food.color;
        }

        ctx.beginPath();
        ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Adding glossy inner highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(food.x - radius * 0.28, food.y - radius * 0.28, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 4. Render All Snakes (Bots & Player)
      const renderSnakeEntity = (snake: Snake) => {
        const baseRad = 13;
        const currentScale = Math.min(1.8, 1.0 + (snake.length - 12) * 0.005);
        const headRadius = baseRad * 1.15 * currentScale;

        // Draw body segments (backwards to overlap nicely)
        const len = snake.body.length;
        for (let i = len - 1; i >= 1; i--) {
          const seg = snake.body[i];
          if (!seg) continue;

          // Skip drawing if segment is offscreen
          if (seg.x < viewLeft - 40 || seg.x > viewRight + 40 || seg.y < viewTop - 40 || seg.y > viewBottom + 40) {
            continue;
          }

          // Smooth body tapering towards tail
          const segmentRadius = baseRad * currentScale * (1.0 - (i / len) * 0.35);

          ctx.save();
          // Multi-color segment gradient style
          const isPlayer = snake.id === 'player';
          const segmentColorGrad = isPlayer
            ? ctx.createRadialGradient(seg.x, seg.y, 2, seg.x, seg.y, segmentRadius)
            : null;

          if (segmentColorGrad) {
            segmentColorGrad.addColorStop(0, themeData.bodyStart);
            segmentColorGrad.addColorStop(1, themeData.bodyEnd);
            ctx.fillStyle = segmentColorGrad;
          } else {
            ctx.fillStyle = snake.color;
          }

          ctx.beginPath();
          ctx.arc(seg.x, seg.y, segmentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Smooth 3D Glossy overlay bubble
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.arc(seg.x - segmentRadius * 0.22, seg.y - segmentRadius * 0.22, segmentRadius * 0.24, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // Draw Head
        ctx.save();
        ctx.fillStyle = snake.id === 'player' ? themeData.headColor : snake.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = snake.color;

        ctx.beginPath();
        ctx.arc(snake.x, snake.y, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw rotating expressive eyes directed towards target slither angle
        const angle = snake.angle;
        const eyeOffsetDist = headRadius * 0.44;
        const eyeAngleOffset = 0.52; // spread angle

        const eyeLX = snake.x + Math.cos(angle - eyeAngleOffset) * eyeOffsetDist;
        const eyeLY = snake.y + Math.sin(angle - eyeAngleOffset) * eyeOffsetDist;
        const eyeRX = snake.x + Math.cos(angle + eyeAngleOffset) * eyeOffsetDist;
        const eyeRY = snake.y + Math.sin(angle + eyeAngleOffset) * eyeOffsetDist;

        // Blink animation
        const isBlinking = Math.sin(Date.now() / 600 + parseFloat(snake.id.replace(/\D/g, '') || '0')) > 0.94;

        if (!isBlinking) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(eyeLX, eyeLY, headRadius * 0.24, 0, Math.PI * 2);
          ctx.arc(eyeRX, eyeRY, headRadius * 0.24, 0, Math.PI * 2);
          ctx.fill();

          // Black pupils looking slightly forward
          ctx.fillStyle = '#000000';
          const pupilLookOffsetX = Math.cos(angle) * (headRadius * 0.06);
          const pupilLookOffsetY = Math.sin(angle) * (headRadius * 0.06);
          ctx.beginPath();
          ctx.arc(eyeLX + pupilLookOffsetX, eyeLY + pupilLookOffsetY, headRadius * 0.12, 0, Math.PI * 2);
          ctx.arc(eyeRX + pupilLookOffsetX, eyeRY + pupilLookOffsetY, headRadius * 0.12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Closed sleepy eye slits
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(eyeLX - 4, eyeLY);
          ctx.lineTo(eyeLX + 4, eyeLY);
          ctx.moveTo(eyeRX - 4, eyeRY);
          ctx.lineTo(eyeRX + 4, eyeRY);
          ctx.stroke();
        }

        // Draw cute little tongue flicking out occasionally
        const isFlicking = Math.sin(Date.now() / 250) > 0.65;
        if (isFlicking) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          const tStartX = snake.x + Math.cos(angle) * headRadius;
          const tStartY = snake.y + Math.sin(angle) * headRadius;
          const tEndX = snake.x + Math.cos(angle) * (headRadius + 8);
          const tEndY = snake.y + Math.sin(angle) * (headRadius + 8);
          ctx.moveTo(tStartX, tStartY);
          ctx.lineTo(tEndX, tEndY);
          ctx.stroke();
        }

        // Leaderboard crown overlay for top snake
        const isLeader = leaderboard[0]?.name === snake.name;
        if (isLeader) {
          ctx.save();
          ctx.translate(snake.x, snake.y - headRadius * 1.55);
          ctx.rotate(Math.sin(Date.now() / 200) * 0.1);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(-10, 5);
          ctx.lineTo(-14, -8);
          ctx.lineTo(-4, -2);
          ctx.lineTo(0, -14);
          ctx.lineTo(4, -2);
          ctx.lineTo(14, -8);
          ctx.lineTo(10, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Draw subtle overhead bot name tag so arena feels authentic
        if (snake.isBot) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(snake.name, snake.x, snake.y - headRadius * 1.3);
        }

        ctx.restore();
      };

      // Draw active bots
      botsRef.current.forEach((bot) => renderSnakeEntity(bot));
      // Draw player
      renderSnakeEntity(playerRef.current);

      // 5. Update and Draw Particles (Sparkles & explosion bursts)
      const particles = particlesRef.current;
      for (let k = particles.length - 1; k >= 0; k--) {
        const p = particles[k];
        p.life++;

        if (p.isDust) {
          // Drifting loop
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = ARENA_SIZE;
          if (p.x > ARENA_SIZE) p.x = 0;
          if (p.y < 0) p.y = ARENA_SIZE;
          if (p.y > ARENA_SIZE) p.y = 0;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.95; // drag deceleration
          p.vy *= 0.95;
          p.alpha = 1.0 - p.life / p.maxLife;
        }

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.isDust ? p.alpha : Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Prune finished particles
        if (!p.isDust && p.life >= p.maxLife) {
          particles.splice(k, 1);
        }
      }

      ctx.restore(); // end camera transformation matrix

      // 6. Draw Virtual Steer Touch Joystick Visual overlay
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

        // Draw Outer Ring
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(steerX, steerY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Inner Joystick Knob
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

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeTheme, difficulty, gameMode, soundOn]);

  return (
    <div
      id="snake-game-screen"
      className={`absolute inset-0 flex flex-col z-20 overflow-hidden text-slate-100 bg-gradient-to-b ${THEME_STYLES[activeTheme].bgClass}`}
    >
      {/* Top Header Navigation bar */}
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
          <span className="text-xs font-black uppercase tracking-widest text-white/90">Snake Rush → Arena</span>
        </div>

        {/* Audio / settings action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              playSound('click');
              setSoundOn((s) => !s);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={() => {
              playSound('click');
              setShowConfig(true);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Main viewport Container */}
      <div className="flex-1 flex flex-col items-center justify-between relative overflow-hidden w-full">
        {/* GAME PLAY HUD BAR OVERLAYS */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none select-none items-start">
            {/* Top Left: Score panel */}
            <div className="bg-black/45 border border-white/10 backdrop-blur-lg px-4 py-3 rounded-2xl flex items-center space-x-3 shadow-lg pointer-events-auto">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center">
                <Zap size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[8px] font-black tracking-widest text-white/50 uppercase block">SCORE</span>
                <span className="font-mono text-base font-black text-white leading-none">{score}</span>
              </div>
            </div>

            {/* Top Center: Timer badge */}
            <div className="bg-black/45 border border-white/10 backdrop-blur-lg px-3.5 py-2.5 rounded-full flex items-center space-x-1.5 shadow-lg">
              <Timer size={13} className="text-indigo-400" />
              <span className="font-mono text-[10px] font-bold tracking-wider text-slate-100">
                {Math.floor(timeSurvived / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(timeSurvived % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Top Right: Real-time multiplayer slither leaderboard */}
            <div className="bg-black/55 border border-white/10 backdrop-blur-lg px-4 py-3.5 rounded-2xl shadow-xl w-44 pointer-events-auto text-left flex flex-col space-y-1.5">
              <span className="text-[8px] font-black tracking-wider text-amber-400 uppercase flex items-center space-x-1">
                <Crown size={10} className="fill-amber-400" />
                <span>ARENA RANKINGS</span>
              </span>
              <div className="flex flex-col space-y-1">
                {leaderboard.map((leader, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center text-[9px] font-bold truncate ${
                      leader.isPlayer ? 'text-indigo-300 font-extrabold border-l-2 border-indigo-500 pl-1' : 'text-slate-300'
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

        {/* Dynamic Canvas full sizing container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => {
            if (gameState !== 'playing') return;
            // Desktop mouse steering click emulator
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              const centerValX = rect.left + rect.width / 2;
              const centerValY = rect.top + rect.height / 2;
              const dx = e.clientX - centerValX;
              const dy = e.clientY - centerValY;
              playerRef.current.targetAngle = Math.atan2(dy, dx);
            }
          }}
          className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden"
        >
          <canvas ref={canvasRef} width={800} height={800} className="w-full h-full block" />

          {/* Booster Speed overlay in play HUD */}
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
                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 border-2 border-white/20 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-all select-none cursor-pointer"
              >
                <Zap size={22} className="text-white fill-white animate-bounce" />
                <span className="text-[7.5px] font-black text-white/90 tracking-widest uppercase">BOOST</span>
              </button>
              <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest leading-none">
                SPACEBAR TO BOOST
              </span>
            </div>
          )}

          {/* Dynamic Play overlays based on flow state */}
          <AnimatePresence>
            {gameState === 'ready' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md z-30"
              >
                {/* Visual Mascot */}
                <div className="w-20 h-20 rounded-full bg-indigo-600/20 flex items-center justify-center text-3xl mb-4 border border-indigo-400/30 animate-pulse relative">
                  🐍
                  <span className="absolute -top-1 right-2 animate-bounce">👑</span>
                </div>

                <h3 className="text-xl font-black tracking-wider text-white uppercase leading-none mb-1">
                  Snake Rush
                </h3>
                <p className="text-[10px] text-indigo-300 tracking-widest font-mono uppercase mb-6">
                  Venom Arena Slither
                </p>

                {/* Quick Info Block */}
                <div className="max-w-xs bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2 text-left mb-6 text-[9.5px] text-slate-300 leading-normal">
                  <div className="flex items-start space-x-1.5">
                    <span className="text-indigo-400">⚡</span>
                    <p>
                      <strong>Steer:</strong> Drag anywhere on screen to slither in continuous, fluid 360° motion.
                    </p>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="text-pink-400">🔥</span>
                    <p>
                      <strong>Speed Boost:</strong> Hold the BOOST button (or Spacebar on desktop) to rush past other
                      snakes!
                    </p>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="text-amber-400">🏆</span>
                    <p>
                      <strong>Rule:</strong> Make other snakes crash their heads into your glossy body to turn them into
                      masses of food!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-3.5 w-full max-w-[220px]">
                  <button
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center space-x-1.5 shadow-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Enter Arena</span>
                  </button>

                  <button
                    onClick={() => {
                      playSound('click');
                      setShowConfig(true);
                    }}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Settings & Skins
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
                  Game Paused
                </h4>
                <p className="text-[9px] text-slate-400 max-w-[170px] mb-5 mt-1 leading-normal font-mono uppercase">
                  Slither is temporarily frozen
                </p>
                <button
                  onClick={() => {
                    playSound('click');
                    setGameState('playing');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-8 py-3 rounded-xl active:scale-95 transition-all cursor-pointer"
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
                className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-5 text-center backdrop-blur-md z-30"
              >
                <span className="text-4xl mb-2 animate-bounce">💥</span>
                <h3 className="text-lg font-black tracking-wider text-red-400 uppercase leading-none">
                  Snake Disintegrated
                </h3>
                <p className="text-[8.5px] font-mono text-slate-400 tracking-widest uppercase mb-4 mt-1">
                  You crashed in the arena
                </p>

                {/* Statistics Box */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl px-5 py-4 my-2.5 w-full max-w-[230px] text-left flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>Survival Time:</span>
                    <span className="font-mono text-white font-black">
                      {Math.floor(timeSurvived / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(timeSurvived % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-white/5 pb-2">
                    <span>Final Score:</span>
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
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold text-[10.5px] px-6 py-3 rounded-xl flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw size={12} />
                    <span>Slither Again</span>
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setGameState('ready');
                    }}
                    className="bg-white/10 hover:bg-white/15 text-white font-extrabold text-[10.5px] px-6 py-3 rounded-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Lobby
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings & Skins configuration drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 z-40 flex items-end"
          >
            {/* Backdrop Closer */}
            <div className="absolute inset-0" onClick={() => setShowConfig(false)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className={`w-full max-h-[85%] rounded-t-[32px] p-6 text-left shadow-2xl relative z-10 border-t border-white/10 overflow-y-auto ${
                isDark ? 'bg-slate-900 text-slate-100' : 'bg-indigo-950 text-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🛠️</span>
                  <h3 className="text-sm font-black uppercase tracking-wide">Customize Slither</h3>
                </div>
                <button
                  onClick={() => setShowConfig(false)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-extrabold text-xs active:scale-90 hover:bg-white/15 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 pb-6">
                {/* Visual Skins */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Visual Theme Skin</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(Object.keys(THEME_STYLES) as ThemeId[]).map((thmId) => {
                      const active = activeTheme === thmId;
                      const thmData = THEME_STYLES[thmId];
                      return (
                        <button
                          key={thmId}
                          onClick={() => {
                            playSound('click');
                            setActiveTheme(thmId);
                            playerRef.current.color = thmData.bodyStart;
                          }}
                          className={`p-2.5 rounded-2xl flex items-center space-x-2 border transition-all cursor-pointer text-left ${
                            active
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md font-extrabold'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-base shrink-0">{thmData.icon}</span>
                          <span className="text-[10px] truncate leading-tight">{thmData.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Boundaries / Wrapping Mode */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Arena Borders Mode</span>
                  <div className="flex space-x-2">
                    {[
                      { id: 'bordered', title: 'Solid Walls', desc: 'Crashing boundaries is lethal' },
                      { id: 'infinite', title: 'Infinite Wrap', desc: 'Wraps slither screen margins' }
                    ].map((mode) => {
                      const active = gameMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            playSound('click');
                            setGameMode(mode.id as GameMode);
                          }}
                          className={`flex-1 p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                            active
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md font-extrabold'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-[10px] block leading-tight font-black">{mode.title}</span>
                          <span className="text-[8px] text-white/60 block mt-0.5 leading-none">{mode.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Speed / Difficulty Levels */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Speed Mode</span>
                  <div className="flex space-x-2">
                    {[
                      { id: 'easy', label: 'Easy Slither', color: 'border-emerald-500/30 text-emerald-300' },
                      { id: 'normal', label: 'Classic Venom', color: 'border-blue-500/30 text-blue-300' },
                      { id: 'hyper', label: 'Hyper Rush', color: 'border-rose-500/30 text-rose-300' }
                    ].map((diffOption) => {
                      const active = difficulty === diffOption.id;
                      return (
                        <button
                          key={diffOption.id}
                          onClick={() => {
                            playSound('click');
                            setDifficulty(diffOption.id as Difficulty);
                          }}
                          className={`flex-1 py-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            active
                              ? 'bg-indigo-600 border-indigo-500 text-white font-extrabold shadow-md'
                              : `bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 ${diffOption.color}`
                          }`}
                        >
                          <span className="text-[10px] block font-black uppercase tracking-wider">{diffOption.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setShowConfig(false)}
                  className="w-full py-3.5 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-black rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-center shadow-lg active:scale-95"
                >
                  Confirm Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
