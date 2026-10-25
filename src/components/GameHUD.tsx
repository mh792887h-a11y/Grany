import React, { useState, useEffect } from 'react';
import { GameItem } from '../game/items';
import {
  Volume2,
  VolumeX,
  Flashlight,
  Eye,
  Key,
  Shield,
  Layers,
  ArrowDown,
  Sparkles,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudio';

interface GameHUDProps {
  currentDay: number;
  heldItem: GameItem | null;
  interactionPrompt: string | null;
  soundLevel: number; // 0 to 1
  isFlashlightOn: boolean;
  isPlayerHidden: boolean;
  hidingSpotName: string | null;
  onDropItem: () => void;
  onToggleFlashlight: () => void;
  onToggleCrouch: () => void;
  onInteract: () => void;
  onPause: () => void;
  onMobileMove: (vec: { x: number; y: number }) => void;
  onMobileLook: (dx: number, dy: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentDay,
  heldItem,
  interactionPrompt,
  soundLevel,
  isFlashlightOn,
  isPlayerHidden,
  hidingSpotName,
  onDropItem,
  onToggleFlashlight,
  onToggleCrouch,
  onInteract,
  onPause,
  onMobileMove,
  onMobileLook,
}) => {
  const [isMuted, setIsMuted] = useState(horrorAudio.getMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [touchActive, setTouchActive] = useState(false);

  // Sound meter decay
  const [displayNoise, setDisplayNoise] = useState(0);

  useEffect(() => {
    if (soundLevel > displayNoise) {
      setDisplayNoise(soundLevel);
    }
  }, [soundLevel]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayNoise((prev) => Math.max(0, prev - 0.08));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    horrorAudio.setMuted(next);
  };

  // Touch joystick tracking
  const handleJoystickTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (touch.clientX - centerX) / (rect.width / 2);
    const dy = (touch.clientY - centerY) / (rect.height / 2);
    // clamp
    const len = Math.sqrt(dx * dx + dy * dy);
    const clampedDx = len > 1 ? dx / len : dx;
    const clampedDy = len > 1 ? dy / len : dy;
    onMobileMove({ x: clampedDx, y: -clampedDy });
  };

  const handleJoystickEnd = () => {
    onMobileMove({ x: 0, y: 0 });
  };

  // Touch swipe to look
  let lastTouchX = 0;
  let lastTouchY = 0;

  const handleLookTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  };

  const handleLookTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const dx = (touch.clientX - lastTouchX) * 0.005;
    const dy = (touch.clientY - lastTouchY) * 0.005;
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
    onMobileLook(dx, dy);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-['Tajawal'] text-white overflow-hidden">
      {/* Horror Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.8)_100%)]" />

      {/* When Hiding: Slatted / dark eye mask */}
      {isPlayerHidden && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center border-y-[40px] border-black transition-all">
          <div className="bg-red-950/80 border border-red-700/60 text-red-200 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-2xl">
            <Eye className="w-5 h-5 text-red-400 animate-pulse" />
            <span>مختبئ في {hidingSpotName || 'مكان آمن'} - اضغط E أو زر التفاعل للخروج</span>
          </div>
        </div>
      )}

      {/* TOP BAR: Day counter, Noise meter, Mute, Pause */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
        {/* Day Indicator */}
        <div className="flex items-center gap-2 bg-zinc-950/80 border border-red-900/60 px-4 py-2 rounded-lg shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span className="text-red-500 font-black text-sm sm:text-base font-['Changa']">
            اليوم {currentDay} من 5
          </span>
        </div>

        {/* Noise Meter (Sound Bar) */}
        <div className="hidden sm:flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-lg shadow">
          <span className="text-xs text-zinc-400">مستوى الضجيج:</span>
          <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                displayNoise > 0.6
                  ? 'bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  : displayNoise > 0.3
                  ? 'bg-yellow-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, displayNoise * 100)}%` }}
            />
          </div>
          {displayNoise > 0.6 && (
            <span className="text-[10px] text-red-400 font-bold animate-pulse">العجوز تسمعك!</span>
          )}
        </div>

        {/* Top-Right Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded bg-zinc-950/80 border border-zinc-800 hover:border-zinc-600 text-zinc-300 transition-colors"
            title="تعليمات اللعب"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            className="p-2 rounded bg-zinc-950/80 border border-zinc-800 hover:border-zinc-600 text-zinc-300 transition-colors"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onPause}
            className="p-2 rounded bg-zinc-950/80 border border-zinc-800 hover:border-zinc-600 text-zinc-300 transition-colors"
            title="إيقاف مؤقت"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER CROSSHAIR & PROMPT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Reticle Dot */}
        <div
          className={`w-2 h-2 rounded-full transition-all ${
            interactionPrompt ? 'bg-red-500 scale-150 ring-4 ring-red-500/30' : 'bg-white/60'
          }`}
        />

        {/* Interactive Prompt Tooltip */}
        {interactionPrompt && (
          <div className="mt-4 px-4 py-2 bg-black/85 border border-red-600/70 text-zinc-100 rounded-md text-sm font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="bg-red-900/80 text-white px-2 py-0.5 rounded text-xs font-mono">E</span>
            <span>{interactionPrompt}</span>
          </div>
        )}
      </div>

      {/* BOTTOM COLLAPSIBLE DOCK: Held Item & Quick Actions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 bg-zinc-950/90 border border-zinc-800/90 px-4 py-2.5 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.8)] max-w-[94vw]">
        {/* Held Item Status */}
        <div className="flex items-center gap-2 pr-2 border-l border-zinc-800 pl-4">
          <div className="w-9 h-9 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            {heldItem ? (
              heldItem.type === 'crowbar' ? (
                <Shield className="w-5 h-5 text-red-400" />
              ) : heldItem.type === 'padlock_key' ? (
                <Key className="w-5 h-5 text-blue-400" />
              ) : heldItem.type === 'code_paper' ? (
                <Layers className="w-5 h-5 text-amber-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-zinc-300" />
              )
            ) : (
              <span className="text-[10px] text-zinc-600">فارغ</span>
            )}
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] text-zinc-500">الأداة في يدك:</span>
            <span className="text-xs font-bold text-zinc-200">
              {heldItem ? heldItem.nameAr : 'لا تحمل شيئاً'}
            </span>
          </div>

          {heldItem && (
            <button
              onClick={onDropItem}
              className="mr-2 px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-[11px] rounded transition-colors"
              title="إسقاط الأداة (Q)"
            >
              إسقاط (Q)
            </button>
          )}
        </div>

        {/* Flashlight Button */}
        <button
          onClick={onToggleFlashlight}
          className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs ${
            isFlashlightOn
              ? 'bg-amber-950/70 border-amber-600 text-amber-200 shadow-[0_0_10px_rgba(217,119,6,0.2)]'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}
          title="تبديل المصباح (F)"
        >
          <Flashlight className="w-4 h-4" />
          <span className="hidden sm:inline">{isFlashlightOn ? 'مضاء' : 'مطفأ'} (F)</span>
        </button>

        {/* Crouch Button */}
        <button
          onClick={onToggleCrouch}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5 text-xs"
          title="القرفصاء / التسلل (C)"
        >
          <ArrowDown className="w-4 h-4" />
          <span className="hidden sm:inline">تسلل (C)</span>
        </button>
      </div>

      {/* MOBILE TOUCH CONTROLS (Visible on touch devices / small screens) */}
      <div className="sm:hidden absolute inset-0 pointer-events-none">
        {/* Left Joystick Area */}
        <div
          className="absolute bottom-20 left-4 w-28 h-28 rounded-full border-2 border-zinc-700/60 bg-black/40 pointer-events-auto flex items-center justify-center touch-none"
          onTouchMove={handleJoystickTouch}
          onTouchEnd={handleJoystickEnd}
        >
          <div className="w-10 h-10 rounded-full bg-red-600/60 border border-red-400" />
        </div>

        {/* Right Touch Swipe Area for Looking */}
        <div
          className="absolute top-20 bottom-24 right-0 w-1/2 pointer-events-auto touch-none"
          onTouchStart={handleLookTouchStart}
          onTouchMove={handleLookTouchMove}
        />

        {/* Mobile Action Buttons */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2.5 pointer-events-auto">
          <button
            onClick={onInteract}
            className="w-12 h-12 rounded-full bg-red-700 border-2 border-red-400 text-white font-bold flex items-center justify-center text-xs shadow-lg active:scale-95"
          >
            تفاعل
          </button>
          <button
            onClick={onToggleCrouch}
            className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center justify-center active:scale-95 text-[11px]"
          >
            قرفصاء
          </button>
        </div>
      </div>

      {/* IN-GAME HELP MODAL */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/85 pointer-events-auto flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-red-900/80 rounded-xl max-w-md w-full p-6 text-right shadow-2xl">
            <h2 className="text-xl font-bold font-['Changa'] text-red-500 mb-3 border-b border-red-950 pb-2">
              كيفية الهروب من بيت العجوز:
            </h2>
            <ul className="text-sm text-zinc-300 space-y-2.5 leading-relaxed">
              <li>
                <strong className="text-white">🚪 الباب الرئيسي:</strong> مقفل بـ 3 أقفال تحتاج فكها بالكامل:
                <br />
                1. <strong>لوح خشبي</strong> يحتاج العتلة (في المطبخ)
                <br />
                2. <strong>قفل معدني</strong> يحتاج المفتاح الأزرق (في غرفة النوم)
                <br />
                3. <strong>لوحة إلكترونية</strong> تحتاج قصاصة الرمز (في غرفة التخزين)
              </li>
              <li>
                <strong className="text-white">👂 حاسة سمع الجدة:</strong> تسمع خطوات الجري (Shift) وكسر المزهريات وإسقاط الأدوات! امشِ بهدوء أو اقرفص (C).
              </li>
              <li>
                <strong className="text-white">🛏️ الاختباء:</strong> يمكنك الاختباء داخل الدواليب أو تحت السرير بالضغط على E لتفادي رؤية العجوز لك.
              </li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2.5 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg border border-red-700 transition-colors"
            >
              فهمت، تابع اللعب
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
