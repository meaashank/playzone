/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Cpu,
  User,
  Zap,
  Target,
  Trophy
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

// Dynamic synthetic sound wrapper
class PoolAudio {
  static play(type: 'strike' | 'collision' | 'pocket' | 'cushion' | 'foul' | 'win' | 'click', enabled: boolean) {
    if (!enabled) return;
    try {
      switch (type) {
        case 'strike':
          SoundEngine.play('snake_boost');
          break;
        case 'collision':
          SoundEngine.play('click');
          break;
        case 'pocket':
          SoundEngine.play('snake_eat');
          break;
        case 'cushion':
          SoundEngine.play('back');
          break;
        case 'foul':
          SoundEngine.play('snake_crash');
          break;
        case 'win':
          SoundEngine.play('win');
          break;
        case 'click':
        default:
          SoundEngine.play('click');
          break;
      }
    } catch (e) {
      console.warn('Pool audio play ignored:', e);
    }
  }
}

interface EightBallPoolGameProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

interface Ball {
  id: number; // 0 for cue ball, 8 for black, 1-7 for solids, 9-15 for stripes
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isPotted: boolean;
  type: 'cue' | 'black' | 'solid' | 'stripe';
  number: number;
}

const TABLE_WIDTH = 760;
const TABLE_HEIGHT = 380;
const BALL_RADIUS = 9.5;
const FRICTION = 0.985;

export const EightBallPoolGame: React.FC<EightBallPoolGameProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true
}) => {
  const isDark = theme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [vsAi, setVsAi] = useState(true);
  const [soundOn, setSoundOn] = useState(soundEnabled);

  // Pool Gameplay State
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [playerType, setPlayerType] = useState<'solids' | 'stripes' | null>(null);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [isFoul, setIsFoul] = useState(false);
  const [logs, setLogs] = useState<string[]>(['8-Ball Pool match ready.']);
  const [winner, setWinner] = useState<string | null>(null);

  // Physics animation references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const isAimingRef = useRef(false);
  const aimAngleRef = useRef(0);
  const strikePowerRef = useRef(0); // 0 to 100
  const isChargingPowerRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const playSound = (type: 'strike' | 'collision' | 'pocket' | 'cushion' | 'foul' | 'win' | 'click') => {
    PoolAudio.play(type, soundOn);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 10)]);
  };

  const initBalls = () => {
    const balls: Ball[] = [];

    // Cue Ball (0)
    balls.push({
      id: 0,
      x: TABLE_WIDTH * 0.25,
      y: TABLE_HEIGHT * 0.5,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: '#ffffff',
      isPotted: false,
      type: 'cue',
      number: 0
    });

    // Triangle Rack positioning for the other 15 balls
    // Standard 8 ball arrangement: 8-ball is in center, corners contain one stripe and one solid
    const startX = TABLE_WIDTH * 0.7;
    const startY = TABLE_HEIGHT * 0.5;
    const spacing = BALL_RADIUS * 2.02;

    const arrangement = [
      { id: 1, type: 'solid', color: '#fbbf24', number: 1 }, // yellow
      { id: 9, type: 'stripe', color: '#fbbf24', number: 9 }, // yellow stripe
      { id: 2, type: 'solid', color: '#2563eb', number: 2 }, // blue
      { id: 8, type: 'black', color: '#111827', number: 8 }, // 8-ball center
      { id: 10, type: 'stripe', color: '#2563eb', number: 10 },
      { id: 3, type: 'solid', color: '#dc2626', number: 3 }, // red
      { id: 4, type: 'solid', color: '#7c3aed', number: 4 }, // purple
      { id: 11, type: 'stripe', color: '#dc2626', number: 11 },
      { id: 12, type: 'stripe', color: '#7c3aed', number: 12 },
      { id: 5, type: 'solid', color: '#ea580c', number: 5 }, // orange
      { id: 13, type: 'stripe', color: '#ea580c', number: 13 },
      { id: 6, type: 'solid', color: '#16a34a', number: 6 }, // green
      { id: 14, type: 'stripe', color: '#16a34a', number: 14 },
      { id: 7, type: 'solid', color: '#9a3412', number: 7 }, // burgundy
      { id: 15, type: 'stripe', color: '#9a3412', number: 15 }
    ];

    let arrIdx = 0;
    // Row layout of pyramid (5 rows)
    for (let row = 0; row < 5; row++) {
      const rx = startX + row * spacing * 0.866; // cos(30 deg)
      const rowYStart = startY - (row * spacing) / 2;
      for (let col = 0; col <= row; col++) {
        const ry = rowYStart + col * spacing;
        const config = arrangement[arrIdx++];
        if (config) {
          balls.push({
            id: config.id,
            x: rx,
            y: ry,
            vx: 0,
            vy: 0,
            radius: BALL_RADIUS,
            color: config.color,
            isPotted: false,
            type: config.type as any,
            number: config.number
          });
        }
      }
    }

    ballsRef.current = balls;
  };

  const startNewGame = () => {
    playSound('collision');
    triggerVibration('medium');
    initBalls();
    setScore(0);
    setRound(1);
    setPlayerType(null);
    setTurn('player');
    setIsFoul(false);
    setLogs(['Table is racked! Shoot when ready.']);
    setWinner(null);
    setIsPlaying(true);
  };

  // 6 Pool Pockets
  const POCKETS = [
    { x: 10, y: 10 }, { x: TABLE_WIDTH / 2, y: 6 }, { x: TABLE_WIDTH - 10, y: 10 },
    { x: 10, y: TABLE_HEIGHT - 10 }, { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 6 }, { x: TABLE_WIDTH - 10, y: TABLE_HEIGHT - 10 }
  ];

  // Aiming logic
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || winner || turn === 'ai') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (TABLE_WIDTH / rect.width);
    const my = (e.clientY - rect.top) * (TABLE_HEIGHT / rect.height);

    const cueBall = ballsRef.current[0];
    if (cueBall && !cueBall.isPotted) {
      const dx = mx - cueBall.x;
      const dy = my - cueBall.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Tap on cue ball or drag cue bar to aim
      if (dist < 40) {
        isChargingPowerRef.current = true;
        triggerVibration('tick');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (TABLE_WIDTH / rect.width);
    const my = (e.clientY - rect.top) * (TABLE_HEIGHT / rect.height);
    mousePosRef.current = { x: mx, y: my };

    const cueBall = ballsRef.current[0];
    if (cueBall) {
      aimAngleRef.current = Math.atan2(my - cueBall.y, mx - cueBall.x);
      
      if (isChargingPowerRef.current) {
        const dist = Math.sqrt(Math.pow(mx - cueBall.x, 2) + Math.pow(my - cueBall.y, 2));
        strikePowerRef.current = Math.min(100, Math.max(10, dist * 0.7));
      }
    }
  };

  const handleMouseUp = () => {
    if (isChargingPowerRef.current) {
      isChargingPowerRef.current = false;
      shootCueBall(strikePowerRef.current * 0.14);
      strikePowerRef.current = 0;
    }
  };

  const shootCueBall = (power: number) => {
    const cueBall = ballsRef.current[0];
    if (cueBall && !cueBall.isPotted) {
      playSound('strike');
      triggerVibration('medium');
      // Strike ball opposite to aim direction
      cueBall.vx = -Math.cos(aimAngleRef.current) * power;
      cueBall.vy = -Math.sin(aimAngleRef.current) * power;
      addLog(`${turn === 'player' ? 'YOU' : 'AI'} struck the cue ball!`);
    }
  };

  // AI Aiming bot logic
  const triggerAiTurn = () => {
    const cueBall = ballsRef.current[0];
    const availableBalls = ballsRef.current.filter(b => b.id > 0 && !b.isPotted);

    if (cueBall && !cueBall.isPotted && availableBalls.length > 0) {
      addLog('Cobra Bot is aiming...');
      setTimeout(() => {
        // Choose target ball
        const target = availableBalls[Math.floor(Math.random() * availableBalls.length)];
        const dx = target.x - cueBall.x;
        const dy = target.y - cueBall.y;
        aimAngleRef.current = Math.atan2(dy, dx) + Math.PI; // Strike in direction of target
        const botPower = 5 + Math.random() * 6;

        shootCueBall(botPower);
      }, 1500);
    }
  };

  // Main Canvas updates & Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updatePhysics = () => {
      const balls = ballsRef.current;
      let someBallsMoving = false;

      // 1. Move and check pocket sinks
      balls.forEach(b => {
        if (b.isPotted) return;

        b.x += b.vx;
        b.y += b.vy;

        // Apply friction
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        if (Math.abs(b.vx) < 0.05) b.vx = 0;
        if (Math.abs(b.vy) < 0.05) b.vy = 0;

        if (b.vx !== 0 || b.vy !== 0) {
          someBallsMoving = true;
        }

        // Pocket check
        POCKETS.forEach(pocket => {
          const dx = b.x - pocket.x;
          const dy = b.y - pocket.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BALL_RADIUS * 1.85) {
            b.isPotted = true;
            b.vx = 0;
            b.vy = 0;
            handleBallPot(b);
          }
        });

        // Cushion bounce
        const cushionMargin = 16;
        if (b.x < cushionMargin + b.radius) {
          b.x = cushionMargin + b.radius;
          b.vx = -b.vx * 0.85;
          playSound('cushion');
        } else if (b.x > TABLE_WIDTH - cushionMargin - b.radius) {
          b.x = TABLE_WIDTH - cushionMargin - b.radius;
          b.vx = -b.vx * 0.85;
          playSound('cushion');
        }

        if (b.y < cushionMargin + b.radius) {
          b.y = cushionMargin + b.radius;
          b.vy = -b.vy * 0.85;
          playSound('cushion');
        } else if (b.y > TABLE_HEIGHT - cushionMargin - b.radius) {
          b.y = TABLE_HEIGHT - cushionMargin - b.radius;
          b.vy = -b.vy * 0.85;
          playSound('cushion');
        }
      });

      // 2. Handle Ball-on-Ball Elastic Collisions
      for (let i = 0; i < balls.length; i++) {
        const b1 = balls[i];
        if (b1.isPotted) continue;

        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          if (b2.isPotted) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < b1.radius + b2.radius) {
            // Collision resolution
            const overlap = b1.radius + b2.radius - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Move balls away to prevent stickiness
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            // Elastic momentum physics exchange
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = nx * kx + ny * ky;

            if (p > 0) {
              b1.vx -= nx * p;
              b1.vy -= ny * p;
              b2.vx += nx * p;
              b2.vy += ny * p;

              playSound('collision');
              if (Math.abs(p) > 2.0) {
                triggerVibration('light');
              }
            }
          }
        }
      }

      // Check if turn needs adjustment when all balls stop
      if (!someBallsMoving && isPlaying && !winner) {
        // Cue scratch replacement
        const cueBall = balls[0];
        if (cueBall && cueBall.isPotted) {
          cueBall.x = TABLE_WIDTH * 0.25;
          cueBall.y = TABLE_HEIGHT * 0.5;
          cueBall.vx = 0;
          cueBall.vy = 0;
          cueBall.isPotted = false;
          setIsFoul(true);
          addLog('Cue ball scratch! Opponent takes ball-in-hand!');
          triggerVibration('medium');
        }
      }
    };

    const handleBallPot = (potted: Ball) => {
      playSound('pocket');
      triggerVibration('medium');

      if (potted.type === 'cue') {
        addLog('Cue ball pocketed! Foul!');
      } else if (potted.type === 'black') {
        // Standard 8-ball win/lose checking
        const countRemaining = ballsRef.current.filter(b => b.id > 0 && b.type !== 'black' && !b.isPotted);
        if (countRemaining.length === 0) {
          setWinner(turn === 'player' ? 'YOU' : 'AI');
          addLog(`8-ball potted! ${turn === 'player' ? 'YOU' : 'AI'} wins the match!`);
        } else {
          setWinner(turn === 'player' ? 'AI' : 'YOU');
          addLog(`8-ball potted prematurely! Opposite player wins!`);
        }
      } else {
        setScore(prev => prev + 100);
        addLog(`Potted ball #${potted.number} (${potted.type.toUpperCase()})`);
      }
    };

    const drawTable = () => {
      ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // Outer wood border
      ctx.fillStyle = '#1e3a1e';
      ctx.strokeStyle = '#4a2511';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.roundRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT, 16);
      ctx.fill();
      ctx.stroke();

      // Inner pool cloth
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.rect(14, 14, TABLE_WIDTH - 28, TABLE_HEIGHT - 28);
      ctx.fill();

      // Pockets rendering
      ctx.fillStyle = '#000000';
      POCKETS.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Baulk Line and Spot
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(TABLE_WIDTH * 0.25, 14);
      ctx.lineTo(TABLE_WIDTH * 0.25, TABLE_HEIGHT - 14);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(TABLE_WIDTH * 0.75, TABLE_HEIGHT * 0.5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Render balls
      const balls = ballsRef.current;
      balls.forEach(b => {
        if (b.isPotted) return;

        ctx.save();
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';

        // Draw Ball Body
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Overlay stripes if applicable
        if (b.type === 'stripe') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, Math.PI * 0.25, Math.PI * 0.75);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, Math.PI * 1.25, Math.PI * 1.75);
          ctx.fill();
        }

        // Draw inner white center circle and number
        if (b.id !== 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.font = `bold ${b.radius * 0.6}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.number.toString(), b.x, b.y);
        }

        // Gloss highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Aim Guidance lines
      const cueBall = balls[0];
      const someBallsMoving = balls.some(b => Math.abs(b.vx) > 0.08 || Math.abs(b.vy) > 0.08);

      if (cueBall && !cueBall.isPotted && !someBallsMoving && isAimingRef.current && turn === 'player' && !winner) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        const dx = -Math.cos(aimAngleRef.current);
        const dy = -Math.sin(aimAngleRef.current);

        // Draw target pointer guide
        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(cueBall.x + dx * 200, cueBall.y + dy * 200);
        ctx.stroke();

        ctx.restore();

        // Visual Aim Cue Stick
        ctx.save();
        ctx.translate(cueBall.x, cueBall.y);
        ctx.rotate(aimAngleRef.current);

        const stickOffset = 22 + (isChargingPowerRef.current ? strikePowerRef.current * 0.3 : 0);
        ctx.fillStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.roundRect(stickOffset, -2, 130, 4, 2);
        ctx.fill();

        // Tip
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.rect(stickOffset, -2, 6, 4);
        ctx.fill();

        ctx.restore();
      }
    };

    const runLoop = () => {
      updatePhysics();
      drawTable();
      animId = requestAnimationFrame(runLoop);
    };

    runLoop();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, turn, winner, soundOn]);

  // Track isAiming state based on cursor over table
  useEffect(() => {
    isAimingRef.current = isChargingPowerRef.current || true;
  }, [strikePowerRef.current]);

  // Turn management loops
  useEffect(() => {
    if (!isPlaying || winner) return;
    if (turn === 'ai') {
      triggerAiTurn();
    }
  }, [turn, isPlaying, winner]);

  // Toggle Turn test utility
  const switchTurn = () => {
    playSound('click');
    setTurn(t => t === 'player' ? 'ai' : 'player');
  };

  return (
    <div className={`absolute inset-0 flex flex-col z-20 overflow-hidden ${isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-100 text-slate-800'}`}>
      {/* HEADER ROW */}
      <div className={`h-14 border-b flex items-center justify-between px-4 shrink-0 backdrop-blur-md z-10 ${isDark ? 'bg-slate-900/60 border-slate-800/60' : 'bg-white/80 border-slate-200/50'}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              playSound('click');
              onBack();
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200/60 hover:bg-slate-200 text-slate-700'}`}
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest">8-Ball Pool Pro</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              playSound('click');
              setSoundOn(s => !s);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200/60 hover:bg-slate-200 text-slate-700'}`}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-between p-4 space-y-4">
        <AnimatePresence mode="wait">
          {!isPlaying ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm p-6 rounded-3xl flex flex-col text-center shadow-lg border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-md text-white">
                🎱
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide">8-Ball Pool</h3>

              {/* Mode Selection */}
              <div className="space-y-2 text-left mb-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Game Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      playSound('click');
                      setVsAi(true);
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase transition-all border flex flex-col items-center justify-center space-y-1 ${
                      vsAi
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Cpu size={14} />
                    <span>vs Cobra Bot</span>
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setVsAi(false);
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase transition-all border flex flex-col items-center justify-center space-y-1 ${
                      !vsAi
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <User size={14} />
                    <span>Free Practice</span>
                  </button>
                </div>
              </div>

              <button
                onClick={startNewGame}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>Rack the Table</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-5xl flex flex-col md:flex-row items-center md:items-start justify-center gap-6"
            >
              {/* LEFT COLUMN: THE POOL TABLE */}
              <div className="flex-1 max-w-[760px] w-full flex flex-col items-center">
                {/* PHYSICS CANVAS */}
                <div className="w-full overflow-hidden select-none rounded-[28px] border border-slate-800 shadow-2xl p-2 bg-[#090d16]">
                  <canvas
                    ref={canvasRef}
                    width={TABLE_WIDTH}
                    height={TABLE_HEIGHT}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="mx-auto block cursor-crosshair max-w-full"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: CONTROLS & STATS */}
              <div className="w-full md:w-[340px] shrink-0 flex flex-col space-y-4">
                {/* INTERACTIVE HUD */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${turn === 'player' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
                    <div className="text-left">
                      <span className="text-[9px] font-black text-slate-400 block uppercase leading-tight">CUE CONTROL</span>
                      <span className="text-xs font-black tracking-tight">{turn === 'player' ? 'YOUR SHOT' : 'COBRA BOT SHOT'}</span>
                    </div>
                  </div>

                  {/* Score panel */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-[8px] font-black text-slate-400 block uppercase leading-tight">SCORE</span>
                      <span className="text-xs font-mono font-black text-indigo-400">{score} XP</span>
                    </div>
                    {vsAi && (
                      <button
                        onClick={switchTurn}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                        }`}
                      >
                        Swap
                      </button>
                    )}
                  </div>
                </div>

                {/* AIMING & STRIKE POWER SLIDER */}
                {turn === 'player' && (
                  <div className={`p-4 rounded-2xl border flex flex-col space-y-2 text-left ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Zap size={13} className="text-amber-400 animate-pulse" />
                        <span>Strike Power Multiplier</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400">{Math.round(strikePowerRef.current)}%</span>
                    </div>
                    <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500 transition-all"
                        style={{ width: `${strikePowerRef.current}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* LOGS PANEL */}
                <div className={`p-3 rounded-2xl border text-left h-24 overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Game Engine Feed</span>
                  <div className="flex flex-col space-y-0.5 font-mono text-[9px]">
                    {logs.map((log, i) => (
                      <div key={i} className={log.includes('YOU struck') || log.includes('wins') ? 'text-amber-400 font-bold' : log.includes('Foul') ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {/* RE-RACK TABLE CONTROL */}
                <button
                  onClick={() => {
                    playSound('click');
                    setIsPlaying(false);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1 border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <RotateCcw size={13} />
                  <span>Restart Session</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MATCH WINNER MODAL */}
      <AnimatePresence>
        {winner && (
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
              <h2 className="text-xl font-black uppercase text-amber-500">Match Decided!</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                The 8-Ball was potted cleanly in the pocket!
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Result</span>
                <span className="text-base font-black text-amber-400 uppercase tracking-wide">
                  {winner === 'YOU' ? 'YOU CLAIMED GOLD!' : 'AI BOT WON'}
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={startNewGame}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Rack Again
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setIsPlaying(false);
                  }}
                  className="px-5 bg-white/10 hover:bg-white/15 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
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
