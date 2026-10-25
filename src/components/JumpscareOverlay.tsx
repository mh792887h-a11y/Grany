import React, { useEffect, useState } from 'react';

export const JumpscareOverlay: React.FC = () => {
  const [bloodOpacity, setBloodOpacity] = useState(0.85);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBloodOpacity(1);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-hidden animate-pulse">
      {/* Violent Blood Splatter Background */}
      <div
        className="absolute inset-0 bg-red-950 transition-opacity duration-700"
        style={{ opacity: bloodOpacity }}
      />

      {/* Terrifying vignette radial & bloody cracks */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(100,0,0,0.95)_70%,_#000000_100%)]" />

      {/* Menacing silhouette message */}
      <div className="relative z-10 text-center scale-110 transform transition-transform">
        <h1 className="text-6xl sm:text-8xl font-black font-['Changa'] text-white drop-shadow-[0_8px_30px_rgba(255,0,0,0.9)]">
          أَمْسَكَتْ بِك!
        </h1>
        <p className="mt-3 text-red-300 text-lg font-bold font-['Tajawal'] tracking-wider">
          ضربة قاتلة.. ستفقد الوعي!
        </p>
      </div>
    </div>
  );
};
