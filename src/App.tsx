import React, { useEffect, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene, startAmbientDrone } from "./Scene";
import { useStore } from "./store";
import { AlertTriangle, Eye, Skull } from "lucide-react";

export default function App() {
  const {
    gameState,
    score,
    setGameState,
    setIsPeeking,
    reset,
    isRedEffect,
    timeHour,
    timeMinute,
    night,
    setNight,
    activeMonster,
    clickMonsterActive,
    clicksRemaining,
    setLookDirection,
    lookDirection,
    flashlightOn,
    flashlightBattery,
    setFlashlightOn,
  } = useStore();

  const [notePage, setNotePage] = useState<"lore" | "mechanics">("lore");

  useEffect(() => {
    if (gameState === "note") {
      setNotePage("lore");
    }
  }, [gameState]);

  const formattedTime = `${timeHour === 0 ? 12 : timeHour}:${timeMinute.toString().padStart(2, "0")} AM`;

  useEffect(() => {
    let stopAudio: () => void = () => {};
    if (gameState === "playing") {
      stopAudio = startAmbientDrone();
    }
    return () => {
      stopAudio();
    };
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing") {
        if (e.code === "KeyD" || e.code === "ArrowRight") {
          setIsPeeking(true);
        }
        if (e.code === "KeyA" || e.code === "ArrowLeft") {
          setLookDirection("left");
          setIsPeeking(false); // looking left cancels peeking
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        if (gameState === "playing") setIsPeeking(false);
      }
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        if (gameState === "playing") setLookDirection("center");
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameState === "playing" && e.button === 0) setFlashlightOn(true);
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (gameState === "playing" && e.button === 0) setFlashlightOn(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gameState, setIsPeeking, setLookDirection, setFlashlightOn]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <Canvas shadows>
        <Scene />
      </Canvas>

      {/* FLASHBACK EFFECT OR RED SCREEN ETC */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-200 ${isRedEffect ? "bg-red-900/30" : "bg-transparent"}`}
      />

      {/* UI OVERLAY */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        {/* Score & Instructions during play */}
        {gameState === "playing" && (
          <div className="flex justify-between items-start text-white/70 font-mono text-sm">
            <div>
              <p className="text-xl font-bold text-white mb-1">
                {formattedTime}
              </p>
              <p>Score: {score}</p>
              <div className="mt-4">
                <p className="font-bold flex gap-2 items-center">
                  FLASHLIGHT:{" "}
                  <span
                    className={
                      flashlightBattery < 20
                        ? "text-red-500 animate-pulse"
                        : "text-green-400"
                    }
                  >
                    {Math.max(0, Math.floor(flashlightBattery))}%
                  </span>
                </p>
                <div className="w-24 border border-white/50 h-2 mt-1 relative bg-black">
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-white"
                    style={{ width: `${Math.max(0, flashlightBattery)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="flex items-center gap-2 justify-end text-red-500 font-bold mb-1">
                NIGHT {night}
              </p>
              <p className="flex items-center gap-2 justify-end">
                Hold Right Arrow (D) to Peek Right
              </p>
              <p className="flex items-center gap-2 justify-end mt-1 text-xs text-yellow-500/70">
                Hold Left Arrow (A) to look Left
              </p>
              <p className="flex items-center gap-2 justify-end mt-1 text-xs text-blue-300">
                LMB to use Flashlight
              </p>
            </div>
          </div>
        )}

        {/* HUD Warning if they are looking left while clickmonster is active */}
        {gameState === "playing" &&
          clickMonsterActive &&
          clicksRemaining > 0 &&
          lookDirection === "left" && (
            <div className="absolute top-1/2 left-[30%] -translate-y-1/2 -translate-x-1/2 text-yellow-500 font-mono font-bold text-2xl pointer-events-none animate-pulse">
              {flashlightOn ? "HOLDING..." : "! SHINE FLASHLIGHT !"}
            </div>
          )}

        {/* HUD Warning if they are not looking left while clickmonster is active */}
        {gameState === "playing" &&
          clickMonsterActive &&
          lookDirection !== "left" && (
            <div className="absolute top-[40%] left-8 text-yellow-500 font-mono font-bold text-sm pointer-events-none animate-pulse">
              SOMETHING IS ON YOUR LEFT (Use A)
            </div>
          )}

        {/* On-screen control for touch devices */}
        {gameState === "playing" && (
          <>
            <button
              className="absolute bottom-8 right-8 w-24 h-24 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full border-2 border-white/30 backdrop-blur-sm pointer-events-auto flex items-center justify-center text-xs font-mono font-bold text-white/70 select-none shadow-[0_0_15px_rgba(255,255,255,0.1)] touch-none"
              onPointerDown={() => setIsPeeking(true)}
              onPointerUp={() => setIsPeeking(false)}
              onPointerLeave={() => setIsPeeking(false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              PEEK
            </button>
            {night >= 2 && (
              <button
                className="absolute bottom-8 left-8 w-24 h-24 bg-yellow-900/40 hover:bg-yellow-800/50 active:bg-yellow-700/60 rounded-full border-2 border-yellow-500/30 backdrop-blur-sm pointer-events-auto flex items-center justify-center text-xs font-mono font-bold text-yellow-200/70 select-none shadow-[0_0_15px_rgba(255,255,0,0.1)] touch-none"
                onPointerDown={() => setLookDirection("left")}
                onPointerUp={() => setLookDirection("center")}
                onPointerLeave={() => setLookDirection("center")}
                onContextMenu={(e) => e.preventDefault()}
              >
                LEFT
              </button>
            )}
          </>
        )}

        {/* Note Screen */}
        {gameState === "note" && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center pointer-events-auto p-4 z-50">
            <div className="max-w-2xl w-full bg-[#fdf5e6] text-black p-8 rounded shadow-[0_0_50px_rgba(255,255,255,0.1)] relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-yellow-900/20 -mt-3 rotate-2"></div>
              <h2 className="text-3xl font-mono font-bold border-b-2 border-black/30 pb-4 mb-6 uppercase text-center border-dashed">
                {notePage === "lore"
                  ? "Found Journal Entry"
                  : `Night ${night} Briefing`}
              </h2>

              <div className="space-y-6 font-mono text-sm">
                {notePage === "lore" && (
                  <div className="italic text-lg text-black/80 font-serif leading-relaxed">
                    {night === 1 && (
                      <p>
                        "They think I’m crazy, but I saw them. The shadows
                        stretch out when you aren't looking. Don't look too
                        long, and don't ignore them either. The red eyes... just
                        a glance will send it away. But the pale one, it needs
                        your attention. It DEMANDS your attention. And if you
                        hear a hum... stay completely still. Don't even look. I
                        can't sleep anymore."
                      </p>
                    )}
                    {night === 2 && (
                      <p>
                        "They called something else. From the left. It crawls...
                        I saw it in the corner of my eye. Yellow, sickly,
                        glowing eyes. It hates the light but we don't have
                        enough. You have to focus on it. Click it, push it back.
                        Don't let it reach the center. It's so quiet..."
                      </p>
                    )}
                    {night === 3 && (
                      <p>
                        "I heard a bird. Huge. Feathers like oil. It stands
                        there on the right, waiting for you to look. If you see
                        it... my god... you have to stop looking at it
                        instantly, but then you HAVE to look left. It's a
                        ritual. Look at it, then look away over your left
                        shoulder. It hates you looking the other way. Two and a
                        half seconds... any longer and you're dead."
                      </p>
                    )}
                    {night === 4 && (
                      <p>
                        "Twins. Symmetrical but broken. Thin as rails, elongated
                        like stretched dough. They come in pairs. One has a
                        glowing left eye, one has a right. You MUST use the
                        flashlight on the one with the left eye, or it will get
                        you. But DO NOT shine the light on the right-eyed one...
                        it enrages it. I can't keep track anymore... so many
                        rules... so little time."
                      </p>
                    )}
                    {night === 5 && (
                      <p>
                        "All of them. All at once. They're at the door. They're
                        on the ceiling. They're everywhere. There are no rules
                        anymore, just survival. They are faster, angrier. The
                        batteries are low. My fingers are bleeding. Survive.
                        Just survive."
                      </p>
                    )}
                  </div>
                )}

                {notePage === "mechanics" && (
                  <>
                    {night >= 1 && (
                      <>
                        <div className="flex gap-4 items-center">
                          <div className="w-24 h-24 border border-black/80 rounded bg-[#f5ead9] p-1 flex-shrink-0 flex items-center justify-center relative overflow-hidden mix-blend-multiply">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full opacity-90 drop-shadow-sm"
                            >
                              <path
                                d="M45 20 C30 35, 35 60, 25 85 C45 80, 55 85, 75 85 C65 60, 70 35, 55 20 Z"
                                fill="#222"
                                stroke="#111"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="42"
                                cy="42"
                                r="3.5"
                                fill="#ff0000"
                                filter="drop-shadow(0 0 5px #ff0000)"
                              />
                              <circle
                                cx="58"
                                cy="42"
                                r="3.5"
                                fill="#ff0000"
                                filter="drop-shadow(0 0 5px #ff0000)"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-base mb-1">
                              THE DEMON (Red Eyes)
                            </p>
                            <p>
                              Lurks in the darkness.{" "}
                              <strong className="bg-black/10 px-1">
                                PEEK (Hold D)
                              </strong>{" "}
                              to scare it away, briefly (less than 1.5s).
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-center mt-4">
                          <div className="w-24 h-24 border border-black/80 rounded bg-[#f5ead9] p-1 flex-shrink-0 flex items-center justify-center relative overflow-hidden mix-blend-multiply">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full opacity-90 drop-shadow-sm"
                            >
                              <path
                                d="M45 10 C35 30, 42 60, 38 90 L62 90 C58 60, 65 30, 55 10 Z"
                                fill="#e2e8f0"
                                stroke="#64748b"
                                strokeWidth="1.5"
                              />
                              <circle
                                cx="50"
                                cy="25"
                                r="16"
                                fill="#1e293b"
                                stroke="#0f172a"
                                strokeWidth="2"
                              />
                              <circle
                                cx="50"
                                cy="25"
                                r="9"
                                fill="#06b6d4"
                                filter="drop-shadow(0 0 6px #22d3ee)"
                              />
                              <circle cx="50" cy="25" r="3" fill="#000" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-base mb-1">
                              THE WATCHER (Pale, One Eye)
                            </p>
                            <p>
                              Hates being ignored.{" "}
                              <strong className="bg-black/10 px-1">
                                STARE (Hold D)
                              </strong>{" "}
                              for at least 3 seconds.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-center mt-4">
                          <div className="w-24 h-24 border border-black/80 rounded bg-[#f5ead9] p-1 flex-shrink-0 flex items-center justify-center relative overflow-hidden mix-blend-multiply">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full opacity-90 drop-shadow-sm"
                            >
                              <path
                                d="M30 20 C10 40, 20 70, 40 85 C60 95, 80 80, 85 60 C95 40, 70 10, 50 15 C35 18, 40 10, 30 20 Z"
                                fill="#111"
                                stroke="#333"
                                strokeWidth="2"
                              />
                              <circle cx="45" cy="35" r="4" fill="#d946ef" />
                              <circle cx="65" cy="45" r="5" fill="#d946ef" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-base mb-1">
                              THE TRAP (Purple Eyes / Hum)
                            </p>
                            <p>
                              <strong className="bg-black/10 px-1">
                                DO NOT PEEK.
                              </strong>{" "}
                              If you do, it will lock your gaze and waste time.
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {night >= 2 && (
                      <div className="flex gap-4 items-center mt-4">
                        <div className="w-24 h-24 border border-black/80 rounded bg-[#f5ead9] p-1 flex-shrink-0 flex items-center justify-center relative overflow-hidden mix-blend-multiply">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-full h-full opacity-90 drop-shadow-sm"
                          >
                            <path
                              d="M25 45 C15 30, 40 10, 60 25 C80 15, 95 40, 80 65 C90 85, 60 95, 45 80 C20 90, 5 65, 25 45 Z"
                              fill="#3f2314"
                              stroke="#29160c"
                              strokeWidth="2"
                            />
                            <ellipse
                              cx="40"
                              cy="45"
                              rx="7"
                              ry="5"
                              fill="#fef08a"
                              transform="rotate(-15 40 45)"
                            />
                            <ellipse
                              cx="65"
                              cy="35"
                              rx="8"
                              ry="6"
                              fill="#fef08a"
                              transform="rotate(20 65 35)"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-base mb-1">
                            THE CREEPER
                          </p>
                          <p>
                            Approaches from the LEFT.{" "}
                            <strong className="bg-black/10 px-1">
                              LOOK LEFT (Hold A)
                            </strong>{" "}
                            and use the{" "}
                            <strong className="bg-black/10 px-1">
                              FLASHLIGHT (LMB)
                            </strong>{" "}
                            on it.
                          </p>
                        </div>
                      </div>
                    )}

                    {night >= 3 && (
                      <div className="flex gap-4 items-center mt-4">
                        <div className="w-24 h-24 border border-black/80 rounded bg-[#f5ead9] p-1 flex-shrink-0 flex items-center justify-center relative overflow-hidden mix-blend-multiply">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-full h-full opacity-90 drop-shadow-sm"
                          >
                            <path
                              d="M40 90 L20 40 Q50 10 80 40 L60 90 Z"
                              fill="#222"
                              stroke="#111"
                              strokeWidth="2"
                            />
                            <circle cx="50" cy="30" r="12" fill="#111" />
                            <circle cx="48" cy="30" r="3" fill="#ffff00" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-base mb-1">THE RAVEN</p>
                          <p>
                            Starts on the RIGHT.{" "}
                            <strong className="bg-black/10 px-1">
                              STOP PEEKING within 2.5s
                            </strong>{" "}
                            and immediately{" "}
                            <strong className="bg-black/10 px-1">
                              LOOK LEFT (A) for 1.5s
                            </strong>{" "}
                            to banish it.
                          </p>
                        </div>
                      </div>
                    )}

                    {night >= 4 && (
                      <div className="flex gap-4 items-center mt-4">
                        <div className="w-24 h-24 border border-black/80 rounded bg-[#f5ead9] p-1 flex-shrink-0 flex items-center justify-center relative overflow-hidden mix-blend-multiply">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-full h-full opacity-90 drop-shadow-sm"
                          >
                            {/* Two tall figures next to each other */}
                            {/* Left Twin */}
                            <path
                              d="M20 90 L30 10 L40 90 Z"
                              fill="#111"
                              stroke="#333"
                              strokeLinejoin="round"
                            />
                            <circle cx="30" cy="20" r="6" fill="#222" />
                            <circle
                              cx="28"
                              cy="20"
                              r="2"
                              fill="#ffff55"
                              filter="drop-shadow(0 0 3px #ffff55)"
                            />{" "}
                            {/* Left eye glowing */}
                            <circle cx="32" cy="20" r="2" fill="#000" />
                            {/* Right Twin */}
                            <path
                              d="M60 90 L70 15 L80 90 Z"
                              fill="#111"
                              stroke="#333"
                              strokeLinejoin="round"
                            />
                            <circle cx="70" cy="25" r="6" fill="#222" />
                            <circle cx="68" cy="25" r="2" fill="#000" />
                            <circle
                              cx="72"
                              cy="25"
                              r="2"
                              fill="#ffff55"
                              filter="drop-shadow(0 0 3px #ffff55)"
                            />{" "}
                            {/* Right eye glowing */}
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-base mb-1">THE TWINS</p>
                          <p>
                            They look similar but react differently. If the{" "}
                            <strong className="bg-black/10 px-1">
                              LEFT EYE glows
                            </strong>
                            , you MUST{" "}
                            <strong className="bg-black/10 px-1">
                              use FLASHLIGHT (LMB)
                            </strong>
                            . If the{" "}
                            <strong className="bg-black/10 px-1 text-red-800">
                              RIGHT EYE glows
                            </strong>
                            , DO NOT shine the light on it!
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-8 flex justify-center gap-4">
                {notePage === "lore" && night < 5 && (
                  <button
                    onClick={() => setNotePage("mechanics")}
                    className="px-8 py-3 bg-gray-900 border-2 border-gray-950 text-white font-mono font-bold uppercase hover:bg-black transition-colors rounded shadow-lg"
                  >
                    Next page
                  </button>
                )}
                {(notePage === "mechanics" || night === 5) && (
                  <button
                    onClick={() => setGameState("playing")}
                    className="px-8 py-3 bg-red-900 border-2 border-red-950 text-white font-mono font-bold uppercase hover:bg-red-800 transition-colors rounded shadow-lg"
                  >
                    Begin Night {night}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-auto">
            <h1 className="text-5xl font-mono font-bold tracking-widest text-red-700 mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
              PEEK
            </h1>
            <p className="text-gray-200 mb-6 max-w-lg text-center text-sm font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Wait behind the wall. <br />
              <br />
              When the dark monster with red eyes appears, peek for less than
              1.5s to drive it away.
              <br />
              When the pale monster with the bright eye appears, stare for 3s to
              drive it away.
              <br />
              When you hear a quiet hum, a shadow with purple eyes is waiting.
              Do not peek. If you do, it will hold your gaze for 3s.
              <br />
              Night 2: A yellow-eyed monster appears to your left. Look left (A)
              and use your Flashlight (LMB) on it.
              <br />
              Night 3: A Raven appears to the right. Stop peeking within 2.5s
              and look left to banish it.
              <br />
              Night 4: Twins appear! Left glowing eye needs Flashlight. Right
              glowing eye hates light.
              <br />
              <br />
              Ignore them or fail their mechanic... and you die.
            </p>
            <div className="flex items-center gap-4 mb-8">
              <button
                className={`px-4 py-2 font-mono font-bold border rounded-sm transition-colors ${night === 1 ? "bg-white text-black border-white" : "bg-transparent text-white/50 border-white/30 hover:border-white/80 hover:text-white"}`}
                onClick={() => setNight(1)}
              >
                Night 1
              </button>
              <button
                className={`px-4 py-2 font-mono font-bold border rounded-sm transition-colors ${night === 2 ? "bg-red-900 border-red-500 text-white" : "bg-transparent text-red-500/50 border-red-900/50 hover:border-red-500/80 hover:text-red-500"}`}
                onClick={() => setNight(2)}
              >
                Night 2
              </button>
              <button
                className={`px-4 py-2 font-mono font-bold border rounded-sm transition-colors ${night === 3 ? "bg-red-600 border-red-400 text-white shadow-[0_0_10px_red]" : "bg-transparent text-red-600/50 border-red-600/50 hover:border-red-600/80 hover:text-red-600"}`}
                onClick={() => setNight(3)}
              >
                Night 3
              </button>
              <button
                className={`px-4 py-2 font-mono font-bold border rounded-sm transition-colors ${night === 4 ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_purple]" : "bg-transparent text-purple-600/50 border-purple-600/50 hover:border-purple-600/80 hover:text-purple-600"}`}
                onClick={() => setNight(4)}
              >
                Night 4
              </button>
              <button
                className={`px-4 py-2 font-mono font-bold border rounded-sm transition-colors ${night === 5 ? "bg-black border-red-700 text-red-600 shadow-[0_0_15px_red]" : "bg-transparent text-red-800/50 border-red-900/50 hover:border-red-600/80 hover:text-red-600"}`}
                onClick={() => setNight(5)}
              >
                Night 5
              </button>
            </div>
            <button
              onClick={() => reset(false)}
              className={`px-8 py-3 ${night === 1 ? "bg-white/10 hover:bg-white/20" : "bg-red-900/50 hover:bg-red-800"} text-white font-mono font-bold uppercase tracking-wider transition-colors border ${night === 1 ? "border-white/20" : "border-red-900"} rounded-sm`}
            >
              Start Survival
            </button>
          </div>
        )}

        {/* Jumpscare Screen */}
        {gameState === "jumpscare" && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center animate-pulse pointer-events-auto shadow-[inset_0_0_200px_rgba(255,0,0,0.5)]">
            <Skull
              size={100}
              className="text-red-600 mb-6 drop-shadow-[0_0_20px_rgba(255,0,0,1)]"
            />
            <h2 className="text-6xl font-mono font-black text-red-600 tracking-tighter mb-4 shadow-red-900 text-shadow">
              YOU DIED
            </h2>
            <p className="text-red-400 font-mono mb-8">
              You survived {score} encounters.
            </p>
            <button
              onClick={() => reset()}
              className="px-8 py-3 bg-red-900 border border-red-500 text-white font-mono font-bold uppercase hover:bg-red-700 transition-colors rounded-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Win Screen */}
        {gameState === "win" && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center animate-in fade-in duration-1000 pointer-events-auto">
            <h2 className="text-6xl font-mono font-black text-black tracking-widest mb-4">
              6:00 AM
            </h2>
            <p className="text-gray-800 font-mono mb-8 font-bold">
              You survived the night.
            </p>
            <p className="text-gray-600 font-mono mb-8 text-sm">
              Encounters survived: {score}
            </p>
            {night === 1 ? (
              <button
                onClick={() => reset(true)}
                className="px-8 py-3 bg-red-900 text-white font-mono font-bold uppercase hover:bg-red-800 transition-colors rounded-sm shadow-[0_0_15px_red]"
              >
                Proceed to Night 2
              </button>
            ) : (
              <button
                onClick={() => {
                  setNight(1);
                  reset(false);
                }}
                className="px-8 py-3 bg-black text-white font-mono font-bold uppercase hover:bg-gray-800 transition-colors rounded-sm border border-white/20"
              >
                Start Over
              </button>
            )}
          </div>
        )}
      </div>

      {/* Red effect overlay when trapped */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-500 mix-blend-multiply ${isRedEffect ? "bg-red-600/80" : "bg-transparent"}`}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0_0_150px_rgba(0,0,0,1)]" />
    </div>
  );
}
