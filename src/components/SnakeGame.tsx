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
  Gamepad2,
  Shield,
  Palette
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';

// Sound Synthesizer for Snake Game using Web Audio API
class SnakeAudio {
  private static ctx: AudioContext | null = null;

  private static getContext() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  static play(type: 'click' | 'eat' | 'super' | 'crash' | 'victory' | 'turn', enabled: boolean) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      switch (type) {
        case 'click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }
        case 'turn': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.setValueAtTime(450, now + 0.03);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.linearRampToValueAtTime(0.005, now + 0.06);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }
        case 'eat': {
          // Playful ascending double chime
          const notes = [523.25, 659.25]; // C5, E5
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.12, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.15);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.15);
          });
          break;
        }
        case 'super': {
          // Playful arpeggio chord for golden star
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.15, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.2);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.2);
          });
          break;
        }
        case 'crash': {
          const osc = ctx.createOscillator();
          const noise = ctx.createGain();
          osc.connect(noise);
          noise.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.linearRampToValueAtTime(40, now + 0.35);
          noise.gain.setValueAtTime(0.25, now);
          noise.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
        case 'victory': {
          // Uplifting victory fanfare
          const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.1, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.3);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
          });
          break;
        }
      }
    } catch (e) {
      console.warn("Audio Context error ignored:", e);
    }
  }
}

// Particle Class for explosive sparkles
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
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type ThemeId = 'neon' | 'forest' | 'space' | 'candy';
type GameMode = 'classic' | 'wrap';
type Difficulty = 'easy' | 'normal' | 'hyper';

interface SnakeGameProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  onAddCoins: (amount: number) => void;
  onAddXP: (amount: number) => void;
}

const THEME_STYLES: Record<ThemeId, {
  name: string;
  icon: string;
  bgClass: string;
  boardBg: string;
  gridLine: string;
  snakeHead: string;
  snakeBody: string;
  foodColor: string;
  starColor: string;
  accentText: string;
  glowColor: string;
}> = {
  neon: {
    name: 'Neon Retro',
    icon: '⚡',
    bgClass: 'from-slate-950 to-indigo-950',
    boardBg: '#090d16',
    gridLine: 'rgba(99, 102, 241, 0.08)',
    snakeHead: '#4f46e5',
    snakeBody: 'rgba(99, 102, 241, 0.85)',
    foodColor: '#ef4444',
    starColor: '#f59e0b',
    accentText: 'text-indigo-400',
    glowColor: '#6366f1'
  },
  forest: {
    name: 'Wild Forest',
    icon: '🌿',
    bgClass: 'from-emerald-950 to-teal-950',
    boardBg: '#021e17',
    gridLine: 'rgba(34, 197, 94, 0.08)',
    snakeHead: '#10b981',
    snakeBody: 'rgba(16, 185, 129, 0.85)',
    foodColor: '#f43f5e',
    starColor: '#fbbf24',
    accentText: 'text-emerald-400',
    glowColor: '#10b981'
  },
  space: {
    name: 'Cosmic Void',
    icon: '🌌',
    bgClass: 'from-violet-950 to-fuchsia-950',
    boardBg: '#12041c',
    gridLine: 'rgba(192, 38, 211, 0.08)',
    snakeHead: '#c026d3',
    snakeBody: 'rgba(192, 38, 211, 0.85)',
    foodColor: '#ec4899',
    starColor: '#fbbf24',
    accentText: 'text-fuchsia-400',
    glowColor: '#c026d3'
  },
  candy: {
    name: 'Sugar Rush',
    icon: '🍭',
    bgClass: 'from-pink-900 to-rose-950',
    boardBg: '#1d0510',
    gridLine: 'rgba(244, 63, 94, 0.08)',
    snakeHead: '#f43f5e',
    snakeBody: 'rgba(251, 113, 133, 0.85)',
    foodColor: '#f43f5e',
    starColor: '#eab308',
    accentText: 'text-rose-400',
    glowColor: '#fb7185'
  }
};

const GRID_SIZE = 16;

export const SnakeGame: React.FC<SnakeGameProps> = ({
  onBack,
  theme: appTheme,
  soundEnabled,
  onAddCoins,
  onAddXP
}) => {
  const isDark = appTheme === 'dark';

  // Core Game Config state
  const [activeTheme, setActiveTheme] = useState<ThemeId>('neon');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [soundOn, setSoundOn] = useState(soundEnabled);

  // Score states
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-rush-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Flow State
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'over'>('ready');
  const [showConfig, setShowConfig] = useState(false);

  // Coins and XP accumulated this round
  const [rewardCoins, setRewardCoins] = useState(0);
  const [rewardXP, setRewardXP] = useState(0);

  // Game Coordinates Ref & States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snakeRef = useRef<Array<{ x: number; y: number }>>([
    { x: 8, y: 8 },
    { x: 8, y: 9 },
    { x: 8, y: 10 }
  ]);
  const directionRef = useRef<Direction>('UP');
  const lastDirectionRef = useRef<Direction>('UP');
  const foodRef = useRef<{ x: number; y: number }>({ x: 4, y: 4 });
  const starRef = useRef<{ x: number; y: number; active: boolean }>({ x: 12, y: 5, active: false });
  const starTimerRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number>(0);

  // Visual eye-blinking/flicking state for head
  const [tongueFlick, setTongueFlick] = useState(false);

  // Get Speed Milliseconds based on Difficulty
  const getSpeedMs = (): number => {
    switch (difficulty) {
      case 'easy':
        return 170;
      case 'normal':
        return 120;
      case 'hyper':
        return 75;
    }
  };

  // Synchronized Sound Trigger
  const playSound = (type: 'click' | 'eat' | 'super' | 'crash' | 'victory' | 'turn') => {
    SnakeAudio.play(type, soundOn);
  };

  // Change active direction safely (blocking instant reverse turns)
  const handleDirectionChange = (newDir: Direction) => {
    if (gameState !== 'playing') return;

    const opposites = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    };

    if (opposites[newDir] !== lastDirectionRef.current) {
      if (directionRef.current !== newDir) {
        playSound('turn');
        triggerVibration('tick');
      }
      directionRef.current = newDir;
    }
  };

  // Touch Gesture Swipes on Board
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        handleDirectionChange(dx > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(dy) > 30) {
        handleDirectionChange(dy > 0 ? 'DOWN' : 'UP');
      }
    }
  };

  // Keyboard support for Desktops
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (gameState === 'ready') startGame();
          else if (gameState === 'over') restartGame();
          else togglePause();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleDirectionChange('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleDirectionChange('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleDirectionChange('RIGHT');
          break;
        case 'Escape':
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, difficulty, activeTheme, gameMode, soundOn]);

  // Generate particles on capture
  const spawnExplosion = (x: number, y: number, color: string, count = 10) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cellSize = canvas.width / GRID_SIZE;
    const centerX = (x + 0.5) * cellSize;
    const centerY = (y + 0.5) * cellSize;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.floor(Math.random() * 20)
      });
    }
  };

  // Helper to generate coordinates not on snake
  const getRandomCoords = (): { x: number; y: number } => {
    const snake = snakeRef.current;
    let safe = false;
    let rx = 0;
    let ry = 0;

    while (!safe) {
      rx = Math.floor(Math.random() * GRID_SIZE);
      ry = Math.floor(Math.random() * GRID_SIZE);
      safe = !snake.some(segment => segment.x === rx && segment.y === ry);
    }
    return { x: rx, y: ry };
  };

  // Game initializer
  const startGame = () => {
    playSound('click');
    triggerVibration('medium');
    
    // Reset Snake coordinates
    snakeRef.current = [
      { x: 8, y: 8 },
      { x: 8, y: 9 },
      { x: 8, y: 10 }
    ];
    directionRef.current = 'UP';
    lastDirectionRef.current = 'UP';
    
    // Set foods
    foodRef.current = getRandomCoords();
    starRef.current = { x: 0, y: 0, active: false };
    
    setScore(0);
    setRewardCoins(0);
    setRewardXP(0);
    setGameState('playing');
    lastMoveTimeRef.current = performance.now();
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      playSound('click');
      setGameState('paused');
    } else if (gameState === 'paused') {
      playSound('click');
      setGameState('playing');
      lastMoveTimeRef.current = performance.now();
    }
  };

  const restartGame = () => {
    startGame();
  };

  // Game Loop updates
  const moveSnakeAndDetectCollisions = () => {
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const currentDir = directionRef.current;
    lastDirectionRef.current = currentDir;

    // Shift coordinates in direction
    if (currentDir === 'UP') head.y -= 1;
    else if (currentDir === 'DOWN') head.y += 1;
    else if (currentDir === 'LEFT') head.x -= 1;
    else if (currentDir === 'RIGHT') head.x += 1;

    // Detect boundaries based on game mode
    if (gameMode === 'wrap') {
      if (head.x < 0) head.x = GRID_SIZE - 1;
      else if (head.x >= GRID_SIZE) head.x = 0;

      if (head.y < 0) head.y = GRID_SIZE - 1;
      else if (head.y >= GRID_SIZE) head.y = 0;
    } else {
      // Solid walls crash
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        triggerGameOver();
        return;
      }
    }

    // Detect Self Bite crash (ignore tail tip unless length is short)
    const selfBite = snake.some((seg, idx) => {
      // Skip very tail end because it moves out of the cell in the same tick
      if (idx === snake.length - 1) return false;
      return seg.x === head.x && seg.y === head.y;
    });

    if (selfBite) {
      triggerGameOver();
      return;
    }

    // Add head segment
    snake.unshift(head);

    // Detect Food Eaten
    let ateFood = false;
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      ateFood = true;
      playSound('eat');
      triggerVibration('light');
      
      const themeData = THEME_STYLES[activeTheme];
      spawnExplosion(head.x, head.y, themeData.foodColor, 12);

      // Increase Score & level-based multiplier
      const addition = difficulty === 'hyper' ? 25 : difficulty === 'normal' ? 15 : 10;
      setScore(s => s + addition);

      // Relocate food
      foodRef.current = getRandomCoords();

      // Rare chance to spawn Golden Star (25%)
      if (!starRef.current.active && Math.random() < 0.25) {
        starRef.current = {
          ...getRandomCoords(),
          active: true
        };
        // Auto decay star after 8 seconds
        if (starTimerRef.current) clearTimeout(starTimerRef.current);
        starTimerRef.current = window.setTimeout(() => {
          starRef.current.active = false;
        }, 8000);
      }
    }

    // Detect Golden Star Eaten
    let ateStar = false;
    if (starRef.current.active && head.x === starRef.current.x && head.y === starRef.current.y) {
      ateStar = true;
      playSound('super');
      triggerVibration('heavy');

      const themeData = THEME_STYLES[activeTheme];
      spawnExplosion(head.x, head.y, themeData.starColor, 20);

      // Big score reward
      const addition = difficulty === 'hyper' ? 60 : difficulty === 'normal' ? 40 : 25;
      setScore(s => s + addition);

      starRef.current.active = false;
      if (starTimerRef.current) clearTimeout(starTimerRef.current);
    }

    // If ate neither food nor star, shrink tail
    if (!ateFood && !ateStar) {
      snake.pop();
    }

    snakeRef.current = snake;
  };

  // Trigger game over and persist rewards
  const triggerGameOver = () => {
    playSound('crash');
    triggerVibration('heavy');
    setGameState('over');

    // Calculate payouts
    const finalScore = score;
    const earnedCoins = Math.floor(finalScore / 3);
    const earnedXP = Math.floor(finalScore / 2);

    setRewardCoins(earnedCoins);
    setRewardXP(earnedXP);

    // Persist High Score
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('snake-rush-highscore', finalScore.toString());
      playSound('victory');
    }

    // Dispatch rewards back to profile system
    if (earnedCoins > 0) onAddCoins(earnedCoins);
    if (earnedXP > 0) onAddXP(earnedXP);
  };

  // Animation Loop and Canvas Drawer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Keep particles animated even when game is paused or over
    const updateCanvas = (timestamp: number) => {
      // 1. Game State Step
      if (gameState === 'playing') {
        const speed = getSpeedMs();
        const elapsed = timestamp - lastMoveTimeRef.current;
        if (elapsed >= speed) {
          moveSnakeAndDetectCollisions();
          lastMoveTimeRef.current = timestamp;

          // Tongue flicker animation
          if (Math.random() < 0.3) {
            setTongueFlick(true);
            setTimeout(() => setTongueFlick(false), 150);
          }
        }
      }

      // 2. Render Loop
      const width = canvas.width;
      const height = canvas.height;
      const themeData = THEME_STYLES[activeTheme];

      // Clear with Theme Background color
      ctx.fillStyle = themeData.boardBg;
      ctx.fillRect(0, 0, width, height);

      const cellSize = width / GRID_SIZE;

      // Draw Grid Lines (Subtle)
      ctx.strokeStyle = themeData.gridLine;
      ctx.lineWidth = 1;
      for (let i = 1; i < GRID_SIZE; i++) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, height);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(width, i * cellSize);
        ctx.stroke();
      }

      // Draw Apple Food
      const fX = foodRef.current.x * cellSize + cellSize / 2;
      const fY = foodRef.current.y * cellSize + cellSize / 2;
      const radius = cellSize * 0.4;

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = themeData.foodColor;
      
      // Draw Red body
      ctx.fillStyle = themeData.foodColor;
      ctx.beginPath();
      ctx.arc(fX, fY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw green leaf on apple
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(fX + radius * 0.4, fY - radius * 0.9, radius * 0.2, radius * 0.4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Highlight/Reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(fX - radius * 0.3, fY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Golden Star (if active)
      if (starRef.current.active) {
        const sX = starRef.current.x * cellSize + cellSize / 2;
        const sY = starRef.current.y * cellSize + cellSize / 2;
        const sRadius = cellSize * 0.55;

        // Pulse star size
        const scale = 0.85 + Math.sin(timestamp / 100) * 0.15;

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = themeData.starColor;
        ctx.fillStyle = themeData.starColor;
        
        ctx.beginPath();
        // Simple star drawing routine
        for (let j = 0; j < 5; j++) {
          const outerAngle = (j * Math.PI * 2) / 5 - Math.PI / 2;
          const innerAngle = ((j + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
          
          ctx.lineTo(sX + Math.cos(outerAngle) * sRadius * scale, sY + Math.sin(outerAngle) * sRadius * scale);
          ctx.lineTo(sX + Math.cos(innerAngle) * sRadius * 0.4 * scale, sY + Math.sin(innerAngle) * sRadius * 0.4 * scale);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw Snake Body
      const snake = snakeRef.current;
      snake.forEach((seg, idx) => {
        const sX = seg.x * cellSize + cellSize / 2;
        const sY = seg.y * cellSize + cellSize / 2;
        const sSize = cellSize * 0.42;

        ctx.save();
        
        if (idx === 0) {
          // Snake Head Drawing
          ctx.shadowBlur = 12;
          ctx.shadowColor = themeData.glowColor;
          ctx.fillStyle = themeData.snakeHead;
          ctx.beginPath();
          ctx.arc(sX, sY, cellSize * 0.48, 0, Math.PI * 2);
          ctx.fill();

          // Little Eyes based on move direction
          const dir = directionRef.current;
          ctx.fillStyle = '#FFFFFF';
          let eyeL_X = sX;
          let eyeL_Y = sY;
          let eyeR_X = sX;
          let eyeR_Y = sY;

          const eyeOffset = cellSize * 0.16;
          const eyeRadius = cellSize * 0.08;

          if (dir === 'UP') {
            eyeL_X = sX - eyeOffset; eyeL_Y = sY - eyeOffset;
            eyeR_X = sX + eyeOffset; eyeR_Y = sY - eyeOffset;
          } else if (dir === 'DOWN') {
            eyeL_X = sX - eyeOffset; eyeL_Y = sY + eyeOffset;
            eyeR_X = sX + eyeOffset; eyeR_Y = sY + eyeOffset;
          } else if (dir === 'LEFT') {
            eyeL_X = sX - eyeOffset; eyeL_Y = sY - eyeOffset;
            eyeR_X = sX - eyeOffset; eyeR_Y = sY + eyeOffset;
          } else if (dir === 'RIGHT') {
            eyeL_X = sX + eyeOffset; eyeL_Y = sY - eyeOffset;
            eyeR_X = sX + eyeOffset; eyeR_Y = sY + eyeOffset;
          }

          // Left Eye White
          ctx.beginPath();
          ctx.arc(eyeL_X, eyeL_Y, eyeRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();
          // Right Eye White
          ctx.beginPath();
          ctx.arc(eyeR_X, eyeR_Y, eyeRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Black Pupils
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(eyeL_X, eyeL_Y, eyeRadius * 0.75, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eyeR_X, eyeR_Y, eyeRadius * 0.75, 0, Math.PI * 2);
          ctx.fill();

          // Tongue flicking!
          if (tongueFlick) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            if (dir === 'UP') {
              ctx.moveTo(sX, sY - cellSize * 0.45);
              ctx.lineTo(sX, sY - cellSize * 0.65);
            } else if (dir === 'DOWN') {
              ctx.moveTo(sX, sY + cellSize * 0.45);
              ctx.lineTo(sX, sY + cellSize * 0.65);
            } else if (dir === 'LEFT') {
              ctx.moveTo(sX - cellSize * 0.45, sY);
              ctx.lineTo(sX - cellSize * 0.65, sY);
            } else if (dir === 'RIGHT') {
              ctx.moveTo(sX + cellSize * 0.45, sY);
              ctx.lineTo(sX + cellSize * 0.65, sY);
            }
            ctx.stroke();
          }

        } else {
          // Body segments drawing (slightly smaller, beautiful rounded capsules)
          ctx.fillStyle = themeData.snakeBody;
          ctx.beginPath();
          
          // Connect segments dynamically to form a continuous snake capsule
          const nextSeg = snake[idx - 1];
          const radiusCoeff = sSize * (1 - idx / snake.length * 0.25); // Slender tail tapering effect!
          ctx.arc(sX, sY, radiusCoeff, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Update and Draw Particles
      const particles = particlesRef.current;
      for (let k = particles.length - 1; k >= 0; k--) {
        const p = particles[k];
        p.life++;
        
        // Move particle
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96; // drag
        p.vy *= 0.96;
        p.alpha = 1 - (p.life / p.maxLife);

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Remove dead particles
        if (p.life >= p.maxLife) {
          particles.splice(k, 1);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(updateCanvas);
    };

    animationFrameIdRef.current = requestAnimationFrame(updateCanvas);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState, activeTheme, difficulty, gameMode, soundOn, tongueFlick]);

  return (
    <div
      id="snake-game-screen"
      className={`absolute inset-0 flex flex-col z-20 overflow-hidden text-slate-100 bg-gradient-to-b ${THEME_STYLES[activeTheme].bgClass}`}
    >
      {/* Top HUD Area */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-black/15">
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
          <span className="text-xs font-black uppercase tracking-widest text-white/90">Snake Rush</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-2">
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
              setShowConfig(true);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 relative overflow-y-auto pb-6 max-w-2xl mx-auto w-full">
        {/* Statistics Banner */}
        <div className="w-full flex justify-between items-center bg-black/20 p-2.5 rounded-2xl border border-white/5 shadow-md">
          <div className="text-left">
            <span className="text-[8px] font-black tracking-widest text-white/50 uppercase">Score</span>
            <div className="flex items-center space-x-1.5 leading-none">
              <Zap size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
              <span className="font-mono text-lg font-black text-white">{score}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[8px] font-black tracking-widest text-white/50 uppercase">Best</span>
            <div className="flex items-center space-x-1.5 leading-none justify-end">
              <Crown size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="font-mono text-base font-black text-amber-300">{highScore}</span>
            </div>
          </div>
        </div>

        {/* Game Canvas Board Panel */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative my-auto w-full aspect-square max-w-[320px] md:max-w-[480px] rounded-3xl overflow-hidden border-[4px] border-white/10 shadow-2xl bg-[#090d16] focus:outline-none"
          style={{
            boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${THEME_STYLES[activeTheme].glowColor}25`
          }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="w-full h-full block"
          />

          {/* Canvas Overlays based on state */}
          <AnimatePresence>
            {gameState === 'ready' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-600/35 flex items-center justify-center text-2xl mb-3 shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/40 animate-bounce">
                  🐍
                </div>
                <h3 className="text-lg font-black tracking-tight text-white mb-1.5 uppercase">Snake Rush</h3>
                <p className="text-[10px] text-slate-300 max-w-[200px] mb-5 leading-normal font-medium">
                  Use on-screen controls or swipe to slither! Avoid self-collision and solid borders!
                </p>

                <button
                  onClick={startGame}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-8 py-3 rounded-full flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Start Game</span>
                </button>
              </motion.div>
            )}

            {gameState === 'paused' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
              >
                <span className="text-3xl mb-2">⏸️</span>
                <h4 className="text-base font-black tracking-widest text-slate-100 uppercase">Game Paused</h4>
                <p className="text-[9px] text-slate-400 max-w-[170px] mb-4 leading-tight mt-0.5">Slither is temporarily frozen. Take a quick breather!</p>
                <button
                  onClick={togglePause}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-full active:scale-95 transition-all cursor-pointer"
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
                className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-5 text-center backdrop-blur-sm"
              >
                <span className="text-3xl mb-2">💥</span>
                <h3 className="text-base font-black tracking-tight text-red-400 uppercase">Game Over</h3>
                
                {/* Score Summary Box */}
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 my-3.5 w-full max-w-[200px] text-left">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>Final Score:</span>
                    <span className="font-mono text-white font-black">{score}</span>
                  </div>
                  {rewardCoins > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold mt-1.5">
                      <span>Stars Earned:</span>
                      <span className="font-mono font-black">+{rewardCoins} ⭐</span>
                    </div>
                  )}
                  {rewardXP > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-indigo-400 font-bold mt-1">
                      <span>XP Earned:</span>
                      <span className="font-mono font-black">+{rewardXP} XP</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2.5">
                  <button
                    onClick={restartGame}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold text-[10px] px-5 py-2.5 rounded-full flex items-center space-x-1 shadow-md active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw size={11} />
                    <span>Replay</span>
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      onBack();
                    }}
                    className="bg-white/10 hover:bg-white/15 text-white font-extrabold text-[10px] px-5 py-2.5 rounded-full active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Exit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Visual Touch D-Pad Gamepad Area for kids on mobile */}
        <div className="w-full max-w-[190px] flex flex-col items-center space-y-1 mb-2 shrink-0">
          <div className="flex justify-center w-full">
            <button
              onClick={() => handleDirectionChange('UP')}
              className="w-11 h-11 bg-white/10 active:bg-white/20 border border-white/15 rounded-xl flex items-center justify-center font-bold text-lg select-none text-white hover:scale-105 active:scale-95 cursor-pointer"
            >
              ▲
            </button>
          </div>
          <div className="flex justify-between w-full space-x-1">
            <button
              onClick={() => handleDirectionChange('LEFT')}
              className="w-11 h-11 bg-white/10 active:bg-white/20 border border-white/15 rounded-xl flex items-center justify-center font-bold text-lg select-none text-white hover:scale-105 active:scale-95 cursor-pointer"
            >
              ◀
            </button>
            <button
              onClick={togglePause}
              disabled={gameState === 'ready' || gameState === 'over'}
              className="w-11 h-11 bg-indigo-600/30 active:bg-indigo-600/50 border border-indigo-500/20 disabled:opacity-40 rounded-xl flex items-center justify-center text-xs text-indigo-200 font-black tracking-tight select-none cursor-pointer"
            >
              {gameState === 'paused' ? 'PLAY' : 'PAUS'}
            </button>
            <button
              onClick={() => handleDirectionChange('RIGHT')}
              className="w-11 h-11 bg-white/10 active:bg-white/20 border border-white/15 rounded-xl flex items-center justify-center font-bold text-lg select-none text-white hover:scale-105 active:scale-95 cursor-pointer"
            >
              ▶
            </button>
          </div>
          <div className="flex justify-center w-full">
            <button
              onClick={() => handleDirectionChange('DOWN')}
              className="w-11 h-11 bg-white/10 active:bg-white/20 border border-white/15 rounded-xl flex items-center justify-center font-bold text-lg select-none text-white hover:scale-105 active:scale-95 cursor-pointer"
            >
              ▼
            </button>
          </div>
        </div>

        {/* Desktop instructions */}
        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.14em] font-mono leading-none">
          DESKTOP: USE ARROWS OR WASD | SPACE TO PLAY
        </span>
      </div>

      {/* Settings configuration slider modal drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 z-40 flex items-end"
          >
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setShowConfig(false)} />

            {/* Config Content Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className={`w-full max-h-[85%] rounded-t-[32px] p-6 text-left shadow-2xl relative z-10 border-t border-white/10 ${
                isDark ? 'bg-slate-900 text-slate-100' : 'bg-indigo-950 text-slate-50'
              }`}
            >
              {/* Close Bar header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🛠️</span>
                  <h3 className="text-sm font-black uppercase tracking-wide">Customize Game</h3>
                </div>
                <button
                  onClick={() => setShowConfig(false)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-extrabold text-xs active:scale-90 hover:bg-white/15 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto max-h-[380px] pb-6 pr-1">
                {/* Visual Skins / Theme selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Visual Theme Skin</span>
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Map Boundaries Mode</span>
                  <div className="flex space-x-2">
                    {[
                      { id: 'classic', title: 'Solid Walls', desc: 'Crashing ends slither' },
                      { id: 'wrap', title: 'Wrap Borders', desc: 'Wraps screen margins' }
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Speed Difficulty</span>
                  <div className="flex space-x-2">
                    {[
                      { id: 'easy', label: 'Easy', color: 'border-emerald-500/30 text-emerald-300' },
                      { id: 'normal', label: 'Normal', color: 'border-blue-500/30 text-blue-300' },
                      { id: 'hyper', label: 'Hyper', color: 'border-rose-500/30 text-rose-300' }
                    ].map((diffOption) => {
                      const active = difficulty === diffOption.id;
                      return (
                        <button
                          key={diffOption.id}
                          onClick={() => {
                            playSound('click');
                            setDifficulty(diffOption.id as Difficulty);
                          }}
                          className={`flex-1 py-2 rounded-2xl border text-center transition-all cursor-pointer ${
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

                {/* Gameplay Instructions brief summary cards */}
                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 text-[9px] text-slate-400 leading-normal space-y-1 font-medium">
                  <span className="font-extrabold text-slate-300 block mb-0.5">🎮 Gamer Pro Tips:</span>
                  <p>• Eat red apples to grow (+15 points).</p>
                  <p>• Grab rare gold star quickly before it decays (+40 points!).</p>
                  <p>• Earn Stars and experience points with every game completed!</p>
                </div>

                <button
                  onClick={() => setShowConfig(false)}
                  className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-black rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-center shadow-lg active:scale-95"
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
