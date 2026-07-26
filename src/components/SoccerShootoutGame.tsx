/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Users,
  Cpu,
  Trophy,
  Sparkles
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

// Dynamic synthetic sound wrapper
class SoccerAudio {
  static play(type: 'kick' | 'save' | 'goal' | 'post' | 'whistle' | 'win', enabled: boolean) {
    if (!enabled) return;
    try {
      switch (type) {
        case 'kick':
          SoundEngine.play('tictactoe_x');
          break;
        case 'save':
          SoundEngine.play('back');
          break;
        case 'goal':
          SoundEngine.play('level_up');
          break;
        case 'post':
          SoundEngine.play('click');
          break;
        case 'whistle':
          SoundEngine.play('tictactoe_o');
          break;
        case 'win':
          SoundEngine.play('win');
          break;
        default:
          SoundEngine.play('click');
          break;
      }
    } catch (e) {
      console.warn('Soccer audio failure:', e);
    }
  }
}

interface GoalScoredAnimationProps {
  scorer: 'p1' | 'p2';
  isAiMode: boolean;
}

const GoalScoredAnimation: React.FC<GoalScoredAnimationProps> = ({ scorer, isAiMode }) => {
  const isP1 = scorer === 'p1';
  const scorerName = isP1 ? 'PLAYER 1' : isAiMode ? 'COBRA BOT' : 'PLAYER 2';
  const themeColor = isP1 ? 'from-rose-500 to-red-600 shadow-red-500/50' : 'from-blue-500 to-indigo-600 shadow-blue-500/50';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-40 backdrop-blur-[1px] pointer-events-none"
    >
      {/* Back glowing halo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [1.2, 1.6, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute w-72 h-72 rounded-full filter blur-[60px] opacity-30 ${isP1 ? 'bg-red-500' : 'bg-blue-500'}`}
      />

      {/* Main Goal Banner */}
      <motion.div
        initial={{ scale: 0.3, y: 100, rotate: -15, opacity: 0 }}
        animate={{
          scale: [0.3, 1.1, 1.0],
          y: [100, -10, 0],
          rotate: [-15, 5, 0],
          opacity: 1
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 18,
          duration: 0.6
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className={`px-12 py-6 bg-gradient-to-r ${themeColor} rounded-2xl shadow-2xl border border-white/20 text-center transform -skew-x-6 relative overflow-hidden`}>
          {/* Animated light reflection stripe */}
          <motion.div
            animate={{ x: [-200, 400] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-16 bg-white/20 skew-x-12 filter blur-sm pointer-events-none"
            style={{ left: 0 }}
          />

          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl md:text-6xl font-black italic tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none uppercase"
          >
            GOAL!
          </motion.h1>
        </div>

        {/* Scorer Info Label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 px-6 py-2 bg-slate-900/95 border border-slate-800 rounded-full shadow-lg flex items-center space-x-2 backdrop-blur-md"
        >
          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isP1 ? 'bg-rose-500' : 'bg-blue-500'}`} />
          <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
            {scorerName} SCORED
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

interface SoccerShootoutGameProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

// Fixed coordinate space for rendering. CSS handles aspect-ratio and scaling.
const V_WIDTH = 800;
const V_HEIGHT = 480;

interface GoalCelebrationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export const SoccerShootoutGame: React.FC<SoccerShootoutGameProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true
}) => {
  const isDark = theme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAiMode, setIsAiMode] = useState(true);
  const [soundOn, setSoundOn] = useState(soundEnabled);

  // Match Scoring states
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1'); // p1 = left, p2 = right
  const [logs, setLogs] = useState<string[]>(['Match kick-off initiated.']);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);
  const [goalScorer, setGoalScorer] = useState<'p1' | 'p2' | null>(null);
  const [isCameraShaking, setIsCameraShaking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hold-to-exit state
  const [exitHoldProgress, setExitHoldProgress] = useState(0);
  const isHoldingExitRef = useRef(false);
  const exitHoldTimerRef = useRef<number | null>(null);

  // Physics simulation state refs
  // Striker Discs (P1 Left, P2 Right)
  const p1Disc = useRef({ x: 200, y: 240, vx: 0, vy: 0, radius: 24, mass: 2 });
  const p2Disc = useRef({ x: 600, y: 240, vx: 0, vy: 0, radius: 24, mass: 2 });

  // Goalkeepers
  const gk1 = useRef({ y: 240, targetY: 240, height: 55, width: 14, speed: 4.0 });
  const gk2 = useRef({ y: 240, targetY: 240, height: 55, width: 14, speed: 4.0 });

  // Ball
  const ball = useRef({
    x: 400,
    y: 240,
    vx: 0,
    vy: 0,
    radius: 12,
    mass: 1,
    rotation: 0,
    lastScorer: null as 'p1' | 'p2' | null
  });

  // Controls & Aiming
  const isAimingRef = useRef(false);
  const aimStartRef = useRef({ x: 0, y: 0 });
  const aimCurrentRef = useRef({ x: 0, y: 0 });
  const aimingDiscRef = useRef<'p1' | 'p2' | null>(null);

  // Juice & FX States
  const particlesRef = useRef<GoalCelebrationParticle[]>([]);
  const shakeIntensityRef = useRef(0);
  const lastTimeRef = useRef(0);

  const playSound = (type: 'kick' | 'save' | 'goal' | 'post' | 'whistle' | 'win') => {
    SoccerAudio.play(type, soundOn);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 5)]);
  };

  // Setup/Reset Round Positions
  const resetRound = () => {
    ball.current.x = 400;
    ball.current.y = 240;
    ball.current.vx = 0;
    ball.current.vy = 0;

    p1Disc.current.x = 200;
    p1Disc.current.y = 240;
    p1Disc.current.vx = 0;
    p1Disc.current.vy = 0;

    p2Disc.current.x = 600;
    p2Disc.current.y = 240;
    p2Disc.current.vx = 0;
    p2Disc.current.vy = 0;

    gk1.current.y = 240;
    gk2.current.y = 240;

    isAimingRef.current = false;
    aimingDiscRef.current = null;
  };

  const startNewGame = (aiModeSelected: boolean) => {
    setIsAiMode(aiModeSelected);
    playSound('whistle');
    triggerVibration('medium');
    setScore1(0);
    setScore2(0);
    setTurn('p1');
    setWinnerMessage(null);
    setLogs(['Match started! Drag and flick your striker!']);
    resetRound();
    setIsPlaying(true);
  };

  // Exit hold interaction
  const startExitHold = () => {
    isHoldingExitRef.current = true;
    const duration = 1200; // 1.2s
    const start = performance.now();

    const updateHold = (now: number) => {
      if (!isHoldingExitRef.current) return;
      const elapsed = now - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setExitHoldProgress(progress);

      if (progress >= 100) {
        playSound('whistle');
        triggerVibration('heavy');
        onBack();
      } else {
        exitHoldTimerRef.current = requestAnimationFrame(updateHold);
      }
    };
    exitHoldTimerRef.current = requestAnimationFrame(updateHold);
  };

  const stopExitHold = () => {
    isHoldingExitRef.current = false;
    if (exitHoldTimerRef.current) {
      cancelAnimationFrame(exitHoldTimerRef.current);
    }
    // Animate smoothly back to 0
    let current = exitHoldProgress;
    const shrink = () => {
      if (isHoldingExitRef.current) return;
      current = Math.max(0, current - 8);
      setExitHoldProgress(current);
      if (current > 0) {
        requestAnimationFrame(shrink);
      }
    };
    requestAnimationFrame(shrink);
  };

  // Canvas interaction logic
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert pixel coordinate to virtual space (800x480)
    const x = ((clientX - rect.left) / rect.width) * V_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * V_HEIGHT;
    return { x, y };
  };

  const handleStart = (e: any) => {
    if (!isPlaying || winnerMessage) return;

    // AI controls p2, so p1 cannot flick during AI phase
    if (isAiMode && turn === 'p2') return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Determine which disc we are trying to drag
    const activeDisc = turn === 'p1' ? p1Disc.current : p2Disc.current;
    const dx = coords.x - activeDisc.x;
    const dy = coords.y - activeDisc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Limit touch distance threshold to tap the striker
    if (dist < 40) {
      isAimingRef.current = true;
      aimingDiscRef.current = turn;
      aimStartRef.current = { x: activeDisc.x, y: activeDisc.y };
      aimCurrentRef.current = { x: coords.x, y: coords.y };
      triggerVibration('tick');
    }
  };

  const handleMove = (e: any) => {
    if (!isAimingRef.current) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      aimCurrentRef.current = { x: coords.x, y: coords.y };
    }
  };

  const handleEnd = () => {
    if (!isAimingRef.current || !aimingDiscRef.current) return;
    isAimingRef.current = false;

    const activeDisc = aimingDiscRef.current === 'p1' ? p1Disc.current : p2Disc.current;
    const dx = aimCurrentRef.current.x - aimStartRef.current.x;
    const dy = aimCurrentRef.current.y - aimStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 15) {
      // Slingshot action (pull opposite to launch forward)
      const forceMultiplier = 0.22;
      activeDisc.vx = -dx * forceMultiplier;
      activeDisc.vy = -dy * forceMultiplier;

      // Limit maximum velocity
      const maxSpeed = 18;
      const speed = Math.sqrt(activeDisc.vx * activeDisc.vx + activeDisc.vy * activeDisc.vy);
      if (speed > maxSpeed) {
        activeDisc.vx = (activeDisc.vx / speed) * maxSpeed;
        activeDisc.vy = (activeDisc.vy / speed) * maxSpeed;
      }

      playSound('kick');
      triggerVibration('medium');
      addLog(`${turn === 'p1' ? 'Player 1' : 'Player 2'} flicked the striker!`);
    }

    aimingDiscRef.current = null;
  };

  // Simple automated Bot AI for player 2
  const triggerAiTurn = () => {
    if (winnerMessage) return;
    addLog('Cobra Bot is planning the next shot...');

    setTimeout(() => {
      if (!isPlaying || turn !== 'p2') return;

      const p2 = p2Disc.current;
      const b = ball.current;

      // Target point: aim at ball, adding slight offset to steer it towards player 1's goal
      const targetGoalX = 40;
      const targetGoalY = 200 + Math.random() * 80;

      // Calculate path from ball to P1 goal
      const ballToGoalDx = targetGoalX - b.x;
      const ballToGoalDy = targetGoalY - b.y;
      const ballToGoalDist = Math.sqrt(ballToGoalDx * ballToGoalDx + ballToGoalDy * ballToGoalDy);

      // We want to hit the ball from behind
      const approachAngle = Math.atan2(ballToGoalDy, ballToGoalDx);
      const hitX = b.x - Math.cos(approachAngle) * 35;
      const hitY = b.y - Math.sin(approachAngle) * 35;

      // Flicker vector from P2 current position to hit position
      const aiDx = hitX - p2.x;
      const aiDy = hitY - p2.y;

      // Simulate aiming UI
      isAimingRef.current = true;
      aimingDiscRef.current = 'p2';
      aimStartRef.current = { x: p2.x, y: p2.y };
      aimCurrentRef.current = { x: p2.x - aiDx * 0.7, y: p2.y - aiDy * 0.7 };

      setTimeout(() => {
        isAimingRef.current = false;
        aimingDiscRef.current = null;

        const forceFactor = 0.24;
        p2.vx = aiDx * forceFactor;
        p2.vy = aiDy * forceFactor;

        // Ensure reasonable speed
        const speed = Math.sqrt(p2.vx * p2.vx + p2.vy * p2.vy);
        const limit = 16;
        if (speed > limit) {
          p2.vx = (p2.vx / speed) * limit;
          p2.vy = (p2.vy / speed) * limit;
        }

        playSound('kick');
        triggerVibration('medium');
        addLog('Cobra Bot launched a calculated strike!');
      }, 700);

    }, 1200);
  };

  // Generate confetti on goals
  const spawnGoalConfetti = (goalX: number, goalY: number) => {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x: goalX,
        y: goalY + (Math.random() - 0.5) * 80,
        vx: (goalX < 400 ? 1 : -1) * (3 + Math.random() * 8),
        vy: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        alpha: 1.0
      });
    }
  };

  // Generate screen-wide festive confetti falling and bursting
  const spawnScreenConfetti = () => {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ffffff'];
    // Rain down from top
    for (let i = 0; i < 110; i++) {
      particlesRef.current.push({
        x: Math.random() * V_WIDTH,
        y: -10 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 4,
        vy: 1.0 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        alpha: 1.0
      });
    }
    // Burst from center of the screen
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 9;
      particlesRef.current.push({
        x: V_WIDTH / 2,
        y: V_HEIGHT / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // slightly upward bias
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 5,
        alpha: 1.0
      });
    }
  };

  // Run physics & rendering engine
  useEffect(() => {
    let animId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;

      updatePhysics();
      renderGame();

      animId = requestAnimationFrame(gameLoop);
    };

    const updatePhysics = () => {
      if (!isPlaying) return;

      const p1 = p1Disc.current;
      const p2 = p2Disc.current;
      const b = ball.current;
      const keeper1 = gk1.current;
      const keeper2 = gk2.current;

      const friction = 0.985;
      const bounceFriction = 0.85;

      // Apply friction and move P1 Disc
      p1.x += p1.vx;
      p1.y += p1.vy;
      p1.vx *= friction;
      p1.vy *= friction;

      // Apply friction and move P2 Disc
      p2.x += p2.vx;
      p2.y += p2.vy;
      p2.vx *= friction;
      p2.vy *= friction;

      // Apply friction and move Ball
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= friction;
      b.vy *= friction;

      // Ball rotation based on speed and movement vector
      const bSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (bSpeed > 0.1) {
        b.rotation += bSpeed * 0.05;
      }

      // 1. Boundary Wall Collisions (leaving outer margins of 40px for goals and nets)
      const fieldTop = 40;
      const fieldBottom = 440;
      const fieldLeft = 40;
      const fieldRight = 760;

      // P1 Striker wall bounds
      if (p1.y - p1.radius < fieldTop) { p1.y = fieldTop + p1.radius; p1.vy = -p1.vy * bounceFriction; }
      if (p1.y + p1.radius > fieldBottom) { p1.y = fieldBottom - p1.radius; p1.vy = -p1.vy * bounceFriction; }
      if (p1.x - p1.radius < fieldLeft) { p1.x = fieldLeft + p1.radius; p1.vx = -p1.vx * bounceFriction; }
      if (p1.x + p1.radius > fieldRight) { p1.x = fieldRight - p1.radius; p1.vx = -p1.vx * bounceFriction; }

      // P2 Striker wall bounds
      if (p2.y - p2.radius < fieldTop) { p2.y = fieldTop + p2.radius; p2.vy = -p2.vy * bounceFriction; }
      if (p2.y + p2.radius > fieldBottom) { p2.y = fieldBottom - p2.radius; p2.vy = -p2.vy * bounceFriction; }
      if (p2.x - p2.radius < fieldLeft) { p2.x = fieldLeft + p2.radius; p2.vx = -p2.vx * bounceFriction; }
      if (p2.x + p2.radius > fieldRight) { p2.x = fieldRight - p2.radius; p2.vx = -p2.vx * bounceFriction; }

      // Ball wall and Goalpost Collisions
      const goalTop = 160;
      const goalBottom = 320;

      // Left goal posts bounce
      // Top Left post (40, 160)
      let dxPostTL = b.x - 40;
      let dyPostTL = b.y - 160;
      let distPostTL = Math.sqrt(dxPostTL * dxPostTL + dyPostTL * dyPostTL);
      if (distPostTL < b.radius + 6) {
        playSound('post');
        triggerVibration('light');
        const angle = Math.atan2(dyPostTL, dxPostTL);
        b.x = 40 + Math.cos(angle) * (b.radius + 6);
        b.vx = Math.cos(angle) * bSpeed * bounceFriction + 1;
        b.vy = Math.sin(angle) * bSpeed * bounceFriction;
      }
      // Bottom Left post (40, 320)
      let dxPostBL = b.x - 40;
      let dyPostBL = b.y - 320;
      let distPostBL = Math.sqrt(dxPostBL * dxPostBL + dyPostBL * dyPostBL);
      if (distPostBL < b.radius + 6) {
        playSound('post');
        triggerVibration('light');
        const angle = Math.atan2(dyPostBL, dxPostBL);
        b.x = 40 + Math.cos(angle) * (b.radius + 6);
        b.vx = Math.cos(angle) * bSpeed * bounceFriction + 1;
        b.vy = Math.sin(angle) * bSpeed * bounceFriction;
      }

      // Right goal posts bounce
      // Top Right post (760, 160)
      let dxPostTR = b.x - 760;
      let dyPostTR = b.y - 160;
      let distPostTR = Math.sqrt(dxPostTR * dxPostTR + dyPostTR * dyPostTR);
      if (distPostTR < b.radius + 6) {
        playSound('post');
        triggerVibration('light');
        const angle = Math.atan2(dyPostTR, dxPostTR);
        b.x = 760 + Math.cos(angle) * (b.radius + 6);
        b.vx = Math.cos(angle) * bSpeed * bounceFriction - 1;
        b.vy = Math.sin(angle) * bSpeed * bounceFriction;
      }
      // Bottom Right post (760, 320)
      let dxPostBR = b.x - 760;
      let dyPostBR = b.y - 320;
      let distPostBR = Math.sqrt(dxPostBR * dxPostBR + dyPostBR * dyPostBR);
      if (distPostBR < b.radius + 6) {
        playSound('post');
        triggerVibration('light');
        const angle = Math.atan2(dyPostBR, dxPostBR);
        b.x = 760 + Math.cos(angle) * (b.radius + 6);
        b.vx = Math.cos(angle) * bSpeed * bounceFriction - 1;
        b.vy = Math.sin(angle) * bSpeed * bounceFriction;
      }

      // Normal wall bounds for ball
      if (b.y - b.radius < fieldTop) { b.y = fieldTop + b.radius; b.vy = -b.vy * bounceFriction; }
      if (b.y + b.radius > fieldBottom) { b.y = fieldBottom - b.radius; b.vy = -b.vy * bounceFriction; }

      // Outside the Goal area, bounce left & right
      if (b.y < goalTop || b.y > goalBottom) {
        if (b.x - b.radius < fieldLeft) { b.x = fieldLeft + b.radius; b.vx = -b.vx * bounceFriction; }
        if (b.x + b.radius > fieldRight) { b.x = fieldRight - b.radius; b.vx = -b.vx * bounceFriction; }
      }

      // 2. Elastic Circle-to-Circle Collisions (P1 vs Ball, P2 vs Ball, P1 vs P2)
      const handleCircleCollision = (c1: any, c2: any) => {
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = c1.radius + c2.radius;

        if (dist < minDist) {
          // Push them apart first to prevent sticking
          const overlap = minDist - dist;
          const ax = (dx / dist) * overlap * 0.5;
          const ay = (dy / dist) * overlap * 0.5;
          c1.x -= ax;
          c1.y -= ay;
          c2.x += ax;
          c2.y += ay;

          // Elastic collision math
          const normalX = dx / dist;
          const normalY = dy / dist;
          const tangentX = -normalY;
          const tangentY = normalX;

          const dpTan1 = c1.vx * tangentX + c1.vy * tangentY;
          const dpTan2 = c2.vx * tangentX + c2.vy * tangentY;

          const dpNorm1 = c1.vx * normalX + c1.vy * normalY;
          const dpNorm2 = c2.vx * normalX + c2.vy * normalY;

          // Conservation of momentum
          const m1 = c1.mass;
          const m2 = c2.mass;
          const mom1 = (dpNorm1 * (m1 - m2) + 2 * m2 * dpNorm2) / (m1 + m2);
          const mom2 = (dpNorm2 * (m2 - m1) + 2 * m1 * dpNorm1) / (m1 + m2);

          // Assign back velocities with energy retention
          const bounceRestitution = 0.92;
          c1.vx = (tangentX * dpTan1 + normalX * mom1) * bounceRestitution;
          c1.vy = (tangentY * dpTan1 + normalY * mom1) * bounceRestitution;
          c2.vx = (tangentX * dpTan2 + normalX * mom2) * bounceRestitution;
          c2.vy = (tangentY * dpTan2 + normalY * mom2) * bounceRestitution;

          playSound('kick');
          triggerVibration('light');
        }
      };

      // Striker vs Ball
      handleCircleCollision(p1, b);
      handleCircleCollision(p2, b);

      // Striker vs Striker
      const pCollideDx = p2.x - p1.x;
      const pCollideDy = p2.y - p1.y;
      const pCollideDist = Math.sqrt(pCollideDx * pCollideDx + pCollideDy * pCollideDy);
      if (pCollideDist < p1.radius + p2.radius) {
        handleCircleCollision(p1, p2);
      }

      // 3. Keepers defending & Collision with ball/strikers
      // Left Goalkeeper AI (tracks ball Y with a subtle lag)
      const targetY1 = Math.max(goalTop + keeper1.height/2, Math.min(goalBottom - keeper1.height/2, b.y));
      keeper1.y += (targetY1 - keeper1.y) * 0.08;

      // Right Goalkeeper AI (tracks ball Y with a subtle lag)
      const targetY2 = Math.max(goalTop + keeper2.height/2, Math.min(goalBottom - keeper2.height/2, b.y));
      keeper2.y += (targetY2 - keeper2.y) * 0.08;

      // Check Goalkeeper collisions
      const checkGkCollision = (gkX: number, keeper: any, targetDisc: any, isBall: boolean) => {
        const topY = keeper.y - keeper.height / 2;
        const bottomY = keeper.y + keeper.height / 2;
        const leftX = gkX - keeper.width / 2;
        const rightX = gkX + keeper.width / 2;

        // Simple box vs circle check
        const closestX = Math.max(leftX, Math.min(rightX, targetDisc.x));
        const closestY = Math.max(topY, Math.min(bottomY, targetDisc.y));
        const diffX = targetDisc.x - closestX;
        const diffY = targetDisc.y - closestY;
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);

        if (distance < targetDisc.radius) {
          // Collided! Push out & reflect
          if (targetDisc.x < leftX) {
            targetDisc.x = leftX - targetDisc.radius;
            targetDisc.vx = -Math.abs(targetDisc.vx) * bounceFriction - 0.5;
          } else if (targetDisc.x > rightX) {
            targetDisc.x = rightX + targetDisc.radius;
            targetDisc.vx = Math.abs(targetDisc.vx) * bounceFriction + 0.5;
          }
          if (targetDisc.y < topY) {
            targetDisc.y = topY - targetDisc.radius;
            targetDisc.vy = -Math.abs(targetDisc.vy) * bounceFriction;
          } else if (targetDisc.y > bottomY) {
            targetDisc.y = bottomY + targetDisc.radius;
            targetDisc.vy = Math.abs(targetDisc.vy) * bounceFriction;
          }

          if (isBall) {
            playSound('save');
            triggerVibration('medium');
            shakeIntensityRef.current = 6;
            addLog('🧤 INCREDIBLE GOALKEEPING SAVE!');
          } else {
            playSound('post');
          }
        }
      };

      checkGkCollision(75, keeper1, b, true);
      checkGkCollision(75, keeper1, p1, false);
      checkGkCollision(75, keeper1, p2, false);

      checkGkCollision(725, keeper2, b, true);
      checkGkCollision(725, keeper2, p1, false);
      checkGkCollision(725, keeper2, p2, false);

      // 4. Goal Lines Check (Left: x = 40, Right: x = 760, Y range 160 to 320)
      if (b.y > goalTop && b.y < goalBottom) {
        if (b.x < 36) {
          // P2 scores! (P1 is left side defender)
          handleGoal('p2');
        } else if (b.x > 764) {
          // P1 scores! (P2 is right side defender)
          handleGoal('p1');
        }
      }

      // 5. Update Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        // Apply wind sway and gravity
        p.vx += Math.sin(Date.now() * 0.005 + p.x) * 0.03;
        p.vy += 0.05; // tiny gravity drift
        p.alpha -= 0.012; // slightly slower fade-out
        if (p.alpha <= 0 || p.y > V_HEIGHT + 20) {
          particles.splice(i, 1);
        }
      }

      // Decay screen shake
      if (shakeIntensityRef.current > 0) {
        shakeIntensityRef.current *= 0.9;
        if (shakeIntensityRef.current < 0.2) shakeIntensityRef.current = 0;
      }

      // 6. Turn switcher logic: wait until all bodies stop moving
      const isStill = (d: any) => Math.sqrt(d.vx * d.vx + d.vy * d.vy) < 0.15;
      if (isPlaying && !winnerMessage && isStill(p1) && isStill(p2) && isStill(b)) {
        if (p1.vx === 0 && p1.vy === 0 && p2.vx === 0 && p2.vy === 0 && b.vx === 0 && b.vy === 0) {
          return;
        }

        p1.vx = 0; p1.vy = 0;
        p2.vx = 0; p2.vy = 0;
        b.vx = 0; b.vy = 0;

        const nextTurn = turn === 'p1' ? 'p2' : 'p1';
        setTurn(nextTurn);
        addLog(`It is now ${nextTurn === 'p1' ? 'Player 1' : isAiMode ? 'Cobra Bot' : 'Player 2'}'s turn.`);

        if (nextTurn === 'p2' && isAiMode) {
          triggerAiTurn();
        }
      }
    };

    const handleGoal = (scorer: 'p1' | 'p2') => {
      playSound('goal');
      triggerVibration('heavy');
      shakeIntensityRef.current = 15;
      setIsCameraShaking(true);
      setGoalScorer(scorer);

      const goalX = scorer === 'p1' ? 760 : 40;
      const goalY = 240;
      spawnGoalConfetti(goalX, goalY);
      spawnScreenConfetti();

      if (scorer === 'p1') {
        setScore1(s => {
          const next = s + 1;
          if (next >= 5) {
            setTimeout(() => {
              playSound('win');
              setWinnerMessage('PLAYER 1 WINS THE MATCH!');
            }, 800);
          }
          return next;
        });
        addLog('⚽ GOOOAL! Player 1 fires it home!');
      } else {
        setScore2(s => {
          const next = s + 1;
          if (next >= 5) {
            setTimeout(() => {
              playSound('win');
              setWinnerMessage(isAiMode ? 'COBRA BOT WINS THE MATCH!' : 'PLAYER 2 WINS THE MATCH!');
            }, 800);
          }
          return next;
        });
        addLog(`⚽ GOOOAL! ${isAiMode ? 'Cobra Bot' : 'Player 2'} scores!`);
      }

      // Pause briefly for celebration before resetting positions
      setIsPlaying(false);
      setTimeout(() => {
        setGoalScorer(null);
        setIsCameraShaking(false);
        if (score1 < 4 && score2 < 4) {
          resetRound();
          setIsPlaying(true);
        }
      }, 2000);
    };

    const renderGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();

      // Camera shake displacement
      if (shakeIntensityRef.current > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensityRef.current;
        const dy = (Math.random() - 0.5) * shakeIntensityRef.current;
        ctx.translate(dx, dy);
      }

      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

      // A. SOCCER FIELD GRASS WITH ALTERNATING STRIPES
      const stripeWidth = V_WIDTH / 10;
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1f853d' : '#229345';
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, V_HEIGHT);
      }

      // Soft vignette layer over corners
      const vignette = ctx.createRadialGradient(V_WIDTH/2, V_HEIGHT/2, 200, V_WIDTH/2, V_HEIGHT/2, V_WIDTH * 0.7);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // B. WHITE FIELD MARKINGS
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 3;

      // Outer Boundary Line
      ctx.beginPath();
      ctx.rect(40, 40, 720, 400);
      ctx.stroke();

      // Midfield Center Line
      ctx.beginPath();
      ctx.moveTo(V_WIDTH / 2, 40);
      ctx.lineTo(V_WIDTH / 2, 440);
      ctx.stroke();

      // Center Circle
      ctx.beginPath();
      ctx.arc(V_WIDTH / 2, V_HEIGHT / 2, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Center Spot Dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(V_WIDTH / 2, V_HEIGHT / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Penalty Box Left
      ctx.beginPath();
      ctx.rect(40, 110, 100, 260);
      ctx.stroke();

      // Penalty Box Right
      ctx.beginPath();
      ctx.rect(660, 110, 100, 260);
      ctx.stroke();

      // C. THE ARCADE GOALS (Extreme left and right edges)
      // Nets Backdrops
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(10, 160, 30, 160); // Left net box
      ctx.fillRect(760, 160, 30, 160); // Right net box

      // Net Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      // Left Goal Net diagonal grids
      for (let offset = -160; offset < 160; offset += 15) {
        ctx.beginPath();
        ctx.moveTo(40, 160 + offset);
        ctx.lineTo(10, 190 + offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(40, 320 - offset);
        ctx.lineTo(10, 290 - offset);
        ctx.stroke();
      }
      // Right Goal Net diagonal grids
      for (let offset = -160; offset < 160; offset += 15) {
        ctx.beginPath();
        ctx.moveTo(760, 160 + offset);
        ctx.lineTo(790, 190 + offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(760, 320 - offset);
        ctx.lineTo(790, 290 - offset);
        ctx.stroke();
      }

      // Draw Goal Frame bars with crisp outlines
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left goal black outline
      ctx.beginPath();
      ctx.moveTo(40, 160);
      ctx.lineTo(10, 160);
      ctx.lineTo(10, 320);
      ctx.lineTo(40, 320);
      ctx.stroke();

      // Right goal black outline
      ctx.beginPath();
      ctx.moveTo(760, 160);
      ctx.lineTo(790, 160);
      ctx.lineTo(790, 320);
      ctx.lineTo(760, 320);
      ctx.stroke();

      // Goal frame white bars
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, 160);
      ctx.lineTo(10, 160);
      ctx.lineTo(10, 320);
      ctx.lineTo(40, 320);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(760, 160);
      ctx.lineTo(790, 160);
      ctx.lineTo(790, 320);
      ctx.lineTo(760, 320);
      ctx.stroke();

      // D. AIM TRAJECTORY CONE & PREVIEW DOTS (Slingshot indicator)
      if (isAimingRef.current && aimingDiscRef.current) {
        const activeDisc = aimingDiscRef.current === 'p1' ? p1Disc.current : p2Disc.current;
        const dragDx = aimCurrentRef.current.x - aimStartRef.current.x;
        const dragDy = aimCurrentRef.current.y - aimStartRef.current.y;
        const dragDist = Math.sqrt(dragDx * dragDx + dragDy * dragDy);

        if (dragDist > 15) {
          const angle = Math.atan2(-dragDy, -dragDx);
          const launchPower = Math.min(18, dragDist * 0.22);

          ctx.save();
          // 1. Long translucent aiming cone
          const coneLength = launchPower * 14;
          const coneSpread = 0.28;

          ctx.beginPath();
          ctx.moveTo(activeDisc.x, activeDisc.y);
          ctx.lineTo(
            activeDisc.x + Math.cos(angle - coneSpread) * coneLength,
            activeDisc.y + Math.sin(angle - coneSpread) * coneLength
          );
          ctx.lineTo(
            activeDisc.x + Math.cos(angle + coneSpread) * coneLength,
            activeDisc.y + Math.sin(angle + coneSpread) * coneLength
          );
          ctx.closePath();

          const grad = ctx.createRadialGradient(activeDisc.x, activeDisc.y, 10, activeDisc.x, activeDisc.y, coneLength);
          grad.addColorStop(0, turn === 'p1' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.fill();

          // 2. Fading white dotted trajectory line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.setLineDash([5, 8]);
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(activeDisc.x, activeDisc.y);
          ctx.lineTo(
            activeDisc.x + Math.cos(angle) * coneLength,
            activeDisc.y + Math.sin(angle) * coneLength
          );
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // E. MINIMAL CUTE GOALKEEPERS
      const drawGoalie = (gkX: number, keeper: any, isRed: boolean) => {
        ctx.save();
        const breathScale = 1.0 + Math.sin(Date.now() * 0.005) * 0.04;

        // Soft goalie shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(gkX, keeper.y + 24, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Keeper Pill Body
        const bodyGrad = ctx.createLinearGradient(gkX - keeper.width/2, keeper.y, gkX + keeper.width/2, keeper.y);
        bodyGrad.addColorStop(0, isRed ? '#ff4560' : '#3b82f6');
        bodyGrad.addColorStop(1, isRed ? '#b91c1c' : '#1d4ed8');
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        ctx.roundRect(
          gkX - (keeper.width / 2) * breathScale,
          keeper.y - (keeper.height / 2) * breathScale,
          keeper.width * breathScale,
          keeper.height * breathScale,
          10
        );
        ctx.fill();

        // Clean white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Animated pupils tracking the football
        const ballRef = ball.current;
        const eyeAngle = Math.atan2(ballRef.y - keeper.y, ballRef.x - gkX);
        const eyeOffset = 3.5;
        const pupilDx = Math.cos(eyeAngle) * eyeOffset;
        const pupilDy = Math.sin(eyeAngle) * eyeOffset;

        // Draw 2 eyes
        const eyeYOffset = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gkX, keeper.y - eyeYOffset, 5, 0, Math.PI * 2);
        ctx.arc(gkX, keeper.y + eyeYOffset, 5, 0, Math.PI * 2);
        ctx.fill();

        // Black pupils looking at ball
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(gkX + pupilDx, keeper.y - eyeYOffset + pupilDy, 2.5, 0, Math.PI * 2);
        ctx.arc(gkX + pupilDx, keeper.y + eyeYOffset + pupilDy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Cute white soccer gloves
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(gkX + (isRed ? 10 : -10), keeper.y - 20, 5, 0, Math.PI * 2);
        ctx.arc(gkX + (isRed ? 10 : -10), keeper.y + 20, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawGoalie(75, gk1.current, true);
      drawGoalie(725, gk2.current, false);

      // F. STRIKER DISCS (Player pieces)
      const drawStrikerDisc = (disc: any, isP1: boolean) => {
        ctx.save();

        // Tactile Disc Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(disc.x + 2, disc.y + 4, disc.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glossy Ring Gradient
        const ringGrad = ctx.createRadialGradient(disc.x - 4, disc.y - 4, 4, disc.x, disc.y, disc.radius);
        if (isP1) {
          ringGrad.addColorStop(0, '#fca5a5');
          ringGrad.addColorStop(0.5, '#ef4444');
          ringGrad.addColorStop(1, '#991b1b');
        } else {
          ringGrad.addColorStop(0, '#93c5fd');
          ringGrad.addColorStop(0.5, '#3b82f6');
          ringGrad.addColorStop(1, '#1e3a8a');
        }

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, disc.radius, 0, Math.PI * 2);
        ctx.fill();

        // White border ring representing team active player
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, disc.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, disc.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Add number label P1 or P2
        ctx.fillStyle = isP1 ? '#b91c1c' : '#1d4ed8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isP1 ? 'P1' : 'P2', disc.x, disc.y);

        ctx.restore();
      };

      drawStrikerDisc(p1Disc.current, true);
      drawStrikerDisc(p2Disc.current, false);

      // G. DYNAMIC SOCCER BALL WITH SPIN ROTATION
      const b = ball.current;
      ctx.save();

      // Ball Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(b.x + 1, b.y + 3, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer White sphere
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pentagonal/Hexagonal patches rolling overlay
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      ctx.fillStyle = '#0f172a';
      // Center pentagon
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const px = Math.cos(angle) * (b.radius * 0.3);
        const py = Math.sin(angle) * (b.radius * 0.3);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Edge pentagons
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const ex = Math.cos(angle) * (b.radius * 0.72);
        const ey = Math.sin(angle) * (b.radius * 0.72);
        ctx.beginPath();
        ctx.arc(ex, ey, b.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // H. CONFETTI PARTICLES CELEBRATIONS
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    };

    // Main animation kickoff
    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, winnerMessage, turn, isAiMode, soundOn]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-800'
      }`}
    >
      <AnimatePresence mode="wait">
        {!isPlaying ? (
          // BEAUTIFUL MINIMALIST KICKOFF LOBBY SCREEN
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25 }}
            className={`w-full max-w-md p-6 rounded-3xl flex flex-col text-center border shadow-2xl relative ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-md text-white">
              ⚽
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase mb-1">Arcade Soccer</h2>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-6">Flick Physics Shootout</p>

            <div className="space-y-3 mb-6">
              {/* PLAY VS COBRA AI BUTTON */}
              <button
                onClick={() => startNewGame(true)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Cpu size={14} />
                <span>SOLO vs COBRA BOT AI</span>
              </button>

              {/* LOCAL 2 PLAYER BUTTON */}
              <button
                onClick={() => startNewGame(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Users size={14} />
                <span>LOCAL 2 PLAYER VERSUS</span>
              </button>
            </div>

            {/* QUICK FOOTER & AUDIO TOGGLE */}
            <div className="flex items-center justify-between border-t border-slate-800/20 pt-4 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center space-x-1">
                <Trophy size={11} className="text-amber-500" />
                <span>FIRST TO 5 GOALS WINS</span>
              </span>

              <button
                onClick={() => {
                  playSound('whistle');
                  setSoundOn(s => !s);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>
          </motion.div>
        ) : (
          // PREMIUM LANDSCAPE 2-PLAYER SCREEN
          <motion.div
            key="gameplay"
            initial={{ opacity: 0 }}
            animate={isCameraShaking ? {
              opacity: 1,
              x: [0, -12, 12, -9, 9, -6, 6, -3, 3, 0],
              y: [0, 8, -8, 6, -6, 4, -4, 2, -2, 0]
            } : { opacity: 1, x: 0, y: 0 }}
            transition={isCameraShaking ? {
              duration: 0.6,
              ease: "easeInOut"
            } : { duration: 0.2 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-5xl aspect-[16/10] bg-slate-950 p-2.5 rounded-[24px] border border-slate-800/50 shadow-2xl relative flex flex-col justify-between overflow-hidden"
          >
            {/* SCORE DISPLAY BAR (TOP CENTER CAPSULE) */}
            <div className="absolute top-4 left-0 right-0 flex justify-center items-center z-30 pointer-events-none">
              <div className="flex items-center space-x-4">
                {/* Score Pill */}
                <div className="bg-white px-5 py-2 rounded-full shadow-lg border border-slate-200 flex items-center space-x-4 text-black shrink-0">
                  <span className="text-xs font-black tracking-wide text-rose-500 uppercase">RED</span>
                  <span className="text-xl font-black font-mono tracking-tight">{score1}</span>
                  <span className="text-slate-300 font-bold">•</span>
                  <span className="text-xl font-black font-mono tracking-tight">{score2}</span>
                  <span className="text-xs font-black tracking-wide text-blue-500 uppercase">
                    {isAiMode ? 'BOT' : 'BLUE'}
                  </span>
                </div>

                {/* Active Player Turn Status Badge */}
                <div className={`px-4 py-2 rounded-full border shadow-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                  turn === 'p1'
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                }`}>
                  {turn === 'p1' ? 'P1 TURN' : isAiMode ? 'AI THINKING...' : 'P2 TURN'}
                </div>
              </div>
            </div>

            {/* AUDIO CONTROL FLOATING IN CORNER */}
            <button
              onClick={() => {
                playSound('whistle');
                setSoundOn(s => !s);
              }}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800/60 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all"
            >
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* DYNAMIC CANVAS VIEW */}
            <div className="w-full flex-1 relative overflow-hidden select-none bg-emerald-900 rounded-[18px]">
              <canvas
                ref={canvasRef}
                width={V_WIDTH}
                height={V_HEIGHT}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                className="w-full h-full object-cover block cursor-crosshair"
              />
            </div>

            {/* EXIT BUTTON WITH INTEGRATED HOLD PROGRESS RING (BOTTOM CENTER) */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center items-center z-30">
              <div className="relative">
                {/* Circular holding animation wrapper */}
                <svg className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] transform -rotate-90 pointer-events-none">
                  <rect
                    x="2"
                    y="2"
                    width="calc(100% - 4px)"
                    height="calc(100% - 4px)"
                    rx="26"
                    className="stroke-slate-800/40 fill-none"
                    strokeWidth="3.5"
                  />
                  <rect
                    x="2"
                    y="2"
                    width="calc(100% - 4px)"
                    height="calc(100% - 4px)"
                    rx="26"
                    className="stroke-amber-400 fill-none transition-all duration-75"
                    strokeWidth="3.5"
                    strokeDasharray="300"
                    strokeDashoffset={300 - (exitHoldProgress / 100) * 300}
                  />
                </svg>

                <button
                  onMouseDown={startExitHold}
                  onMouseUp={stopExitHold}
                  onMouseLeave={stopExitHold}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startExitHold();
                  }}
                  onTouchEnd={stopExitHold}
                  className="px-6 py-2.5 bg-white hover:brightness-105 active:scale-95 text-black font-black text-[11px] uppercase tracking-widest rounded-full shadow-lg relative flex items-center space-x-1.5 cursor-pointer select-none transition-all"
                >
                  <Sparkles size={11} className="text-amber-500 fill-amber-500 animate-pulse" />
                  <span>HOLD TO EXIT</span>
                </button>
              </div>
            </div>

            {/* Goal Scored Celebration Overlay */}
            <AnimatePresence>
              {goalScorer && (
                <GoalScoredAnimation
                  key="goal-celebration"
                  scorer={goalScorer}
                  isAiMode={isAiMode}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MATCH WINNER CHAMPION DIALOG BOX */}
      <AnimatePresence>
        {winnerMessage && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-6 z-50 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-3xl text-center border shadow-2xl relative ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-400 to-yellow-600 flex items-center justify-center text-3xl mx-auto mb-3 animate-bounce shadow-md">
                🏆
              </div>
              <h2 className="text-xl font-black uppercase text-amber-500">{winnerMessage}</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5 font-bold">
                Final match summary of shootout!
              </p>

              <div className="bg-slate-800/10 dark:bg-white/5 border border-slate-200/10 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Result Score</span>
                <span className="text-lg font-black text-amber-400 uppercase tracking-wide">
                  {score1} Goals vs {score2} Goals
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => startNewGame(isAiMode)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Kickoff Again
                </button>
                <button
                  onClick={() => {
                    playSound('whistle');
                    setIsPlaying(false);
                  }}
                  className="px-5 bg-slate-800/20 hover:bg-slate-800/30 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  Lobby
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
