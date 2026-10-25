import React, { useEffect } from 'react';
import { horrorAudio } from '../audio/HorrorAudio';

interface DayIntroScreenProps {
  day: number;
  onFinish: () => void;
}

export const DayIntroScreen: React.FC<DayIntroScreenProps> = ({ day, onFinish }) => {
  const dayNames: Record<number, string> = {
    1: 'اليَومُ الأوَّل',
    2: 'اليَومُ الثَّانِي',
    3: 'اليَومُ الثَّالِث',
    4: 'اليَومُ الرَّابِع',
    5: 'اليَومُ الخَامِس والأَخِير!',
  };

  useEffect(() => {
    horrorAudio.playDayTransition();
    const timer = setTimeout(() => {
      onFinish();
    }, 2800);
    return () => clearTimeout(timer);
  }, [day, onFinish]);

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 select-none font-['Tajawal'] text-white">
      <div className="text-center animate-pulse">
        <h2 className="text-5xl sm:text-7xl font-black font-['Amiri'] text-red-600 drop-shadow-[0_4px_16px_rgba(200,0,0,0.6)]">
          {dayNames[day] || `اليوم ${day}`}
        </h2>
        <p className="mt-4 text-zinc-500 text-sm tracking-widest font-mono">
          {day === 5 ? 'احذر! هذه فرصتك الأخيرة للنجاة...' : 'استيقظت مجدداً.. تحرك بحذر'}
        </p>
      </div>
    </div>
  );
};
