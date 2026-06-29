/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Crown,
  Target,
  Bell,
  Settings,
  ArrowLeft,
  Heart,
  Search,
  User,
  Users,
  ChevronRight,
  Lock,
  Unlock,
  Volume2,
  Music,
  Sparkles,
  Shield,
  HelpCircle,
  FileText,
  Check,
  Plus,
  Info,
  Star,
  Edit3,
  RefreshCw,
  Clock,
  ThumbsUp,
  X
} from 'lucide-react';
import { ScreenId, UserProfile, AppSettings, GamePlaceholder, Achievement } from '../types';
import { GAME_PLACEHOLDERS, AVATAR_OPTIONS, DEFAULT_ACHIEVEMENTS } from '../constants';
import { GameIconRenderer } from './GameIcons';
import { DoodleAvatar, AvatarSelectionScreen, DOODLE_AVATARS } from './DoodleAvatars';
import { TicTacToeGame } from './TicTacToeGame';
import { GroupPlay } from './GroupPlay';

interface ScreensProps {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  notifications: Array<{ id: string; title: string; body: string; time: string; read: boolean }>;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: string; title: string; body: string; time: string; read: boolean }>>>;
  isParentUnlocked: boolean;
  setIsParentUnlocked: (unlocked: boolean) => void;
  onShowNotificationBanner: (title: string, message: string) => void;
  theme?: 'light' | 'dark';
}

export const InteractiveScreens: React.FC<ScreensProps> = ({
  currentScreen,
  setCurrentScreen,
  profile,
  setProfile,
  settings,
  setSettings,
  favorites,
  setFavorites,
  notifications,
  setNotifications,
  isParentUnlocked,
  setIsParentUnlocked,
  onShowNotificationBanner,
  theme = 'light',
}) => {
  // Local Screen states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [splashProgress, setSplashProgress] = useState(35);

  // Filter games based on search query & category
  const filteredGames = GAME_PLACEHOLDERS.filter((game) => {
    const matchesQuery = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = searchCategory === 'All' || game.category === searchCategory;
    return matchesQuery && matchesCategory;
  });

  const activeAvatar = AVATAR_OPTIONS.find(av => av.id === profile.avatarId) || AVATAR_OPTIONS[0];

  // Utility to handle favorite toggle
  const toggleFavorite = (gameId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (favorites.includes(gameId)) {
      setFavorites(favorites.filter(id => id !== gameId));
      onShowNotificationBanner('Favorites Updated', 'Removed game from your favorites list.');
    } else {
      setFavorites([...favorites, gameId]);
      onShowNotificationBanner('Favorites Updated', 'Added game to your favorites list! ❤️');
    }
  };

  // Profile update handler
  const saveUsername = () => {
    if (tempUsername.trim()) {
      setProfile(prev => ({ ...prev, username: tempUsername.trim() }));
      setIsEditingUsername(false);
      onShowNotificationBanner('Profile Updated', 'Your username has been saved.');
    }
  };

  // PIN verification for parent area
  const handlePinPress = (num: string) => {
    setPinError(false);
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      if (nextPin === '1234') {
        setIsParentUnlocked(true);
        setPinInput('');
        onShowNotificationBanner('Parents Area Unlocked', 'Welcome to Parental Settings.');
      } else if (nextPin.length === 4) {
        // Trigger error after 500ms
        setTimeout(() => {
          setPinError(true);
          setPinInput('');
        }, 300);
      }
    }
  };

  // Simulated daily achievement completion
  const handleSimulateXP = () => {
    const xpReward = 50;
    setProfile(prev => {
      const nextXp = prev.xp + xpReward;
      const nextLevel = nextXp >= 100 ? prev.level + 1 : prev.level;
      const finalXp = nextXp >= 100 ? nextXp - 100 : nextXp;
      const nextCoins = prev.coins + 25;

      if (nextLevel > prev.level) {
        onShowNotificationBanner('🎉 LEVEL UP!', `Congratulations, you reached Level ${nextLevel}!`);
      } else {
        onShowNotificationBanner('⭐ Experience Earned', `You gained ${xpReward} XP & 25 Stars!`);
      }

      return {
        ...prev,
        level: nextLevel,
        xp: finalXp,
        coins: nextCoins
      };
    });
  };

  // Trigger simulated screen time notification
  const handleTriggerTimeNotification = () => {
    const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotif = {
      id: uniqueId,
      title: '⏰ Screen Time Alert',
      body: 'Your daily play time limit is approaching. 5 minutes remaining!',
      time: 'Just Now',
      read: false
    };
    setNotifications([newNotif, ...notifications]);
    onShowNotificationBanner(newNotif.title, newNotif.body);
  };

  // Add sample game for demo purposes
  const handleExploreFavorites = () => {
    setCurrentScreen('home');
  };

  // Bottom Nav Bar helper
  const BottomNav = () => (
    <div id="bottom-nav-container" className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-20">
      <button
        id="nav-home"
        onClick={() => setCurrentScreen('home')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
          currentScreen === 'home' ? 'text-[#6C5CE7] bg-[#6C5CE7]/10 font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Sparkles size={20} className={currentScreen === 'home' ? 'scale-110' : ''} />
        <span className="text-[10px] mt-0.5 font-bold">Games</span>
      </button>

      <button
        id="nav-group-play"
        onClick={() => setCurrentScreen('group-play')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
          currentScreen === 'group-play' ? 'text-[#6C5CE7] bg-[#6C5CE7]/10 font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Users size={20} className={currentScreen === 'group-play' ? 'scale-110' : ''} />
        <span className="text-[10px] mt-0.5 font-bold">Group</span>
      </button>

      <button
        id="nav-favorites"
        onClick={() => setCurrentScreen('favorites')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
          currentScreen === 'favorites' ? 'text-[#FF7675] bg-[#FF7675]/10 font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Heart size={20} className={currentScreen === 'favorites' ? 'scale-110 fill-[#FF7675] stroke-[#FF7675]' : ''} />
        <span className="text-[10px] mt-0.5 font-bold">Favorites</span>
      </button>

      <button
        id="nav-achievements"
        onClick={() => setCurrentScreen('achievements')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
          currentScreen === 'achievements' ? 'text-[#FFB300] bg-[#FFF8E1] font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Trophy size={20} className={currentScreen === 'achievements' ? 'scale-110' : ''} />
        <span className="text-[10px] mt-0.5 font-bold">Badges</span>
      </button>

      <button
        id="nav-profile"
        onClick={() => setCurrentScreen('profile')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
          currentScreen === 'profile' ? 'text-[#6C5CE7] bg-[#6C5CE7]/10 font-bold' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <User size={20} className={currentScreen === 'profile' ? 'scale-110' : ''} />
        <span className="text-[10px] mt-0.5 font-bold">Me</span>
      </button>
    </div>
  );

  // Common Back Header
  const BackHeader = ({ title, target = 'home', actionButton }: { title: string; target?: ScreenId; actionButton?: React.ReactNode }) => (
    <div id="screen-header" className="sticky top-0 bg-white h-14 border-b border-slate-100 flex items-center justify-between px-4 z-10 shrink-0">
      <div className="flex items-center space-x-3">
        <button
          id="header-back-btn"
          onClick={() => setCurrentScreen(target)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 active:bg-slate-100 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
      <div>
        {actionButton}
      </div>
    </div>
  );

  // Render Splash Screen
  const renderSplash = () => (
    <div id="splash-screen" className="absolute inset-0 bg-indigo-950 flex flex-col items-center justify-between py-12 px-6 select-none z-30">
      {/* Background Watermark/Patterns */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap gap-12 p-8 justify-center overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <Crown key={i} size={48} className="text-white rotate-12" />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Mascot Controller Frame */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
            <svg viewBox="0 0 100 100" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 50 C20 40, 30 35, 50 35 C70 35, 80 40, 80 50 C80 60, 72 75, 62 75 C58 75, 56 70, 50 70 C44 70, 42 75, 38 75 C28 75, 20 60, 20 50 Z" fill="#FFFFFF" />
              {/* Buttons */}
              <circle cx="65" cy="50" r="4.5" fill="#EF4444" />
              <circle cx="56" cy="58" r="4.5" fill="#FBBF24" />
              {/* D-Pad */}
              <rect x="30" y="47" width="5" height="11" rx="1.5" fill="#6B7280" />
              <rect x="27" y="50" width="11" height="5" rx="1.5" fill="#6B7280" />
            </svg>
          </div>
          {/* Yellow Crown sitting on the controller */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-12 drop-shadow-md">
            <Crown size={28} className="text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        {/* Brand Name with stylized characters */}
        <div className="flex space-x-1 mb-2">
          {['P', 'L', 'A', 'Y'].map((letter, idx) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
            return (
              <span
                key={idx}
                className={`w-9 h-9 rounded-xl text-white font-black text-xl flex items-center justify-center shadow-md ${colors[idx]} transform -rotate-6`}
              >
                {letter}
              </span>
            );
          })}
        </div>
        <h1 className="text-xl font-black text-white tracking-widest mt-1">ZONE</h1>
        <p className="text-xs text-indigo-300 mt-2 font-medium tracking-wide">Lots of fun. One place.</p>
      </div>

      {/* Loading Bar */}
      <div className="w-full max-w-[200px] flex flex-col items-center space-y-3">
        <div className="w-full h-2.5 bg-indigo-900/60 rounded-full overflow-hidden p-0.5 border border-indigo-800/40">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${splashProgress}%` }}
          />
        </div>
        <span className="text-[10px] text-indigo-300 font-mono tracking-wider">LOADING... {splashProgress}%</span>

        <button
          onClick={() => {
            setSplashProgress(100);
            setTimeout(() => setCurrentScreen('home'), 150);
          }}
          className="mt-2 text-[10px] font-bold text-yellow-400 bg-indigo-900/40 hover:bg-indigo-900/80 active:bg-indigo-900/90 py-1.5 px-4 rounded-full border border-indigo-800 transition-all"
        >
          Skip to Home
        </button>
      </div>
    </div>
  );

  // Render Home Screen
  const renderHome = () => (
    <div id="home-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
      {/* Top App Bar */}
      <div id="top-bar" className="bg-white px-4 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentScreen('profile')}>
          <div className="w-10 h-10 bg-[#F1F3F5] rounded-full flex items-center justify-center p-0.5 border border-slate-150">
            <DoodleAvatar id={profile.avatarId} className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate">{profile.username}</span>
              <span className="bg-amber-100 text-amber-800 font-black text-[9px] px-1 rounded-full border border-amber-200">LV.{profile.level}</span>
            </div>
            <p className="text-[10px] text-slate-400 text-left">Gamer status: Active</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Coins/Stars counter */}
          <div
            onClick={() => {
              setProfile(p => ({ ...p, coins: p.coins + 10 }));
              onShowNotificationBanner('Coin Gained!', 'You tapped and collected +10 Stars! ⭐');
            }}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-100 border border-amber-100 px-2.5 py-1.5 rounded-full cursor-pointer transition-all shrink-0"
          >
            <Star className="text-amber-500 fill-amber-500" size={13} />
            <span className="text-xs font-black text-amber-700 tracking-tight font-mono">{profile.coins}</span>
          </div>

          {/* Settings Shortcut Button */}
          <button
            id="settings-shortcut"
            onClick={() => setCurrentScreen('settings')}
            className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center active:bg-slate-100 transition-all cursor-pointer"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div id="home-scroll-container" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Banner area / Greeting */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-4 text-white shadow-sm relative overflow-hidden">
          {/* Background controller shapes */}
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12">
            <svg viewBox="0 0 100 100" className="w-24 h-24 fill-white">
              <path d="M20 50 C20 40, 30 35, 50 35 C70 35, 80 40, 80 50 C80 60, 72 75, 62 75 C58 75, 56 70, 50 70 C44 70, 42 75, 38 75 C28 75, 20 60, 20 50 Z" />
            </svg>
          </div>

          <span className="bg-white/20 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full tracking-wider uppercase">Gamer Hub</span>
          <h3 className="text-base font-black tracking-tight mt-1.5">Choose a Game! 🚀</h3>
          <p className="text-[10px] text-blue-100 font-medium leading-relaxed max-w-[190px] mt-0.5">Explore our kids-safe, ad-free flat puzzle & tabletop collections.</p>
        </div>

        {/* Playful invitation card to Group Play */}
        <div
          onClick={() => setCurrentScreen('group-play')}
          className="bg-gradient-to-br from-[#6C5CE7] to-[#FF7675] p-3.5 rounded-3xl text-white shadow-sm relative overflow-hidden flex items-center justify-between cursor-pointer active:scale-[0.99] hover:shadow-md transition-all text-left"
        >
          <div className="flex-1 min-w-0 pr-3 z-10">
            <span className="bg-white/20 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full tracking-wider uppercase">Cousins Meetup! 👥</span>
            <h4 className="text-xs font-black tracking-tight mt-1">Spin the Bottle</h4>
            <p className="text-[9px] text-indigo-50 leading-tight mt-0.5">Tactile drag-and-flick spinner with physics & chime chords.</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0 z-10">
            🍼
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
          {['All', 'Board', 'Strategy', 'Sports', 'Arcade'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSearchCategory(cat);
                setCurrentScreen('search');
              }}
              className="px-3.5 py-1.5 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setCurrentScreen('search')}
            className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-600 flex items-center space-x-1 whitespace-nowrap"
          >
            <Search size={11} />
            <span>Search</span>
          </button>
        </div>

        {/* Game List Grid */}
        <div className="grid grid-cols-2 gap-3.5 pb-4">
          {GAME_PLACEHOLDERS.map((game) => {
            const isFav = favorites.includes(game.id);
            return (
              <div
                key={game.id}
                onClick={() => {
                  if (game.id === 'game-tictactoe') {
                    setCurrentScreen('tic-tac-toe');
                  } else {
                    onShowNotificationBanner(game.title, `${game.title} is coming soon in the next major release! 🎮`);
                  }
                }}
                className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                {/* Heart/Favorite toggle button */}
                <button
                  onClick={(e) => toggleFavorite(game.id, e)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 active:scale-90 transition-all z-10"
                >
                  <Heart size={14} className={isFav ? 'fill-red-500 stroke-red-500' : ''} />
                </button>

                {/* Vector game illustration box */}
                <div className="aspect-square w-full rounded-2xl bg-slate-50 mb-2 flex items-center justify-center overflow-hidden">
                  <GameIconRenderer iconName={game.iconName} className="w-16 h-16 group-hover:scale-110 transition-transform duration-300" />
                </div>

                {/* Text Metadata */}
                <div className="text-left mt-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{game.category}</span>
                  <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-none mt-0.5">{game.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[9px] font-bold ${game.id === 'game-tictactoe' ? 'text-indigo-600 font-sans' : 'text-slate-400'}`}>
                      {game.id === 'game-tictactoe' ? 'Play Now ⚡' : 'Coming Soon'}
                    </span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${game.id === 'game-tictactoe' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      {game.id === 'game-tictactoe' ? '🎮' : <Lock size={9} />}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );

  // Render Settings Screen
  const renderSettings = () => (
    <div id="settings-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
      <BackHeader title="Settings" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left">
        {/* Profile Card Summary */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-[#F1F3F5] rounded-2xl flex items-center justify-center p-0.5 border border-slate-100">
              <DoodleAvatar id={profile.avatarId} className="w-full h-full" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800">{profile.username}</h3>
              <p className="text-[10px] text-slate-400">Manage settings & parents lock</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentScreen('profile')}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 font-bold text-[10px] px-3 py-1.5 rounded-full transition-all"
          >
            Edit Profile
          </button>
        </div>

        {/* System Settings Toggles */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">Sound & Feedback</span>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Sound Toggle */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Volume2 size={16} />
                </span>
                <span className="text-xs font-bold text-slate-700">Game Sounds</span>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${settings.soundEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Music Toggle */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                  <Music size={16} />
                </span>
                <span className="text-xs font-bold text-slate-700">Background Music</span>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, musicEnabled: !s.musicEnabled }))}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${settings.musicEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings.musicEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Vibration Toggle */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center animate-pulse">
                  <Sparkles size={16} />
                </span>
                <span className="text-xs font-bold text-slate-700">Tactile Vibration</span>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, vibrationEnabled: !s.vibrationEnabled }))}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${settings.vibrationEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings.vibrationEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* General Options */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">General Info</span>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Language */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                 onClick={() => {
                   const langs = ['English', 'Español', 'Français'];
                   const idx = (langs.indexOf(settings.language) + 1) % langs.length;
                   setSettings(s => ({ ...s, language: langs[idx] }));
                   onShowNotificationBanner('Language Changed', `App set to ${langs[idx]}.`);
                 }}>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center font-bold text-xs font-mono">EN</span>
                <span className="text-xs font-bold text-slate-700">Language</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="text-xs text-slate-500 font-bold">{settings.language}</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                 onClick={() => setCurrentScreen('about')}>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <FileText size={16} />
                </span>
                <span className="text-xs font-bold text-slate-700">Privacy Policy</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            {/* Help & About */}
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                 onClick={() => setCurrentScreen('about')}>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <HelpCircle size={16} />
                </span>
                <span className="text-xs font-bold text-slate-700">About App</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Security / Parents Gate Section */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">Parent Controls</span>
          <button
            onClick={() => {
              setPinInput('');
              setIsParentUnlocked(false);
              setCurrentScreen('parent-area');
            }}
            className="w-full bg-white hover:bg-slate-50 p-3.5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm group active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <Shield size={16} />
              </span>
              <div>
                <span className="text-xs font-bold text-slate-700 block">Parents Area</span>
                <span className="text-[9px] text-slate-400 font-medium">Protect limits with high security PIN</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 uppercase">PIN Locked</span>
              <Lock size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );

  // Render Profile Screen
  const renderProfile = () => (
    <div id="profile-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
      <BackHeader title="My Profile" target="home" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left">
        {/* Profile Identity Frame */}
        <div className="bg-gradient-to-b from-purple-500 to-indigo-600 rounded-3xl p-5 text-center text-white relative shadow-sm overflow-hidden">
          <div className="absolute right-[-15px] top-[-15px] opacity-10">
            <Crown size={96} className="rotate-45" />
          </div>

          <div className="relative inline-block mx-auto mb-3">
            <div className="w-20 h-20 bg-[#F1F3F5] rounded-full flex items-center justify-center shadow-md border-4 border-white/90 p-1">
              <DoodleAvatar id={profile.avatarId} className="w-full h-full" />
            </div>
            {/* Edit avatar pencil float */}
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="absolute bottom-0 right-0 w-7 h-7 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-slate-800 shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer animate-bounce"
            >
              <Edit3 size={12} />
            </button>
          </div>

          {/* Edit username input */}
          {isEditingUsername ? (
            <div className="flex items-center justify-center space-x-2 px-4">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                maxLength={15}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/50 text-center font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 w-full max-w-[160px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveUsername();
                }}
              />
              <button
                onClick={saveUsername}
                className="w-7 h-7 bg-green-500 rounded-xl flex items-center justify-center text-white hover:bg-green-600 shadow-sm"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setTempUsername(profile.username);
                  setIsEditingUsername(false);
                }}
                className="w-7 h-7 bg-red-500 rounded-xl flex items-center justify-center text-white hover:bg-red-600 shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1.5 cursor-pointer group" onClick={() => setIsEditingUsername(true)}>
              <h2 className="text-base font-black tracking-tight">{profile.username}</h2>
              <Edit3 size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {/* Level Progress */}
          <div className="mt-4 max-w-[200px] mx-auto">
            <div className="flex items-center justify-between text-[10px] text-purple-100 font-bold mb-1">
              <span>LEVEL {profile.level}</span>
              <span>{profile.xp} / 100 XP</span>
            </div>
            <div className="w-full h-2 bg-purple-900/40 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${profile.xp}%` }} />
            </div>
          </div>
        </div>

        {/* Statistic Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center shadow-sm">
            <span className="text-[9px] font-black text-slate-400 block uppercase">Stars</span>
            <div className="flex items-center justify-center text-xs font-black text-amber-500 mt-1">
              <Star size={12} className="fill-amber-500 mr-1" />
              <span>{profile.coins}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center shadow-sm">
            <span className="text-[9px] font-black text-slate-400 block uppercase">Won</span>
            <div className="flex items-center justify-center text-xs font-black text-green-600 mt-1">
              <Trophy size={12} className="mr-1 text-green-500" />
              <span>85</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center shadow-sm">
            <span className="text-[9px] font-black text-slate-400 block uppercase">Level</span>
            <div className="flex items-center justify-center text-xs font-black text-purple-600 mt-1">
              <Crown size={12} className="mr-1 text-purple-500" />
              <span>{profile.level}</span>
            </div>
          </div>
        </div>

        {/* Avatar Modal Selector Trigger / Showcase */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Select Character</span>
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="text-[11px] font-extrabold text-[#6C5CE7] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles size={11} />
              <span>Customize Avatar</span>
            </button>
          </div>

          {/* Inline Selection List with Doodle Avatars Preview */}
          <div className="bg-white rounded-[28px] p-3 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-6 gap-2">
              {DOODLE_AVATARS.slice(0, 6).map((av) => (
                <button
                  key={av.id}
                  onClick={() => {
                    setProfile(p => ({ ...p, avatarId: av.id }));
                    onShowNotificationBanner('Avatar Updated', `Say hello to ${av.name}! 👋`);
                  }}
                  className={`aspect-square rounded-2xl flex items-center justify-center p-1.5 cursor-pointer transition-all border-2 bg-[#F8F9FA] ${
                    profile.avatarId === av.id
                      ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 scale-105 shadow-md'
                      : 'border-slate-50 hover:bg-slate-100 hover:scale-102'
                  }`}
                  title={av.name}
                >
                  <DoodleAvatar id={av.id} className="w-full h-full" />
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="w-full mt-3 py-2.5 bg-[#6C5CE7]/5 hover:bg-[#6C5CE7]/10 text-[#6C5CE7] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View All 24 Doodle Characters</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Developer Sandbox Options */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">Sandbox Lab</span>
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
            <p className="text-[10px] text-slate-400 leading-normal">Simulate actual player events to check how the responsive system behaves across screens:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSimulateXP}
                className="bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-extrabold text-[10px] py-2 px-3 rounded-2xl border border-indigo-100 flex items-center justify-center space-x-1.5 transition-all"
              >
                <Sparkles size={11} />
                <span>Gain +50 XP</span>
              </button>
              <button
                onClick={handleTriggerTimeNotification}
                className="bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-extrabold text-[10px] py-2 px-3 rounded-2xl border border-rose-100 flex items-center justify-center space-x-1.5 transition-all"
              >
                <Bell size={11} />
                <span>Trigger Warning</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );

  // Render Achievements Screen
  const renderAchievements = () => (
    <div id="achievements-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
      <BackHeader
        title="Badges & Rewards"
        actionButton={
          <button
            onClick={handleSimulateXP}
            className="flex items-center space-x-1 bg-amber-50 active:bg-amber-100 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-amber-700 cursor-pointer"
          >
            <Sparkles size={11} className="text-amber-500 animate-spin" />
            <span>Earn XP</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left">
        {/* Large Trophy Header Frame */}
        <div className="bg-amber-500 rounded-3xl p-4 text-white shadow-sm flex items-center space-x-4 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
            <Trophy size={110} />
          </div>

          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Trophy size={36} className="text-yellow-100 fill-yellow-200 animate-bounce" />
          </div>
          <div>
            <span className="bg-white/20 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full tracking-wider uppercase">Achievements Score</span>
            <h3 className="text-lg font-black tracking-tight mt-1">2,500 Stars</h3>
            <p className="text-[10px] text-amber-100 font-medium leading-tight">Complete milestones and unlock special cards!</p>
          </div>
        </div>

        {/* Locked/Unlocked Badges Grid */}
        <div className="space-y-2.5 pb-4">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">My Badges ({DEFAULT_ACHIEVEMENTS.length})</span>

          {DEFAULT_ACHIEVEMENTS.map((ach) => (
            <div
              key={ach.id}
              className={`bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between transition-all ${
                ach.isLocked ? 'opacity-70 bg-slate-50/50' : 'opacity-100'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                {/* Badge Emblem Shape */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  ach.isCompleted
                    ? 'bg-green-50 text-green-500 border border-green-100'
                    : ach.isLocked
                    ? 'bg-slate-100 text-slate-400 border border-slate-200'
                    : 'bg-amber-50 text-amber-500 border border-amber-100'
                }`}>
                  {ach.icon === 'Trophy' && <Trophy size={20} className={ach.isCompleted ? 'fill-green-100' : ''} />}
                  {ach.icon === 'Flame' && <Flame size={20} className="fill-amber-100" />}
                  {ach.icon === 'Crown' && <Crown size={20} className="fill-purple-100" />}
                  {ach.icon === 'Target' && <Target size={20} />}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>{ach.title}</span>
                    {ach.isCompleted && (
                      <span className="w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <Check size={8} strokeWidth={3} />
                      </span>
                    )}
                  </h4>
                  <p className="text-[9px] text-slate-400 leading-snug mt-0.5">{ach.description}</p>

                  {/* Micro Progress Indicator */}
                  {!ach.isCompleted && !ach.isLocked && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-500 font-bold font-mono">{ach.progress}/{ach.maxProgress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reward Stars */}
              <div className="text-right shrink-0">
                <span className={`text-[10px] font-black block ${ach.isCompleted ? 'text-green-600' : ach.isLocked ? 'text-slate-400' : 'text-amber-600'}`}>
                  +{ach.points}
                </span>
                <span className="text-[8px] text-slate-400 font-medium">Stars</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );

  // Render Favorites Screen
  const renderFavorites = () => {
    // Collect game details for favorites list
    const favoritedGamesData = GAME_PLACEHOLDERS.filter(g => favorites.includes(g.id));

    return (
      <div id="favorites-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
        <BackHeader title="Favorites" />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-center flex flex-col justify-between">
          {favoritedGamesData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
              {/* Clean Heart Folder Illustration */}
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100/40">
                <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 30 C20 24, 24 20, 30 20 L45 20 C48 20, 50 22, 52 24 L58 30 L80 30 C86 30, 90 34, 90 40 L90 80 C90 86, 86 90, 80 90 L30 90 C24 90, 20 86, 20 80 Z" fill="#FEE2E2" />
                  <path d="M50 48 Q50 48, 47 45 C42 41, 35 41, 35 47 C35 52, 42 57, 50 64 C58 57, 65 52, 65 47 C65 41, 58 41, 53 45 Z" fill="#EF4444" />
                </svg>
              </div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">No favorite games yet.</h3>
              <p className="text-[10px] text-slate-400 max-w-[180px] leading-relaxed mt-1">Tap the heart icon on any game on the home screen to add it here!</p>

              <button
                onClick={handleExploreFavorites}
                className="mt-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[11px] py-2.5 px-6 rounded-full shadow-sm transition-all cursor-pointer"
              >
                Explore Games
              </button>
            </div>
          ) : (
            <div className="flex-1 text-left">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1 block mb-3">Saved Games ({favoritedGamesData.length})</span>
              <div className="grid grid-cols-2 gap-3.5">
                {favoritedGamesData.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => {
                      if (game.id === 'game-tictactoe') {
                        setCurrentScreen('tic-tac-toe');
                      } else {
                        onShowNotificationBanner(game.title, `${game.title} is ready soon!`);
                      }
                    }}
                    className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                  >
                    <button
                      onClick={(e) => toggleFavorite(game.id, e)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 rounded-full border border-slate-100 flex items-center justify-center text-red-500 active:scale-90 transition-all z-10"
                    >
                      <Heart size={14} className="fill-red-500 stroke-red-500" />
                    </button>

                    <div className="aspect-square w-full rounded-2xl bg-slate-50 mb-2 flex items-center justify-center">
                      <GameIconRenderer iconName={game.iconName} className="w-14 h-14" />
                    </div>

                    <div className="text-left mt-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{game.category}</span>
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-none mt-0.5">{game.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[9px] font-bold ${game.id === 'game-tictactoe' ? 'text-indigo-600 font-sans' : 'text-slate-400'}`}>
                          {game.id === 'game-tictactoe' ? 'Play Now ⚡' : 'Coming Soon'}
                        </span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${game.id === 'game-tictactoe' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          {game.id === 'game-tictactoe' ? '🎮' : <Lock size={9} />}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Simulated add box */}
                <div
                  onClick={() => setCurrentScreen('home')}
                  className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-3 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 active:scale-98 transition-all cursor-pointer aspect-square"
                >
                  <Plus size={24} className="mb-1" />
                  <span className="text-[10px] font-bold">Add Game</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    );
  };

  // Render Search Screen
  const renderSearch = () => (
    <div id="search-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
      {/* Dynamic Search Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-3.5 py-3 z-10 flex items-center space-x-2 shrink-0">
        <button
          onClick={() => setCurrentScreen('home')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 active:bg-slate-100 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 flex items-center px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/25 transition-all">
          <Search size={15} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search mini-games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-700 w-full focus:outline-none placeholder-slate-400 font-medium text-left"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left">
        {/* Category Selector Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">Categories</span>
          <div className="flex flex-wrap gap-1.5">
            {['All', 'Board', 'Strategy', 'Sports', 'Arcade'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  searchCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Search Results */}
        <div className="space-y-2 pb-4">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">
            {searchQuery || searchCategory !== 'All' ? 'Filtered Game Placeholders' : 'All Games List'}
          </span>

          {filteredGames.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center shadow-sm py-8">
              <span className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Search size={18} />
              </span>
              <h4 className="text-xs font-bold text-slate-700">No games found for "{searchQuery}"</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Try changing your search terms or picking another category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredGames.map((game) => {
                const isFav = favorites.includes(game.id);
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      if (game.id === 'game-tictactoe') {
                        setCurrentScreen('tic-tac-toe');
                      } else {
                        onShowNotificationBanner(game.title, `${game.title} is ready soon!`);
                      }
                    }}
                    className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                  >
                    <button
                      onClick={(e) => toggleFavorite(game.id, e)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 active:scale-90 transition-all z-10"
                    >
                      <Heart size={14} className={isFav ? 'fill-red-500 stroke-red-500' : ''} />
                    </button>

                    <div className="aspect-square w-full rounded-2xl bg-slate-50 mb-2 flex items-center justify-center">
                      <GameIconRenderer iconName={game.iconName} className="w-14 h-14" />
                    </div>

                    <div className="text-left mt-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{game.category}</span>
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-none mt-0.5">{game.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[9px] font-bold ${game.id === 'game-tictactoe' ? 'text-indigo-600 font-sans' : 'text-slate-400'}`}>
                          {game.id === 'game-tictactoe' ? 'Play Now ⚡' : 'Coming Soon'}
                        </span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${game.id === 'game-tictactoe' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          {game.id === 'game-tictactoe' ? '🎮' : <Lock size={9} />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );

  // Render Notifications Screen
  const renderNotifications = () => (
    <div id="notifications-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
      <BackHeader title="Alert Center" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-center">
        {notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 h-full">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-blue-500 fill-blue-50/50" />
            </div>
            <h3 className="text-xs font-black text-slate-800 tracking-tight">No notifications yet.</h3>
            <p className="text-[10px] text-slate-400 max-w-[170px] leading-relaxed mt-1">You are all caught up! Keep playing to earn stars and level badges.</p>

            <button
              onClick={handleTriggerTimeNotification}
              className="mt-6 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] py-2 px-4 rounded-full shadow-sm transition-all"
            >
              Simulate Warning
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 pb-4 text-left">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Recent Notifications ({notifications.length})</span>
              <button
                onClick={() => {
                  setNotifications([]);
                  onShowNotificationBanner('Notifications Cleared', 'All messages removed.');
                }}
                className="text-[10px] text-red-500 hover:underline font-bold"
              >
                Clear All
              </button>
            </div>

            {notifications.map((notif) => (
              <div key={notif.id} className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm flex items-start space-x-3">
                <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Bell size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{notif.title}</h4>
                    <span className="text-[8px] text-slate-400 font-medium whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{notif.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );

  // Render About Screen
  const renderAbout = () => (
    <div id="about-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10 pb-16">
      <BackHeader title="About PlayZone" target="settings" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-center">
        {/* Large Branding Header */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl">
              🎮
            </div>
            <div className="absolute -top-1.5 -right-1.5">
              <Crown size={18} className="text-yellow-400 fill-yellow-400 rotate-12" />
            </div>
          </div>
          <h2 className="text-sm font-black tracking-tight text-slate-800">PLAYZONE HUB</h2>
          <span className="text-[10px] font-black text-indigo-500 tracking-wider uppercase block mt-0.5">Version 1.0.0</span>
          <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5 max-w-[200px] mx-auto">
            A safe, premium, offline-first kids game platform with colorful minimalist visuals. Play, practice, and learn without ads or trackers.
          </p>
        </div>

        {/* Links lists */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">Legal & Information</span>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-3.5 flex items-center justify-between border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                 onClick={() => onShowNotificationBanner('Privacy Policy', 'Standard safe kids data rules apply. 🛡️')}>
              <span className="text-xs font-bold text-slate-700">Privacy Policy for Kids</span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            <div className="p-3.5 flex items-center justify-between border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                 onClick={() => onShowNotificationBanner('Terms of Service', 'End user terms are kids-friendly & completely ad-free.')}>
              <span className="text-xs font-bold text-slate-700">Terms of Service</span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                 onClick={() => onShowNotificationBanner('Credits', 'Designed with pure vector CSS components for speed & readability.')}>
              <span className="text-xs font-bold text-slate-700">Credits</span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 text-center font-medium pt-2">© 2026 PlayZone Game Studio Inc. <br /> All rights reserved.</p>
      </div>

      <BottomNav />
    </div>
  );

  // Render Parent Area (PIN Entry + Parent Settings Dashboard)
  const renderParentArea = () => {
    if (isParentUnlocked) {
      return (
        <div id="parent-dashboard-screen" className="absolute inset-0 bg-slate-50 flex flex-col z-10">
          <BackHeader title="Parents Dashboard" target="settings" />

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left">
            <div className="bg-emerald-500 rounded-3xl p-4 text-white shadow-sm flex items-center space-x-3.5 relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                <Shield size={100} />
              </div>

              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Shield size={28} className="text-white fill-emerald-100" />
              </div>
              <div>
                <span className="bg-white/20 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full tracking-wider uppercase">Unlocked Admin</span>
                <h3 className="text-sm font-black tracking-tight mt-0.5">Parent Settings</h3>
                <p className="text-[9px] text-emerald-100 leading-none">Configure playtime & restrictions safely.</p>
              </div>
            </div>

            {/* Time Controls */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">Daily Play limits</span>
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Time Limit:</span>
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {settings.screenTimeLimit === 0 ? 'Unlimited' : `${settings.screenTimeLimit} Minutes / Day`}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSettings(s => ({ ...s, screenTimeLimit: Math.max(0, s.screenTimeLimit - 15) }))}
                    className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${settings.screenTimeLimit === 0 ? 100 : Math.min(100, (settings.screenTimeLimit / 120) * 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, screenTimeLimit: s.screenTimeLimit === 0 ? 15 : Math.min(120, s.screenTimeLimit + 15) }))}
                    className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSettings(s => ({ ...s, screenTimeLimit: val }))}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        settings.screenTimeLimit === val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-500'
                      }`}
                    >
                      {val === 0 ? 'No Limit' : `${val} Mins`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Filters */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase ml-1">Kids Age Controls</span>
              <div className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm space-y-2">
                <div className="p-2.5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 rounded-2xl cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Strict Mode</span>
                    <span className="text-[9px] text-slate-400 font-medium">Only show preschool simple math & logic games</span>
                  </div>
                  <span className="bg-slate-100 text-slate-500 text-[8px] px-2 py-0.5 rounded-full font-bold">OFF</span>
                </div>

                <div className="p-2.5 flex items-center justify-between hover:bg-slate-50 rounded-2xl cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Offline Safety lock</span>
                    <span className="text-[9px] text-slate-400 font-medium">Prevent external downloads or online lobbies</span>
                  </div>
                  <span className="bg-green-100 text-green-700 text-[8px] px-2 py-0.5 rounded-full font-bold">ON</span>
                </div>
              </div>
            </div>

            {/* Admin actions */}
            <button
              onClick={() => {
                setIsParentUnlocked(false);
                setCurrentScreen('settings');
                onShowNotificationBanner('Security Locked', 'Settings have been securely locked again.');
              }}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer text-center"
            >
              Lock Settings Now
            </button>
          </div>
        </div>
      );
    }

    // Otherwise render standard PIN prompt keypad
    return (
      <div id="parent-pin-screen" className="absolute inset-0 bg-slate-950 flex flex-col justify-between py-10 px-6 z-20 select-none">
        {/* Header Back */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => setCurrentScreen('settings')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-400">Parents verification gate</span>
        </div>

        {/* Security Title & PIN dots */}
        <div className="text-center space-y-6">
          <div className="w-14 h-14 bg-red-950/40 rounded-full flex items-center justify-center mx-auto border border-red-900/40">
            <Lock className="text-red-500" size={24} />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">Parent Verification Gate</h2>
            <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1 leading-relaxed">
              Solve or enter PIN <span className="text-yellow-400 font-mono font-bold">1 2 3 4</span> to unlock system settings.
            </p>
          </div>

          {/* Code input dots display */}
          <div className="flex justify-center space-x-4 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const active = pinInput.length > idx;
              return (
                <span
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    pinError
                      ? 'bg-red-500 border-red-500 animate-bounce'
                      : active
                      ? 'bg-green-500 border-green-500 scale-110'
                      : 'border-slate-800 bg-transparent'
                  }`}
                />
              );
            })}
          </div>
          {pinError && <p className="text-[10px] text-red-500 font-bold animate-pulse">Incorrect PIN. Try again!</p>}
        </div>

        {/* Flat Numeric Keypad */}
        <div className="space-y-3 max-w-[240px] mx-auto w-full">
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handlePinPress(num)}
                className="aspect-square bg-slate-900/60 text-white font-extrabold text-base rounded-full hover:bg-slate-800 active:bg-slate-800/80 active:scale-95 transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                setPinInput('');
                setPinError(false);
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-white"
            >
              CLEAR
            </button>
            <button
              onClick={() => handlePinPress('0')}
              className="aspect-square bg-slate-900/60 text-white font-extrabold text-base rounded-full hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              onClick={() => setCurrentScreen('settings')}
              className="text-[10px] font-bold text-red-400 hover:text-red-300"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Switch statement for screens
  const screenContent = (() => {
    switch (currentScreen) {
      case 'splash':
        return renderSplash();
      case 'home':
        return renderHome();
      case 'settings':
        return renderSettings();
      case 'profile':
        return renderProfile();
      case 'achievements':
        return renderAchievements();
      case 'favorites':
        return renderFavorites();
      case 'search':
        return renderSearch();
      case 'notifications':
        return renderNotifications();
      case 'about':
        return renderAbout();
      case 'parent-area':
        return renderParentArea();
      case 'group-play':
        return (
          <GroupPlay
            onBack={() => setCurrentScreen('home')}
            theme={theme}
            soundEnabled={settings.soundEnabled}
            onAddCoins={(amount) => {
              setProfile(p => ({ ...p, coins: p.coins + amount }));
            }}
          />
        );
      case 'tic-tac-toe':
        return (
          <TicTacToeGame
            onBack={() => setCurrentScreen('home')}
            theme={theme}
            soundEnabled={settings.soundEnabled}
          />
        );
      default:
        return renderHome();
    }
  })();

  return (
    <div className="relative w-full h-full overflow-hidden">
      {screenContent}
      {showAvatarSelector && (
        <AvatarSelectionScreen
          onBack={() => setShowAvatarSelector(false)}
          selectedId={profile.avatarId}
          onSelect={(id) => {
            setProfile(p => ({ ...p, avatarId: id }));
          }}
          onContinue={() => {
            setShowAvatarSelector(false);
            const avName = DOODLE_AVATARS.find(av => av.id === profile.avatarId)?.name || 'Character';
            onShowNotificationBanner('Avatar Updated', `${avName} is now ready! ⚡`);
          }}
        />
      )}
    </div>
  );
};
