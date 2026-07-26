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
  RotateCw,
  Sliders
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

// Dynamic synthetic sound wrapper
class CarromAudio {
  static play(type: 'strike' | 'hit' | 'pocket' | 'border' | 'foul' | 'win', enabled: boolean) {
    if (!enabled) return;
    try {
      switch (type) {
        case 'strike':
          SoundEngine.play('tictactoe_o');
          break;
        case 'hit':
          SoundEngine.play('click');
          break;
        case 'pocket':
          SoundEngine.play('snake_eat');
          break;
        case 'border':
          SoundEngine.play('back');
          break;
        case 'foul':
          SoundEngine.play('snake_crash');
          break;
        case 'win':
          SoundEngine.play('win');
          break;
        default:
          SoundEngine.play('click');
          break;
      }
    } catch (e) {
      console.warn('Carrom audio failure:', e);
    }
  }
}

interface CarromDiscGameProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

interface CarromMan {
  id: number; // 0 for striker, 1 for queen, 2-10 for whites, 11-19 for blacks
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isPotted: boolean;
  type: 'striker' | 'queen' | 'white' | 'black';
}

const BOARD_SIZE = 500;
const STRIKER_RADIUS = 15;
const COIN_RADIUS = 11;
const FRICTION = 0.98;

export const CarromDiscGame: React.FC<CarromDiscGameProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true
}) => {
  const isDark = theme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [vsAi, setVsAi] = useState(true);
  const [soundOn, setSoundOn] = useState(soundEnabled);

  // Gameplay States
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [queenPottedBy, setQueenPottedBy] = useState<'player' | 'ai' | null>(null);
  const [isQueenCovered, setIsQueenCovered] = useState(false);
  const [strikerX, setStrikerX] = useState(BOARD_SIZE / 2); // Baseline position X
  const [isStrikerPlaced, setIsStrikerPlaced] = useState(true);
  const [logs, setLogs] = useState<string[]>(['Carrom board match ready.']);
  const [winner, setWinner] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coinsRef = useRef<CarromMan[]>([]);
  const isAimingRef = useRef(false);
  const aimStartRef = useRef({ x: 0, y: 0 });
  const aimCurrentRef = useRef({ x: 0, y: 0 });

  const playSound = (type: 'strike' | 'hit' | 'pocket' | 'border' | 'foul' | 'win') => {
    CarromAudio.play(type, soundOn);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 10)]);
  };

  const initBoardCoins = () => {
    const coins: CarromMan[] = [];

    // Striker (id: 0)
    coins.push({
      id: 0,
      x: BOARD_SIZE / 2,
      y: BOARD_SIZE - 45, // Placement on baseline
      vx: 0,
      vy: 0,
      radius: STRIKER_RADIUS,
      color: '#ffffff',
      isPotted: false,
      type: 'striker'
    });

    // Red Queen (id: 1)
    coins.push({
      id: 1,
      x: BOARD_SIZE / 2,
      y: BOARD_SIZE / 2,
      vx: 0,
      vy: 0,
      radius: COIN_RADIUS,
      color: '#ef4444', // Red
      isPotted: false,
      type: 'queen'
    });

    // Hexagonal ring around queen for whites and blacks
    const numRing = 6;
    const spacing = COIN_RADIUS * 2.1;
    for (let i = 0; i < numRing; i++) {
      const angle = (i * Math.PI * 2) / numRing;
      const rx = BOARD_SIZE / 2 + Math.cos(angle) * spacing;
      const ry = BOARD_SIZE / 2 + Math.sin(angle) * spacing;
      const isWhite = i % 2 === 0;

      coins.push({
        id: i + 2,
        x: rx,
        y: ry,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        color: isWhite ? '#fef08a' : '#1e293b', // Yellowish white vs slate black
        isPotted: false,
        type: isWhite ? 'white' : 'black'
      });
    }

    // Larger ring of 12 coins
    const numOuterRing = 12;
    const outerSpacing = COIN_RADIUS * 4.1;
    for (let i = 0; i < numOuterRing; i++) {
      const angle = (i * Math.PI * 2) / numOuterRing;
      const rx = BOARD_SIZE / 2 + Math.cos(angle) * outerSpacing;
      const ry = BOARD_SIZE / 2 + Math.sin(angle) * outerSpacing;
      const isWhite = i % 2 === 0;

      coins.push({
        id: i + 8,
        x: rx,
        y: ry,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        color: isWhite ? '#fef08a' : '#1e293b',
        isPotted: false,
        type: isWhite ? 'white' : 'black'
      });
    }

    coinsRef.current = coins;
    setStrikerX(BOARD_SIZE / 2);
    setIsStrikerPlaced(true);
  };

  const startNewGame = () => {
    playSound('hit');
    triggerVibration('medium');
    initBoardCoins();
    setScore(0);
    setTurn('player');
    setQueenPottedBy(null);
    setIsQueenCovered(false);
    setLogs(['Table is racked! Shoot when ready.']);
    setWinner(null);
    setIsPlaying(true);
  };

  // 4 Corner pockets
  const POCKETS = [
    { x: 26, y: 26 }, { x: BOARD_SIZE - 26, y: 26 },
    { x: 26, y: BOARD_SIZE - 26 }, { x: BOARD_SIZE - 26, y: BOARD_SIZE - 26 }
  ];

  // Drag and flick controls
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || winner || turn === 'ai' || !isStrikerPlaced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (BOARD_SIZE / rect.width);
    const my = (e.clientY - rect.top) * (BOARD_SIZE / rect.height);

    const striker = coinsRef.current[0];
    if (striker) {
      const dx = mx - striker.x;
      const dy = my - striker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < STRIKER_RADIUS * 1.5) {
        isAimingRef.current = true;
        aimStartRef.current = { x: striker.x, y: striker.y };
        aimCurrentRef.current = { x: mx, y: my };
        triggerVibration('tick');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAimingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (BOARD_SIZE / rect.width);
    const my = (e.clientY - rect.top) * (BOARD_SIZE / rect.height);

    aimCurrentRef.current = { x: mx, y: my };
  };

  const handleMouseUp = () => {
    if (isAimingRef.current) {
      isAimingRef.current = false;

      const dx = aimStartRef.current.x - aimCurrentRef.current.x;
      const dy = aimStartRef.current.y - aimCurrentRef.current.y;
      const power = Math.sqrt(dx * dx + dy * dy);

      if (power > 12) {
        shootStriker(dx * 0.12, dy * 0.12);
      }
    }
  };

  const shootStriker = (vx: number, vy: number) => {
    const striker = coinsRef.current[0];
    if (striker) {
      playSound('strike');
      triggerVibration('medium');
      striker.vx = vx;
      striker.vy = vy;
      setIsStrikerPlaced(false);
      addLog(`${turn === 'player' ? 'YOU' : 'AI'} flicked the striker!`);
    }
  };

  // AI striking loop
  const triggerAiTurn = () => {
    const targetCoins = coinsRef.current.filter(c => c.id > 0 && !c.isPotted);
    const striker = coinsRef.current[0];

    if (striker && targetCoins.length > 0) {
      addLog('Cobra Bot is planning baseline position...');
      setTimeout(() => {
        // AI positions striker on top baseline (Y: 45)
        const botX = BOARD_SIZE * 0.3 + Math.random() * (BOARD_SIZE * 0.4);
        striker.x = botX;
        striker.y = 45;
        striker.vx = 0;
        striker.vy = 0;
        striker.isPotted = false;

        setTimeout(() => {
          // AI aims at random coin
          const target = targetCoins[Math.floor(Math.random() * targetCoins.length)];
          const dx = target.x - striker.x;
          const dy = target.y - striker.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Add minor error offset to vx, vy depending on bot difficulty
          const speed = 7 + Math.random() * 5;
          const botVx = (dx / dist) * speed + (Math.random() - 0.5) * 1.5;
          const botVy = (dy / dist) * speed + (Math.random() - 0.5) * 1.5;

          shootStriker(botVx, botVy);
        }, 1200);
      }, 1000);
    }
  };

  // Main Canvas updates & Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateCarromPhysics = () => {
      const coins = coinsRef.current;
      let someCoinsMoving = false;

      // 1. Position update, friction, and cushion bounds
      coins.forEach(c => {
        if (c.isPotted) return;

        c.x += c.vx;
        c.y += c.vy;

        c.vx *= FRICTION;
        c.vy *= FRICTION;

        if (Math.abs(c.vx) < 0.05) c.vx = 0;
        if (Math.abs(c.vy) < 0.05) c.vy = 0;

        if (c.vx !== 0 || c.vy !== 0) {
          someCoinsMoving = true;
        }

        // Pocket checking
        POCKETS.forEach(pocket => {
          const dx = c.x - pocket.x;
          const dy = c.y - pocket.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 18) {
            c.isPotted = true;
            c.vx = 0;
            c.vy = 0;
            handlePottedCoin(c);
          }
        });

        // Cushion Bounces
        const cushion = 22; // border cushion thickness
        if (c.x < cushion + c.radius) {
          c.x = cushion + c.radius;
          c.vx = -c.vx * 0.85;
          playSound('border');
        } else if (c.x > BOARD_SIZE - cushion - c.radius) {
          c.x = BOARD_SIZE - cushion - c.radius;
          c.vx = -c.vx * 0.85;
          playSound('border');
        }

        if (c.y < cushion + c.radius) {
          c.y = cushion + c.radius;
          c.vy = -c.vy * 0.85;
          playSound('border');
        } else if (c.y > BOARD_SIZE - cushion - c.radius) {
          c.y = BOARD_SIZE - cushion - c.radius;
          c.vy = -c.vy * 0.85;
          playSound('border');
        }
      });

      // 2. Elastic circle collisions
      for (let i = 0; i < coins.length; i++) {
        const c1 = coins[i];
        if (c1.isPotted) continue;

        for (let j = i + 1; j < coins.length; j++) {
          const c2 = coins[j];
          if (c2.isPotted) continue;

          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < c1.radius + c2.radius) {
            const overlap = c1.radius + c2.radius - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Resolve overlapping sticky situations
            c1.x -= nx * overlap * 0.5;
            c1.y -= ny * overlap * 0.5;
            c2.x += nx * overlap * 0.5;
            c2.y += ny * overlap * 0.5;

            // Elastic bounce impulse
            const kx = c1.vx - c2.vx;
            const ky = c1.vy - c2.vy;
            const impulse = nx * kx + ny * ky;

            if (impulse > 0) {
              c1.vx -= nx * impulse;
              c1.vy -= ny * impulse;
              c2.vx += nx * impulse;
              c2.vy += ny * impulse;

              playSound('hit');
              if (Math.abs(impulse) > 2.0) {
                triggerVibration('light');
              }
            }
          }
        }
      }

      // 3. Reset striker on top baseline or bottom baseline when movement halts
      if (!someCoinsMoving && isPlaying && !winner && !isStrikerPlaced) {
        const striker = coins[0];
        if (striker) {
          // Send striker back to turn base
          striker.vx = 0;
          striker.vy = 0;
          striker.isPotted = false;

          if (turn === 'player') {
            striker.x = strikerX;
            striker.y = BOARD_SIZE - 45;
          } else {
            striker.x = BOARD_SIZE / 2;
            striker.y = 45;
          }

          setIsStrikerPlaced(true);
          // Pass Turn in Vs AI
          if (vsAi) {
            setTurn(t => t === 'player' ? 'ai' : 'player');
          }
        }
      }
    };

    const handlePottedCoin = (c: CarromMan) => {
      playSound('pocket');
      triggerVibration('medium');

      if (c.type === 'striker') {
        addLog('Striker pocketed! Foul/scratch penalty!');
        setScore(prev => Math.max(0, prev - 50));
      } else if (c.type === 'queen') {
        setQueenPottedBy(turn);
        setScore(prev => prev + 250);
        addLog(`Red QUEEN potted by ${turn === 'player' ? 'YOU' : 'AI'}! Cover it with your next shot!`);
      } else {
        setScore(prev => prev + 100);
        addLog(`Potted ${c.type.toUpperCase()} coin!`);

        // Check overall remaining coins to decide winner
        const remaining = coinsRef.current.filter(coin => coin.id > 0 && !coin.isPotted);
        if (remaining.length === 0) {
          setWinner('Match complete!');
          addLog('All coins cleared! Game Over.');
        }
      }
    };

    const drawBoard = () => {
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Wooden Frame
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(0, 0, BOARD_SIZE, BOARD_SIZE, 24);
      ctx.fill();

      // Board Surface
      ctx.fillStyle = '#fef08a'; // Warm yellowish wood cloth color
      ctx.beginPath();
      ctx.rect(12, 12, BOARD_SIZE - 24, BOARD_SIZE - 24);
      ctx.fill();

      // Inner borders / margins
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(22, 22, BOARD_SIZE - 44, BOARD_SIZE - 44);
      ctx.stroke();

      // Concentric circles in center
      const cx = BOARD_SIZE / 2;
      const cy = BOARD_SIZE / 2;

      ctx.strokeStyle = 'rgba(133, 77, 14, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(133, 77, 14, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Draw baselines
      const drawBaseline = (y: number) => {
        ctx.strokeStyle = 'rgba(133, 77, 14, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(BOARD_SIZE - 60, y);
        ctx.stroke();

        // Terminal circle hooks
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(60, y, 5, 0, Math.PI * 2);
        ctx.arc(BOARD_SIZE - 60, y, 5, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBaseline(45); // Top Baseline
      drawBaseline(BOARD_SIZE - 45); // Bottom Baseline

      // Draw pockets
      ctx.fillStyle = '#0f172a';
      POCKETS.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      });

      // Diagonal pointer arrows pointing to corners
      ctx.strokeStyle = 'rgba(133, 77, 14, 0.3)';
      ctx.lineWidth = 1;
      const arrowLen = 50;
      const corners = [[22, 22], [BOARD_SIZE - 22, 22], [22, BOARD_SIZE - 22], [BOARD_SIZE - 22, BOARD_SIZE - 22]];
      corners.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(c[0], c[1]);
        ctx.stroke();
      });

      // Render coins
      const coins = coinsRef.current;
      coins.forEach(c => {
        if (c.isPotted) return;

        ctx.save();
        ctx.shadowBlur = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';

        // Draw Coin
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();

        // Extra details on Queen & Striker
        if (c.type === 'queen') {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (c.type === 'striker') {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Standard inner ring for coin aesthetics
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      // Aim Slingshot Guidance
      if (isAimingRef.current && turn === 'player' && !winner) {
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;

        const striker = coins[0];
        const dx = aimStartRef.current.x - aimCurrentRef.current.x;
        const dy = aimStartRef.current.y - aimCurrentRef.current.y;

        // Draw tension line behind striker
        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(striker.x - dx, striker.y - dy);
        ctx.stroke();

        // Projectile direction dot guidelines
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(striker.x + dx * 3, striker.y + dy * 3);
        ctx.stroke();

        ctx.restore();
      }
    };

    const runLoop = () => {
      updateCarromPhysics();
      drawBoard();
      animId = requestAnimationFrame(runLoop);
    };

    runLoop();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, turn, winner, soundOn, strikerX, isStrikerPlaced]);

  // Handle position slider change
  const handleSliderChange = (val: number) => {
    setStrikerX(val);
    const striker = coinsRef.current[0];
    if (striker && isStrikerPlaced) {
      striker.x = val;
    }
  };

  useEffect(() => {
    if (!isPlaying || winner) return;
    if (turn === 'ai') {
      triggerAiTurn();
    }
  }, [turn, isPlaying, winner]);

  return (
    <div className={`absolute inset-0 flex flex-col z-20 overflow-hidden ${isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-100 text-slate-800'}`}>
      {/* HEADER SECTION */}
      <div className={`h-14 border-b flex items-center justify-between px-4 shrink-0 backdrop-blur-md z-10 ${isDark ? 'bg-slate-900/60 border-slate-800/60' : 'bg-white/80 border-slate-200/50'}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              playSound('hit');
              onBack();
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200/60 hover:bg-slate-200 text-slate-700'}`}
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest">Carrom Disc Master</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              playSound('hit');
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">
                🎯
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide">Carrom Disc</h3>

              {/* Bot selection */}
              <div className="space-y-2 text-left mb-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Opponent Config</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      playSound('hit');
                      setVsAi(true);
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase transition-all border flex flex-col items-center justify-center space-y-1 ${
                      vsAi
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Cpu size={14} />
                    <span>vs Cobra Bot</span>
                  </button>
                  <button
                    onClick={() => {
                      playSound('hit');
                      setVsAi(false);
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase transition-all border flex flex-col items-center justify-center space-y-1 ${
                      !vsAi
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <User size={14} />
                    <span>Solo Board</span>
                  </button>
                </div>
              </div>

              <button
                onClick={startNewGame}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>Rack the Discs</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-5xl flex flex-col md:flex-row items-center md:items-start justify-center gap-6"
            >
              {/* LEFT COLUMN: THE PLAYING BOARD */}
              <div className="flex-1 max-w-[520px] w-full flex flex-col items-center">
                {/* PHYS COLLISION CANVAS */}
                <div className="w-full aspect-square overflow-hidden select-none rounded-[28px] border border-slate-800 shadow-2xl p-1 bg-[#151c2c]">
                  <canvas
                    ref={canvasRef}
                    width={BOARD_SIZE}
                    height={BOARD_SIZE}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="mx-auto block cursor-crosshair max-w-full"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: STATS AND CONTROLS */}
              <div className="w-full md:w-[340px] shrink-0 flex flex-col space-y-4">
                {/* CURRENT PLAYER BADGE & GAMEPLAY CONTROLS */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${turn === 'player' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
                    <div className="text-left">
                      <span className="text-[9px] font-black text-slate-400 block uppercase leading-tight">ACTIVE STATUS</span>
                      <span className="text-xs font-black tracking-tight">{turn === 'player' ? 'YOUR SHOT' : 'COBRA BOT SHOT'}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-[8px] font-black text-slate-400 block uppercase leading-tight">XP SCORE</span>
                    <span className="text-xs font-mono font-black text-amber-500">{score}</span>
                  </div>
                </div>

                {/* BASELINE POSITION CONTROL SLIDER */}
                {turn === 'player' && isStrikerPlaced && (
                  <div className={`p-4 rounded-2xl border flex flex-col space-y-1.5 text-left ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Sliders size={13} className="text-amber-400" />
                        <span>Striker Position Slider</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold text-amber-400">{Math.round(strikerX)}px</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={BOARD_SIZE - 80}
                      value={strikerX}
                      onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                )}

                {/* ENGINE FEED LOGS */}
                <div className={`p-3 rounded-2xl border text-left h-24 overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Game Engine Feed</span>
                  <div className="flex flex-col space-y-0.5 font-mono text-[9px]">
                    {logs.map((log, i) => (
                      <div key={i} className={log.includes('flicked') || log.includes('QUEEN') ? 'text-amber-400 font-bold' : log.includes(' scratch') ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BACK TO LOBBY CONTROL */}
                <button
                  onClick={() => {
                    playSound('hit');
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
              <h2 className="text-xl font-black uppercase text-amber-500">Board Cleared!</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                All carrom coins have been pocketed successfully!
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grand Score</span>
                <span className="text-lg font-black text-amber-400 uppercase tracking-wide">
                  {score} Coins Collected
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={startNewGame}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Rack Again
                </button>
                <button
                  onClick={() => {
                    playSound('hit');
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
