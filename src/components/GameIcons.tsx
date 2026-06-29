/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const BilliardsIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#1E40AF" />
    <circle cx="50" cy="50" r="32" fill="#0F172A" />
    <circle cx="44" cy="44" r="8" fill="#38BDF8" opacity="0.3" />
    <circle cx="50" cy="50" r="16" fill="#FFFFFF" />
    <text x="50" y="56" fill="#0F172A" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">8</text>
  </svg>
);

export const TicTacToeIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#16A34A" />
    {/* Grid lines */}
    <line x1="38" y1="20" x2="38" y2="80" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    <line x1="62" y1="20" x2="62" y2="80" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    <line x1="20" y1="38" x2="80" y2="38" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    <line x1="20" y1="62" x2="80" y2="62" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    {/* X and O */}
    {/* Top-Left X */}
    <line x1="26" y1="26" x2="32" y2="32" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <line x1="32" y1="26" x2="26" y2="32" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    {/* Center O */}
    <circle cx="50" cy="50" r="5" stroke="#FFFFFF" strokeWidth="4" />
    {/* Bottom-Right X */}
    <line x1="68" y1="68" x2="74" y2="74" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <line x1="74" y1="68" x2="68" y2="74" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    {/* Top-Right O */}
    <circle cx="71" cy="29" r="5" stroke="#FFFFFF" strokeWidth="4" />
    {/* Bottom-Left O */}
    <circle cx="29" cy="71" r="5" stroke="#FFFFFF" strokeWidth="4" />
  </svg>
);

export const LudoIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#CA8A04" />
    {/* 4 Quadrants representing Ludo zones */}
    <rect x="20" y="20" width="26" height="26" rx="4" fill="#EF4444" />
    <rect x="54" y="20" width="26" height="26" rx="4" fill="#3B82F6" />
    <rect x="20" y="54" width="26" height="26" rx="4" fill="#10B981" />
    <rect x="54" y="54" width="26" height="26" rx="4" fill="#F59E0B" />
    {/* Dice in the center */}
    <rect x="36" y="36" width="28" height="28" rx="6" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="2" />
    <circle cx="43" cy="43" r="2.5" fill="#EF4444" />
    <circle cx="57" cy="43" r="2.5" fill="#EF4444" />
    <circle cx="50" cy="50" r="2.5" fill="#EF4444" />
    <circle cx="43" cy="57" r="2.5" fill="#EF4444" />
    <circle cx="57" cy="57" r="2.5" fill="#EF4444" />
  </svg>
);

export const CarromIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#EA580C" />
    <rect x="15" y="15" width="70" height="70" rx="8" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
    {/* Center circle */}
    <circle cx="50" cy="50" r="18" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
    <circle cx="50" cy="50" r="8" fill="#F87171" stroke="#EF4444" strokeWidth="2" />
    {/* Striker or coins around */}
    <circle cx="42" cy="42" r="4" fill="#000000" />
    <circle cx="58" cy="42" r="4" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1" />
    <circle cx="44" cy="58" r="4" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1" />
    <circle cx="56" cy="58" r="4" fill="#000000" />
  </svg>
);

export const SnakeIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#0D9488" />
    {/* Snake path */}
    <path d="M25 70 C30 50, 45 50, 50 70 C55 90, 70 90, 75 70 C80 50, 80 30, 65 25 C50 20, 40 35, 45 45" 
          stroke="#22C55E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    {/* Eyes */}
    <circle cx="43" cy="28" r="3.5" fill="#FFFFFF" />
    <circle cx="43" cy="28" r="1.5" fill="#000000" />
    <circle cx="55" cy="28" r="3.5" fill="#FFFFFF" />
    <circle cx="55" cy="28" r="1.5" fill="#000000" />
    {/* Cheeks & tongue */}
    <circle cx="39" cy="33" r="1.5" fill="#F43F5E" />
    <circle cx="59" cy="33" r="1.5" fill="#F43F5E" />
    <path d="M49 32 Q49 38 46 38" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CheckersIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#DC2626" />
    {/* Checkerboard grid background */}
    <rect x="25" y="25" width="25" height="25" fill="#B91C1C" />
    <rect x="50" y="50" width="25" height="25" fill="#B91C1C" />
    <rect x="50" y="25" width="25" height="25" fill="#EF4444" />
    <rect x="25" y="50" width="25" height="25" fill="#EF4444" />
    {/* Checker pieces */}
    <circle cx="37" cy="37" r="9" fill="#F87171" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="37" cy="37" r="5" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
    <circle cx="62" cy="62" r="9" fill="#111827" stroke="#374151" strokeWidth="2" />
    <circle cx="62" cy="62" r="5" stroke="#9CA3AF" strokeWidth="1" opacity="0.6" />
  </svg>
);

export const SoccerIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#15803D" />
    {/* Net details in background */}
    <path d="M15 15 L85 15 L85 50 L15 50 Z" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" strokeDasharray="3 3" />
    <line x1="15" y1="32" x2="85" y2="32" stroke="#FFFFFF" strokeWidth="2" opacity="0.2" />
    <line x1="50" y1="15" x2="50" y2="50" stroke="#FFFFFF" strokeWidth="2" opacity="0.2" />
    {/* Soccer Ball */}
    <circle cx="50" cy="55" r="22" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
    {/* Hexagon pattern */}
    <path d="M50 43 L58 48 L55 57 L45 57 L42 48 Z" fill="#000000" />
    <line x1="50" y1="43" x2="50" y2="33" stroke="#000000" strokeWidth="2" />
    <line x1="58" y1="48" x2="68" y2="45" stroke="#000000" strokeWidth="2" />
    <line x1="55" y1="57" x2="62" y2="66" stroke="#000000" strokeWidth="2" />
    <line x1="45" y1="57" x2="38" y2="66" stroke="#000000" strokeWidth="2" />
    <line x1="42" y1="48" x2="32" y2="45" stroke="#000000" strokeWidth="2" />
  </svg>
);

export const MoreGamesIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="#7C3AED" />
    {/* Gamepad shape */}
    <path d="M25 45 C25 35, 35 30, 50 30 C65 30, 75 35, 75 45 C75 55, 68 70, 60 70 C56 70, 54 65, 50 65 C46 65, 44 70, 40 70 C32 70, 25 55, 25 45 Z" fill="#4C1D95" />
    {/* D-Pad */}
    <rect x="34" y="42" width="6" height="14" rx="2" fill="#FFFFFF" />
    <rect x="30" y="46" width="14" height="6" rx="2" fill="#FFFFFF" />
    {/* Action buttons */}
    <circle cx="64" cy="44" r="4" fill="#EF4444" />
    <circle cx="56" cy="52" r="4" fill="#FBBF24" />
    {/* Ellipsis */}
    <circle cx="43" cy="60" r="2" fill="#9CA3AF" />
    <circle cx="50" cy="60" r="2" fill="#9CA3AF" />
    <circle cx="57" cy="60" r="2" fill="#9CA3AF" />
  </svg>
);

export const GameIconRenderer = ({ iconName, className = 'w-16 h-16' }: { iconName: string; className?: string }) => {
  switch (iconName) {
    case 'billiards':
      return <div className={className}><BilliardsIcon /></div>;
    case 'tictactoe':
      return <div className={className}><TicTacToeIcon /></div>;
    case 'ludo':
      return <div className={className}><LudoIcon /></div>;
    case 'carrom':
      return <div className={className}><CarromIcon /></div>;
    case 'snake':
      return <div className={className}><SnakeIcon /></div>;
    case 'checkers':
      return <div className={className}><CheckersIcon /></div>;
    case 'soccer':
      return <div className={className}><SoccerIcon /></div>;
    case 'more':
    default:
      return <div className={className}><MoreGamesIcon /></div>;
  }
};
