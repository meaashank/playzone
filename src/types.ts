/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GamePlaceholder {
  id: string;
  title: string;
  category: string;
  description: string;
  color: string; // Tailwind bg color class (e.g., 'bg-blue-500')
  accentColor: string; // Tailwind text/border color
  isComingSoon: boolean;
  iconName: string; // For rendering custom SVG icons
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number; // e.g., 3
  maxProgress: number; // e.g., 5
  isCompleted: boolean;
  isLocked: boolean;
  icon: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  vibrationIntensity: 'light' | 'medium' | 'heavy' | 'tick';
  notificationsEnabled: boolean;
  language: string;
}

export interface UserProfile {
  username: string;
  avatarId: string;
  level: number;
  coins: number;
  xp: number;
}

export type ScreenId =
  | 'splash'
  | 'home'
  | 'settings'
  | 'profile'
  | 'achievements'
  | 'favorites'
  | 'search'
  | 'notifications'
  | 'about'
  | 'group-play'
  | 'tic-tac-toe'
  | 'ludo-classic';
