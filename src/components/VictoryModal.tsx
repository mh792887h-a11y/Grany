import React from 'react';
import { Trophy, RotateCcw, CheckCircle2 } from 'lucide-react';

interface VictoryModalProps {
  daysTaken: number;
  onPlayAgain: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ daysTaken, onPlayAgain }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 select-none font-['Tajawal'] text-white">
      <div className="relative max-w-lg w-full bg-zinc-950 border-2 border-emerald-700/80 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        {/* Trophy Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center mb-6 shadow-inner">
          <Trophy className="w-10 h-10 text-emerald-400" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black font-['Changa'] text-emerald-400 mb-2">
          لَقَدْ نَجَوْتَ وَهَرَبْتَ!
        </h1>

        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mt-4">
          تمكنت بذكائك وشجاعتك من خلع الألواح الخشبية بالعتلة، وفتح القفل المعدني، وفك شفرة لوحة المفاتيح والفرار نحو الحرية!
        </p>

        {/* Escape Stats */}
        <div className="my-6 p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-around text-center">
          <div>
            <span className="text-xs text-zinc-400 block">الأيام المستغرقة</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{daysTaken} من 5</span>
          </div>
          <div className="w-[1px] h-8 bg-zinc-700" />
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>نجاة كاملة</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onPlayAgain}
          className="w-full py-4 bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-700 text-white font-bold text-lg font-['Changa'] rounded-xl border border-emerald-500 shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-102 active:scale-98"
        >
          <RotateCcw className="w-5 h-5" />
          <span>العب مجدداً</span>
        </button>
      </div>
    </div>
  );
};
