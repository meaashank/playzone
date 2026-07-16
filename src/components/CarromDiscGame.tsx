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

interface CarromDiscProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

interface Piece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  type: 'white' | 'black' | 'queen' | 'striker';
  active: boolean;
}

interface Pocket {
  x: number;
  y: number;
  r: number;
}

export const CarromDiscGame: React.FC<CarromDiscProps> = ({
  onBack,
  theme = 'dark',
  soundEnabled = true,
}) => {
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('ai');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [strikerBaselineX, setStrikerBaselineX] = useState<number>(200); // Baseline range 50 - 350
  const [foulMessage, setFoulMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Board configuration (Square Board 400x400)
  const BOARD_SIZE = 400;
  const PIECE_RADIUS = 10;
  const STRIKER_RADIUS = 15;
  const FRICTION = 0.985;
  const BASELINE_Y = 340;

  // Game pieces ref
  const piecesRef = useRef<Piece[]>([]);
  const shootAngleRef = useRef<number>(-Math.PI / 2); // default aim straight up
  const shootPowerRef = useRef<number>(50); // Power 0 - 100
  const isPiecesMovingRef = useRef<boolean>(false);

  // Sound generator
  const playSound = (type: 'strike' | 'pocket' | 'foul' | 'bounce' | 'win' | 'click') => {
    if (isMuted) return;
    try {
      if (type === 'strike') {
        SoundEngine.play('tictactoe_o');
      } else if (type === 'pocket') {
        SoundEngine.play('coin');
      } else if (type === 'foul') {
        SoundEngine.play('error');
      } else if (type === 'bounce') {
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
    { x: 22, y: 22, r: 24 }, // Top Left
    { x: BOARD_SIZE - 22, y: 22, r: 24 }, // Top Right
    { x: 22, y: BOARD_SIZE - 22, r: 24 }, // Bottom Left
    { x: BOARD_SIZE - 22, y: BOARD_SIZE - 22, r: 24 }, // Bottom Right
  ];

  const initializeBoard = () => {
    const pieces: Piece[] = [];
    const centerX = BOARD_SIZE / 2;
    const centerY = BOARD_SIZE / 2;

    // 1. Red Queen piece in center
    pieces.push({
      id: 0,
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      r: PIECE_RADIUS,
      color: '#E74C3C', // Red
      type: 'queen',
      active: true,
    });

    // 2. White and Black carrom men in concentric arrangement
    // Let's arrange 4 White and 4 Black pieces around Queen
    const angleStep = Math.PI / 4;
    const ringRadius = PIECE_RADIUS * 2.3;

    for (let i = 0; i < 8; i++) {
      const angle = i * angleStep;
      const isWhite = i % 2 === 0;
      pieces.push({
        id: i + 1,
        x: centerX + Math.cos(angle) * ringRadius,
        y: centerY + Math.sin(angle) * ringRadius,
        vx: 0,
        vy: 0,
        r: PIECE_RADIUS,
        color: isWhite ? '#F1C40F' : '#2C3E50', // White/Gold vs Black/Navy
        type: isWhite ? 'white' : 'black',
        active: true,
      });
    }

    // 3. Striker
    pieces.push({
      id: 9,
      x: strikerBaselineX,
      y: BASELINE_Y,
      vx: 0,
      vy: 0,
      r: STRIKER_RADIUS,
      color: '#9B59B6', // Purple Striker
      type: 'striker',
      active: true,
    });

    piecesRef.current = pieces;
    isPiecesMovingRef.current = false;
  };

  // Sync striker horizontal position when baseline X changes
  useEffect(() => {
    const striker = piecesRef.current.find(p => p.type === 'striker');
    if (striker && !isPiecesMovingRef.current) {
      striker.x = strikerBaselineX;
      striker.y = BASELINE_Y;
    }
  }, [strikerBaselineX]);

  const handleStartGame = (mode: 'pvp' | 'ai') => {
    playSound('click');
    setGameMode(mode);
    setGameState('playing');
    setCurrentPlayer(1);
    setScore({ p1: 0, p2: 0 });
    setWinner(null);
    setFoulMessage(null);
    setStrikerBaselineX(BOARD_SIZE / 2);
    initializeBoard();
  };

  const handleShoot = () => {
    if (isPiecesMovingRef.current) return;

    const striker = piecesRef.current.find(p => p.type === 'striker');
    if (!striker || !striker.active) return;

    const power = shootPowerRef.current;
    const angle = shootAngleRef.current;

    const impulse = (power / 100) * 16; // Speed cap 16px/frame
    striker.vx = Math.cos(angle) * impulse;
    striker.vy = Math.sin(angle) * impulse;

    isPiecesMovingRef.current = true;
    triggerVibration('medium');
    playSound('strike');
  };

  const executeAiTurn = () => {
    const striker = piecesRef.current.find(p => p.type === 'striker');
    const targetPieces = piecesRef.current.filter(p => p.active && p.type !== 'striker');
    if (!striker || targetPieces.length === 0) return;

    // Robot positions its striker randomly along baseline
    const targetX = 100 + Math.random() * 200;
    setStrikerBaselineX(targetX);
    striker.x = targetX;
    striker.y = BASELINE_Y;

    // Target a random active carrom piece
    const randomTarget = targetPieces[Math.floor(Math.random() * targetPieces.length)];
    const angleToTarget = Math.atan2(randomTarget.y - striker.y, randomTarget.x - striker.x);
    
    // Some small AI aiming spread error
    const aiError = (Math.random() - 0.5) * 0.12;
    shootAngleRef.current = angleToTarget + aiError;
    shootPowerRef.current = 45 + Math.random() * 45;

    setTimeout(() => {
      handleShoot();
    }, 1500);
  };

  // Main board game loop
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

    let foulOccurred = false;
    let coinPocketed = false;

    const updatePhysics = () => {
      const pieces = piecesRef.current;
      let moving = false;

      // 1. Piece motion & Wall reflections
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;

        // Friction slow-down
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        if (Math.abs(p.vx) < 0.05) p.vx = 0;
        if (Math.abs(p.vy) < 0.05) p.vy = 0;

        if (p.vx !== 0 || p.vy !== 0) {
          moving = true;
        }

        // Cushion bounce bounds
        const cushionOffset = 15;
        const leftBound = cushionOffset + p.r;
        const rightBound = BOARD_SIZE - cushionOffset - p.r;
        const topBound = cushionOffset + p.r;
        const bottomBound = BOARD_SIZE - cushionOffset - p.r;

        if (p.x < leftBound) {
          p.x = leftBound;
          p.vx = -p.vx * 0.92;
          if (Math.abs(p.vx) > 0.4) playSound('bounce');
        } else if (p.x > rightBound) {
          p.x = rightBound;
          p.vx = -p.vx * 0.92;
          if (Math.abs(p.vx) > 0.4) playSound('bounce');
        }

        if (p.y < topBound) {
          p.y = topBound;
          p.vy = -p.vy * 0.92;
          if (Math.abs(p.vy) > 0.4) playSound('bounce');
        } else if (p.y > bottomBound) {
          p.y = bottomBound;
          p.vy = -p.vy * 0.92;
          if (Math.abs(p.vy) > 0.4) playSound('bounce');
        }

        // 2. Pocket Checking
        for (const pocket of pockets) {
          const dist = Math.hypot(p.x - pocket.x, p.y - pocket.y);
          if (dist < pocket.r) {
            // pocketed!
            p.active = false;
            p.vx = 0;
            p.vy = 0;
            triggerVibration('light');

            if (p.type === 'striker') {
              foulOccurred = true;
              playSound('foul');
            } else {
              coinPocketed = true;
              playSound('pocket');
              let points = 10;
              if (p.type === 'queen') points = 50; // Red Queen is worth 50 points!

              // Allocate score
              if (currentPlayer === 1) {
                setScore(s => ({ ...s, p1: s.p1 + points }));
              } else {
                setScore(s => ({ ...s, p2: s.p2 + points }));
              }
            }
          }
        }
      }

      // 3. Elastic piece collisions
      for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
          const p1 = pieces[i];
          const p2 = pieces[j];

          if (!p1.active || !p2.active) continue;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = p1.r + p2.r;

          if (dist < minDist) {
            // Overlap separation
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            p1.x -= nx * overlap * 0.5;
            p1.y -= ny * overlap * 0.5;
            p2.x += nx * overlap * 0.5;
            p2.y += ny * overlap * 0.5;

            // Elastic bounce momentum formulas
            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const pVal = nx * kx + ny * ky;

            if (pVal > 0) {
              p1.vx -= nx * pVal;
              p1.vy -= ny * pVal;
              p2.vx += nx * pVal;
              p2.vy += ny * pVal;

              if (Math.abs(pVal) > 0.25) {
                playSound('strike');
              }
            }
          }
        }
      }

      // 4. Handle state transition when pieces stop moving
      if (isPiecesMovingRef.current && !moving) {
        isPiecesMovingRef.current = false;

        // Reset striker back to baseline position
        const striker = pieces.find(p => p.type === 'striker');
        if (striker) {
          striker.active = true;
          striker.x = strikerBaselineX;
          striker.y = BASELINE_Y;
          striker.vx = 0;
          striker.vy = 0;
        }

        // Win state check (check if all carrom coins are pocketed)
        const activeCoins = pieces.filter(p => p.active && p.type !== 'striker');
        if (activeCoins.length === 0) {
          playSound('win');
          setWinner(score.p1 > score.p2 ? 'Player 1' : gameMode === 'ai' ? 'Robot Master' : 'Player 2');
          setGameState('gameover');
        } else if (foulOccurred) {
          setFoulMessage('Striker Pocketed Foul! Turn Switched.');
          setTimeout(() => setFoulMessage(null), 2000);
          setCurrentPlayer(p => (p === 1 ? 2 : 1));
        } else if (!coinPocketed) {
          // No coin pocketed, switch turns
          setCurrentPlayer(p => (p === 1 ? 2 : 1));
        }
      }
    };

    const drawBoard = () => {
      // Clear
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Wooden Frame outer borders
      ctx.fillStyle = '#6E473B'; // Wood brown
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Cream Carrom Felt playing field
      ctx.fillStyle = '#F5E6CA'; // Ivory felt cream
      ctx.fillRect(15, 15, BOARD_SIZE - 30, BOARD_SIZE - 30);

      // Outer thin board lines (cushion shadow)
      ctx.strokeStyle = '#D4B895';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(15, 15, BOARD_SIZE - 30, BOARD_SIZE - 30);

      // Center Concentric Circles
      const centerX = BOARD_SIZE / 2;
      const centerY = BOARD_SIZE / 2;

      ctx.strokeStyle = '#935116';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.stroke();

      // Red center circle (queen socket)
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Striker Baselines (Top, Bottom, Left, Right)
      ctx.strokeStyle = 'rgba(147, 81, 22, 0.4)';
      ctx.lineWidth = 2;
      
      // Bottom baseline
      ctx.beginPath();
      ctx.moveTo(50, BASELINE_Y);
      ctx.lineTo(BOARD_SIZE - 50, BASELINE_Y);
      ctx.stroke();

      // Red circle sockets on baseline ends
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(50, BASELINE_Y, 4, 0, Math.PI * 2);
      ctx.arc(BOARD_SIZE - 50, BASELINE_Y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Corner Arrow Lines (Pocket diagonal alignment)
      ctx.strokeStyle = 'rgba(147, 81, 22, 0.3)';
      ctx.lineWidth = 1;
      const arrowLen = 60;
      
      // Top Left arrow
      ctx.beginPath();
      ctx.moveTo(15, 15);
      ctx.lineTo(15 + arrowLen, 15 + arrowLen);
      ctx.stroke();

      // Top Right arrow
      ctx.beginPath();
      ctx.moveTo(BOARD_SIZE - 15, 15);
      ctx.lineTo(BOARD_SIZE - 15 - arrowLen, 15 + arrowLen);
      ctx.stroke();

      // Bottom Left arrow
      ctx.beginPath();
      ctx.moveTo(15, BOARD_SIZE - 15);
      ctx.lineTo(15 + arrowLen, BOARD_SIZE - 15 - arrowLen);
      ctx.stroke();

      // Bottom Right arrow
      ctx.beginPath();
      ctx.moveTo(BOARD_SIZE - 15, BOARD_SIZE - 15);
      ctx.lineTo(BOARD_SIZE - 15 - arrowLen, BOARD_SIZE - 15 - arrowLen);
      ctx.stroke();

      // 4 Corner Pockets
      for (const p of pockets) {
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r - 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw all coins/pieces
      const pieces = piecesRef.current;
      for (const p of pieces) {
        if (!p.active) continue;

        // Piece shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.arc(p.x + 1.5, p.y + 1.5, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Piece outer body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Striker specific decal style
        if (p.type === 'striker') {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r - 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard coin concentric ridge decal
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r - 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Aiming Guide line for Striker
      const striker = pieces.find(p => p.type === 'striker');
      if (striker && striker.active && !isPiecesMovingRef.current) {
        // Human player turns only
        const isHumanTurn = gameMode === 'pvp' || currentPlayer === 1;
        if (isHumanTurn) {
          const angle = shootAngleRef.current;
          const power = shootPowerRef.current;

          const dx = Math.cos(angle);
          const dy = Math.sin(angle);

          // Aim guideline
          ctx.strokeStyle = '#9B59B6'; // Purple guide
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(striker.x + dx * 130, striker.y + dy * 130);
          ctx.stroke();
          ctx.setLineDash([]);

          // Aiming arrow tip
          const arrowX = striker.x + dx * 60;
          const arrowY = striker.y + dy * 60;
          ctx.fillStyle = '#9B59B6';
          ctx.beginPath();
          ctx.arc(arrowX, arrowY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      updatePhysics();
      drawBoard();
      animationFrameId.current = requestAnimationFrame(loop);
    };

    drawBoard();
    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, gameMode, currentPlayer, strikerBaselineX]);

  // Handle automatic AI moves
  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'ai' && currentPlayer === 2 && !isPiecesMovingRef.current) {
      executeAiTurn();
    }
  }, [gameState, gameMode, currentPlayer]);

  // Drag interaction to adjust angle directly on board
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isPiecesMovingRef.current || gameState !== 'playing') return;
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

    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;

    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    const striker = piecesRef.current.find(p => p.type === 'striker');
    if (!striker) return;

    // Set angle relative to striker
    const angle = Math.atan2(clickY - striker.y, clickX - striker.x);
    shootAngleRef.current = angle;
  };

  return (
    <div className={`flex flex-col h-full w-full select-none ${theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navigation */}
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
          <span className="text-xs font-bold font-sans flex items-center gap-1.5 uppercase tracking-widest text-[#E67E22]">
            🎯 Carrom Disc Board
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Classic Tabletop Friction Carrom</span>
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

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          
          {/* Menu */}
          {gameState === 'menu' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md text-center flex flex-col gap-6"
            >
              <div className="p-8 rounded-3xl border shadow-xl bg-gradient-to-b from-indigo-950/40 to-slate-900/40 border-indigo-500/10">
                <div className="w-20 h-20 bg-orange-600/10 border border-orange-500/20 text-[#E67E22] rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  🎯
                </div>
                <h2 className="text-xl font-bold tracking-tight">Carrom Disc Club</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Conquer the ivory board. Move your striker along the bottom baseline, aim at the gold and red pieces, and pocket them to victory.
                </p>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={() => handleStartGame('ai')}
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <Cpu size={16} /> Play vs Robot AI
                  </button>
                  <button
                    onClick={() => handleStartGame('pvp')}
                    className="w-full h-12 bg-[#E67E22]/10 hover:bg-[#E67E22]/15 text-[#E67E22] rounded-2xl flex items-center justify-center gap-2 font-bold border border-[#E67E22]/30 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <Users size={16} /> Local Pass & Play (2 Player)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Board Playing */}
          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-lg flex flex-col gap-3"
            >
              {/* Scorecard */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/45">
                <div className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${currentPlayer === 1 ? 'bg-orange-600/15 border border-orange-500/30 text-orange-400' : 'opacity-60'}`}>
                  <span className="text-[9px] font-bold tracking-widest uppercase">Player 1</span>
                  <div className="text-md font-mono font-bold">{score.p1} <span className="text-[9px] font-sans text-slate-400">Pts</span></div>
                </div>

                <div className="text-center font-mono font-bold text-[10px] bg-slate-800/50 px-2.5 py-1 rounded-full text-slate-300">
                  {gameMode === 'ai' && currentPlayer === 2 ? '🤖 ROBOT SLIDING...' : `👉 ACTIVE: PLAYER ${currentPlayer}`}
                </div>

                <div className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${currentPlayer === 2 ? 'bg-purple-600/15 border border-purple-500/30 text-purple-400' : 'opacity-60'}`}>
                  <span className="text-[9px] font-bold tracking-widest uppercase">{gameMode === 'ai' ? 'Robot AI' : 'Player 2'}</span>
                  <div className="text-md font-mono font-bold">{score.p2} <span className="text-[9px] font-sans text-slate-400">Pts</span></div>
                </div>
              </div>

              {/* Square Board Canvas */}
              <div className="relative aspect-square w-full rounded-2xl border border-orange-500/10 bg-[#0B0F19] overflow-hidden shadow-2xl flex items-center justify-center select-none">
                <canvas
                  ref={canvasRef}
                  width={BOARD_SIZE}
                  height={BOARD_SIZE}
                  className="w-full max-w-[400px] aspect-square block cursor-crosshair touch-none"
                  onMouseDown={handleCanvasInteraction}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) handleCanvasInteraction(e);
                  }}
                  onTouchStart={handleCanvasInteraction}
                  onTouchMove={handleCanvasInteraction}
                />

                {/* Foul Overlay */}
                <AnimatePresence>
                  {foulMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none"
                    >
                      <div className="bg-red-600/90 text-white font-bold px-4 py-2 rounded-full text-[10px] shadow-lg uppercase tracking-wider">
                        🚨 {foulMessage}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Striker Slider Controls & Firing bar */}
              <div className="flex flex-col gap-3 p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/40 mt-1">
                
                {/* 1. Striker Positioning Slider */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                    <span>STRIKER POSITION (LEFT - RIGHT)</span>
                    <span className="text-orange-400 font-mono">X: {Math.round(strikerBaselineX)}</span>
                  </div>
                  <input
                    type="range"
                    min="65"
                    max="335"
                    value={strikerBaselineX}
                    onChange={(e) => {
                      setStrikerBaselineX(parseInt(e.target.value));
                      triggerVibration('tick');
                    }}
                    disabled={isPiecesMovingRef.current || (gameMode === 'ai' && currentPlayer === 2)}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-ew-resize accent-orange-500 bg-slate-800 disabled:opacity-40"
                  />
                </div>

                {/* 2. Aim/Shoot power slider & fire */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
                      <span>POWER ({shootPowerRef.current}%)</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      defaultValue="55"
                      onChange={(e) => {
                        shootPowerRef.current = parseInt(e.target.value);
                      }}
                      disabled={isPiecesMovingRef.current || (gameMode === 'ai' && currentPlayer === 2)}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#9B59B6] bg-slate-800 disabled:opacity-40"
                    />
                  </div>

                  <button
                    onClick={handleShoot}
                    disabled={isPiecesMovingRef.current || (gameMode === 'ai' && currentPlayer === 2)}
                    className="h-10 bg-gradient-to-r from-orange-500 to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold tracking-widest text-[10px] uppercase active:scale-95 transition-all cursor-pointer"
                  >
                    <Play size={12} className="fill-current" /> FLICK STRIKER ⚡
                  </button>
                </div>

                <div className="text-center text-[9px] text-slate-500 leading-normal">
                  💡 Drag anywhere on the carrom board itself to rotate your aiming angle, then click FLICK STRIKER.
                </div>
              </div>
            </motion.div>
          )}

          {/* Game Over */}
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
                <h2 className="text-xl font-bold tracking-tight">Carrom Complete!</h2>
                
                <div className="text-2xl font-bold text-orange-400 mt-4 uppercase font-sans tracking-wide">
                  🎉 {winner} Wins!
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 p-4 rounded-2xl bg-slate-900/50">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Player 1</span>
                    <span className="text-xl font-mono font-bold mt-1">{score.p1} Pts</span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-800" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Player 2</span>
                    <span className="text-xl font-mono font-bold mt-1">{score.p2} Pts</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={() => handleStartGame(gameMode)}
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <RotateCcw size={16} /> Rematch
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setGameState('menu');
                    }}
                    className="w-full h-12 bg-[#E67E22]/10 hover:bg-[#E67E22]/15 text-[#E67E22] rounded-2xl flex items-center justify-center gap-2 font-bold border border-[#E67E22]/30 active:scale-95 transition-all cursor-pointer text-sm"
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
