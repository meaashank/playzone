/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Award,
  Crown
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

interface CheckersProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

type PieceOwner = 1 | 2; // 1 = Red (Player), 2 = Navy/Silver (AI or Player 2)

interface CheckerPiece {
  id: number;
  row: number;
  col: number;
  owner: PieceOwner;
  isKing: boolean;
}

interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  jumpedPieceId: number | null; // ID of captured piece, if any
}

export const CheckersProGame: React.FC<CheckersProps> = ({
  onBack,
  theme = 'dark',
  soundEnabled = true,
}) => {
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('ai');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [currentPlayer, setCurrentPlayer] = useState<PieceOwner>(1);
  const [pieces, setPieces] = useState<CheckerPiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<CheckerPiece | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  // Score stats: captured counts
  const [capturedByP1, setCapturedByP1] = useState(0);
  const [capturedByP2, setCapturedByP2] = useState(0);

  const playSound = (type: 'move' | 'capture' | 'king' | 'win' | 'lose' | 'click') => {
    if (isMuted) return;
    try {
      if (type === 'move') {
        SoundEngine.play('piece_move');
      } else if (type === 'capture') {
        SoundEngine.play('kill_opponent');
      } else if (type === 'king') {
        SoundEngine.play('level_up');
      } else if (type === 'win') {
        SoundEngine.play('win');
      } else if (type === 'lose') {
        SoundEngine.play('lose');
      } else {
        SoundEngine.play('click');
      }
    } catch (e) {
      console.warn('Audio failure:', e);
    }
  };

  const initializeBoard = () => {
    const initialPieces: CheckerPiece[] = [];
    let idCounter = 1;

    // Rows 0, 1, 2 for Player 2 (AI - Navy)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          initialPieces.push({
            id: idCounter++,
            row: r,
            col: c,
            owner: 2,
            isKing: false,
          });
        }
      }
    }

    // Rows 5, 6, 7 for Player 1 (Red)
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          initialPieces.push({
            id: idCounter++,
            row: r,
            col: c,
            owner: 1,
            isKing: false,
          });
        }
      }
    }

    setPieces(initialPieces);
    setSelectedPiece(null);
    setValidMoves([]);
    setCapturedByP1(0);
    setCapturedByP2(0);
  };

  const handleStartGame = (mode: 'pvp' | 'ai') => {
    playSound('click');
    setGameMode(mode);
    setGameState('playing');
    setCurrentPlayer(1);
    setWinner(null);
    initializeBoard();
  };

  // Get active checker pieces in board coordinate
  const getPieceAt = (row: number, col: number, list: CheckerPiece[] = pieces): CheckerPiece | undefined => {
    return list.find(p => p.row === row && p.col === col);
  };

  // Generate all legal moves for a given piece owner
  const generateAllLegalMoves = (owner: PieceOwner, currentPieces: CheckerPiece[] = pieces): Move[] => {
    const moves: Move[] = [];
    const playerPieces = currentPieces.filter(p => p.owner === owner);

    playerPieces.forEach(p => {
      // Directions: owner 1 moves UP (row decrements), owner 2 moves DOWN (row increments)
      // Kings can move any directions
      const rowDirs: number[] = [];
      if (p.isKing) {
        rowDirs.push(-1, 1);
      } else {
        rowDirs.push(p.owner === 1 ? -1 : 1);
      }
      const colDirs = [-1, 1];

      // Single step diagonal moves & Diagonal jump moves
      rowDirs.forEach(rd => {
        colDirs.forEach(cd => {
          // 1. Check simple non-jump moves
          const targetRow = p.row + rd;
          const targetCol = p.col + cd;

          if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
            const blockingPiece = getPieceAt(targetRow, targetCol, currentPieces);
            if (!blockingPiece) {
              moves.push({
                fromRow: p.row,
                fromCol: p.col,
                toRow: targetRow,
                toCol: targetCol,
                jumpedPieceId: null,
              });
            } else if (blockingPiece.owner !== p.owner) {
              // 2. Potential Jump Move: check cell behind blocking piece
              const landRow = targetRow + rd;
              const landCol = targetCol + cd;

              if (landRow >= 0 && landRow < 8 && landCol >= 0 && landCol < 8) {
                const landingBlock = getPieceAt(landRow, landCol, currentPieces);
                if (!landingBlock) {
                  moves.push({
                    fromRow: p.row,
                    fromCol: p.col,
                    toRow: landRow,
                    toCol: landCol,
                    jumpedPieceId: blockingPiece.id,
                  });
                }
              }
            }
          }
        });
      });
    });

    // Rule of Checkers: If jump moves exist, they are forced!
    const jumpMoves = moves.filter(m => m.jumpedPieceId !== null);
    return jumpMoves.length > 0 ? jumpMoves : moves;
  };

  // Check if current player has any legal moves left
  const checkWinOrDraw = (currentPieces: CheckerPiece[], nextPlayer: PieceOwner) => {
    const nextMoves = generateAllLegalMoves(nextPlayer, currentPieces);
    if (nextMoves.length === 0) {
      // current player wins!
      const finalWinnerName = nextPlayer === 1 ? 
        (gameMode === 'ai' ? 'Robot Master' : 'Player 2') : 'Player 1';
      setWinner(finalWinnerName);
      setGameState('gameover');
      playSound(nextPlayer === 1 ? 'lose' : 'win');
    }
  };

  const selectPiece = (piece: CheckerPiece) => {
    if (gameState !== 'playing') return;
    if (gameMode === 'ai' && currentPlayer === 2) return; // Block input during AI turn

    if (piece.owner !== currentPlayer) return;

    playSound('click');
    setSelectedPiece(piece);
    const allMoves = generateAllLegalMoves(currentPlayer);
    const pieceMoves = allMoves.filter(m => m.fromRow === piece.row && m.fromCol === piece.col);
    setValidMoves(pieceMoves);
  };

  const executeMove = (move: Move) => {
    const currentPieces = [...pieces];
    const pieceIndex = currentPieces.findIndex(p => p.row === move.fromRow && p.col === move.fromCol);
    if (pieceIndex === -1) return;

    const movingPiece = { ...currentPieces[pieceIndex] };
    movingPiece.row = move.toRow;
    movingPiece.col = move.toCol;

    // Check King Promotion
    let promotedToKing = false;
    if (!movingPiece.isKing) {
      if ((movingPiece.owner === 1 && move.toRow === 0) || (movingPiece.owner === 2 && move.toRow === 7)) {
        movingPiece.isKing = true;
        promotedToKing = true;
      }
    }

    currentPieces[pieceIndex] = movingPiece;

    // Handle captures
    let updatedPieces = currentPieces;
    if (move.jumpedPieceId !== null) {
      updatedPieces = currentPieces.filter(p => p.id !== move.jumpedPieceId);
      triggerVibration('medium');
      playSound('capture');
      if (currentPlayer === 1) {
        setCapturedByP1(c => c + 1);
      } else {
        setCapturedByP2(c => c + 1);
      }
    } else {
      playSound('move');
      triggerVibration('light');
    }

    if (promotedToKing) {
      playSound('king');
    }

    setPieces(updatedPieces);
    setSelectedPiece(null);
    setValidMoves([]);

    // Turn transition
    const nextPlayer: PieceOwner = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);

    // Evaluate for next player victory
    checkWinOrDraw(updatedPieces, nextPlayer);
  };

  // Run AI movement calculations
  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'ai' || currentPlayer !== 2) return;

    const aiThinkingTimer = setTimeout(() => {
      const aiMoves = generateAllLegalMoves(2);
      if (aiMoves.length === 0) {
        // AI has no moves, Player 1 wins
        setWinner('Player 1');
        setGameState('gameover');
        playSound('win');
        return;
      }

      // Simple Checker Heuristic AI:
      // Prioritize capture/jump moves, followed by moves leading to kings, or just random
      let chosenMove = aiMoves[0];
      const jumpMoves = aiMoves.filter(m => m.jumpedPieceId !== null);
      
      if (jumpMoves.length > 0) {
        // AI chooses a random jump move
        chosenMove = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
      } else {
        // Prioritize moves that lead to bottom row for promotion
        const promotingMoves = aiMoves.filter(m => m.toRow === 7);
        if (promotingMoves.length > 0) {
          chosenMove = promotingMoves[0];
        } else {
          // Choose a random standard diagonal move
          chosenMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
        }
      }

      executeMove(chosenMove);
    }, 1200);

    return () => clearTimeout(aiThinkingTimer);
  }, [gameState, gameMode, currentPlayer, pieces]);

  return (
    <div className={`flex flex-col h-full w-full select-none ${theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Header */}
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
          <span className="text-xs font-bold font-sans flex items-center gap-1.5 uppercase tracking-widest text-red-500">
            👑 Checkers Pro
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Tactical Jump Strategy Board</span>
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
                <div className="w-20 h-20 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  🔴
                </div>
                <h2 className="text-xl font-bold tracking-tight">Checkers Pro</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Plan your diagonal movements, jump over opponent checkers to capture them, and reach the baseline to crown your pieces as Kings!
                </p>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={() => handleStartGame('ai')}
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <Cpu size={16} /> Play vs Checker AI
                  </button>
                  <button
                    onClick={() => handleStartGame('pvp')}
                    className="w-full h-12 bg-red-600/10 hover:bg-red-600/15 text-red-500 rounded-2xl flex items-center justify-center gap-2 font-bold border border-red-500/30 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <Users size={16} /> Local Pass & Play (2 Player)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Playing Grid Board */}
          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-lg flex flex-col gap-4"
            >
              {/* Scorecard Capture Stats */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/45">
                <div className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${currentPlayer === 1 ? 'bg-red-600/15 border border-red-500/30 text-red-400' : 'opacity-60'}`}>
                  <span className="text-[9px] font-bold tracking-widest uppercase">Red Player</span>
                  <div className="text-md font-mono font-bold">{capturedByP1} <span className="text-[9px] font-sans text-slate-400">Captured</span></div>
                </div>

                <div className="text-center font-mono font-bold text-[10px] bg-slate-800/50 px-2.5 py-1 rounded-full text-slate-300">
                  {gameMode === 'ai' && currentPlayer === 2 ? '🤖 AI THINKING...' : `👉 ACTIVE: PLAYER ${currentPlayer}`}
                </div>

                <div className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${currentPlayer === 2 ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400' : 'opacity-60'}`}>
                  <span className="text-[9px] font-bold tracking-widest uppercase">{gameMode === 'ai' ? 'Navy AI' : 'Navy Player'}</span>
                  <div className="text-md font-mono font-bold">{capturedByP2} <span className="text-[9px] font-sans text-slate-400">Captured</span></div>
                </div>
              </div>

              {/* 8x8 Board Container */}
              <div className="aspect-square w-full rounded-2xl border border-slate-800 bg-[#1e293b] overflow-hidden shadow-2xl p-2 grid grid-cols-8 grid-rows-8 gap-0.5">
                {Array.from({ length: 8 }).map((_, r) => (
                  <React.Fragment key={r}>
                    {Array.from({ length: 8 }).map((_, c) => {
                      const isDarkCell = (r + c) % 2 === 1;
                      const cellPiece = getPieceAt(r, c);
                      const isSelected = selectedPiece && selectedPiece.row === r && selectedPiece.col === c;
                      
                      // Check if this cell is a valid move target for current selection
                      const landingMove = validMoves.find(m => m.toRow === r && m.toCol === c);
                      const isHighlight = landingMove !== undefined;

                      return (
                        <div
                          key={c}
                          onClick={() => {
                            if (isHighlight && landingMove) {
                              executeMove(landingMove);
                            } else if (cellPiece) {
                              selectPiece(cellPiece);
                            }
                          }}
                          className={`relative aspect-square flex items-center justify-center transition-colors cursor-pointer ${
                            isDarkCell 
                              ? isHighlight 
                                ? 'bg-emerald-500/30 hover:bg-emerald-500/40' 
                                : 'bg-slate-900/90' 
                              : 'bg-slate-200'
                          }`}
                        >
                          {/* Board cell coordinate label (very subtle) */}
                          <span className="absolute bottom-0.5 right-0.5 text-[7px] text-slate-500/30 font-mono">
                            {String.fromCharCode(65 + c)}{8 - r}
                          </span>

                          {/* Piece rendering */}
                          {cellPiece && (
                            <motion.div
                              layoutId={`piece-${cellPiece.id}`}
                              className={`w-[82%] h-[82%] rounded-full shadow-lg relative flex items-center justify-center border-2 active:scale-95 transition-all ${
                                cellPiece.owner === 1
                                  ? 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 shadow-red-900/30'
                                  : 'bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500 shadow-slate-950/40'
                              } ${isSelected ? 'ring-4 ring-yellow-400 scale-[1.06]' : ''}`}
                            >
                              {/* Inside ridges decal */}
                              <div className="absolute w-[68%] h-[68%] rounded-full border border-white/20 flex items-center justify-center">
                                <div className="w-[50%] h-[50%] rounded-full border border-white/10" />
                              </div>

                              {/* King visual indication */}
                              {cellPiece.isKing && (
                                <Crown size={12} className="text-yellow-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] z-10 animate-bounce" />
                              )}
                            </motion.div>
                          )}

                          {/* Valid move target green circular pulse */}
                          {isHighlight && (
                            <div className="absolute w-4 h-4 rounded-full bg-emerald-400/80 animate-pulse border border-white/20 z-10" />
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Aim Helper Tip banner */}
              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/45 text-center text-[10px] text-slate-400 font-medium">
                ⚡ <span className="text-slate-200 font-bold">Rule Book:</span> Select your checker to highlight valid moves. Jump over opponent chips diagonally to eliminate them. Standard pieces only move forward, Kings can move any direction.
              </div>
            </motion.div>
          )}

          {/* Game Over Screen */}
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
                <h2 className="text-xl font-bold tracking-tight">Match Complete!</h2>
                
                <div className="text-2xl font-bold text-red-500 mt-4 uppercase font-sans tracking-wide">
                  🎉 {winner} Wins!
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 p-4 rounded-2xl bg-slate-900/50">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Red Player</span>
                    <span className="text-lg font-mono font-bold mt-1">{capturedByP1} Caps</span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-800" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Navy Player</span>
                    <span className="text-lg font-mono font-bold mt-1">{capturedByP2} Caps</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={() => handleStartGame(gameMode)}
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all cursor-pointer text-sm"
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
