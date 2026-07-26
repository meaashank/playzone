/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  User,
  Cpu,
  Trophy,
  Play,
  HelpCircle,
  Award,
  Crown
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

// Dynamic synthetic sound wrapper
class LudoAudio {
  static play(type: 'click' | 'roll' | 'move' | 'capture' | 'safe' | 'win' | 'foul', enabled: boolean) {
    if (!enabled) return;
    try {
      switch (type) {
        case 'roll':
          SoundEngine.play('tictactoe_x');
          break;
        case 'move':
          SoundEngine.play('click');
          break;
        case 'capture':
          SoundEngine.play('snake_crash');
          break;
        case 'safe':
          SoundEngine.play('level_up');
          break;
        case 'win':
          SoundEngine.play('win');
          break;
        case 'foul':
          SoundEngine.play('back');
          break;
        default:
          SoundEngine.play('click');
          break;
      }
    } catch (e) {
      console.warn('Audio play ignored:', e);
    }
  }
}

interface LudoClassicGameProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1 means in yard, 0-50 on common track, 51-56 on home stretch, 57 is in home pocket
  stepCount: number; // cumulative steps taken (0 to 57)
}

interface Player {
  color: PlayerColor;
  name: string;
  isBot: boolean;
  isActive: boolean;
}

// Track Path definitions
// Map stepCount (0-50) to the 2D grid coordinates for common track
// Ludo board is a 15x15 grid. We define x and y coordinates (0-14) for the path of each player color.
// Common track layout of 52 cells starting from Red's entry spot:
const COMMON_PATH: [number, number][] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], // Red arm
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // Green arm up
  [7, 0], // Green top crossover
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], // Green arm down
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // Yellow arm right
  [14, 7], // Yellow crossover
  [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], // Yellow arm left
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // Blue arm down
  [7, 14], // Blue crossover
  [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], // Blue arm up
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // Red arm left
  [0, 7], // Red crossover left
  [0, 6], // Back to start loop
];

// Starting offsets on common track for each color
const COLOR_START_STEPS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// Safe spot indexes on COMMON_PATH
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

// Home stretch coordinates (6 steps)
const HOME_STRETCH_PATHS: Record<PlayerColor, [number, number][]> = {
  red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
};

// Yard positions for rendering tokens in their starting houses
const YARD_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [[2, 2], [3, 2], [2, 3], [3, 3]],
  green: [[11, 2], [12, 2], [11, 3], [12, 3]],
  yellow: [[11, 11], [12, 11], [11, 12], [12, 12]],
  blue: [[2, 11], [3, 11], [2, 12], [3, 12]],
};

export const LudoClassicGame: React.FC<LudoClassicGameProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true
}) => {
  const isDark = theme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [numPlayers, setNumPlayers] = useState<2 | 3 | 4>(4);
  const [useBots, setUseBots] = useState(true);
  const [soundOn, setSoundOn] = useState(soundEnabled);

  // Core Play State
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [diceValue, setDiceValue] = useState<number>(4);
  const [diceState, setDiceState] = useState<'idle' | 'rolling' | 'rolled'>('idle');
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState(false);
  const [rollCount6, setRollCount6] = useState(0); // tracks consecutive rolls of 6

  // Game log/feed
  const [gameLogs, setGameLogs] = useState<string[]>(['Welcome to Ludo Classic!']);
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  const colorsList: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  const playSound = (type: 'click' | 'roll' | 'move' | 'capture' | 'safe' | 'win' | 'foul') => {
    LudoAudio.play(type, soundOn);
  };

  const addLog = (msg: string) => {
    setGameLogs(prev => [msg, ...prev.slice(0, 15)]);
  };

  // Set up new game
  const initGame = () => {
    playSound('click');
    triggerVibration('medium');

    const createdPlayers: Player[] = [
      { color: 'red', name: 'You (Red)', isBot: false, isActive: true },
      { color: 'green', name: useBots ? 'Cobra Bot' : 'Player 2 (Green)', isBot: useBots, isActive: true },
      { color: 'yellow', name: numPlayers >= 3 ? (useBots ? 'Worm Bot' : 'Player 3 (Yellow)') : 'N/A', isBot: useBots, isActive: numPlayers >= 3 },
      { color: 'blue', name: numPlayers === 4 ? (useBots ? 'Neon Bot' : 'Player 4 (Blue)') : 'N/A', isBot: useBots, isActive: numPlayers === 4 }
    ];

    const initialTokens: Token[] = [];
    createdPlayers.forEach(p => {
      if (p.isActive) {
        for (let i = 0; i < 4; i++) {
          initialTokens.push({
            id: i,
            color: p.color,
            position: -1,
            stepCount: 0
          });
        }
      }
    });

    setPlayers(createdPlayers);
    setTokens(initialTokens);
    setCurrentPlayerIdx(0);
    setDiceValue(1);
    setDiceState('idle');
    setHasRolledThisTurn(false);
    setRollCount6(0);
    setWinner(null);
    setGameLogs(['Game started! Red turns first. Roll a 6 to bring tokens out!']);
    setIsPlaying(true);
  };

  const getActivePlayer = () => {
    return players.filter(p => p.isActive)[currentPlayerIdx];
  };

  // Check if a move is possible for a given token with current diceValue
  const isValidMove = (token: Token, steps: number): boolean => {
    if (token.position === -1) {
      return steps === 6; // Requires a 6 to leave yard
    }
    return token.stepCount + steps <= 57; // Cannot overshoot home
  };

  // Find all tokens that can make a move this turn
  const getMoveableTokens = (color: PlayerColor, steps: number): Token[] => {
    return tokens.filter(t => t.color === color && isValidMove(t, steps));
  };

  // Switch to next active player
  const passTurn = (forceNext = false) => {
    const activePlayers = players.filter(p => p.isActive);
    let nextIdx = (currentPlayerIdx + 1) % activePlayers.length;

    setHasRolledThisTurn(false);
    setDiceState('idle');
    setCurrentPlayerIdx(nextIdx);
    setRollCount6(0);
  };

  // Rolling Dice Animation
  const rollDice = () => {
    if (hasRolledThisTurn || diceState === 'rolling' || winner) return;

    playSound('roll');
    triggerVibration('light');
    setDiceState('rolling');

    let counter = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const rolled = Math.floor(Math.random() * 6) + 1;
        setDiceValue(rolled);
        setDiceState('rolled');
        setHasRolledThisTurn(true);
        handleDiceResult(rolled);
      }
    }, 80);
  };

  const handleDiceResult = (val: number) => {
    const activePlayer = getActivePlayer();
    const moveable = getMoveableTokens(activePlayer.color, val);

    addLog(`${activePlayer.name} rolled a ${val}!`);

    // Rule: Three 6s in a row voids turn
    if (val === 6) {
      const next6Count = rollCount6 + 1;
      if (next6Count === 3) {
        addLog(`Three 6s! Turn passed to next player.`);
        playSound('foul');
        setTimeout(() => passTurn(), 1200);
        return;
      }
      setRollCount6(next6Count);
    } else {
      setRollCount6(0);
    }

    if (moveable.length === 0) {
      addLog(`No playable moves for ${activePlayer.color.toUpperCase()}`);
      setTimeout(() => passTurn(), 1200);
    } else if (activePlayer.isBot) {
      // Robot chooses token after a slight thinking pause
      setTimeout(() => {
        // AI chooses smartest token: prioritizing captures, then home stretch, then highest position
        const sorted = [...moveable].sort((a, b) => {
          // Priority 1: Check if moving captures someone
          const aCapture = willCapture(a, val);
          const bCapture = willCapture(b, val);
          if (aCapture && !bCapture) return -1;
          if (!aCapture && bCapture) return 1;

          // Priority 2: In yard (release them!)
          if (a.position === -1 && b.position !== -1) return -1;
          if (a.position !== -1 && b.position === -1) return 1;

          // Priority 3: Progress/stepCount (push closest to home)
          return b.stepCount - a.stepCount;
        });

        moveToken(sorted[0], val);
      }, 1000);
    }
  };

  const willCapture = (token: Token, val: number): boolean => {
    let targetPos = 0;
    let targetStep = token.stepCount + val;
    if (token.position === -1) {
      targetPos = COLOR_START_STEPS[token.color];
    } else {
      targetPos = (token.position + val) % 52;
    }

    if (targetStep > 51) return false; // Yard/Home stretch is safe

    // Check if landing on safe spot
    if (SAFE_SPOTS.includes(targetPos)) return false;

    return tokens.some(other =>
      other.color !== token.color &&
      other.position === targetPos &&
      other.position !== -1
    );
  };

  // Execute token slide
  const moveToken = (token: Token, val: number) => {
    if (winner) return;
    playSound('move');
    triggerVibration('tick');

    let currentStep = token.stepCount;
    const finalStep = currentStep + (token.position === -1 ? 57 : val); // Yard-to-start counts as placing it on track

    const updateInterval = setInterval(() => {
      setTokens(prev =>
        prev.map(t => {
          if (t.color === token.color && t.id === token.id) {
            if (t.position === -1) {
              // Enter track
              return { ...t, position: COLOR_START_STEPS[t.color], stepCount: 1 };
            } else {
              const nextStep = t.stepCount + 1;
              if (nextStep <= 57) {
                // Calculate next board path index
                let nextPos = t.position;
                if (nextStep <= 51) {
                  nextPos = (t.position + 1) % 52;
                } else {
                  nextPos = 100 + nextStep; // Marked home stretches
                }
                return { ...t, position: nextPos, stepCount: nextStep };
              }
            }
          }
          return t;
        })
      );

      currentStep++;
      if (currentStep >= finalStep) {
        clearInterval(updateInterval);
        // Post movement mechanics: check captures, wins, and next turn triggers
        setTimeout(() => finalizeMove(token, val), 150);
      }
    }, 120);
  };

  const finalizeMove = (token: Token, val: number) => {
    // Get updated token position
    const latestToken = tokens.find(t => t.color === token.color && t.id === token.id)!;
    const isHome = latestToken.stepCount === 57;

    if (isHome) {
      playSound('safe');
      addLog(`Token ${token.id + 1} of ${token.color.toUpperCase()} reached HOME! 🏆`);
      
      // Check color win conditions
      const allHome = tokens.filter(t => t.color === token.color).every(t => t.stepCount === 57);
      if (allHome) {
        setWinner(token.color);
        playSound('win');
        triggerVibration('heavy');
        addLog(`🎉 ${token.color.toUpperCase()} WINS THE MATCH! 🎉`);
        return;
      }
    }

    // Check Capture on track
    let didCapture = false;
    if (latestToken.stepCount <= 51 && !SAFE_SPOTS.includes(latestToken.position)) {
      const opponentsAtSpot = tokens.filter(t => t.color !== token.color && t.position === latestToken.position && t.position !== -1);
      if (opponentsAtSpot.length > 0) {
        playSound('capture');
        triggerVibration('medium');
        addLog(`💥 SPLAT! ${token.color.toUpperCase()} captured ${opponentsAtSpot[0].color.toUpperCase()}'s token!`);
        
        setTokens(prev =>
          prev.map(t => {
            if (t.color === opponentsAtSpot[0].color && t.id === opponentsAtSpot[0].id) {
              return { ...t, position: -1, stepCount: 0 }; // Send back to yard
            }
            return t;
          })
        );
        didCapture = true;
      }
    }

    // Rule: Capture or rolling a 6 awards an extra dice roll
    if (val === 6 || didCapture) {
      addLog(`Bonus Roll awarded to ${token.color.toUpperCase()}!`);
      setHasRolledThisTurn(false);
      setDiceState('idle');
      if (getActivePlayer().isBot) {
        setTimeout(() => rollDice(), 800);
      }
    } else {
      passTurn();
    }
  };

  // Trigger bot roll inside loop
  useEffect(() => {
    if (!isPlaying || winner) return;
    const activePlayer = getActivePlayer();
    if (activePlayer && activePlayer.isBot && !hasRolledThisTurn && diceState === 'idle') {
      const botTimer = setTimeout(() => {
        rollDice();
      }, 1000);
      return () => clearTimeout(botTimer);
    }
  }, [isPlaying, currentPlayerIdx, hasRolledThisTurn, diceState, winner]);

  // Translate position to 2D coordinates on a 15x15 board
  const getTokenCoords = (token: Token): { x: number; y: number } => {
    if (token.position === -1) {
      // In Yard
      const yardPos = YARD_COORDS[token.color][token.id];
      return { x: yardPos[0], y: yardPos[1] };
    } else if (token.stepCount === 57) {
      // In Home pocket
      const centers: Record<PlayerColor, { x: number; y: number }> = {
        red: { x: 6, y: 7 },
        green: { x: 7, y: 6 },
        yellow: { x: 8, y: 7 },
        blue: { x: 7, y: 8 }
      };
      return centers[token.color];
    } else if (token.stepCount > 51) {
      // Home stretch path
      const idx = token.stepCount - 52;
      const pt = HOME_STRETCH_PATHS[token.color][idx];
      return { x: pt[0], y: pt[1] };
    } else {
      // Common track path
      // Offset position index relative to COMMON_PATH
      const commonIdx = token.position;
      const pt = COMMON_PATH[commonIdx];
      return { x: pt[0], y: pt[1] };
    }
  };

  // Render a cell on Ludo board grid
  const getCellColor = (x: number, y: number): string => {
    // Red Yard
    if (x < 6 && y < 6) return 'bg-red-500/10 border-red-500/20';
    // Green Yard
    if (x > 8 && y < 6) return 'bg-emerald-500/10 border-emerald-500/20';
    // Yellow Yard
    if (x > 8 && y > 8) return 'bg-amber-500/10 border-amber-500/20';
    // Blue Yard
    if (x < 6 && y > 8) return 'bg-blue-500/10 border-blue-500/20';

    // Center Home Triangle
    if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
      if (x === 6 && y === 7) return 'bg-red-500/40';
      if (x === 7 && y === 6) return 'bg-green-500/40';
      if (x === 8 && y === 7) return 'bg-amber-500/40';
      if (x === 7 && y === 8) return 'bg-blue-500/40';
      return 'bg-slate-800/20';
    }

    // Home Stretches
    if (y === 7 && x >= 1 && x <= 5) return 'bg-red-500/80';
    if (x === 7 && y >= 1 && y <= 5) return 'bg-green-500/80';
    if (y === 7 && x >= 9 && x <= 13) return 'bg-amber-500/80';
    if (x === 7 && y >= 9 && y <= 13) return 'bg-blue-500/80';

    // Safe Spots and Entry points
    const redEntry = [1, 6];
    const greenEntry = [8, 1];
    const yellowEntry = [13, 8];
    const blueEntry = [6, 13];

    if (x === redEntry[0] && y === redEntry[1]) return 'bg-red-500 border-red-400 shadow-inner';
    if (x === greenEntry[0] && y === greenEntry[1]) return 'bg-green-500 border-green-400 shadow-inner';
    if (x === yellowEntry[0] && y === yellowEntry[1]) return 'bg-yellow-500 border-yellow-400 shadow-inner';
    if (x === blueEntry[0] && y === blueEntry[1]) return 'bg-blue-500 border-blue-400 shadow-inner';

    // Other safe star symbols
    const stars = [[8, 2], [6, 12], [2, 8], [12, 6]];
    if (stars.some(s => s[0] === x && s[1] === y)) return 'bg-indigo-500/20 border-indigo-400/30';

    return isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50/70 border-slate-200/60';
  };

  return (
    <div className={`absolute inset-0 flex flex-col z-20 overflow-hidden ${isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-100 text-slate-800'}`}>
      {/* HEADER SECTION */}
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
          <span className="text-xs font-black uppercase tracking-widest">Ludo Classic</span>
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">
                🎲
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide">Ludo Classic</h3>

              {/* Player Count config */}
              <div className="space-y-2 text-left mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Players</span>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        playSound('click');
                        setNumPlayers(num as any);
                      }}
                      className={`py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                        numPlayers === num
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {num} Players
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot selection */}
              <div className="space-y-2 text-left mb-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Opponent Types</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      playSound('click');
                      setUseBots(true);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                      useBots
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Cpu size={14} />
                    <span>vs Robots AI</span>
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setUseBots(false);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                      !useBots
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <User size={14} />
                    <span>Pass & Play</span>
                  </button>
                </div>
              </div>

              <button
                onClick={initGame}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:brightness-105 active:scale-95 transition-all"
              >
                <Play size={14} fill="currentColor" />
                <span>Initialize Board</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-5xl flex flex-col md:flex-row items-center md:items-start justify-center gap-6"
            >
              {/* LEFT COLUMN: THE BOARD */}
              <div className="flex-1 max-w-[500px] w-full flex flex-col items-center">
                {/* LUDO BOARD GRID */}
                <div className={`aspect-square w-full rounded-[24px] overflow-hidden p-2 grid grid-cols-15 grid-rows-15 border gap-0.5 relative ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  {/* Yard backgrounds */}
                  {/* Red Yard Box */}
                  <div className="absolute top-2 left-2 w-[40%] aspect-square bg-red-500/25 border-4 border-red-500/60 rounded-xl flex flex-col justify-around p-2 pointer-events-none">
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-red-500" />
                      <div className="w-5 h-5 rounded-full bg-red-500" />
                    </div>
                    <div className="text-[9px] font-black uppercase text-red-500/80 tracking-widest text-center leading-none">RED</div>
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-red-500" />
                      <div className="w-5 h-5 rounded-full bg-red-500" />
                    </div>
                  </div>

                  {/* Green Yard Box */}
                  <div className="absolute top-2 right-2 w-[40%] aspect-square bg-green-500/25 border-4 border-green-500/60 rounded-xl flex flex-col justify-around p-2 pointer-events-none">
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-green-500" />
                      <div className="w-5 h-5 rounded-full bg-green-500" />
                    </div>
                    <div className="text-[9px] font-black uppercase text-green-500/80 tracking-widest text-center leading-none">GREEN</div>
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-green-500" />
                      <div className="w-5 h-5 rounded-full bg-green-500" />
                    </div>
                  </div>

                  {/* Blue Yard Box */}
                  <div className="absolute bottom-2 left-2 w-[40%] aspect-square bg-blue-500/25 border-4 border-blue-500/60 rounded-xl flex flex-col justify-around p-2 pointer-events-none">
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-blue-500" />
                      <div className="w-5 h-5 rounded-full bg-blue-500" />
                    </div>
                    <div className="text-[9px] font-black uppercase text-blue-500/80 tracking-widest text-center leading-none">BLUE</div>
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-blue-500" />
                      <div className="w-5 h-5 rounded-full bg-blue-500" />
                    </div>
                  </div>

                  {/* Yellow Yard Box */}
                  <div className="absolute bottom-2 right-2 w-[40%] aspect-square bg-yellow-500/25 border-4 border-yellow-500/60 rounded-xl flex flex-col justify-around p-2 pointer-events-none">
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-yellow-500" />
                      <div className="w-5 h-5 rounded-full bg-yellow-500" />
                    </div>
                    <div className="text-[9px] font-black uppercase text-yellow-500/80 tracking-widest text-center leading-none">YELLOW</div>
                    <div className="flex justify-between w-full">
                      <div className="w-5 h-5 rounded-full bg-yellow-500" />
                      <div className="w-5 h-5 rounded-full bg-yellow-500" />
                    </div>
                  </div>

                  {/* Main grid cells */}
                  {Array.from({ length: 15 }).map((_, y) =>
                    Array.from({ length: 15 }).map((_, x) => {
                      const isCommonTrackCell =
                        (x >= 6 && x <= 8) || (y >= 6 && y <= 8);
                      const isSafeHomeSpace =
                        x >= 6 && x <= 8 && y >= 6 && y <= 8;

                      return (
                        <div
                          key={`${x}-${y}`}
                          className={`w-full aspect-square border text-[7px] flex items-center justify-center font-bold ${getCellColor(
                            x,
                            y
                          )}`}
                        >
                          {/* Draw Star inside safe spots */}
                          {SAFE_SPOTS.some(idx => {
                            const pt = COMMON_PATH[idx];
                            return pt[0] === x && pt[1] === y;
                          }) && (
                            <span className="text-indigo-400 scale-90">★</span>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* RENDER INTERACTIVE TOKENS */}
                  {tokens.map((token, idx) => {
                    const coord = getTokenCoords(token);
                    const isMoveable = getActivePlayer().color === token.color &&
                                       !getActivePlayer().isBot &&
                                       diceState === 'rolled' &&
                                       isValidMove(token, diceValue);

                    // Jitter effect for playable tokens
                    return (
                      <motion.div
                        key={`${token.color}-${token.id}`}
                        layout
                        initial={{ scale: 0 }}
                        animate={{
                          scale: isMoveable ? [1, 1.15, 1] : 1,
                          x: `calc(${coord.x} * 100% + 2px)`,
                          y: `calc(${coord.y} * 100% + 2px)`
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 180,
                          damping: 18,
                          scale: isMoveable ? { repeat: Infinity, duration: 1.2 } : {}
                        }}
                        onClick={() => {
                          if (isMoveable) {
                            moveToken(token, diceValue);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          width: 'calc(100% / 15 - 4px)',
                          height: 'calc(100% / 15 - 4px)'
                        }}
                        className={`rounded-full shadow-lg border-2 flex items-center justify-center text-[10px] cursor-pointer font-black ${
                          token.color === 'red' ? 'bg-red-500 border-white text-white shadow-red-950/40' :
                          token.color === 'green' ? 'bg-emerald-500 border-white text-white shadow-emerald-950/40' :
                          token.color === 'yellow' ? 'bg-amber-400 border-white text-amber-950 shadow-amber-950/40' :
                          'bg-blue-500 border-white text-white shadow-blue-950/40'
                        } ${isMoveable ? 'z-30 ring-4 ring-offset-2 ring-indigo-500' : 'z-20'}`}
                      >
                        {token.id + 1}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: CONTROLS & STATS */}
              <div className="w-full md:w-[340px] shrink-0 flex flex-col space-y-4">
                {/* CURRENT PLAYER BADGE & GAMEPLAY CONTROLS */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3.5 h-3.5 rounded-full animate-ping ${
                      getActivePlayer().color === 'red' ? 'bg-red-500' :
                      getActivePlayer().color === 'green' ? 'bg-green-500' :
                      getActivePlayer().color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <span className="text-[9px] font-black text-slate-400 block uppercase leading-tight">ACTIVE TURN</span>
                      <span className="text-xs font-black tracking-tight">{getActivePlayer().name}</span>
                    </div>
                  </div>

                  {/* Dice Roller trigger */}
                  <div className="flex items-center space-x-3">
                    <motion.button
                      animate={diceState === 'rolling' ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 0.9, 1.2, 1] } : {}}
                      transition={{ repeat: diceState === 'rolling' ? Infinity : 0, duration: 0.4 }}
                      disabled={hasRolledThisTurn || getActivePlayer().isBot || winner !== null}
                      onClick={rollDice}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-md border cursor-pointer active:scale-90 transition-all ${
                        getActivePlayer().color === 'red' ? 'bg-red-500/20 border-red-500 text-red-400' :
                        getActivePlayer().color === 'green' ? 'bg-green-500/20 border-green-500 text-green-400' :
                        getActivePlayer().color === 'yellow' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-blue-500/20 border-blue-500 text-blue-400'
                      }`}
                    >
                      {diceValue === 1 ? '⚀' : diceValue === 2 ? '⚁' : diceValue === 3 ? '⚂' : diceValue === 4 ? '⚃' : diceValue === 5 ? '⚄' : '⚅'}
                    </motion.button>
                    <span className="text-[10px] font-bold text-slate-400 max-w-[50px] leading-tight">
                      {diceState === 'rolling' ? 'Rolling...' : diceState === 'rolled' ? `Got ${diceValue}!` : 'Tap Dice!'}
                    </span>
                  </div>
                </div>

                {/* GAME PLAY LOG */}
                <div className={`p-3 rounded-2xl border text-left h-28 overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Board Game Logs</span>
                  <div className="flex flex-col space-y-1 font-mono text-[9px]">
                    {gameLogs.map((log, i) => (
                      <div key={i} className={log.includes('Rolled a 6') || log.includes('reached HOME') ? 'text-amber-400 font-bold' : log.includes('SPLAT') ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BACK TO LOBBY CONTROL */}
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

      {/* GAME WINNER MODAL */}
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
                👑
              </div>
              <h2 className="text-xl font-black uppercase text-amber-500">Victory Decided!</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                The tokens of <strong className="uppercase">{winner}</strong> reached the center zone before everyone else!
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Result</span>
                <span className="text-base font-black text-amber-400 uppercase tracking-wide">
                  {winner} Claimed Gold
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={initGame}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Play Again
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
