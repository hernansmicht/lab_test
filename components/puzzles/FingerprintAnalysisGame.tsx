import React, { useState, useEffect, useRef } from "react";
import type { Puzzle } from "../../types";
import FingerprintSVG from "./FingerprintSVG";
import { CheckCircleIcon } from "../icons";

const DATABASE_SEED = "vendor-access-345";
const TARGET_ROTATION = 30;
const TARGET_SCALE = 1.2;
const TARGET_POSITION = { x: 100, y: 100 }; // Center of the target area

interface FingerprintAnalysisGameProps {
  puzzle: Puzzle;
  onComplete: () => void;
}

const FingerprintAnalysisGame: React.FC<FingerprintAnalysisGameProps> = ({
  puzzle,
  onComplete,
}) => {
  const [stage, setStage] = useState<"lift" | "match" | "success">("lift");
  const [isLifting, setIsLifting] = useState(false);

  // Alignment controls
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 150, y: 50 }); // Initial position off-center

  // View controls
  const [viewZoom, setViewZoom] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 }); // Pan offset

  // Drag & Pan state
  const [isDragging, setIsDragging] = useState(false); // For fingerprint
  const [isPanning, setIsPanning] = useState(false); // For viewport
  const dragStartPos = useRef({ x: 0, y: 0 });
  const panStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState<string | null>(
    "Use the tape to lift the partial print.",
  );
  const [isMatchConfirmed, setIsMatchConfirmed] = useState(false);

  useEffect(() => {
    if (stage === "success") {
      const timer = setTimeout(onComplete, 2000); // After success screen is shown for 2s, complete puzzle
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  const handleStartLift = () => {
    setIsLifting(true);
    setMessage("Lifting print...");
    setTimeout(() => {
      setStage("match");
      setMessage("Align the lifted print with the database record.");
    }, 1500); // Duration of the peel animation
  };

  const handleCheckMatch = () => {
    const isCorrect =
      Math.abs(rotation - TARGET_ROTATION) < 8 &&
      Math.abs(scale - TARGET_SCALE) < 0.08 &&
      Math.abs(position.x - TARGET_POSITION.x) < 15 &&
      Math.abs(position.y - TARGET_POSITION.y) < 15;

    if (isCorrect) {
      setMessage("Match confirmed!");
      setIsMatchConfirmed(true);
      setTimeout(() => {
        setStage("success");
      }, 1500);
      setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
    } else {
      setMessage("Incorrect alignment. Please try again.");
      setTimeout(() => {
        if (stage === "match" && !isMatchConfirmed) {
          setMessage("Align the lifted print with the database record.");
        }
      }, 2500);
    }
  };

  const handleFingerprintDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent pan from starting
    if (!viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const unprojectedX = (mouseX - viewOffset.x) / viewZoom;
    const unprojectedY = (mouseY - viewOffset.y) / viewZoom;

    dragStartPos.current = {
      x: unprojectedX - position.x,
      y: unprojectedY - position.y,
    };
    setIsDragging(true);
  };

  const handlePanStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewZoom <= 1) return;
    e.preventDefault();

    panStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: viewOffset.x,
      startY: viewOffset.y,
    };
    setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;

    if (isDragging) {
      e.preventDefault();
      const rect = viewportRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const unprojectedX = (mouseX - viewOffset.x) / viewZoom;
      const unprojectedY = (mouseY - viewOffset.y) / viewZoom;

      setPosition({
        x: unprojectedX - dragStartPos.current.x,
        y: unprojectedY - dragStartPos.current.y,
      });
    } else if (isPanning) {
      e.preventDefault();

      const dx = e.clientX - panStart.current.mouseX;
      const dy = e.clientY - panStart.current.mouseY;

      const newOffsetX = panStart.current.startX + dx;
      const newOffsetY = panStart.current.startY + dy;

      const viewportWidth = viewportRef.current.clientWidth;
      const viewportHeight = viewportRef.current.clientHeight;
      const maxPanX = viewportWidth * viewZoom - viewportWidth;
      const maxPanY = viewportHeight * viewZoom - viewportHeight;

      setViewOffset({
        x: Math.max(-maxPanX, Math.min(0, newOffsetX)),
        y: Math.max(-maxPanY, Math.min(0, newOffsetY)),
      });
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleViewZoomChange = (newZoom: number) => {
    if (newZoom <= 1) {
      setViewOffset({ x: 0, y: 0 });
    }
    setViewZoom(newZoom);
  };

  if (stage === "success") {
    return (
      <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[500px]">
        <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
        <h3 className="font-teko text-3xl text-green-300 mt-3">
          FINGERPRINT MATCHED
        </h3>
        <p className="text-slate-300">{puzzle.clue}</p>
      </div>
    );
  }

  return (
    <div className="p-2 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[500px] select-none flex flex-col">
      <h3 className="font-teko text-3xl text-center text-blue-300 mb-2">
        Fingerprint Analysis
      </h3>

      {stage === "lift" && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative w-48 h-48 bg-slate-700 rounded-lg p-4 border-2 border-slate-600 shadow-inner">
            <p className="text-center text-xs text-slate-400 absolute top-1 left-2">
              Metal Safe Door
            </p>
            <FingerprintSVG
              seed={DATABASE_SEED}
              isPartial={true}
              className="w-full h-full"
              strokeColor="text-slate-500/50"
            />

            {isLifting && (
              <div className="absolute inset-0 flex items-center justify-center animate-peel-off">
                <div className="w-3/4 h-3/4 bg-blue-300/20 border-2 border-blue-400/50 rounded-md">
                  <FingerprintSVG
                    seed={DATABASE_SEED}
                    isPartial={true}
                    className="w-full h-full"
                    strokeColor="text-blue-200"
                  />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleStartLift}
            disabled={isLifting}
            className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50"
          >
            {isLifting ? "Lifting..." : "Lift Print with Tape"}
          </button>
        </div>
      )}

      {stage === "match" && (
        <div className="flex-grow flex flex-col justify-between">
          <div className="flex flex-col space-y-2">
            {/* Matching Area */}
            <div
              ref={viewportRef}
              className="relative w-full h-52 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden"
              onMouseDown={handlePanStart}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              style={{
                cursor: isPanning
                  ? "grabbing"
                  : viewZoom > 1
                  ? "grab"
                  : "default",
              }}
            >
              <div
                className="absolute w-full h-full"
                style={{
                  transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${viewZoom})`,
                  transformOrigin: "top left",
                  transition:
                    isPanning || isDragging
                      ? "none"
                      : "transform 0.2s ease-out",
                }}
              >
                {/* Database Print (Target) */}
                <div
                  style={{
                    transform: `rotate(${TARGET_ROTATION}deg) scale(${TARGET_SCALE})`,
                    left: `${TARGET_POSITION.x}px`,
                    top: `${TARGET_POSITION.y}px`,
                  }}
                  className="absolute w-24 h-24"
                >
                  <FingerprintSVG
                    seed={DATABASE_SEED}
                    className="w-full h-full"
                    strokeColor="text-slate-600"
                  />
                </div>

                {/* Player's movable print */}
                <div
                  onMouseDown={handleFingerprintDragStart}
                  className="absolute w-24 h-24 cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: `rotate(${rotation}deg) scale(${scale})`,
                    transformOrigin: "center center",
                  }}
                >
                  <div className="relative w-full h-full border-2 border-blue-400/50 rounded-md bg-blue-400/10">
                    <FingerprintSVG
                      seed={DATABASE_SEED}
                      isPartial={true}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Controls */}
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2">
              <p className="text-center font-bold text-slate-300">
                Alignment Controls
              </p>
              <div className="text-xs space-y-3 text-slate-300">
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="rotation-slider">Rotation</label>{" "}
                    <span>{rotation}°</span>
                  </div>
                  <input
                    id="rotation-slider"
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(+e.target.value)}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="scale-slider">Print Size</label>{" "}
                    <span>{scale.toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setScale((s) => Math.max(0.5, s - 0.05))}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-slate-700 hover:bg-slate-600 transition-colors flex-shrink-0"
                      aria-label="Decrease Size"
                    >
                      -
                    </button>
                    <input
                      id="scale-slider"
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.01"
                      value={scale}
                      onChange={(e) => setScale(+e.target.value)}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      onClick={() => setScale((s) => Math.min(1.5, s + 0.05))}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-slate-700 hover:bg-slate-600 transition-colors flex-shrink-0"
                      aria-label="Increase Size"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex justify-between items-center">
                    <label htmlFor="zoom-slider">Magnification</label>{" "}
                    <span>{Math.round(viewZoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() =>
                        handleViewZoomChange(Math.max(1, viewZoom - 0.25))
                      }
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-slate-700 hover:bg-slate-600 transition-colors flex-shrink-0"
                      aria-label="Zoom Out"
                    >
                      -
                    </button>
                    <input
                      id="zoom-slider"
                      type="range"
                      min="1"
                      max="3"
                      step="0.25"
                      value={viewZoom}
                      onChange={(e) => handleViewZoomChange(+e.target.value)}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      onClick={() =>
                        handleViewZoomChange(Math.min(3, viewZoom + 0.25))
                      }
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-slate-700 hover:bg-slate-600 transition-colors flex-shrink-0"
                      aria-label="Zoom In"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Check button */}
          <div className="mt-4">
            <button
              onClick={handleCheckMatch}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
            >
              Check Match
            </button>
          </div>
        </div>
      )}

      <p
        className={`text-sm mt-auto pt-2 text-center h-5 transition-all font-semibold ${
          isMatchConfirmed ? "text-green-400" : "text-yellow-400"
        }`}
      >
        {message}
      </p>
    </div>
  );
};

export default FingerprintAnalysisGame;
