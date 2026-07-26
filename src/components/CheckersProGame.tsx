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
  Play,
  Cpu,
  User,
  Trophy,
  Crown
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

// Dynamic synthetic sound wrapper
class CheckersAudio {
  static play(type: 'click' | 'move' | 'jump' | 'king' | 'win' | 'foul', enabled: boolean) {
    if (!enabled) return;
    try {
      switch (type) {
        case 'click':
          SoundEngine.play('click');
          break;
        case 'move':
          SoundEngine.play('tictactoe_o');
          break;
        case 'jump':
          SoundEngine.play('snake_eat');
          break;
        case 'king':
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
      console.warn('Checkers audio error:', e);
    }
  }
}

interface CheckersProGameProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

interface Piece {
  id: string;
  row: number;
  col: number;
  color: 'red' | 'dark'; // Red vs Dark pieces
  isKing: boolean;
}

interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  jumpedPiece?: Piece | null;
}

export const CheckersProGame: React.FC<CheckersProGameProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true
}) => {
  const isDark = theme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [vsAi, setVsAi] = useState(true);
  const [soundOn, setSoundOn] = useState(soundEnabled);

  // Core States
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [turn, setTurn] = useState<'red' | 'dark'>('red'); // Red moves first
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<'red' | 'dark' | null>(null);
  const [logs, setLogs] = useState<string[]>(['Checkers match ready.']);

  const playSound = (type: 'click' | 'move' | 'jump' | 'king' | 'win' | 'foul') => {
    CheckersAudio.play(type, soundOn);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 10)]);
  };

  const initBoard = () => {
    const initialPieces: Piece[] = [];
    let idCounter = 1;

    // Dark pieces top 3 rows (0, 1, 2) on dark squares (row + col % 2 === 1)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          initialPieces.push({
            id: `d-${idCounter++}`,
            row: r,
            col: c,
            color: 'dark',
            isKing: false
          });
        }
      }
    }

    // Red pieces bottom 3 rows (5, 6, 7)
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          initialPieces.push({
            id: `r-${idCounter++}`,
            row: r,
            col: c,
            color: 'red',
            isKing: false
          });
        }
      }
    }

    setPieces(initialPieces);
    setTurn('red');
    setSelectedPiece(null);
    setValidMoves([]);
    setWinner(null);
    setLogs(['Match initialized! RED turns first.']);
    setIsPlaying(true);
  };

  // Check board coordinates
  const getPieceAt = (r: number, c: number, boardState = pieces) => {
    return boardState.find(p => p.row === r && p.col === c) || null;
  };

  // Find all available valid moves/jumps for a color
  // Rule: Forced capture jumping is checked if available!
  const getMovesForColor = (color: 'red' | 'dark', boardState = pieces): Move[] => {
    const list: Move[] = [];
    const colorPieces = boardState.filter(p => p.color === color);

    colorPieces.forEach(p => {
      // Directions: normal red moves up (-1), dark moves down (+1). Kings move both ways.
      const directions: number[] = [];
      if (p.isKing) {
        directions.push(-1, 1);
      } else {
        directions.push(p.color === 'red' ? -1 : 1);
      }

      directions.forEach(dr => {
        [-1, 1].forEach(dc => {
          // 1. Single diagonal slide
          const tr = p.row + dr;
          const tc = p.col + dc;

          if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
            const destPiece = getPieceAt(tr, tc, boardState);
            if (!destPiece) {
              list.push({ fromRow: p.row, fromCol: p.col, toRow: tr, toCol: tc });
            } else if (destPiece.color !== p.color) {
              // 2. Jump capture step
              const jr = tr + dr;
              const jc = tc + dc;
              if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8) {
                const jumpDest = getPieceAt(jr, jc, boardState);
                if (!jumpDest) {
                  list.push({
                    fromRow: p.row,
                    fromCol: p.col,
                    toRow: jr,
                    toCol: jc,
                    jumpedPiece: destPiece
                  });
                }
              }
            }
          }
        });
      });
    });

    // Forced Capture priority: if any capture moves exist, return ONLY those capture moves!
    const jumps = list.filter(m => m.jumpedPiece);
    return jumps.length > 0 ? jumps : list;
  };

  // Select checker piece
  const handlePieceClick = (piece: Piece) => {
    if (!isPlaying || winner || turn === 'dark' && vsAi) return;
    if (piece.color !== turn) {
      playSound('foul');
      return;
    }

    playSound('click');
    setSelectedPiece(piece);

    // Get valid moves for this selected piece
    const allTurnMoves = getMovesForColor(turn);
    const pieceMoves = allTurnMoves.filter(m => m.fromRow === piece.row && m.fromCol === piece.col);
    setValidMoves(pieceMoves);
  };

  // Click on a target square
  const handleSquareClick = (r: number, c: number) => {
    if (!selectedPiece) return;

    const matchedMove = validMoves.find(m => m.toRow === r && m.toCol === c);
    if (matchedMove) {
      executeMove(matchedMove);
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const executeMove = (move: Move) => {
    playSound(move.jumpedPiece ? 'jump' : 'move');
    triggerVibration(move.jumpedPiece ? 'medium' : 'light');

    let isPromoted = false;

    const nextPieces = pieces.map(p => {
      if (p.row === move.fromRow && p.col === move.fromCol) {
        // Promote to King if reaching ends
        const reachBackRow = (turn === 'red' && move.toRow === 0) || (turn === 'dark' && move.toRow === 7);
        const makeKing = p.isKing || reachBackRow;
        if (reachBackRow && !p.isKing) {
          isPromoted = true;
        }
        return { ...p, row: move.toRow, col: move.toCol, isKing: makeKing };
      }
      return p;
    });

    // Remove captured piece if any
    let filteredPieces = nextPieces;
    if (move.jumpedPiece) {
      filteredPieces = nextPieces.filter(p => !(p.row === move.jumpedPiece!.row && p.col === move.jumpedPiece!.col));
      addLog(`${turn.toUpperCase()} captured an opponent checker!`);
    }

    if (isPromoted) {
      playSound('king');
      addLog(`👑 checker promoted to KING!`);
    } else {
      addLog(`${turn.toUpperCase()} moved to [${move.toRow}, ${move.toCol}]`);
    }

    setPieces(filteredPieces);
    setSelectedPiece(null);
    setValidMoves([]);

    // Check Win/Loss conditions
    const opposingColor = turn === 'red' ? 'dark' : 'red';
    const oppositionRemaining = filteredPieces.filter(p => p.color === opposingColor);
    const oppositionMoves = getMovesForColor(opposingColor, filteredPieces);

    if (oppositionRemaining.length === 0 || oppositionMoves.length === 0) {
      setWinner(turn);
      playSound('win');
      triggerVibration('heavy');
      addLog(`🏆 MATCH COMPLETED! ${turn.toUpperCase()} WINS!`);
      return;
    }

    // Toggle Turn
    setTurn(opposingColor);
  };

  // Heuristic Bot AI Logic for Dark side
  useEffect(() => {
    if (!isPlaying || winner || turn !== 'dark' || !vsAi) return;

    const botTimer = setTimeout(() => {
      const allAiMoves = getMovesForColor('dark');
      if (allAiMoves.length === 0) {
        setWinner('red');
        addLog('No available moves for AI! Red Wins!');
        return;
      }

      // Priority 1: Pick capture jumps
      // Priority 2: Pick moves that promote to King
      // Priority 3: Random/optimal selection
      const jumps = allAiMoves.filter(m => m.jumpedPiece);
      let selectedMove = allAiMoves[0];

      if (jumps.length > 0) {
        selectedMove = jumps[Math.floor(Math.random() * jumps.length)];
      } else {
        const kingMaker = allAiMoves.find(m => m.toRow === 7);
        if (kingMaker) {
          selectedMove = kingMaker;
        } else {
          // Pick randomly
          selectedMove = allAiMoves[Math.floor(Math.random() * allAiMoves.length)];
        }
      }

      executeMove(selectedMove);
    }, 1500);

    return () => clearTimeout(botTimer);
  }, [turn, isPlaying, winner, vsAi]);

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
          <span className="text-xs font-black uppercase tracking-widest">Checkers Pro</span>
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-md text-white">
                🏁
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide">Checkers Pro</h3>

              {/* Bot toggles */}
              <div className="space-y-2 text-left mb-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Opponent Config</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      playSound('click');
                      setVsAi(true);
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase transition-all border flex flex-col items-center justify-center space-y-1 ${
                      vsAi
                        ? 'bg-violet-600 border-violet-500 text-white shadow-md'
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
                        ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <User size={14} />
                    <span>Pass & Play</span>
                  </button>
                </div>
              </div>

              <button
                onClick={initBoard}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
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
              {/* LEFT COLUMN: THE CHECKERS BOARD */}
              <div className="flex-1 max-w-[500px] w-full flex flex-col items-center">
                {/* 8X8 CHECKERS BOARD */}
                <div className={`aspect-square w-full rounded-[24px] overflow-hidden p-2.5 grid grid-cols-8 grid-rows-8 border gap-0.5 shadow-xl relative ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  {Array.from({ length: 8 }).map((_, r) =>
                    Array.from({ length: 8 }).map((_, c) => {
                      const isDarkSquare = (r + c) % 2 === 1;
                      const pieceOnSquare = getPieceAt(r, c);
                      const isTargetableMove = validMoves.some(m => m.toRow === r && m.toCol === c);

                      return (
                        <div
                          key={`${r}-${c}`}
                          onClick={() => {
                            if (isTargetableMove) {
                              handleSquareClick(r, c);
                            }
                          }}
                          className={`w-full aspect-square flex items-center justify-center relative transition-all duration-150 ${
                            isDarkSquare
                              ? isDark ? 'bg-slate-900/50' : 'bg-slate-800/10'
                              : isDark ? 'bg-slate-950' : 'bg-slate-50'
                          } ${isTargetableMove ? 'cursor-pointer bg-emerald-500/25 ring-2 ring-emerald-500' : ''}`}
                        >
                          {/* Highlights valid circles */}
                          {isTargetableMove && (
                            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping pointer-events-none" />
                          )}

                          {/* Pieces rendering */}
                          {pieceOnSquare && (
                            <motion.div
                              layout
                              onClick={() => handlePieceClick(pieceOnSquare)}
                              className={`w-4/5 h-4/5 rounded-full border-2 flex items-center justify-center cursor-pointer relative shadow-lg ${
                                pieceOnSquare.color === 'red'
                                  ? 'bg-red-600 border-red-400 shadow-red-950/45'
                                  : 'bg-slate-800 border-slate-600 shadow-black/45'
                              } ${
                                selectedPiece?.id === pieceOnSquare.id
                                  ? 'ring-4 ring-offset-2 ring-indigo-500 scale-105 z-10'
                                  : ''
                              }`}
                            >
                              {/* King crowns */}
                              {pieceOnSquare.isKing && (
                                <Crown size={11} className="text-yellow-400 drop-shadow-sm" fill="currentColor" />
                              )}
                            </motion.div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: STATS & CONTROLS */}
              <div className="w-full md:w-[340px] shrink-0 flex flex-col space-y-4">
                {/* STATUS CARD */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${turn === 'red' ? 'bg-red-500 animate-ping' : 'bg-slate-400 animate-pulse'}`} />
                    <div className="text-left">
                      <span className="text-[9px] font-black text-slate-400 block uppercase leading-tight">ACTIVE STATUS</span>
                      <span className="text-xs font-black tracking-tight">{turn === 'red' ? 'RED PIECES (YOU)' : 'DARK PIECES (AI)'}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-[8px] font-black text-slate-400 block uppercase leading-tight">PIECES LEFT</span>
                    <span className="text-xs font-mono font-black text-indigo-400">
                      🔴 {pieces.filter(p => p.color === 'red').length} | ⚫ {pieces.filter(p => p.color === 'dark').length}
                    </span>
                  </div>
                </div>

                {/* ENGINE FEED */}
                <div className={`p-3 rounded-2xl border text-left h-24 overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Game Engine Feed</span>
                  <div className="flex flex-col space-y-0.5 font-mono text-[9px]">
                    {logs.map((log, i) => (
                      <div key={i} className={log.includes('captured') || log.includes('WINS') ? 'text-amber-400 font-bold' : log.includes('KING') ? 'text-violet-400 font-bold' : 'text-slate-400'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {/* RE-RACK CONTROL */}
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

      {/* GAME OVER WIN MODAL */}
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
              <h2 className="text-xl font-black uppercase text-amber-500">Board Conquered!</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5 font-bold">
                No legal moves or checkers remain for the opponent!
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center space-y-1 mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Outcome</span>
                <span className="text-base font-black text-amber-400 uppercase tracking-wide">
                  {winner.toUpperCase()} DOMINATED
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={initBoard}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Match Again
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
