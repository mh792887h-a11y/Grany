import React, { useState } from 'react';
import { Volume2, VolumeX, Eye, Footprints, ShieldAlert, KeyRound, Radio } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudio';

interface TitleScreenProps {
  onStartGame: (difficulty: 'easy' | 'normal' | 'nightmare') => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'nightmare'>('normal');

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    horrorAudio.setMuted(next);
  };

  const handleStart = () => {
    // Play a chilling start click sound
    horrorAudio.playDayTransition();
    onStartGame(difficulty);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-y-auto bg-black/90 backdrop-brightness-50 font-['Tajawal'] text-white">
      {/* Vignette & Blood Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)]" />
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,_rgba(160,10,10,0.4)_0%,_transparent_70%)]" />

      {/* Top Header / Mute control */}
      <div className="w-full max-w-4xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/50 px-3 py-1.5 rounded text-xs text-red-300">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>تحذير: تحتوي اللعبة على مؤثرات صوتية مرعبة وقفزات رعب</span>
        </div>

        <button
          onClick={toggleMute}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs transition-colors"
          title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'الصوت مكتوم' : 'الصوت مفعل'}</span>
        </button>
      </div>

      {/* Hero Title Lockup */}
      <div className="my-auto text-center flex flex-col items-center relative z-10 max-w-2xl">
        <div className="inline-block relative mb-2">
          {/* Blood Title */}
          <h1 className="text-6xl sm:text-8xl font-black font-['Changa'] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-700 to-zinc-900 drop-shadow-[0_8px_24px_rgba(200,0,0,0.45)]">
            بَيْتُ العَجُوزْ
          </h1>
          <span className="text-xs uppercase tracking-widest text-red-400/90 font-mono mt-1 block">
            GRANNY HORROR EXPERIENCE
          </span>
        </div>

        <p className="text-zinc-400 text-sm sm:text-base max-w-md mt-2 leading-relaxed">
          استيقظت محبوساً في منزل قديم متهالك.. أمامك <span className="text-red-400 font-bold">5 أيام فقط</span> للهروب قبل أن تصبح الضحية القادمة!
        </p>

        {/* Audio Recommendation Pill */}
        <div className="mt-4 flex items-center gap-2 bg-black/80 border border-zinc-800 px-4 py-2 rounded-full text-xs text-zinc-300 shadow-lg">
          <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          <span>🎧 يُنصح بارتداء سماعات الرأس لسماع خطوات العجوز بوضوح</span>
        </div>

        {/* Difficulty Selector */}
        <div className="mt-8 flex flex-col items-center gap-2 w-full max-w-xs">
          <span className="text-xs text-zinc-400">مستوى الصعوبة:</span>
          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              onClick={() => setDifficulty('easy')}
              className={`py-2 px-3 rounded text-xs font-semibold border transition-all ${
                difficulty === 'easy'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              سهل
            </button>
            <button
              onClick={() => setDifficulty('normal')}
              className={`py-2 px-3 rounded text-xs font-semibold border transition-all ${
                difficulty === 'normal'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              عادي (الجدة)
            </button>
            <button
              onClick={() => setDifficulty('nightmare')}
              className={`py-2 px-3 rounded text-xs font-semibold border transition-all ${
                difficulty === 'nightmare'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              كابوس ☠️
            </button>
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          onClick={handleStart}
          className="mt-8 px-10 py-4 bg-gradient-to-r from-red-900 via-red-700 to-red-900 hover:from-red-800 hover:to-red-800 text-white text-lg sm:text-xl font-bold font-['Changa'] rounded border border-red-600/70 shadow-[0_0_28px_rgba(180,20,20,0.6)] hover:shadow-[0_0_36px_rgba(230,30,30,0.8)] transition-all cursor-pointer transform hover:scale-105 active:scale-95"
        >
          ابدأ الهروب الآن
        </button>
      </div>

      {/* Bottom Controls Cheat Sheet */}
      <div className="w-full max-w-3xl mt-6 relative z-10 bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3 sm:p-4 text-xs text-zinc-400">
        <div className="flex flex-wrap items-center justify-around gap-3 sm:gap-6 text-center">
          <div className="flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-zinc-400" />
            <span><strong className="text-zinc-200">WASD:</strong> الحركة والمشي</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-[10px] font-mono">Shift</span>
            <span><strong className="text-red-400">الجري</strong> (يصدر صوتاً عالياً!)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-[10px] font-mono">C</span>
            <span><strong className="text-emerald-400">القرفصاء</strong> والتسلل بهدوء</span>
          </div>
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-yellow-500" />
            <span><strong className="text-zinc-200">E:</strong> التفاعل والاختباء في الخزانة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-400" />
            <span><strong className="text-zinc-200">F:</strong> المصباح اليدوي</span>
          </div>
        </div>
      </div>
    </div>
  );
};
