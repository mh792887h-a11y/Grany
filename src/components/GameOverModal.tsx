import React from 'react';
import { Skull, RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6 select-none font-['Tajawal'] text-white">
      <div className="relative max-w-lg w-full bg-zinc-950 border-2 border-red-900 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(180,0,0,0.5)]">
        {/* Skull Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center mb-6 shadow-inner">
          <Skull className="w-10 h-10 text-red-500 animate-pulse" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black font-['Changa'] text-red-600 mb-2">
          انْتَهَتْ الأَيَّامُ الخَمْسَة
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mt-4">
          أغلقت العجوز جميع المخارج.. ولم تتمكن من الهروب في الوقت المحدد. أصبحت الآن جزءاً من البيت الملعون!
        </p>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="mt-8 w-full py-4 bg-gradient-to-r from-red-900 via-red-700 to-red-900 hover:from-red-800 hover:to-red-800 text-white font-bold text-lg font-['Changa'] rounded-xl border border-red-600 shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-102 active:scale-98"
        >
          <RotateCcw className="w-5 h-5" />
          <span>حاول الهروب من جديد</span>
        </button>
      </div>
    </div>
  );
};
