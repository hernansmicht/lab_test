import React, { useState, useMemo } from "react";
import type { Puzzle } from "../../types";
import { CheckCircleIcon } from "../icons";

// --- Types and Constants ---
type ReagentID = "reagentA" | "reagentB" | "reagentC";

const REAGENTS: {
  id: ReagentID;
  name: string;
  description: string;
  color: string;
  hoverColor: string;
}[] = [
  {
    id: "reagentA",
    name: "Terra-Test",
    description: "Tests for soil components",
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-400",
  },
  {
    id: "reagentB",
    name: "Flora-Scan",
    description: "Tests for floral agents",
    color: "bg-pink-500",
    hoverColor: "hover:bg-pink-400",
  },
  {
    id: "reagentC",
    name: "Control H₂O",
    description: "Distilled water control",
    color: "bg-sky-500",
    hoverColor: "hover:bg-sky-400",
  },
];

// --- Helper Components ---
const Sparkle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="absolute animate-sparkle" style={style}>
    <div className="relative w-4 h-4">
      <div className="absolute w-full h-0.5 bg-pink-300 rounded-full top-1/2 left-0 transform -translate-y-1/2"></div>
      <div className="absolute h-full w-0.5 bg-pink-300 rounded-full left-1/2 top-0 transform -translate-x-1/2"></div>
      <div className="absolute w-full h-0.5 bg-pink-300 rounded-full top-1/2 left-0 transform -translate-y-1/2 rotate-45"></div>
      <div className="absolute h-full w-0.5 bg-pink-300 rounded-full left-1/2 top-0 transform -translate-x-1/2 rotate-45"></div>
    </div>
  </div>
);

const Bubble: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div
    className="absolute w-3 h-3 bg-yellow-300/50 rounded-full border-2 border-yellow-400 animate-fizz"
    style={style}
  ></div>
);

const MagnifyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="11" y1="8" x2="11" y2="14"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

// --- Illustrative Icons for Reference Chart ---
const SoilIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 15C3 15 3 19 7 19C11 19 11.5 17 13.5 17C15.5 17 16 19 19 19C20.1046 19 21 18.1046 21 17V15H3Z"
      fill="#a16207"
      stroke="#6d4c41"
      strokeWidth="1"
    />
    <path
      d="M6 15L5 13M9 15L8 13M12 15L11 13M15 15L14 13M18 15L17 13"
      stroke="#d2a679"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const FlowerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
      fill="#fde047"
    />
    <path
      d="M12 8C12 5.33333 14 3 14 3C14 3 16 5.33333 16 8C18.6667 8 21 10 21 10C21 10 18.6667 12 16 12C16 14.6667 14 17 14 17C14 17 12 14.6667 12 12C9.33333 12 7 10 7 10C7 10 9.33333 8 12 8Z"
      fill="#e11d48"
    />
  </svg>
);

const FizzIcon: React.FC = () => (
  <div
    className="flex justify-center items-center gap-0.5"
    title="Fizzing Bubbles"
  >
    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-70" />
    <span className="w-2 h-2 bg-yellow-300 rounded-full" />
    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-70" />
  </div>
);
const SparkleIcon: React.FC = () => (
  <div className="flex justify-center items-center" title="Glittery Sparkles">
    <svg
      className="w-4 h-4 text-pink-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M10 1.5l1.1 3.4h3.6l-2.9 2.1 1.1 3.4-2.9-2.1-2.9 2.1 1.1-3.4-2.9-2.1h3.6z" />
    </svg>
  </div>
);
const NoReactionIcon: React.FC = () => (
  <div className="flex justify-center items-center" title="No Reaction">
    <span className="w-3 h-0.5 bg-slate-500 rounded-full" />
  </div>
);

const getReactionIcon = (reactionText: string) => {
  if (reactionText.includes("Fizz")) return <FizzIcon />;
  if (reactionText.includes("Sparkle")) return <SparkleIcon />;
  return <NoReactionIcon />;
};

interface ChemicalAnalysisGameProps {
  puzzle: Puzzle;
  onComplete: () => void;
}

const ChemicalAnalysisGame: React.FC<ChemicalAnalysisGameProps> = ({
  puzzle,
  onComplete,
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(
    "Drag a reagent to the sample dish.",
  );
  const [appliedReagents, setAppliedReagents] = useState(new Set<ReagentID>());
  const [playerSelection, setPlayerSelection] = useState({
    soil: false,
    preservative: false,
  });
  const [reactionKey, setReactionKey] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  const particlePositions = useMemo(
    () => ({
      soil: Array.from({ length: 10 }, (_, i) => ({
        top: `${15 + Math.random() * 70}%`,
        left: `${15 + Math.random() * 70}%`,
        delay: `${i * 0.15}s`,
      })),
      preservative: Array.from({ length: 8 }, (_, i) => ({
        top: `${15 + Math.random() * 70}%`,
        left: `${15 + Math.random() * 70}%`,
        delay: `${(i + 10) * 0.15}s`,
      })),
    }),
    [],
  );

  const isSoilReactionVisible = appliedReagents.has("reagentA");
  const isPreservativeReactionVisible = appliedReagents.has("reagentB");

  const REFERENCE_CHART = [
    {
      substance: "Potting Soil",
      icon: <SoilIcon className="w-8 h-8 mx-auto" />,
      reactionA: "Fizzing Bubbles",
      reactionB: "No Reaction",
    },
    {
      substance: "Floral Preservative",
      icon: <FlowerIcon className="w-8 h-8 mx-auto" />,
      reactionA: "No Reaction",
      reactionB: "Glittery Sparkles",
    },
  ];

  const handleApplyReagent = (reagentId: ReagentID) => {
    if (appliedReagents.has(reagentId) || isSolved) return;
    setAppliedReagents((prev) => new Set(prev).add(reagentId));
    setReactionKey((prev) => prev + 1);
    setIsDropping(true);
    setTimeout(() => setIsDropping(false), 500);
    setMessage("Reaction observed. Check the reference chart.");
  };

  const handleConfirm = () => {
    if (isSolved) return;
    const isCorrect = playerSelection.soil && playerSelection.preservative;
    if (isCorrect) {
      setMessage("ANALYSIS CONFIRMED: Components identified!");
      setIsSolved(true);
      setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
      setTimeout(() => {
        setIsSuccess(true);
      }, 1500);
    } else {
      setMessage("INCORRECT: Review the reactions and your conclusion.");
      setTimeout(() => {
        if (!isSolved) {
          setMessage("Select the correct components based on the chart.");
        }
      }, 3000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const reagentId = e.dataTransfer.getData("reagentId") as ReagentID;
    if (reagentId) {
      handleApplyReagent(reagentId);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[500px]">
        <CheckCircleIcon className="w-20 h-20 text-green-400" />
        <h3 className="font-teko text-3xl text-green-300 mt-3">
          CHEMICAL ANALYSIS COMPLETE
        </h3>
        <p className="text-slate-300">{puzzle.clue}</p>
      </div>
    );
  }

  const canConfirm = playerSelection.soil || playerSelection.preservative;

  return (
    <div className="p-2 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[600px] flex flex-col space-y-2 relative">
      <h3 className="font-teko text-3xl text-center text-blue-300">
        Chemical Reagent Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        {/* Left Column: Lab Bench */}
        <div className="flex flex-col space-y-4">
          <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-700/50 flex-grow flex flex-col">
            <h4 className="font-teko text-xl text-center text-slate-300 mb-2">
              Step 1: Test the Sample
            </h4>
            <div className="relative flex-grow flex items-center justify-center">
              <div
                className="relative w-full max-w-[200px] aspect-square"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="absolute -top-1 -right-1 z-20 p-2 bg-slate-700 rounded-full text-slate-300 hover:bg-slate-600 hover:text-white transition-all"
                  title="Magnify Sample"
                >
                  <MagnifyIcon className="w-5 h-5" />
                </button>
                <div
                  className={`w-full h-full bg-slate-900 rounded-full border-4 border-slate-700 p-4 transition-transform duration-300 ${
                    isZoomed ? "scale-125" : ""
                  } ${
                    isDropping ? "scale-105 shadow-lg shadow-blue-500/20" : ""
                  }`}
                >
                  <div className="relative w-full h-full rounded-full bg-slate-800/50 overflow-hidden">
                    {particlePositions.soil.map((pos, i) => (
                      <div
                        key={`s-${i}`}
                        className="absolute w-1.5 h-1.5 bg-amber-900 rounded-full animate-pulse-glow"
                        style={{
                          top: pos.top,
                          left: pos.left,
                          animationDelay: pos.delay,
                        }}
                      />
                    ))}
                    {particlePositions.preservative.map((pos, i) => (
                      <div
                        key={`p-${i}`}
                        className="absolute w-1 h-1 bg-slate-400/70 rounded-sm animate-pulse-glow"
                        style={{
                          top: pos.top,
                          left: pos.left,
                          animationDelay: pos.delay,
                        }}
                      />
                    ))}
                    {isSoilReactionVisible &&
                      particlePositions.soil.map((pos, i) => (
                        <Bubble key={`${reactionKey}-b-${i}`} style={pos} />
                      ))}
                    {isPreservativeReactionVisible &&
                      particlePositions.preservative.map((pos, i) => (
                        <Sparkle key={`${reactionKey}-p-${i}`} style={pos} />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <p className="text-center font-bold text-slate-300 mb-2">
              Drag a reagent to the sample
            </p>
            <div className="grid grid-cols-3 gap-2">
              {REAGENTS.map((reagent) => (
                <div
                  key={reagent.id}
                  draggable={!appliedReagents.has(reagent.id) && !isSolved}
                  onDragStart={(e) =>
                    e.dataTransfer.setData("reagentId", reagent.id)
                  }
                  title={reagent.description}
                  className={`p-2 rounded-md text-sm font-bold text-white text-center transition-all transform hover:-translate-y-1 ${
                    appliedReagents.has(reagent.id) || isSolved
                      ? "bg-slate-600 opacity-50 cursor-not-allowed"
                      : `${reagent.color} ${reagent.hoverColor} cursor-grab active:cursor-grabbing hover:shadow-md hover:shadow-blue-400/30`
                  }`}
                >
                  {reagent.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Analysis & Findings */}
        <div className="flex flex-col space-y-4">
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <h4 className="font-teko text-xl text-center text-slate-300 mb-2">
              Step 2: Reference Chart
            </h4>
            <div className="grid grid-cols-[1fr,auto,auto] items-center gap-x-2 text-center text-xs font-semibold text-slate-400 mb-1 px-2">
              <span>Substance</span>
              <span title="Terra-Test">T-Test</span>
              <span title="Flora-Scan">F-Scan</span>
            </div>
            <div className="space-y-2">
              {REFERENCE_CHART.map((item) => (
                <div
                  key={item.substance}
                  className="grid grid-cols-[1fr,auto,auto] gap-x-2 items-center bg-slate-800/40 p-2 rounded"
                >
                  <div className="flex items-center gap-2 text-left">
                    {item.icon}
                    <span className="font-semibold text-slate-200 text-sm">
                      {item.substance}
                    </span>
                  </div>
                  <div
                    className={`flex justify-center transition-opacity duration-500 ${
                      isSoilReactionVisible || isPreservativeReactionVisible
                        ? "opacity-100"
                        : "opacity-20"
                    }`}
                  >
                    {getReactionIcon(item.reactionA)}
                  </div>
                  <div
                    className={`flex justify-center transition-opacity duration-500 ${
                      isSoilReactionVisible || isPreservativeReactionVisible
                        ? "opacity-100"
                        : "opacity-20"
                    }`}
                  >
                    {getReactionIcon(item.reactionB)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 flex-grow flex flex-col justify-between">
            <div>
              <h4 className="font-teko text-xl text-center text-slate-300 mb-3">
                Step 3: Record Your Findings
              </h4>
              <p className="text-center text-slate-400 text-sm mb-3">
                Based on the reactions, what is in the smudge?
              </p>
              <div className="flex flex-col items-center gap-2">
                <label className="flex items-center gap-2 text-slate-200 font-semibold cursor-pointer p-2 rounded-md hover:bg-slate-800 w-full justify-center">
                  <input
                    type="checkbox"
                    checked={playerSelection.soil}
                    onChange={(e) =>
                      setPlayerSelection((p) => ({
                        ...p,
                        soil: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 bg-slate-600 border-slate-500 rounded text-blue-500 focus:ring-blue-600 cursor-pointer"
                  />
                  Potting Soil
                </label>
                <label className="flex items-center gap-2 text-slate-200 font-semibold cursor-pointer p-2 rounded-md hover:bg-slate-800 w-full justify-center">
                  <input
                    type="checkbox"
                    checked={playerSelection.preservative}
                    onChange={(e) =>
                      setPlayerSelection((p) => ({
                        ...p,
                        preservative: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 bg-slate-600 border-slate-500 rounded text-blue-500 focus:ring-blue-600 cursor-pointer"
                  />
                  Floral Preservative
                </label>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleConfirm}
                disabled={!canConfirm || isSolved}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Confirm Analysis
              </button>
              <p
                className={`text-sm mt-1 h-5 text-center transition-all font-semibold ${
                  isSolved ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChemicalAnalysisGame;
