import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToTitle,
}) => {
  const [isMuted, setIsMuted] = React.useState(horrorAudio.getMuted());

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    horrorAudio.setMuted(next);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-6 select-none font-['Tajawal'] text-white">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-black font-['Changa'] text-zinc-100 mb-6">
          اللعبة متوقفة مؤقتاً
        </h2>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-red-800 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>متابعة اللعب</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة اللعبة من اليوم الأول</span>
          </button>

          <button
            onClick={toggleMute}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت'}</span>
          </button>

          <button
            onClick={onExitToTitle}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>العودة للقائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
