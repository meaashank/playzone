/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GamePlaceholder, Achievement } from './types';

export const GAME_PLACEHOLDERS: GamePlaceholder[] = [
  {
    id: 'game-8ball',
    title: '8 Ball Pool',
    category: 'Sports',
    description: 'Precision physics billard game for two players.',
    color: 'bg-blue-600',
    accentColor: 'text-blue-200',
    isComingSoon: false,
    iconName: 'billiards',
  },
  {
    id: 'game-tictactoe',
    title: 'Tic Tac Toe',
    category: 'Strategy',
    description: 'Classic grid puzzle of Xs and Os.',
    color: 'bg-green-600',
    accentColor: 'text-green-200',
    isComingSoon: false,
    iconName: 'tictactoe',
  },
  {
    id: 'game-ludo',
    title: 'Ludo Classic',
    category: 'Board',
    description: 'Roll the dice and race your tokens to the center.',
    color: 'bg-yellow-600',
    accentColor: 'text-yellow-200',
    isComingSoon: false,
    iconName: 'ludo',
  },
  {
    id: 'game-carrom',
    title: 'Carrom Disc',
    category: 'Board',
    description: 'Flick the striker to pocket your carrom men.',
    color: 'bg-orange-600',
    accentColor: 'text-orange-200',
    isComingSoon: false,
    iconName: 'carrom',
  },
  {
    id: 'game-snake',
    title: 'Snake Rush',
    category: 'Arcade',
    description: 'Navigate the growing serpent around obstacles.',
    color: 'bg-teal-600',
    accentColor: 'text-teal-200',
    isComingSoon: false,
    iconName: 'snake',
  },
  {
    id: 'game-checkers',
    title: 'Checkers Pro',
    category: 'Strategy',
    description: 'Jump over opponent pieces on a checkers grid.',
    color: 'bg-red-600',
    accentColor: 'text-red-200',
    isComingSoon: false,
    iconName: 'checkers',
  },
  {
    id: 'game-soccer',
    title: 'Soccer Shootout',
    category: 'Sports',
    description: 'Flick and kick goals past the automated keeper.',
    color: 'bg-emerald-700',
    accentColor: 'text-emerald-200',
    isComingSoon: false,
    iconName: 'soccer',
  },
  {
    id: 'game-more',
    title: 'More Games',
    category: 'Adventure',
    description: 'Exciting puzzles, racing, and action games in preparation.',
    color: 'bg-purple-600',
    accentColor: 'text-purple-200',
    isComingSoon: true,
    iconName: 'more',
  },
];

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-win',
    title: 'First Win',
    description: 'Win your first game',
    points: 100,
    progress: 1,
    maxProgress: 1,
    isCompleted: true,
    isLocked: false,
    icon: 'Trophy',
  },
  {
    id: 'ach-on-a-roll',
    title: 'On a Roll',
    description: 'Win 5 games in a row',
    points: 250,
    progress: 3,
    maxProgress: 5,
    isCompleted: false,
    isLocked: false,
    icon: 'Flame',
  },
  {
    id: 'ach-master-player',
    title: 'Master Player',
    description: 'Win 50 games',
    points: 1000,
    progress: 12,
    maxProgress: 50,
    isCompleted: false,
    isLocked: false,
    icon: 'Crown',
  },
  {
    id: 'ach-perfect-score',
    title: 'Perfect Score',
    description: 'Win a game without losing a turn',
    points: 500,
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    isLocked: true,
    icon: 'Target',
  },
];

export interface AvatarOption {
  id: string;
  name: string;
  bgColor: string;
  emoji: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'av-dino', name: 'Dino Kid', bgColor: 'bg-emerald-100', emoji: '🦖' },
  { id: 'av-cat', name: 'Cool Cat', bgColor: 'bg-purple-100', emoji: '🐱' },
  { id: 'av-fox', name: 'Clever Fox', bgColor: 'bg-orange-100', emoji: '🦊' },
  { id: 'av-robot', name: 'Robo Play', bgColor: 'bg-blue-100', emoji: '🤖' },
  { id: 'av-koala', name: 'Cuddly Koala', bgColor: 'bg-pink-100', emoji: '🐨' },
  { id: 'av-unicorn', name: 'Magic Star', bgColor: 'bg-yellow-100', emoji: '🦄' },
];
