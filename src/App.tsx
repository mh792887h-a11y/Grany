import React, { useRef, useState, useEffect, useCallback } from 'react';
import { HorrorGameEngine } from './game/GameEngine';
import { GameItem } from './game/items';
import { TitleScreen } from './components/TitleScreen';
import { DayIntroScreen } from './components/DayIntroScreen';
import { JumpscareOverlay } from './components/JumpscareOverlay';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { PauseModal } from './components/PauseModal';

type GamePhase = 'TITLE' | 'DAY_INTRO' | 'PLAYING' | 'JUMPSCARE' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HorrorGameEngine | null>(null);

  // High-level App State
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [heldItem, setHeldItem] = useState<GameItem | null>(null);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [soundLevel, setSoundLevel] = useState<number>(0);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(true);
  const [isPlayerHidden, setIsPlayerHidden] = useState<boolean>(false);
  const [hidingSpotName, setHidingSpotName] = useState<string | null>(null);

  // Initialize engine once mount container is ready
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new HorrorGameEngine(mountRef.current, {
      onDayChange: (day) => {
        setCurrentDay(day);
        setPhase('DAY_INTRO');
      },
      onJumpscare: () => {
        setPhase('JUMPSCARE');
      },
      onGameOver: () => {
        setPhase('GAME_OVER');
      },
      onVictory: () => {
        setPhase('VICTORY');
      },
      onHoverInteraction: (prompt) => {
        setInteractionPrompt(prompt);
      },
      onItemHeldChange: (item) => {
        setHeldItem(item);
      },
      onSoundMade: (level) => {
        setSoundLevel(level);
      },
      onFlashlightChange: (on) => {
        setIsFlashlightOn(on);
      },
      onHidingStateChange: (hidden, spot) => {
        setIsPlayerHidden(hidden);
        setHidingSpotName(spot);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keyboard shortcut for Pause (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (phase === 'PLAYING') {
          setPhase('PAUSED');
        } else if (phase === 'PAUSED') {
          setPhase('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  // Actions
  const handleStartGame = useCallback((_difficulty: 'easy' | 'normal' | 'nightmare') => {
    setCurrentDay(1);
    engineRef.current?.restartGame();
    setPhase('DAY_INTRO');
  }, []);

  const handleDayIntroFinish = useCallback(() => {
    setPhase('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentDay(1);
    engineRef.current?.restartGame();
    setPhase('DAY_INTRO');
  }, []);

  const handleExitToTitle = useCallback(() => {
    setPhase('TITLE');
  }, []);

  const handleInteract = useCallback(() => {
    engineRef.current?.triggerInteraction();
  }, []);

  const handleDropItem = useCallback(() => {
    engineRef.current?.dropHeldItem();
  }, []);

  const handleToggleFlashlight = useCallback(() => {
    engineRef.current?.toggleFlashlight();
  }, []);

  const handleToggleCrouch = useCallback(() => {
    engineRef.current?.toggleCrouch();
  }, []);

  const handleMobileMove = useCallback((vec: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.mobileMoveVector = vec;
    }
  }, []);

  const handleMobileLook = useCallback((dx: number, dy: number) => {
    engineRef.current?.rotateCamera(dx, dy);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Isolated Three.js Canvas Container - never re-rendered by React */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Title Screen Overlay */}
      {phase === 'TITLE' && <TitleScreen onStartGame={handleStartGame} />}

      {/* Day Intro Cutscene */}
      {phase === 'DAY_INTRO' && (
        <DayIntroScreen day={currentDay} onFinish={handleDayIntroFinish} />
      )}

      {/* Jumpscare Blood Overlay */}
      {phase === 'JUMPSCARE' && <JumpscareOverlay />}

      {/* Playing Game HUD */}
      {(phase === 'PLAYING' || phase === 'PAUSED') && (
        <GameHUD
          currentDay={currentDay}
          heldItem={heldItem}
          interactionPrompt={interactionPrompt}
          soundLevel={soundLevel}
          isFlashlightOn={isFlashlightOn}
          isPlayerHidden={isPlayerHidden}
          hidingSpotName={hidingSpotName}
          onDropItem={handleDropItem}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleCrouch={handleToggleCrouch}
          onInteract={handleInteract}
          onPause={() => setPhase('PAUSED')}
          onMobileMove={handleMobileMove}
          onMobileLook={handleMobileLook}
        />
      )}

      {/* Pause Menu Modal */}
      {phase === 'PAUSED' && (
        <PauseModal
          onResume={() => setPhase('PLAYING')}
          onRestart={handleRestart}
          onExitToTitle={handleExitToTitle}
        />
      )}

      {/* Game Over Screen */}
      {phase === 'GAME_OVER' && <GameOverModal onRestart={handleRestart} />}

      {/* Escape Victory Screen */}
      {phase === 'VICTORY' && (
        <VictoryModal daysTaken={currentDay} onPlayAgain={handleRestart} />
      )}
    </div>
  );
}
