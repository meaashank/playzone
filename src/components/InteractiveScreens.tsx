/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Sun,
  Moon
} from 'lucide-react';
import { ScreenId, UserProfile, AppSettings, GamePlaceholder, Achievement } from '../types';
import { GAME_PLACEHOLDERS, AVATAR_OPTIONS, DEFAULT_ACHIEVEMENTS } from '../constants';
import { GameIconRenderer } from './GameIcons';
import { DoodleAvatar, AvatarSelectionScreen, DOODLE_AVATARS, AvatarCustomizerScreen } from './DoodleAvatars';
import { TicTacToeGame } from './TicTacToeGame';
import { GroupPlay } from './GroupPlay';
import { LudoClassicGame } from './LudoClassicGame';
import { SnakeGame } from './SnakeGame';
import { triggerVibration } from '../utils/vibration';

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
  onShowNotificationBanner: (title: string, message: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
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
  onShowNotificationBanner,
  theme = 'light',
  onToggleTheme = () => {},
}) => {
  // Local Screen states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [splashProgress, setSplashProgress] = useState(35);
  const [vibrateTestRipple, setVibrateTestRipple] = useState<string | null>(null);

  // Automatically progress splash screen
  useEffect(() => {
    if (currentScreen !== 'splash') {
      // Reset splash progress for the next time it is visited
      setSplashProgress(35);
      return;
    }

    const interval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // When progress reaches 100, transition to home
  useEffect(() => {
    if (currentScreen === 'splash' && splashProgress >= 100) {
      const timer = setTimeout(() => {
        setCurrentScreen('home');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [splashProgress, currentScreen, setCurrentScreen]);

  // Stop haptic feedback demo when haptic mode/intensity is changed
  useEffect(() => {
    setVibrateTestRipple(null);
  }, [settings.vibrationEnabled, settings.vibrationIntensity]);

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

  // Touch Swipe Gesture Navigation support for native-like feel
  const SWIPEABLE_SCREENS: ScreenId[] = ['home', 'group-play', 'favorites', 'achievements', 'profile'];
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Don't swipe if touching interactive elements or sliders/inputs
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('select') ||
      target.closest('[data-no-swipe]') ||
      target.closest('.no-swipe')
    ) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Must be mostly horizontal swipe of at least 60 pixels
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
      if (!SWIPEABLE_SCREENS.includes(currentScreen)) return;
      const currentIndex = SWIPEABLE_SCREENS.indexOf(currentScreen);
      
      if (diffX < 0) {
        // Swipe Left -> Next Tab
        if (currentIndex < SWIPEABLE_SCREENS.length - 1) {
          setCurrentScreen(SWIPEABLE_SCREENS[currentIndex + 1]);
        }
      } else {
        // Swipe Right -> Previous Tab
        if (currentIndex > 0) {
          setCurrentScreen(SWIPEABLE_SCREENS[currentIndex - 1]);
        }
      }
    }
  };

  // Add sample game for demo purposes
  const handleExploreFavorites = () => {
    setCurrentScreen('home');
  };

  // Bottom Nav Bar helper
  const BottomNav = () => {
    const isDark = theme === 'dark';
    return (
      <div 
        id="bottom-nav-container" 
        className={`absolute bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around px-2 z-20 transition-colors duration-300 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
        }`}
      >
        <button
          id="nav-home"
          onClick={() => setCurrentScreen('home')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
            currentScreen === 'home' 
              ? isDark ? 'text-indigo-400 bg-indigo-950/50 font-bold' : 'text-[#6C5CE7] bg-[#6C5CE7]/10 font-bold' 
              : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sparkles size={20} className={currentScreen === 'home' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-0.5 font-bold">Games</span>
        </button>

        <button
          id="nav-group-play"
          onClick={() => setCurrentScreen('group-play')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
            currentScreen === 'group-play' 
              ? isDark ? 'text-indigo-400 bg-indigo-950/50 font-bold' : 'text-[#6C5CE7] bg-[#6C5CE7]/10 font-bold' 
              : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users size={20} className={currentScreen === 'group-play' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-0.5 font-bold">Group</span>
        </button>

        <button
          id="nav-favorites"
          onClick={() => setCurrentScreen('favorites')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
            currentScreen === 'favorites' 
              ? 'text-[#FF7675] bg-[#FF7675]/10 font-bold' 
              : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Heart size={20} className={currentScreen === 'favorites' ? 'scale-110 fill-[#FF7675] stroke-[#FF7675]' : ''} />
          <span className="text-[10px] mt-0.5 font-bold">Favorites</span>
        </button>

        <button
          id="nav-achievements"
          onClick={() => setCurrentScreen('achievements')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
            currentScreen === 'achievements' 
              ? isDark ? 'text-amber-400 bg-amber-950/40 font-bold' : 'text-[#FFB300] bg-[#FFF8E1] font-bold' 
              : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Trophy size={20} className={currentScreen === 'achievements' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-0.5 font-bold">Badges</span>
        </button>

        <button
          id="nav-profile"
          onClick={() => setCurrentScreen('profile')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer ${
            currentScreen === 'profile' 
              ? isDark ? 'text-indigo-400 bg-indigo-950/50 font-bold' : 'text-[#6C5CE7] bg-[#6C5CE7]/10 font-bold' 
              : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <User size={20} className={currentScreen === 'profile' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-0.5 font-bold">Me</span>
        </button>
      </div>
    );
  };

  // Common Back Header
  const BackHeader = ({ title, target = 'home', actionButton }: { title: string; target?: ScreenId; actionButton?: React.ReactNode }) => {
    const isDark = theme === 'dark';
    return (
      <div id="screen-header" className={`sticky top-0 h-14 border-b flex items-center justify-between px-4 z-10 shrink-0 transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            id="header-back-btn"
            onClick={() => setCurrentScreen(target)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 active:bg-slate-100'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h2>
        </div>
        <div>
          {actionButton}
        </div>
      </div>
    );
  };

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
  const renderHome = () => {
    const isDark = theme === 'dark';
    return (
      <div id="home-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        {/* Top App Bar */}
        <div id="top-bar" className={`px-4 pt-3 pb-3 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentScreen('profile')}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center p-0.5 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#F1F3F5] border-slate-150'}`}>
              <DoodleAvatar id={profile.avatarId} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className={`text-xs font-bold max-w-[90px] truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.username}</span>
                <span className={`font-black text-[9px] px-1 rounded-full border ${isDark ? 'bg-amber-950/40 text-amber-400 border-amber-900/60' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>LV.{profile.level}</span>
              </div>
              <p className={`text-[10px] text-left ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gamer status: Active</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Coins/Stars counter */}
            <div
              className={`flex items-center space-x-1.5 border px-2.5 py-1.5 rounded-full shrink-0 ${
                isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50 border-amber-100'
              }`}
            >
              <Star className="text-amber-500 fill-amber-500" size={13} />
              <span className={`text-xs font-black tracking-tight font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{profile.coins}</span>
            </div>

            {/* Settings Shortcut Button */}
            <button
              id="settings-shortcut"
              onClick={() => setCurrentScreen('settings')}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 text-slate-500 active:bg-slate-100'
              }`}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Main Grid Content */}
        <div id="home-scroll-container" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* SEARCH BAR AT THE TOP OF THE HOME SCREEN */}
          <div className="relative animate-fade-in">
            <div className={`rounded-2xl border flex items-center px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-[#6C5CE7]/35 transition-all shadow-sm ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <Search size={15} className="text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Search specific games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent text-xs w-full focus:outline-none placeholder-slate-450 font-bold text-left ${
                  isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-700 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

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
                onClick={() => setSearchCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-sm whitespace-nowrap border ${
                  searchCategory === cat
                    ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white font-extrabold'
                    : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-white border-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchCategory('All');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 whitespace-nowrap border ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 border-slate-250 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <RefreshCw size={11} />
              <span>Clear</span>
            </button>
          </div>

          {/* Game List Grid / No Results Handling */}
          {filteredGames.length === 0 ? (
            <div className={`p-6 rounded-3xl border text-center shadow-sm py-10 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <span className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'
              }`}>
                <Search size={18} />
              </span>
              <h4 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                No matches found for "{searchQuery}"
              </h4>
              <p className={`text-[9px] mt-1 leading-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Try typing a different name or checking another category pill.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchCategory('All');
                }}
                className="mt-4 text-[10px] font-extrabold text-[#6C5CE7] bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/15 px-4 py-2 rounded-full transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 pb-4">
              {filteredGames.map((game) => {
                const isFav = favorites.includes(game.id);
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      if (game.id === 'game-tictactoe') {
                        setCurrentScreen('tic-tac-toe');
                      } else if (game.id === 'game-ludo') {
                        setCurrentScreen('ludo-classic');
                      } else if (game.id === 'game-snake') {
                        setCurrentScreen('snake-rush');
                      } else {
                        onShowNotificationBanner(game.title, `${game.title} is coming soon in the next major release! 🎮`);
                      }
                    }}
                    className={`border rounded-3xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md active:scale-[0.98] transition-all cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                    }`}
                  >
                    {/* Heart/Favorite toggle button */}
                    <button
                      onClick={(e) => toggleFavorite(game.id, e)}
                      className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full border flex items-center justify-center active:scale-90 transition-all z-10 ${
                        isDark ? 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-red-400' : 'bg-white/90 border-slate-100 text-slate-400 hover:text-red-500'
                      }`}
                    >
                      <Heart size={14} className={isFav ? 'fill-red-500 stroke-red-500' : ''} />
                    </button>

                    {/* Vector game illustration box */}
                    <div className={`aspect-square w-full rounded-2xl mb-2 flex items-center justify-center overflow-hidden transition-colors ${
                      isDark ? 'bg-slate-950' : 'bg-slate-50'
                    }`}>
                      <GameIconRenderer iconName={game.iconName} className="w-16 h-16 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Text Metadata */}
                    <div className="text-left mt-1">
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.category}</span>
                      <h4 className={`text-xs font-bold tracking-tight leading-none mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{game.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[9px] font-bold ${(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? 'text-indigo-400 font-sans' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          {(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? 'Play Now ⚡' : 'Coming Soon'}
                        </span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? 'bg-indigo-950 text-indigo-400' : isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                          {(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? '🎮' : <Lock size={9} />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    );
  };

  // Render Settings Screen
  const renderSettings = () => {
    const isDark = theme === 'dark';
    return (
      <div id="settings-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        <BackHeader title="Settings" />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left">
          {/* Profile Card Summary */}
          <div className={`p-3.5 rounded-3xl border flex items-center justify-between shadow-sm transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center p-0.5 border ${
                isDark ? 'bg-slate-850 border-slate-700' : 'bg-[#F1F3F5] border-slate-100'
              }`}>
                <DoodleAvatar id={profile.avatarId} className="w-full h-full" />
              </div>
              <div>
                <h3 className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile.username}</h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Manage settings & parents lock</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`font-bold text-[10px] px-3 py-1.5 rounded-full transition-all border ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
              }`}
            >
              Edit Profile
            </button>
          </div>

          {/* Theme Settings Toggle Option */}
          <div className="space-y-2 animate-fade-in">
            <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Appearance</span>
            <div className={`rounded-3xl border overflow-hidden shadow-sm transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-50 text-amber-500'
                  }`}>
                    {isDark ? <Moon size={16} /> : <Sun size={16} />}
                  </span>
                  <div>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Dark Theme</span>
                    <p className={`text-[9px] mt-0.5 leading-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isDark ? 'Dark theme is active' : 'Light theme is active'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleTheme}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${
                    isDark ? 'bg-[#6C5CE7]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    isDark ? 'translate-x-4' : 'translate-x-0'
                  } flex items-center justify-center`} >
                    {isDark ? <Moon size={9} className="text-[#6C5CE7]" /> : <Sun size={9} className="text-amber-500" />}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* System Settings Toggles */}
          <div className="space-y-2">
            <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sound & Feedback</span>
            <div className={`rounded-3xl border overflow-hidden shadow-sm transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              {/* Sound Toggle */}
              <div className={`p-3.5 flex items-center justify-between border-b ${isDark ? 'border-slate-800/60' : 'border-slate-50'}`}>
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-50 text-blue-500'}`}>
                    <Volume2 size={16} />
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Game Sounds</span>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${settings.soundEnabled ? 'bg-green-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Music Toggle */}
              <div className={`p-3.5 flex items-center justify-between border-b ${isDark ? 'border-slate-800/60' : 'border-slate-50'}`}>
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-950/40 text-purple-400' : 'bg-purple-50 text-purple-500'}`}>
                    <Music size={16} />
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Background Music</span>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, musicEnabled: !s.musicEnabled }))}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${settings.musicEnabled ? 'bg-green-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings.musicEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Vibration Toggle */}
              <div className={`p-3.5 flex items-center justify-between ${settings.vibrationEnabled ? isDark ? 'border-b border-slate-800/60' : 'border-b border-slate-50' : ''}`}>
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center animate-pulse ${isDark ? 'bg-orange-950/40 text-orange-400' : 'bg-orange-50 text-orange-500'}`}>
                    <Sparkles size={16} />
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Tactile Vibration</span>
                </div>
                <button
                  onClick={() => {
                    const nextVibe = !settings.vibrationEnabled;
                    setSettings(s => ({ ...s, vibrationEnabled: nextVibe }));
                    if (nextVibe) {
                      setTimeout(() => {
                        triggerVibration(settings.vibrationIntensity || 'medium');
                      }, 80);
                    }
                  }}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${settings.vibrationEnabled ? 'bg-green-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings.vibrationEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Vibration Intensity Option (Conditional on vibrationEnabled) */}
              {settings.vibrationEnabled && (
                <div className={`px-4 pb-4 pt-3 flex flex-col space-y-3.5 text-left border-t transition-colors ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black tracking-wider uppercase ml-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Haptic Feedback Intensity</span>
                    <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/40 uppercase tracking-wider font-mono">
                      {settings.vibrationIntensity || 'medium'}
                    </span>
                  </div>

                  {/* Range Slider Control */}
                  <div className="space-y-2">
                    <div className="relative pt-1">
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={
                          (settings.vibrationIntensity || 'medium') === 'tick' ? 1 :
                          (settings.vibrationIntensity || 'medium') === 'light' ? 2 :
                          (settings.vibrationIntensity || 'medium') === 'medium' ? 3 : 4
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const intensity = val === 1 ? 'tick' : val === 2 ? 'light' : val === 3 ? 'medium' : 'heavy';
                          setSettings(s => ({ ...s, vibrationIntensity: intensity }));
                          triggerVibration(intensity);
                        }}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 transition-all"
                      />
                      {/* Tick labels */}
                      <div className="flex justify-between text-[8px] text-slate-400 font-black px-0.5 pt-1.5 font-mono tracking-tighter">
                        <span className={settings.vibrationIntensity === 'tick' ? 'text-orange-600 font-extrabold' : ''}>TICK</span>
                        <span className={settings.vibrationIntensity === 'light' ? 'text-orange-600 font-extrabold' : ''}>LIGHT</span>
                        <span className={settings.vibrationIntensity === 'medium' ? 'text-orange-600 font-extrabold' : ''}>MEDIUM</span>
                        <span className={settings.vibrationIntensity === 'heavy' ? 'text-orange-600 font-extrabold' : ''}>HEAVY</span>
                      </div>
                    </div>
                  </div>

                  {/* Tactile Preview Zone */}
                  <div className={`rounded-2xl p-3 border flex flex-col items-center justify-center space-y-2 relative overflow-hidden transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
                  }`}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tap to Feel Pulse</span>
                    
                    {/* Test Wave Button */}
                    <button
                      onClick={() => {
                        const currentIntensity = settings.vibrationIntensity || 'medium';
                        triggerVibration(currentIntensity);
                        
                        // Trigger visual ripple confirmation
                        setVibrateTestRipple(null);
                        setTimeout(() => {
                          setVibrateTestRipple(currentIntensity);
                        }, 10);
                      }}
                      className="relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 active:scale-95 text-white flex items-center justify-center shadow-md transition-all z-10 cursor-pointer"
                    >
                      <Sparkles size={16} className="animate-pulse" />

                      {/* Visual ripple expansion effect based on intensity */}
                      {vibrateTestRipple && (
                        <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none">
                          <span 
                            className={`absolute w-full h-full rounded-full border opacity-75 animate-ping ${
                              vibrateTestRipple === 'tick' ? 'border-cyan-400 bg-cyan-400/20 [animation-duration:0.25s]' :
                              vibrateTestRipple === 'light' ? 'border-sky-400 bg-sky-400/20 [animation-duration:0.45s]' :
                              vibrateTestRipple === 'medium' ? 'border-indigo-500 bg-indigo-500/20 [animation-duration:0.65s]' :
                              'border-rose-500 bg-rose-500/30 [animation-duration:0.85s] border-2 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                            }`}
                            onAnimationEnd={() => setVibrateTestRipple(null)}
                          />
                        </div>
                      )}
                    </button>

                    <div className="text-[9px] text-slate-400 text-center leading-normal">
                      {settings.vibrationIntensity === 'tick' && "Subtle micro-pulse vibration."}
                      {settings.vibrationIntensity === 'light' && "Gentle tap, perfect for quiet game rooms."}
                      {settings.vibrationIntensity === 'medium' && "Standard haptic tactile feedback level."}
                      {settings.vibrationIntensity === 'heavy' && "Intense physical rumble response."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* General Options */}
          <div className="space-y-2">
            <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>General Info</span>
            <div className={`rounded-3xl border overflow-hidden shadow-sm transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              {/* Language */}
              <div className={`p-3.5 flex items-center justify-between border-b cursor-pointer transition-colors ${
                isDark ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-50 hover:bg-slate-50'
              }`}
                   onClick={() => {
                     const langs = ['English', 'Español', 'Français'];
                     const idx = (langs.indexOf(settings.language) + 1) % langs.length;
                     setSettings(s => ({ ...s, language: langs[idx] }));
                     onShowNotificationBanner('Language Changed', `App set to ${langs[idx]}.`);
                   }}>
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${isDark ? 'bg-sky-950/40 text-sky-400' : 'bg-sky-50 text-sky-500'}`}>EN</span>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Language</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{settings.language}</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Privacy Policy */}
              <div className={`p-3.5 flex items-center justify-between border-b cursor-pointer transition-colors ${
                isDark ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-50 hover:bg-slate-50'
              }`}
                   onClick={() => setCurrentScreen('about')}>
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-500'}`}>
                    <FileText size={16} />
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Privacy Policy</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </div>

              {/* Help & About */}
              <div className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
              }`}
                   onClick={() => setCurrentScreen('about')}>
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-950/40 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                    <HelpCircle size={16} />
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>About App</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  };

  // Render Profile Screen
  const renderProfile = () => {
    const isDark = theme === 'dark';
    return (
      <div id="profile-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        <BackHeader title="My Profile" target="home" />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-left">
          {/* Profile Identity Frame */}
          <div className="bg-gradient-to-b from-purple-500 to-indigo-600 rounded-3xl p-5 text-center text-white relative shadow-sm overflow-hidden">
            <div className="absolute right-[-15px] top-[-15px] opacity-10">
              <Crown size={96} className="rotate-45" />
            </div>

            <div className="relative inline-block mx-auto mb-3">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md border-4 p-1 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#F1F3F5] border-white/90'}`}>
                <DoodleAvatar id={profile.avatarId} className="w-full h-full" />
              </div>
              {/* Edit avatar pencil float */}
              <button
                onClick={() => setShowAvatarCustomizer(true)}
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
            <div className={`rounded-2xl p-3 border text-center shadow-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className={`text-[9px] font-black block uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Stars</span>
              <div className="flex items-center justify-center text-xs font-black text-amber-500 mt-1">
                <Star size={12} className="fill-amber-500 mr-1" />
                <span>{profile.coins}</span>
              </div>
            </div>
            <div className={`rounded-2xl p-3 border text-center shadow-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className={`text-[9px] font-black block uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Won</span>
              <div className="flex items-center justify-center text-xs font-black text-green-600 mt-1">
                <Trophy size={12} className="mr-1 text-green-500" />
                <span>85</span>
              </div>
            </div>
            <div className={`rounded-2xl p-3 border text-center shadow-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className={`text-[9px] font-black block uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Level</span>
              <div className="flex items-center justify-center text-xs font-black text-purple-600 mt-1">
                <Crown size={12} className="mr-1 text-purple-500" />
                <span>{profile.level}</span>
              </div>
            </div>
          </div>

          {/* Avatar Modal Selector Trigger / Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className={`text-[10px] font-black tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Select Character</span>
              <button
                onClick={() => setShowAvatarCustomizer(true)}
                className="text-[11px] font-extrabold text-[#6C5CE7] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Sparkles size={11} />
                <span>Customize Avatar</span>
              </button>
            </div>

            {/* Inline Selection List with Doodle Avatars Preview */}
            <div className={`rounded-[28px] p-3 border shadow-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="grid grid-cols-6 gap-2">
                {DOODLE_AVATARS.slice(0, 6).map((av) => (
                  <button
                    key={av.id}
                    onClick={() => {
                      setProfile(p => ({ ...p, avatarId: av.id }));
                      onShowNotificationBanner('Avatar Updated', `Say hello to ${av.name}! 👋`);
                    }}
                    className={`aspect-square rounded-2xl flex items-center justify-center p-1.5 cursor-pointer transition-all border-2 ${
                      profile.avatarId === av.id
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 scale-105 shadow-md'
                        : isDark
                          ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 hover:scale-102'
                          : 'border-slate-50 bg-[#F8F9FA] hover:bg-slate-100 hover:scale-102'
                    }`}
                    title={av.name}
                  >
                    <DoodleAvatar id={av.id} className="w-full h-full" />
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowAvatarSelector(true)}
                className={`w-full mt-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                  isDark
                    ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/20 text-[#6C5CE7] hover:bg-[#6C5CE7]/15'
                    : 'bg-[#6C5CE7]/5 border-transparent text-[#6C5CE7] hover:bg-[#6C5CE7]/10'
                }`}
              >
                <span>View All 24 Doodle Characters</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  };

  // Render Achievements Screen
  const renderAchievements = () => {
    const isDark = theme === 'dark';
    return (
      <div id="achievements-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        <BackHeader
          title="Badges & Rewards"
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
            <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>My Badges ({DEFAULT_ACHIEVEMENTS.length})</span>

            {DEFAULT_ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className={`rounded-3xl p-3.5 border shadow-sm flex items-center justify-between transition-all ${
                  isDark
                    ? ach.isLocked 
                      ? 'bg-slate-900/40 border-slate-900/60 opacity-60' 
                      : 'bg-slate-900 border-slate-800'
                    : ach.isLocked 
                      ? 'opacity-70 bg-slate-50/50 border-slate-100' 
                      : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  {/* Badge Emblem Shape */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    ach.isCompleted
                      ? isDark ? 'bg-green-950/40 text-green-400 border border-green-900/50' : 'bg-green-50 text-green-500 border border-green-100'
                      : ach.isLocked
                      ? isDark ? 'bg-slate-850 text-slate-500 border border-slate-800' : 'bg-slate-100 text-slate-400 border border-slate-200'
                      : isDark ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' : 'bg-amber-50 text-amber-500 border border-amber-100'
                  }`}>
                    {ach.icon === 'Trophy' && <Trophy size={20} className={ach.isCompleted ? 'fill-green-100' : ''} />}
                    {ach.icon === 'Flame' && <Flame size={20} className="fill-amber-100" />}
                    {ach.icon === 'Crown' && <Crown size={20} className="fill-purple-100" />}
                    {ach.icon === 'Target' && <Target size={20} />}
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold flex items-center space-x-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <span>{ach.title}</span>
                      {ach.isCompleted && (
                        <span className="w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center text-white">
                          <Check size={8} strokeWidth={3} />
                        </span>
                      )}
                    </h4>
                    <p className={`text-[9px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{ach.description}</p>

                    {/* Micro Progress Indicator */}
                    {!ach.isCompleted && !ach.isLocked && (
                      <div className="mt-2 flex items-center space-x-2">
                        <div className={`w-24 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                          />
                        </div>
                        <span className={`text-[8px] font-bold font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ach.progress}/{ach.maxProgress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reward Stars */}
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-black block ${ach.isCompleted ? 'text-green-500' : ach.isLocked ? 'text-slate-400' : 'text-amber-500'}`}>
                    +{ach.points}
                  </span>
                  <span className="text-[8px] text-slate-500 font-medium">Stars</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    );
  };

  // Render Favorites Screen
  const renderFavorites = () => {
    const isDark = theme === 'dark';
    // Collect game details for favorites list
    const favoritedGamesData = GAME_PLACEHOLDERS.filter(g => favorites.includes(g.id));

    return (
      <div id="favorites-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        <BackHeader title="Favorites" />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-center flex flex-col justify-between">
          {favoritedGamesData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
              {/* Clean Heart Folder Illustration */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-red-50 border-red-100/40'}`}>
                <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 30 C20 24, 24 20, 30 20 L45 20 C48 20, 50 22, 52 24 L58 30 L80 30 C86 30, 90 34, 90 40 L90 80 C90 86, 86 90, 80 90 L30 90 C24 90, 20 86, 20 80 Z" fill={isDark ? '#3B0712' : '#FEE2E2'} />
                  <path d="M50 48 Q50 48, 47 45 C42 41, 35 41, 35 47 C35 52, 42 57, 50 64 C58 57, 65 52, 65 47 C65 41, 58 41, 53 45 Z" fill="#EF4444" />
                </svg>
              </div>
              <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No favorite games yet.</h3>
              <p className={`text-[10px] max-w-[180px] leading-relaxed mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tap the heart icon on any game on the home screen to add it here!</p>

              <button
                onClick={handleExploreFavorites}
                className="mt-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[11px] py-2.5 px-6 rounded-full shadow-sm transition-all cursor-pointer"
              >
                Explore Games
              </button>
            </div>
          ) : (
            <div className="flex-1 text-left">
              <span className={`text-[10px] font-black tracking-wider uppercase ml-1 block mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Saved Games ({favoritedGamesData.length})</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {favoritedGamesData.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => {
                      if (game.id === 'game-tictactoe') {
                        setCurrentScreen('tic-tac-toe');
                      } else if (game.id === 'game-ludo') {
                        setCurrentScreen('ludo-classic');
                      } else if (game.id === 'game-snake') {
                        setCurrentScreen('snake-rush');
                      } else {
                        onShowNotificationBanner(game.title, `${game.title} is ready soon!`);
                      }
                    }}
                    className={`border rounded-3xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                    }`}
                  >
                    <button
                      onClick={(e) => toggleFavorite(game.id, e)}
                      className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full border flex items-center justify-center text-red-500 active:scale-90 transition-all z-10 ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white/90 border-slate-100'
                      }`}
                    >
                      <Heart size={14} className="fill-red-500 stroke-red-500" />
                    </button>

                    <div className={`aspect-square w-full rounded-2xl mb-2 flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                      <GameIconRenderer iconName={game.iconName} className="w-14 h-14" />
                    </div>

                    <div className="text-left mt-1">
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.category}</span>
                      <h4 className={`text-xs font-bold tracking-tight leading-none mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{game.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[9px] font-bold ${(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? isDark ? 'text-indigo-400 font-sans' : 'text-indigo-600 font-sans' : 'text-slate-400'}`}>
                          {(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? 'Play Now ⚡' : 'Coming Soon'}
                        </span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? isDark ? 'bg-indigo-950/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600' : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                          {(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? '🎮' : <Lock size={9} />}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Simulated add box */}
                <div
                  onClick={() => setCurrentScreen('home')}
                  className={`border-2 border-dashed rounded-3xl p-3 flex flex-col items-center justify-center active:scale-98 transition-all cursor-pointer aspect-square ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400' 
                      : 'bg-slate-105 border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
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
  const renderSearch = () => {
    const isDark = theme === 'dark';
    return (
      <div id="search-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        {/* Dynamic Search Header */}
        <div className={`sticky top-0 border-b px-3.5 py-3 z-10 flex items-center space-x-2 shrink-0 transition-colors duration-300 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <button
            onClick={() => setCurrentScreen('home')}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 active:bg-slate-100'
            }`}
          >
            <ArrowLeft size={16} />
          </button>

          <div className={`flex-1 rounded-2xl border flex items-center px-3 py-1.5 transition-all ${
            isDark ? 'bg-slate-950 border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20' : 'bg-slate-50 border-slate-100 focus-within:ring-2 focus-within:ring-blue-500/25'
          }`}>
            <Search size={15} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search mini-games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent text-xs w-full focus:outline-none font-medium text-left ${isDark ? 'text-slate-200 placeholder-slate-600' : 'text-slate-700 placeholder-slate-400'}`}
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
            <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Categories</span>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Board', 'Strategy', 'Sports', 'Arcade'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSearchCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    searchCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark
                        ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850'
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
            <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {searchQuery || searchCategory !== 'All' ? 'Filtered Game Placeholders' : 'All Games List'}
            </span>

            {filteredGames.length === 0 ? (
              <div className={`p-6 rounded-3xl border text-center shadow-sm py-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <span className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                  <Search size={18} />
                </span>
                <h4 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No games found for "{searchQuery}"</h4>
                <p className={`text-[9px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Try changing your search terms or picking another category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {filteredGames.map((game) => {
                  const isFav = favorites.includes(game.id);
                  return (
                    <div
                      key={game.id}
                      onClick={() => {
                        if (game.id === 'game-tictactoe') {
                          setCurrentScreen('tic-tac-toe');
                        } else if (game.id === 'game-ludo') {
                          setCurrentScreen('ludo-classic');
                        } else if (game.id === 'game-snake') {
                          setCurrentScreen('snake-rush');
                        } else {
                          onShowNotificationBanner(game.title, `${game.title} is ready soon!`);
                        }
                      }}
                      className={`border rounded-3xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                      }`}
                    >
                      <button
                        onClick={(e) => toggleFavorite(game.id, e)}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full border flex items-center justify-center text-slate-400 hover:text-red-500 active:scale-90 transition-all z-10 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white/90 border-slate-100'
                        }`}
                      >
                        <Heart size={14} className={isFav ? 'fill-red-500 stroke-red-500 text-red-500' : ''} />
                      </button>

                      <div className={`aspect-square w-full rounded-2xl mb-2 flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                        <GameIconRenderer iconName={game.iconName} className="w-14 h-14" />
                      </div>

                      <div className="text-left mt-1">
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.category}</span>
                        <h4 className={`text-xs font-bold tracking-tight leading-none mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{game.title}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[9px] font-bold ${(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? isDark ? 'text-indigo-400 font-sans' : 'text-indigo-600 font-sans' : 'text-slate-400'}`}>
                            {(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? 'Play Now ⚡' : 'Coming Soon'}
                          </span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? isDark ? 'bg-indigo-950/45 text-indigo-400' : 'bg-indigo-50 text-indigo-600' : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                            {(game.id === 'game-tictactoe' || game.id === 'game-ludo' || game.id === 'game-snake') ? '🎮' : <Lock size={9} />}
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
  };

  // Render Notifications Screen
  const renderNotifications = () => {
    const isDark = theme === 'dark';
    return (
      <div id="notifications-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        <BackHeader title="Alert Center" />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-center">
          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 h-full">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-indigo-950/40 text-indigo-400' : 'bg-blue-50 text-blue-500'}`}>
                <Bell size={32} className={isDark ? '' : 'fill-blue-50/50'} />
              </div>
              <h3 className={`text-xs font-black tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No notifications yet.</h3>
              <p className={`text-[10px] max-w-[170px] leading-relaxed mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>You are all caught up! Keep playing to earn stars and level badges.</p>

              <button
                onClick={() => {
                  const uniqueId = `notif-${Date.now()}`;
                  const newNotif = {
                    id: uniqueId,
                    title: '🌟 Bonus Stars Awarded',
                    body: 'You unlocked the PlayZone Explorer achievement! Keep it up! ⚡',
                    time: 'Just Now',
                    read: false
                  };
                  setNotifications([newNotif, ...notifications]);
                  onShowNotificationBanner(newNotif.title, newNotif.body);
                }}
                className="mt-6 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] py-2 px-4 rounded-full shadow-sm transition-all"
              >
                Trigger Milestone
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 pb-4 text-left">
              <div className="flex items-center justify-between px-1">
                <span className={`text-[10px] font-black tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Recent Notifications ({notifications.length})</span>
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
                <div key={notif.id} className={`rounded-3xl p-3.5 border shadow-sm flex items-start space-x-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-50 text-amber-500'}`}>
                    <Bell size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{notif.title}</h4>
                      <span className={`text-[8px] font-medium whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{notif.time}</span>
                    </div>
                    <p className={`text-[10px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{notif.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    );
  };

  // Render About Screen
  const renderAbout = () => {
    const isDark = theme === 'dark';
    return (
      <div id="about-screen" className={`absolute inset-0 flex flex-col z-10 pb-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'}`}>
        <BackHeader title="About PlayZone" target="settings" />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-center">
          {/* Large Branding Header */}
          <div className={`border p-6 rounded-3xl shadow-sm text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="relative inline-block mx-auto mb-3">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl">
                🎮
              </div>
              <div className="absolute -top-1.5 -right-1.5">
                <Crown size={18} className="text-yellow-400 fill-yellow-400 rotate-12" />
              </div>
            </div>
            <h2 className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>PLAYZONE HUB</h2>
            <span className="text-[10px] font-black text-indigo-400 tracking-wider uppercase block mt-0.5">Version 1.0.0</span>
            <p className={`text-[10px] leading-relaxed mt-2.5 max-w-[200px] mx-auto ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              A safe, premium, offline-first kids game platform with colorful minimalist visuals. Play, practice, and learn without ads or trackers.
            </p>
          </div>

          {/* Links lists */}
          <div className="space-y-2 text-left">
            <span className={`text-[10px] font-black tracking-wider uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Legal & Information</span>
            <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className={`p-3.5 flex items-center justify-between border-b cursor-pointer transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-850' : 'border-slate-50 hover:bg-slate-50'}`}
                   onClick={() => onShowNotificationBanner('Privacy Policy', 'Standard safe kids data rules apply. 🛡️')}>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Privacy Policy for Kids</span>
                <ChevronRight size={14} className="text-slate-400" />
              </div>

              <div className={`p-3.5 flex items-center justify-between border-b cursor-pointer transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-850' : 'border-slate-50 hover:bg-slate-50'}`}
                   onClick={() => onShowNotificationBanner('Terms of Service', 'End user terms are kids-friendly & completely ad-free.')}>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Terms of Service</span>
                <ChevronRight size={14} className="text-slate-400" />
              </div>

              <div className={`p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors`}
                   onClick={() => onShowNotificationBanner('Credits', 'Designed with pure vector CSS components for speed & readability.')}>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Credits</span>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 text-center font-medium pt-2">© 2026 PlayZone Game Studio Inc. <br /> All rights reserved.</p>
        </div>

      <BottomNav />
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
      case 'ludo-classic':
        return (
          <LudoClassicGame
            onBack={() => setCurrentScreen('home')}
            theme={theme}
            soundEnabled={settings.soundEnabled}
          />
        );
      case 'snake-rush':
        return (
          <SnakeGame
            onBack={() => setCurrentScreen('home')}
            theme={theme}
            soundEnabled={settings.soundEnabled}
            onAddCoins={(amount) => {
              setProfile(p => ({ ...p, coins: p.coins + amount }));
            }}
            onAddXP={(amount) => {
              setProfile(p => {
                const nextXp = p.xp + amount;
                const nextLevel = nextXp >= 100 ? p.level + 1 : p.level;
                const finalXp = nextXp >= 100 ? nextXp - 100 : nextXp;
                if (nextLevel > p.level) {
                  setTimeout(() => {
                    onShowNotificationBanner('🎉 LEVEL UP!', `Congratulations, you reached Level ${nextLevel}!`);
                  }, 400);
                }
                return { ...p, level: nextLevel, xp: finalXp };
              });
            }}
          />
        );
      default:
        return renderHome();
    }
  })();

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
      {showAvatarCustomizer && (
        <AvatarCustomizerScreen
          onBack={() => setShowAvatarCustomizer(false)}
          selectedId={profile.avatarId}
          onSave={(serializedId) => {
            setProfile(p => ({ ...p, avatarId: serializedId }));
            setShowAvatarCustomizer(false);
            onShowNotificationBanner('Avatar Customized', 'Your custom avatar is now ready! 🎨✨');
          }}
        />
      )}
    </div>
  );
};
