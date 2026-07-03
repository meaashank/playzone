/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  Users,
  Cpu,
  Trophy,
  Sparkles,
  Home,
  CheckCircle2,
  Play,
  Palette,
  User,
  Activity,
  Zap,
  Star,
  Award,
  Crown
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';

// Synthetic sound synthesizer using Web Audio API to avoid external assets.
class GameAudio {
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

  static play(type: 'click' | 'placeX' | 'placeO' | 'victory' | 'draw' | 'defeat' | 'settings', enabled: boolean) {
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
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
          
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
        case 'settings': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(660, now + 0.08);
          
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
          
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }
        case 'placeX': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
        case 'placeO': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
          
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
        case 'victory': {
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
          });
          break;
        }
        case 'defeat': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(261.63, now); // C4
          osc.frequency.exponentialRampToValueAtTime(130.81, now + 0.35); // C3
          
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
        case 'draw': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.type = 'sine';
          osc2.type = 'sine';
          
          osc1.frequency.setValueAtTime(329.63, now); // E4
          osc2.frequency.setValueAtTime(339.63, now); // Slightly detuned
          
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.2);
          osc2.stop(now + 0.2);
          break;
        }
      }
    } catch (e) {
      console.warn('Web Audio failure', e);
    }
  }
}

type Mode = 'pvp' | 'ai';
type Difficulty = 'easy' | 'medium' | 'hard';
type BoardState = (string | null)[];

interface TicTacToeGameProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

interface ThemeConfig {
  id: string;
  name: string;
  bgClass: string;
  headerBgClass: string;
  cardBgClass: string;
  boardBgClass: string;
  cellBgClass: string;
  cellHoverClass: string;
  textColor: string;
  subtitleColor: string;
  accentBadge: string;
  xColor: string;
  oColor: string;
  gridLine: string;
  glowEffect: string;
  btnPrimary: string;
}

const GAME_THEMES: Record<string, ThemeConfig> = {
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Galaxy 🌟',
    bgClass: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white',
    headerBgClass: 'bg-indigo-950/60 border-indigo-500/20 backdrop-blur-md',
    cardBgClass: 'bg-indigo-950/40 border-indigo-500/25 shadow-indigo-950/50 backdrop-blur-md border',
    boardBgClass: 'bg-indigo-950/50 border-indigo-500/30 border shadow-lg',
    cellBgClass: 'bg-slate-950/60 border-indigo-500/15 shadow-inner',
    cellHoverClass: 'hover:border-indigo-400 hover:bg-indigo-900/40',
    textColor: 'text-white',
    subtitleColor: 'text-indigo-200/70',
    accentBadge: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/35',
    xColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    oColor: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    gridLine: 'border-indigo-500/20',
    glowEffect: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
    btnPrimary: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20'
  },
  neon: {
    id: 'neon',
    name: 'Cyber Arcade ⚡',
    bgClass: 'bg-gradient-to-br from-purple-950 via-neutral-950 to-pink-950 text-white',
    headerBgClass: 'bg-black/60 border-fuchsia-500/20 backdrop-blur-md',
    cardBgClass: 'bg-black/60 border-fuchsia-500/35 shadow-purple-950/50 backdrop-blur-md border',
    boardBgClass: 'bg-purple-950/25 border-fuchsia-500/40 border shadow-[0_0_15px_rgba(217,70,239,0.1)]',
    cellBgClass: 'bg-black/80 border-fuchsia-500/20 shadow-[0_0_10px_rgba(217,70,239,0.05)]',
    cellHoverClass: 'hover:border-fuchsia-400 hover:shadow-[0_0_15px_rgba(217,70,239,0.2)]',
    textColor: 'text-white',
    subtitleColor: 'text-fuchsia-300/70',
    accentBadge: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40',
    xColor: 'text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.75)]',
    oColor: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.75)]',
    gridLine: 'border-fuchsia-500/30',
    glowEffect: 'shadow-[0_0_30px_rgba(217,70,239,0.25)]',
    btnPrimary: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-fuchsia-500/20'
  },
  sunset: {
    id: 'sunset',
    name: 'Peach Sunset 🍑',
    bgClass: 'bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 text-slate-800',
    headerBgClass: 'bg-white/80 border-amber-200/50 backdrop-blur-md',
    cardBgClass: 'bg-white/85 border-amber-200 shadow-md shadow-amber-900/5 backdrop-blur-md border',
    boardBgClass: 'bg-white/60 border-amber-300/60 border shadow-md',
    cellBgClass: 'bg-white border-amber-100/80 shadow-sm',
    cellHoverClass: 'hover:border-orange-400 hover:bg-orange-50/50',
    textColor: 'text-slate-800',
    subtitleColor: 'text-slate-500',
    accentBadge: 'bg-orange-500/10 text-orange-700 border border-orange-200',
    xColor: 'text-rose-500 drop-shadow-sm',
    oColor: 'text-amber-500 drop-shadow-sm',
    gridLine: 'border-amber-200/40',
    glowEffect: 'shadow-[0_4px_20px_rgba(249,115,22,0.08)]',
    btnPrimary: 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white shadow-orange-500/10'
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Mint 🍃',
    bgClass: 'bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-900 text-white',
    headerBgClass: 'bg-teal-950/60 border-emerald-500/20 backdrop-blur-md',
    cardBgClass: 'bg-teal-950/40 border-emerald-500/25 shadow-emerald-950/50 backdrop-blur-md border',
    boardBgClass: 'bg-teal-950/50 border-emerald-500/30 border shadow-lg',
    cellBgClass: 'bg-slate-950/60 border-emerald-500/15 shadow-inner',
    cellHoverClass: 'hover:border-emerald-400 hover:bg-emerald-900/40',
    textColor: 'text-white',
    subtitleColor: 'text-emerald-200/70',
    accentBadge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35',
    xColor: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    oColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    gridLine: 'border-emerald-500/20',
    glowEffect: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    btnPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
  }
};

const getWinningLineCoords = (line: number[] | null) => {
  if (!line) return null;
  const key = line.slice().sort().join(',');
  switch (key) {
    // Rows
    case '0,1,2': return { x1: 8, y1: 16.7, x2: 92, y2: 16.7 };
    case '3,4,5': return { x1: 8, y1: 50, x2: 92, y2: 50 };
    case '6,7,8': return { x1: 8, y1: 83.3, x2: 92, y2: 83.3 };
    // Columns
    case '0,3,6': return { x1: 16.7, y1: 8, x2: 16.7, y2: 92 };
    case '1,4,7': return { x1: 50, y1: 8, x2: 50, y2: 92 };
    case '2,5,8': return { x1: 83.3, y1: 8, x2: 83.3, y2: 92 };
    // Diagonals
    case '0,4,8': return { x1: 10, y1: 10, x2: 90, y2: 90 };
    case '2,4,6': return { x1: 90, y1: 10, x2: 10, y2: 90 };
    default: return null;
  }
};

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true,
}) => {
  // Themes Setup
  const [activeThemeId, setActiveThemeId] = useState<string>(theme === 'dark' ? 'cosmic' : 'sunset');
  const activeTheme = GAME_THEMES[activeThemeId] || GAME_THEMES.cosmic;

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerMarker, setPlayerMarker] = useState<'X' | 'O'>('X');
  
  // Game Play States
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null); // 'X', 'O', 'draw', or null
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  // Scores
  const [scores, setScores] = useState({ xWins: 0, oWins: 0, draws: 0 });
  const [round, setRound] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [localSound, setLocalSound] = useState(soundEnabled);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const activeSound = localSound;

  // Sync initial sound config
  useEffect(() => {
    setLocalSound(soundEnabled);
  }, [soundEnabled]);

  // AI moves trigger
  useEffect(() => {
    const isAiTurn = gameMode === 'ai' && (
      (playerMarker === 'X' && !isXNext) ||
      (playerMarker === 'O' && isXNext)
    );
    if (isPlaying && isAiTurn && winner === null) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        makeAiMove();
        setIsAiThinking(false);
      }, 750); // realistic thinking delay
      return () => clearTimeout(timer);
    }
  }, [isPlaying, gameMode, isXNext, winner, board, playerMarker]);

  // Win combinations
  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6],             // Diagonals
  ];

  const checkWinner = (currentBoard: BoardState) => {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line };
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isPlaying || isAiThinking) return;
    
    if (gameMode === 'ai') {
      const isHumanTurn = (playerMarker === 'X' && isXNext) || (playerMarker === 'O' && !isXNext);
      if (!isHumanTurn) return;
    }

    const marker = isXNext ? 'X' : 'O';
    const newBoard = [...board];
    newBoard[index] = marker;
    setBoard(newBoard);

    // Play marker sound & trigger light tick/feedback vibration
    GameAudio.play(marker === 'X' ? 'placeX' : 'placeO', activeSound);
    triggerVibration('light');

    const result = checkWinner(newBoard);
    if (result) {
      handleGameEnd(result.winner, result.line);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const handleGameEnd = (gameWinner: string, line: number[] | null) => {
    setWinner(gameWinner);
    if (line) {
      setWinningLine(line);
    }

    if (gameWinner === 'draw') {
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      GameAudio.play('draw', activeSound);
      triggerVibration('medium');
    } else {
      const isPlayerWin = gameMode === 'pvp' || gameWinner === playerMarker;
      if (gameWinner === 'X') {
        setScores(s => ({ ...s, xWins: s.xWins + 1 }));
      } else {
        setScores(s => ({ ...s, oWins: s.oWins + 1 }));
      }
      
      if (isPlayerWin) {
        GameAudio.play('victory', activeSound);
        triggerVibration('heavy');
      } else {
        GameAudio.play('defeat', activeSound);
        triggerVibration('medium');
      }
    }
  };

  // AI Algorithm logic
  const makeAiMove = () => {
    let targetIndex = -1;
    const aiMarker = playerMarker === 'X' ? 'O' : 'X';

    if (difficulty === 'easy') {
      targetIndex = getRandomMove(board);
    } else if (difficulty === 'medium') {
      if (Math.random() < 0.65) {
        targetIndex = getBestMoveMinimax(board, aiMarker);
      } else {
        targetIndex = getBasicHeuristicMove(board, aiMarker);
      }
    } else {
      targetIndex = getBestMoveMinimax(board, aiMarker);
    }

    if (targetIndex !== -1 && board[targetIndex] === null) {
      const newBoard = [...board];
      newBoard[targetIndex] = aiMarker;
      setBoard(newBoard);
      GameAudio.play(aiMarker === 'X' ? 'placeX' : 'placeO', activeSound);
      triggerVibration('light');

      const result = checkWinner(newBoard);
      if (result) {
        handleGameEnd(result.winner, result.line);
      } else {
        setIsXNext(!isXNext);
      }
    }
  };

  const getRandomMove = (currentBoard: BoardState): number => {
    const available = currentBoard.map((c, i) => c === null ? i : null).filter((val) => val !== null) as number[];
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  };

  const getBasicHeuristicMove = (currentBoard: BoardState, aiMarker: 'X' | 'O'): number => {
    const huMarker = aiMarker === 'O' ? 'X' : 'O';
    // 1. Can AI win in 1 move?
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const copy = [...currentBoard];
        copy[i] = aiMarker;
        const res = checkWinner(copy);
        if (res && res.winner === aiMarker) return i;
      }
    }

    // 2. Can Player win in 1 move? (AI block)
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const copy = [...currentBoard];
        copy[i] = huMarker;
        const res = checkWinner(copy);
        if (res && res.winner === huMarker) return i;
      }
    }

    // 3. Center if free
    if (currentBoard[4] === null) return 4;

    // 4. Random free
    return getRandomMove(currentBoard);
  };

  // Minimax algorithm implementation
  const getBestMoveMinimax = (currentBoard: BoardState, aiPlayer: 'X' | 'O'): number => {
    const huPlayer = aiPlayer === 'O' ? 'X' : 'O';

    const evaluateBoard = (b: BoardState) => {
      for (const line of WIN_LINES) {
        const [a, c, d] = line;
        if (b[a] && b[a] === b[c] && b[a] === b[d]) {
          return b[a] === aiPlayer ? 10 : -10;
        }
      }
      return 0;
    };

    const minimax = (b: BoardState, depth: number, isMax: boolean): number => {
      const score = evaluateBoard(b);

      if (score === 10) return score - depth;
      if (score === -10) return score + depth;
      if (b.every(cell => cell !== null)) return 0;

      if (isMax) {
        let best = -1000;
        for (let i = 0; i < 9; i++) {
          if (b[i] === null) {
            b[i] = aiPlayer;
            best = Math.max(best, minimax(b, depth + 1, false));
            b[i] = null;
          }
        }
        return best;
      } else {
        let best = 1000;
        for (let i = 0; i < 9; i++) {
          if (b[i] === null) {
            b[i] = huPlayer;
            best = Math.min(best, minimax(b, depth + 1, true));
            b[i] = null;
          }
        }
        return best;
      }
    };

    let bestVal = -1000;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = aiPlayer;
        const moveVal = minimax(currentBoard, 0, false);
        currentBoard[i] = null;

        if (moveVal > bestVal) {
          bestMove = i;
          bestVal = moveVal;
        }
      }
    }

    if (bestMove === -1) {
      return getRandomMove(currentBoard);
    }
    return bestMove;
  };

  const startNewGame = () => {
    GameAudio.play('click', activeSound);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setIsPlaying(true);
  };

  const nextRound = () => {
    GameAudio.play('click', activeSound);
    setRound(r => r + 1);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  const resetAll = () => {
    GameAudio.play('click', activeSound);
    setScores({ xWins: 0, oWins: 0, draws: 0 });
    setRound(1);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setIsPlaying(false);
  };

  return (
    <div className={`absolute inset-0 flex flex-col z-20 select-none overflow-hidden transition-all duration-300 ${activeTheme.bgClass}`}>
      
      {/* HEADER SECTION */}
      <div className={`h-14 px-4 flex items-center justify-between border-b shrink-0 transition-all duration-300 ${activeTheme.headerBgClass}`}>
        <button
          onClick={() => {
            GameAudio.play('click', activeSound);
            onBack();
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer bg-black/10 hover:bg-black/20 text-current active:scale-95`}
        >
          <ArrowLeft size={18} />
        </button>

        <h2 className="text-sm font-black tracking-wider uppercase flex items-center gap-1.5">
          <Zap size={14} className="text-amber-400 animate-pulse" />
          Tic Tac Toe
        </h2>

        <div className="flex items-center gap-2">
          {/* Custom Theme Switcher */}
          <button
            onClick={() => {
              GameAudio.play('settings', activeSound);
              setShowThemePicker(!showThemePicker);
              setShowSettings(false);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer bg-black/10 hover:bg-black/20 text-current active:scale-95`}
            title="Switch Theme"
          >
            <Palette size={16} className={showThemePicker ? 'rotate-12 text-indigo-400' : ''} />
          </button>

          <button
            onClick={() => {
              GameAudio.play('settings', activeSound);
              setShowSettings(!showSettings);
              setShowThemePicker(false);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer bg-black/10 hover:bg-black/20 text-current active:scale-95`}
          >
            <Settings size={18} className={showSettings ? 'rotate-45 text-amber-500' : ''} />
          </button>
        </div>
      </div>

      {/* THEME PICKER OVERLAY */}
      <AnimatePresence>
        {showThemePicker && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-14 left-0 right-0 p-4 border-b z-30 shadow-lg ${activeTheme.cardBgClass}`}
          >
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider block">Choose Visual Skin</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(GAME_THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveThemeId(t.id);
                      GameAudio.play('click', activeSound);
                      setShowThemePicker(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      activeThemeId === t.id
                        ? 'bg-white text-slate-950 border-white shadow-md font-bold'
                        : 'bg-black/20 border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <span className="text-xs font-bold block">{t.name}</span>
                    <div className="flex gap-1.5 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MENU DRAWER OVERLAY */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-14 left-0 right-0 p-4 border-b z-30 shadow-lg ${activeTheme.cardBgClass}`}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide">Sound Effects</span>
                <button
                  onClick={() => {
                    const nextSound = !localSound;
                    setLocalSound(nextSound);
                    GameAudio.play('settings', nextSound);
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${localSound ? 'bg-amber-500' : 'bg-white/20'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${localSound ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {isPlaying && (
                <button
                  onClick={resetAll}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 font-extrabold text-xs py-2.5 rounded-xl border border-rose-500/30 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <RotateCcw size={14} />
                  <span>Quit & Reset Match</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-between py-6 px-4 space-y-4 max-w-2xl mx-auto w-full">
        
        {/* HOMEPAGE MENU */}
        {!isPlaying ? (
          <div className="flex-1 flex flex-col justify-between w-full max-w-md md:max-w-xl space-y-6">
            
            {/* Visual Intro Mascot/Icon with rich visual layout */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="relative"
              >
                {/* Visual board mockup wrapper */}
                <div className={`w-36 h-36 rounded-[36px] flex items-center justify-center relative overflow-hidden p-4 ${activeTheme.cardBgClass} ${activeTheme.glowEffect}`}>
                  
                  {/* Neon Grid mock */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-4 opacity-40">
                    {Array(9).fill(null).map((_, i) => (
                      <div key={i} className={`border rounded-lg ${activeTheme.gridLine} bg-black/10`} />
                    ))}
                  </div>

                  {/* Bouncing glowing game markers */}
                  <div className="absolute flex items-center justify-center gap-4 z-10">
                    <motion.span
                      animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className={`text-4xl font-black ${activeTheme.xColor}`}
                    >
                      X
                    </motion.span>
                    <motion.span
                      animate={{ y: [0, 8, 0], rotate: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.3 }}
                      className={`text-4xl font-black ${activeTheme.oColor}`}
                    >
                      O
                    </motion.span>
                  </div>
                </div>
                
                {/* Floating Stylized Badge */}
                <span className="absolute -bottom-2 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-400 text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest rotate-6 shadow-lg">
                  Arcade Style ⚡
                </span>
              </motion.div>

              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tight uppercase bg-gradient-to-r from-amber-400 via-orange-300 to-cyan-300 bg-clip-text text-transparent">
                  Tic Tac Toe
                </h1>
                <p className={`text-xs max-w-[280px] leading-relaxed mx-auto ${activeTheme.subtitleColor}`}>
                  Say goodbye to flat white grids! Choose your premium visual skin, challenge the AI Bot, or battle local friends!
                </p>
              </div>

              {/* Mode Selection Cards */}
              <div className="w-full space-y-3 px-2">
                <span className={`text-[10px] font-black tracking-widest uppercase block text-left ml-1 ${activeTheme.subtitleColor}`}>
                  Select Game Mode
                </span>
                
                <div className="grid grid-cols-2 gap-3.5">
                  {/* PvP Card */}
                  <button
                    onClick={() => {
                      GameAudio.play('click', activeSound);
                      setGameMode('pvp');
                    }}
                    className={`p-4 rounded-3xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      gameMode === 'pvp'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-[1.03] ring-2 ring-indigo-500/35'
                        : 'bg-black/20 border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <Users size={24} className={gameMode === 'pvp' ? 'text-indigo-200' : 'text-indigo-400'} />
                    <div className="mt-4">
                      <span className="text-xs font-black block">Pass & Play</span>
                      <span className="text-[9px] opacity-70">2 Players Local</span>
                    </div>
                  </button>

                  {/* AI Card */}
                  <button
                    onClick={() => {
                      GameAudio.play('click', activeSound);
                      setGameMode('ai');
                    }}
                    className={`p-4 rounded-3xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      gameMode === 'ai'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg scale-[1.03] ring-2 ring-emerald-500/35'
                        : 'bg-black/20 border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <Cpu size={24} className={gameMode === 'ai' ? 'text-emerald-200' : 'text-emerald-400'} />
                    <div className="mt-4">
                      <span className="text-xs font-black block">Smart AI Bot</span>
                      <span className="text-[9px] opacity-70">Single Player</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Choose Your Side Selector */}
              <div className="w-full space-y-3 px-2">
                <span className={`text-[10px] font-black tracking-widest uppercase block text-left ml-1 ${activeTheme.subtitleColor}`}>
                  Choose Your Symbol (Play As)
                </span>
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Select X */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      GameAudio.play('placeX', activeSound);
                      setPlayerMarker('X');
                    }}
                    className={`relative p-4 rounded-3xl border-2 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      playerMarker === 'X'
                        ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/20'
                        : 'border-white/10 bg-black/20 hover:bg-black/30'
                    }`}
                  >
                    {/* Tick overlay if active */}
                    {playerMarker === 'X' && (
                      <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 rounded-full p-0.5">
                        <CheckCircle2 size={12} className="stroke-[3]" />
                      </div>
                    )}
                    <span className={`text-4.5xl font-black ${activeTheme.xColor} block mb-1`}>X</span>
                    <span className="text-[10px] font-black uppercase tracking-wider block">Cross (X)</span>
                    <span className="text-[8px] opacity-65 tracking-normal mt-0.5 block">Plays First Turn</span>
                  </motion.button>

                  {/* Select O */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      GameAudio.play('placeO', activeSound);
                      setPlayerMarker('O');
                    }}
                    className={`relative p-4 rounded-3xl border-2 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      playerMarker === 'O'
                        ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-2 ring-cyan-400/20'
                        : 'border-white/10 bg-black/20 hover:bg-black/30'
                    }`}
                  >
                    {/* Tick overlay if active */}
                    {playerMarker === 'O' && (
                      <div className="absolute top-2 right-2 bg-cyan-400 text-slate-950 rounded-full p-0.5">
                        <CheckCircle2 size={12} className="stroke-[3]" />
                      </div>
                    )}
                    <span className={`text-4.5xl font-black ${activeTheme.oColor} block mb-1`}>O</span>
                    <span className="text-[10px] font-black uppercase tracking-wider block">Circle (O)</span>
                    <span className="text-[8px] opacity-65 tracking-normal mt-0.5 block">Plays Second Turn</span>
                  </motion.button>
                </div>
              </div>

              {/* AI Difficulty Selector */}
              <AnimatePresence>
                {gameMode === 'ai' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full space-y-2 px-2 overflow-hidden"
                  >
                    <span className={`text-[10px] font-black tracking-widest uppercase block text-left ml-1 ${activeTheme.subtitleColor}`}>
                      Difficulty Level
                    </span>
                    <div className="p-1.5 rounded-2xl border border-white/10 bg-black/25 flex items-center justify-between">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => {
                        const isSelected = difficulty === level;
                        return (
                          <button
                            key={level}
                            onClick={() => {
                              GameAudio.play('click', activeSound);
                              setDifficulty(level);
                            }}
                            className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-extrabold'
                                : 'text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            <span>{level}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Start Match button */}
            <div className="pt-4 px-2">
              <button
                onClick={startNewGame}
                className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-2 font-black tracking-wider text-sm cursor-pointer transition-all active:scale-95 shadow-lg ${activeTheme.btnPrimary}`}
              >
                <Play size={16} fill="currentColor" />
                <span>START MATCH</span>
              </button>
            </div>
          </div>
        ) : (
          
          /* ACTIVE MATCH LAYOUT */
          <div className="flex-1 flex flex-col justify-between w-full max-w-md md:max-w-xl space-y-4">
            
            {/* Top Match Stats */}
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
                <Trophy size={11} className="text-amber-400" />
                ROUND {round}
              </span>
              <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${activeTheme.accentBadge}`}>
                {gameMode === 'ai' ? `vs AI Bot (${difficulty})` : 'Player vs Player'}
              </span>
            </div>

            {/* HEADS UP MATCH SCOREBOARD */}
            <div className={`p-4 rounded-3xl shadow-lg transition-all duration-300 ${activeTheme.cardBgClass}`}>
              
              {/* Turn Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-white/10 mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${activeTheme.subtitleColor}`}>
                    Active:
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {isXNext ? (
                      <span className={`text-xs font-black px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20`}>
                        {gameMode === 'ai' ? (playerMarker === 'X' ? 'You (X)' : 'Bot (X)') : 'Player X'}
                      </span>
                    ) : (
                      <span className={`text-xs font-black px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20`}>
                        {gameMode === 'ai' ? (playerMarker === 'O' ? 'You (O)' : 'Bot (O)') : 'Player O'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {isAiThinking ? (
                    <div className="flex items-center gap-1 text-[9px] text-cyan-400 font-extrabold">
                      <span className="w-2 h-2 rounded-full animate-ping bg-cyan-400" />
                      <span>BOT THINKING...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
                      <span>LIVE GAME</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score visual grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                
                {/* Player X */}
                <div className={`p-2 rounded-2xl border transition-all ${isXNext ? 'bg-amber-400/10 border-amber-400/30' : 'bg-black/10 border-transparent'}`}>
                  <span className="text-[8px] opacity-75 font-black block uppercase tracking-wider">
                    {gameMode === 'ai' ? (playerMarker === 'X' ? 'You (X)' : 'Bot (X)') : 'Player X'}
                  </span>
                  <span className="text-xl font-black font-mono mt-0.5 block">
                    {scores.xWins}
                  </span>
                </div>

                {/* Draws */}
                <div className="p-2 rounded-2xl bg-black/10 border border-transparent">
                  <span className="text-[8px] opacity-50 font-black block uppercase tracking-wider">Ties</span>
                  <span className="text-xl font-black font-mono mt-0.5 block">
                    {scores.draws}
                  </span>
                </div>

                {/* Player O */}
                <div className={`p-2 rounded-2xl border transition-all ${!isXNext ? 'bg-cyan-400/10 border-cyan-400/30' : 'bg-black/10 border-transparent'}`}>
                  <span className="text-[8px] opacity-75 font-black block uppercase tracking-wider">
                    {gameMode === 'ai' ? (playerMarker === 'O' ? 'You (O)' : 'Bot (O)') : 'Player O'}
                  </span>
                  <span className="text-xl font-black font-mono mt-0.5 block">
                    {scores.oWins}
                  </span>
                </div>
              </div>
            </div>

            {/* MAIN 3X3 GAME BOARD - VIVID COLOURED */}
            <div className="flex-1 flex items-center justify-center py-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full aspect-square rounded-[36px] p-4 grid grid-cols-3 grid-rows-3 gap-3 relative ${activeTheme.boardBgClass} ${activeTheme.glowEffect}`}
              >
                {board.map((cell, idx) => {
                  const isWinningCell = winningLine?.includes(idx);
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: cell === null && !winner ? 1.04 : 1 }}
                      whileTap={{ scale: cell === null && !winner ? 0.93 : 1 }}
                      animate={isWinningCell ? {
                        scale: [1, 1.15, 1.08],
                        zIndex: 10,
                      } : { 
                        scale: 1,
                        zIndex: 1
                      }}
                      transition={isWinningCell ? {
                        type: "spring",
                        stiffness: 300,
                        damping: 12,
                        delay: idx * 0.04
                      } : {
                        duration: 0.2
                      }}
                      onClick={() => handleCellClick(idx)}
                      disabled={cell !== null || winner !== null || isAiThinking}
                      className={`relative rounded-2xl flex items-center justify-center border-2 overflow-hidden transition-all duration-300 select-none group cursor-pointer ${
                        isWinningCell
                          ? cell === 'X'
                            ? 'bg-amber-400/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                            : 'bg-cyan-400/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                          : cell !== null
                          ? 'bg-black/30 border-white/5'
                          : `bg-black/20 border-white/10 ${activeTheme.cellHoverClass}`
                      }`}
                    >
                      {/* Active indicator dot inside free cells on hover */}
                      {cell === null && !winner && (
                        <div className="absolute w-2 h-2 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-200" />
                      )}

                      <AnimatePresence mode="wait">
                        {cell === 'X' && (
                          <motion.svg
                            key="X"
                            viewBox="0 0 24 24"
                            className={`w-12 h-12 fill-none ${isWinningCell ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : activeTheme.xColor}`}
                            initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 15 }}
                          >
                            <motion.line
                              x1="5" y1="5" x2="19" y2="19"
                              stroke="currentColor"
                              strokeWidth={4.5}
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                            />
                            <motion.line
                              x1="19" y1="5" x2="5" y2="19"
                              stroke="currentColor"
                              strokeWidth={4.5}
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.22, delay: 0.08, ease: "easeOut" }}
                            />
                          </motion.svg>
                        )}

                        {cell === 'O' && (
                          <motion.svg
                            key="O"
                            viewBox="0 0 24 24"
                            className={`w-12 h-12 fill-none ${isWinningCell ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : activeTheme.oColor}`}
                            initial={{ scale: 0.3, rotate: 45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 15 }}
                          >
                            <motion.circle
                              cx="12" cy="12" r="7"
                              stroke="currentColor"
                              strokeWidth={4.5}
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.28, ease: "easeOut" }}
                            />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}

                {/* Animated Winning Line (Strikethrough) */}
                {winningLine && (() => {
                  const coords = getWinningLineCoords(winningLine);
                  if (!coords) return null;
                  const strokeColor = winner === 'X' ? '#fbbf24' : '#22d3ee';
                  return (
                    <svg
                      className="absolute inset-4 pointer-events-none z-30 w-[calc(100%-2rem)] h-[calc(100%-2rem)] overflow-visible tic-tac-toe-winning-line"
                      viewBox="0 0 100 100"
                    >
                      <defs>
                        <filter id="winningLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <motion.line
                        className="tic-tac-toe-winning-line"
                        x1={coords.x1}
                        y1={coords.y1}
                        x2={coords.x2}
                        y2={coords.y2}
                        stroke={strokeColor}
                        strokeWidth={5}
                        strokeLinecap="round"
                        filter="url(#winningLineGlow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                      />
                    </svg>
                  );
                })()}
              </motion.div>
            </div>

            {/* Bottom Back Button */}
            <div className="pt-2 px-2 shrink-0">
              <button
                onClick={resetAll}
                className="w-full active:scale-95 font-extrabold text-xs py-3.5 rounded-2xl border border-white/10 bg-black/25 flex items-center justify-center space-x-1.5 cursor-pointer hover:bg-black/40 transition-all text-current"
              >
                <Home size={14} />
                <span>Return to Menu</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* GAME OVER DIALOG OVERLAY */}
      <AnimatePresence>
        {winner !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-40 p-4 backdrop-blur-sm"
          >
            {/* Sparkle Emojis floating */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array(10).fill(null).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: '100%', x: `${Math.random() * 100}%`, scale: 0.5, opacity: 0 }}
                  animate={{ y: '-10%', scale: [0.5, 1.2, 0.8], opacity: [0, 1, 0] }}
                  transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  className="absolute text-xl"
                >
                  {i % 3 === 0 ? '✨' : i % 3 === 1 ? '🌟' : '🎉'}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 15 }}
              className={`w-full max-w-xs rounded-[32px] p-6 text-center space-y-6 ${activeTheme.cardBgClass} ${activeTheme.glowEffect}`}
            >
              <div className="space-y-2">
                
                {/* Visual Icon Header */}
                {winner === 'draw' ? (
                  <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                    🤝
                  </div>
                ) : winner === 'X' ? (
                  <div className="w-16 h-16 bg-amber-400/20 border border-amber-400 rounded-2xl flex items-center justify-center mx-auto text-4xl font-black text-amber-400">
                    X
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-cyan-400/20 border border-cyan-400 rounded-2xl flex items-center justify-center mx-auto text-4xl font-black text-cyan-400">
                    O
                  </div>
                )}

                <h3 className="text-xl font-black tracking-tight pt-2 uppercase">
                  {winner === 'draw' ? (
                    'It\'s a Tie Draw!'
                  ) : winner === 'X' ? (
                    'Player X Wins!'
                  ) : gameMode === 'ai' ? (
                    'AI Bot Wins!'
                  ) : (
                    'Player O Wins!'
                  )}
                </h3>

                <p className={`text-[11px] leading-relaxed ${activeTheme.subtitleColor}`}>
                  {winner === 'draw' 
                    ? 'Both sides matched each other block for block! Reset the grid and break the tie!' 
                    : `Incredible battle! Player ${winner} claimed victory this round. Ready to fight again?`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2.5">
                <button
                  onClick={nextRound}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                >
                  <Sparkles size={13} fill="currentColor" />
                  <span>NEXT ROUND</span>
                </button>

                <button
                  onClick={startNewGame}
                  className="w-full active:scale-95 font-bold text-[11px] py-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all text-current"
                >
                  Reset Current Game
                </button>

                <button
                  onClick={resetAll}
                  className="w-full active:scale-95 font-bold text-[11px] py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer transition-all text-rose-400"
                >
                  Exit to Main Lobby
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
