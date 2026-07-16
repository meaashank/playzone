/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Users,
  Cpu,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Award
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

interface EightBallPoolProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  type: 'cue' | 'solid' | 'stripe' | 'black';
  number: number;
  active: boolean;
}

interface Pocket {
  x: number;
  y: number;
  r: number;
}

export const EightBallPoolGame: React.FC<EightBallPoolProps> = ({
  onBack,
  theme = 'dark',
  soundEnabled = true,
}) => {
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('ai');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [scratchMessage, setScratchMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Table parameters
  const TABLE_WIDTH = 640;
  const TABLE_HEIGHT = 320;
  const BALL_RADIUS = 10;
  const FRICTION = 0.985;

  // Game state refs to avoid closure stale state in animation loop
  const ballsRef = useRef<Ball[]>([]);
  const aimingAngleRef = useRef<number>(0); // Angle in radians
  const shootPowerRef = useRef<number>(50); // Power 0 - 100
  const isDraggingCueRef = useRef<boolean>(false);
  const isBallsMovingRef = useRef<boolean>(false);

  // Sound generator helper
  const playSound = (type: 'hit' | 'pocket' | 'scratch' | 'cushion' | 'win' | 'click') => {
    if (isMuted) return;
    try {
      if (type === 'hit') {
        SoundEngine.play('tictactoe_x');
      } else if (type === 'pocket') {
        SoundEngine.play('coin');
      } else if (type === 'scratch') {
        SoundEngine.play('error');
      } else if (type === 'cushion') {
        SoundEngine.play('dice_land');
      } else if (type === 'win') {
        SoundEngine.play('win');
      } else {
        SoundEngine.play('click');
      }
    } catch (e) {
      console.warn('Audio play failure:', e);
    }
  };

  const pockets: Pocket[] = [
    { x: 15, y: 15, r: 18 }, // Top-Left
    { x: TABLE_WIDTH / 2, y: 12, r: 16 }, // Top-Middle
    { x: TABLE_WIDTH - 15, y: 15, r: 18 }, // Top-Right
    { x: 15, y: TABLE_HEIGHT - 15, r: 18 }, // Bottom-Left
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 12, r: 16 }, // Bottom-Middle
    { x: TABLE_WIDTH - 15, y: TABLE_HEIGHT - 15, r: 18 }, // Bottom-Right
  ];

  const initializeBalls = () => {
    const balls: Ball[] = [];
    
    // 1. Cue Ball
    balls.push({
      id: 0,
      x: TABLE_WIDTH * 0.25,
      y: TABLE_HEIGHT * 0.5,
      vx: 0,
      vy: 0,
      color: '#FFFFFF',
      type: 'cue',
      number: 0,
      active: true,
    });

    // 2. Target balls in a pyramid on the right
    const startX = TABLE_WIDTH * 0.7;
    const startY = TABLE_HEIGHT * 0.5;
    const colors = [
      '#F1C40F', // 1 Yellow (Solid)
      '#2980B9', // 10 Blue (Stripe)
      '#E74C3C', // 3 Red (Solid)
      '#111111', // 8 Black (8 Ball)
      '#E67E22', // 11 Orange (Stripe)
      '#27AE60', // 6 Green (Solid)
      '#8E44AD', // 12 Purple (Stripe)
    ];
    const types: ('solid' | 'stripe' | 'black')[] = [
      'solid',
      'stripe',
      'solid',
      'black',
      'stripe',
      'solid',
      'stripe',
    ];
    const numbers = [1, 10, 3, 8, 11, 6, 12];

    let index = 0;
    // Layer 1
    balls.push({
      id: 1,
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      color: colors[0],
      type: types[0],
      number: numbers[0],
      active: true,
    });

    // Layer 2
    balls.push({
      id: 2,
      x: startX + BALL_RADIUS * 1.8,
      y: startY - BALL_RADIUS * 1.1,
      vx: 0,
      vy: 0,
      color: colors[1],
      type: types[1],
      number: numbers[1],
      active: true,
    });
    balls.push({
      id: 3,
      x: startX + BALL_RADIUS * 1.8,
      y: startY + BALL_RADIUS * 1.1,
      vx: 0,
      vy: 0,
      color: colors[2],
      type: types[2],
      number: numbers[2],
      active: true,
    });

    // Layer 3 (Contains 8 Ball in center)
    balls.push({
      id: 4,
      x: startX + BALL_RADIUS * 3.6,
      y: startY - BALL_RADIUS * 2.2,
      vx: 0,
      vy: 0,
      color: colors[3], // Black
      type: types[3],
      number: numbers[3],
      active: true,
    });
    balls.push({
      id: 5,
      x: startX + BALL_RADIUS * 3.6,
      y: startY,
      vx: 0,
      vy: 0,
      color: colors[4],
      type: types[4],
      number: numbers[4],
      active: true,
    });
    balls.push({
      id: 6,
      x: startX + BALL_RADIUS * 3.6,
      y: startY + BALL_RADIUS * 2.2,
      vx: 0,
      vy: 0,
      color: colors[5],
      type: types[5],
      number: numbers[5],
      active: true,
    });

    ballsRef.current = balls;
    isBallsMovingRef.current = false;
  };

  const handleStartGame = (mode: 'pvp' | 'ai') => {
    playSound('click');
    setGameMode(mode);
    setGameState('playing');
    setCurrentPlayer(1);
    setScore({ p1: 0, p2: 0 });
    setWinner(null);
    setScratchMessage(null);
    initializeBalls();
  };

  const handleShoot = () => {
    if (isBallsMovingRef.current) return;

    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    if (!cueBall || !cueBall.active) return;

    const power = shootPowerRef.current;
    const angle = aimingAngleRef.current;

    // Convert aim angle and power into force velocities
    const impulse = (power / 100) * 15; // Max speed 15px/frame
    cueBall.vx = Math.cos(angle) * impulse;
    cueBall.vy = Math.sin(angle) * impulse;

    isBallsMovingRef.current = true;
    triggerVibration('medium');
    playSound('hit');
  };

  const executeAiTurn = () => {
    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    const targetBalls = ballsRef.current.filter(b => b.active && b.type !== 'cue');
    if (!cueBall || targetBalls.length === 0) return;

    // Find the closest active ball
    let closestBall = targetBalls[0];
    let minDist = Infinity;
    for (const b of targetBalls) {
      const dist = Math.hypot(b.x - cueBall.x, b.y - cueBall.y);
      if (dist < minDist) {
        minDist = dist;
        closestBall = b;
      }
    }

    // Aim toward closest ball with some small random error based on AI inaccuracy
    const angleToTarget = Math.atan2(closestBall.y - cueBall.y, closestBall.x - cueBall.x);
    const aiInaccuracy = (Math.random() - 0.5) * 0.15; // slight spread
    const angle = angleToTarget + aiInaccuracy;

    aimingAngleRef.current = angle;
    shootPowerRef.current = 40 + Math.random() * 40; // Random shoot power 40-80

    // Delay visual aiming representation a bit before shooting
    setTimeout(() => {
      handleShoot();
    }, 1500);
  };

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let scratchOccurred = false;
    let targetBallPocketed = false;
    let eightBallPocketed = false;

    const updatePhysics = () => {
      const balls = ballsRef.current;
      let moving = false;

      // 1. Position update and Table bounds collisions
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (!b.active) continue;

        b.x += b.vx;
        b.y += b.vy;

        // Apply friction
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        // Round tiny speeds down to zero
        if (Math.abs(b.vx) < 0.05) b.vx = 0;
        if (Math.abs(b.vy) < 0.05) b.vy = 0;

        if (b.vx !== 0 || b.vy !== 0) {
          moving = true;
        }

        // Table boundaries collision
        const leftBound = 22 + BALL_RADIUS;
        const rightBound = TABLE_WIDTH - 22 - BALL_RADIUS;
        const topBound = 22 + BALL_RADIUS;
        const bottomBound = TABLE_HEIGHT - 22 - BALL_RADIUS;

        if (b.x < leftBound) {
          b.x = leftBound;
          b.vx = -b.vx * 0.9;
          if (Math.abs(b.vx) > 0.5) playSound('cushion');
        } else if (b.x > rightBound) {
          b.x = rightBound;
          b.vx = -b.vx * 0.9;
          if (Math.abs(b.vx) > 0.5) playSound('cushion');
        }

        if (b.y < topBound) {
          b.y = topBound;
          b.vy = -b.vy * 0.9;
          if (Math.abs(b.vy) > 0.5) playSound('cushion');
        } else if (b.y > bottomBound) {
          b.y = bottomBound;
          b.vy = -b.vy * 0.9;
          if (Math.abs(b.vy) > 0.5) playSound('cushion');
        }

        // 2. Check Pocketing
        for (const p of pockets) {
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < p.r) {
            // Ball pocketed!
            b.active = false;
            b.vx = 0;
            b.vy = 0;
            triggerVibration('light');

            if (b.type === 'cue') {
              scratchOccurred = true;
              playSound('scratch');
            } else if (b.type === 'black') {
              eightBallPocketed = true;
              playSound('win');
            } else {
              targetBallPocketed = true;
              playSound('pocket');
              // Increment score
              if (currentPlayer === 1) {
                setScore(s => ({ ...s, p1: s.p1 + 1 }));
              } else {
                setScore(s => ({ ...s, p2: s.p2 + 1 }));
              }
            }
          }
        }
      }

      // 3. Elastic Ball-to-Ball collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];

          if (!b1.active || !b2.active) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < BALL_RADIUS * 2) {
            // Overlap resolution
            const overlap = BALL_RADIUS * 2 - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            // Elastic collision formulas
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = nx * kx + ny * ky;

            if (p > 0) {
              b1.vx -= nx * p;
              b1.vy -= ny * p;
              b2.vx += nx * p;
              b2.vy += ny * p;

              if (Math.abs(p) > 0.2) {
                playSound('hit');
              }
            }
          }
        }
      }

      // 4. Handle state transition when balls stop moving
      if (isBallsMovingRef.current && !moving) {
        isBallsMovingRef.current = false;

        // Resolve Turn Results
        if (eightBallPocketed) {
          // Pocketed 8 ball
          const activeSolids = balls.filter(b => b.active && (b.type === 'solid' || b.type === 'stripe'));
          if (activeSolids.length === 0) {
            // Proper win
            setWinner(currentPlayer === 1 ? 'Player 1' : gameMode === 'ai' ? 'Robot Master' : 'Player 2');
          } else {
            // Foul: 8-ball pocketed too early -> Opponent wins!
            setWinner(currentPlayer === 1 ? (gameMode === 'ai' ? 'Robot Master' : 'Player 2') : 'Player 1');
          }
          setGameState('gameover');
        } else if (scratchOccurred) {
          // Reset cue ball
          const cue = balls.find(b => b.type === 'cue');
          if (cue) {
            cue.active = true;
            cue.x = TABLE_WIDTH * 0.25;
            cue.y = TABLE_HEIGHT * 0.5;
            cue.vx = 0;
            cue.vy = 0;
          }
          setScratchMessage('Scratch Foul! Opponent turn.');
          setTimeout(() => setScratchMessage(null), 2000);
          
          // Force turn switch
          setCurrentPlayer(p => (p === 1 ? 2 : 1));
        } else if (!targetBallPocketed) {
          // If no target ball pocketed, switch turns
          setCurrentPlayer(p => (p === 1 ? 2 : 1));
        }
      }
    };

    const drawTable = () => {
      // Clear canvas
      ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // Wood cushion outer border
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

      // Inner green felt play area
      ctx.fillStyle = '#16A085';
      ctx.fillRect(20, 20, TABLE_WIDTH - 40, TABLE_HEIGHT - 40);

      // Headstring line (gray)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(TABLE_WIDTH * 0.25, 20);
      ctx.lineTo(TABLE_WIDTH * 0.25, TABLE_HEIGHT - 20);
      ctx.stroke();

      // Pockets
      for (const p of pockets) {
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r - 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Balls
      const balls = ballsRef.current;
      for (const b of balls) {
        if (!b.active) continue;

        // Ball Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(b.x + 2, b.y + 2, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Solid color circle
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Stripe design
        if (b.type === 'stripe') {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_RADIUS - 2, -Math.PI / 4, Math.PI / 4);
          ctx.lineTo(b.x, b.y);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_RADIUS - 2, Math.PI * 0.75, Math.PI * 1.25);
          ctx.lineTo(b.x, b.y);
          ctx.fill();
        }

        // Inner white circle for ball numbers
        if (b.type !== 'cue') {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_RADIUS * 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Draw Number text
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.number.toString(), b.x, b.y);
        } else {
          // Cue ball sheen shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(b.x - 3, b.y - 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Aiming Cue Stick & Guideline
      const cueBall = balls.find(b => b.type === 'cue');
      if (cueBall && cueBall.active && !isBallsMovingRef.current) {
        // Only allow shooting if it's the human's turn or PvP mode
        const isHumanTurn = gameMode === 'pvp' || currentPlayer === 1;

        if (isHumanTurn) {
          const angle = aimingAngleRef.current;
          const power = shootPowerRef.current;

          const dx = Math.cos(angle);
          const dy = Math.sin(angle);

          // 1. Dotted guideline
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cueBall.x, cueBall.y);
          ctx.lineTo(cueBall.x + dx * 180, cueBall.y + dy * 180);
          ctx.stroke();
          ctx.setLineDash([]);

          // 2. Aiming target dot
          ctx.fillStyle = '#F1C40F';
          ctx.beginPath();
          ctx.arc(cueBall.x + dx * 60, cueBall.y + dy * 60, 3, 0, Math.PI * 2);
          ctx.fill();

          // 3. Wood Cue stick (represented on the opposite side of aim)
          const stickDistance = 25 + (power * 0.35); // pulls back with power
          const cueLength = 160;

          const stickStartX = cueBall.x - dx * stickDistance;
          const stickStartY = cueBall.y - dy * stickDistance;
          const stickEndX = cueBall.x - dx * (stickDistance + cueLength);
          const stickEndY = cueBall.y - dy * (stickDistance + cueLength);

          // Thick wood end
          ctx.strokeStyle = '#8E44AD'; // Purple grip
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(stickStartX - dx * (cueLength * 0.7), stickStartY - dy * (cueLength * 0.7));
          ctx.lineTo(stickEndX, stickEndY);
          ctx.stroke();

          // Thin tip end
          ctx.strokeStyle = '#E67E22'; // Wood shaft
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(stickStartX, stickStartY);
          ctx.lineTo(stickStartX - dx * (cueLength * 0.7), stickStartY - dy * (cueLength * 0.7));
          ctx.stroke();

          // Ivory cue tip white dot
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(stickStartX, stickStartY);
          ctx.lineTo(stickStartX - dx * 3, stickStartY - dy * 3);
          ctx.stroke();
        }
      }
    };

    const loop = () => {
      updatePhysics();
      drawTable();
      animationFrameId.current = requestAnimationFrame(loop);
    };

    // Initialize/sync first frame
    drawTable();
    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, gameMode, currentPlayer]);

  // Handle automatic AI moves
  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'ai' && currentPlayer === 2 && !isBallsMovingRef.current) {
      executeAiTurn();
    }
  }, [gameState, gameMode, currentPlayer]);

  // Touch/Mouse controls for Aiming Angle
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isBallsMovingRef.current || gameState !== 'playing') return;

    // Block aiming during Robot's turn
    if (gameMode === 'ai' && currentPlayer === 2) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = TABLE_WIDTH / rect.width;
    const scaleY = TABLE_HEIGHT / rect.height;

    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    if (!cueBall) return;

    // Calculate angle towards touched position
    const angle = Math.atan2(clickY - cueBall.y, clickX - cueBall.x);
    aimingAngleRef.current = angle;
  };

  return (
    <div className={`flex flex-col h-full w-full select-none ${theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navigation Bar */}
      <header className={`p-4 flex items-center justify-between border-b ${theme === 'dark' ? 'bg-[#0F172A]/80 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button
          onClick={() => {
            playSound('click');
            onBack();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold font-sans flex items-center gap-1.5 uppercase tracking-widest text-[#6C5CE7]">
            <Zap size={13} className="text-[#F1C40F]" /> Billiards Pool 🎱
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">2D Physics Simulator</span>
        </div>

        <button
          onClick={() => {
            setIsMuted(!isMuted);
            playSound('click');
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          
          {/* Menu State */}
          {gameState === 'menu' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md text-center flex flex-col gap-6"
            >
              <div className="p-8 rounded-3xl border shadow-xl bg-gradient-to-b from-indigo-950/40 to-slate-900/40 border-indigo-500/10">
                <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 text-[#6C5CE7] rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  🎱
                </div>
                <h2 className="text-xl font-bold tracking-tight">8 Ball Retro Pool</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Test your precision, angles, and power control in our realistic, ad-free offline pool simulator.
                </p>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={() => handleStartGame('ai')}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <Cpu size={16} /> Play vs Robot AI
                  </button>
                  <button
                    onClick={() => handleStartGame('pvp')}
                    className="w-full h-12 bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/15 text-[#6C5CE7] rounded-2xl flex items-center justify-center gap-2 font-bold border border-[#6C5CE7]/30 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <Users size={16} /> Pass & Play (2 Players)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Playing State */}
          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-2xl flex flex-col gap-4"
            >
              {/* Scoreboard */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/45">
                <div className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentPlayer === 1 ? 'bg-indigo-600/10 border border-indigo-500/20 text-[#6C5CE7]' : 'opacity-60'}`}>
                  <span className="text-[10px] font-bold tracking-widest uppercase">Player 1</span>
                  <div className="text-lg font-mono font-bold">{score.p1} <span className="text-[10px] font-sans text-slate-400">Balls</span></div>
                </div>

                <div className="text-center font-mono font-bold text-xs bg-slate-800/50 px-3 py-1 rounded-full text-slate-300">
                  {gameMode === 'ai' && currentPlayer === 2 ? '🤖 ROBOT THINKING...' : `👉 ACTIVE: PLAYER ${currentPlayer}`}
                </div>

                <div className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentPlayer === 2 ? 'bg-[#E67E22]/10 border border-[#E67E22]/20 text-[#E67E22]' : 'opacity-60'}`}>
                  <span className="text-[10px] font-bold tracking-widest uppercase">{gameMode === 'ai' ? 'Robot AI' : 'Player 2'}</span>
                  <div className="text-lg font-mono font-bold">{score.p2} <span className="text-[10px] font-sans text-slate-400">Balls</span></div>
                </div>
              </div>

              {/* Pool Table Canvas Wrapper */}
              <div className="relative aspect-[2/1] w-full rounded-2xl border border-indigo-500/10 bg-[#0B0F19] overflow-hidden shadow-inner select-none">
                <canvas
                  ref={canvasRef}
                  width={TABLE_WIDTH}
                  height={TABLE_HEIGHT}
                  className="w-full h-full block cursor-crosshair touch-none"
                  onMouseDown={handleCanvasInteraction}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) handleCanvasInteraction(e);
                  }}
                  onTouchStart={handleCanvasInteraction}
                  onTouchMove={handleCanvasInteraction}
                />

                {/* Foul/Scratch message Overlay */}
                <AnimatePresence>
                  {scratchMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none"
                    >
                      <div className="bg-red-600/90 text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-lg uppercase tracking-widest flex items-center gap-2">
                        ⚠️ {scratchMessage}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Cue Controller Controls (Power & Aiming helper) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mt-2 p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/40">
                
                {/* Aiming Drag Indicator Hint */}
                <div className="text-left text-[10px] text-slate-400 font-medium">
                  💡 <span className="text-slate-200 font-bold">How to Aim:</span> Drag or tap anywhere inside the green pool table above to rotate your cue angle.
                </div>

                {/* Power Slider */}
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                    <span>SHOOT POWER</span>
                    <span className="text-[#6C5CE7]">{shootPowerRef.current}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    defaultValue="50"
                    onChange={(e) => {
                      shootPowerRef.current = parseInt(e.target.value);
                      triggerVibration('tick');
                    }}
                    disabled={isBallsMovingRef.current || (gameMode === 'ai' && currentPlayer === 2)}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#6C5CE7] bg-slate-800 disabled:opacity-40"
                  />
                </div>

                {/* Shoot Button */}
                <button
                  onClick={handleShoot}
                  disabled={isBallsMovingRef.current || (gameMode === 'ai' && currentPlayer === 2)}
                  className="h-11 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold tracking-widest text-xs uppercase shadow-lg shadow-red-600/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Play size={14} className="fill-current" /> SHOOT CUE ⚡
                </button>
              </div>
            </motion.div>
          )}

          {/* Game Over State */}
          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md text-center flex flex-col gap-6"
            >
              <div className="p-8 rounded-3xl border shadow-xl bg-gradient-to-b from-indigo-950/40 to-slate-900/40 border-indigo-500/10">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={32} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Game Finished!</h2>
                
                <div className="text-2xl font-bold text-[#F1C40F] mt-4 uppercase font-sans tracking-wide">
                  🎉 {winner} Wins!
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 p-4 rounded-2xl bg-slate-900/50">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Player 1</span>
                    <span className="text-xl font-mono font-bold mt-1">{score.p1}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-800" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Player 2</span>
                    <span className="text-xl font-mono font-bold mt-1">{score.p2}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={() => handleStartGame(gameMode)}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <RotateCcw size={16} /> Rematch
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setGameState('menu');
                    }}
                    className="w-full h-12 bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/15 text-[#6C5CE7] rounded-2xl flex items-center justify-center gap-2 font-bold border border-[#6C5CE7]/30 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    Main Menu
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};
