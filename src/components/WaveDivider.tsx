"use client";

type Variant = "wave" | "wave-inverted" | "tilt" | "curve" | "zigzag" | "blob";

const PATHS: Record<Variant, string> = {
  wave: "M0,160 C240,320 480,0 720,80 C960,160 1200,240 1440,120 L1440,320 L0,320 Z",
  "wave-inverted":
    "M0,160 C240,0 480,320 720,240 C960,160 1200,80 1440,200 L1440,0 L0,0 Z",
  tilt: "M0,320 L1440,0 L1440,320 L0,320 Z",
  curve: "M0,0 Q720,320 1440,0 L1440,320 L0,320 Z",
  zigzag:
    "M0,120 L160,40 L320,160 L480,40 L640,160 L800,40 L960,160 L1120,40 L1280,160 L1440,40 L1440,320 L0,320 Z",
  blob: "M0,200 C200,80 400,300 720,180 C1040,60 1240,260 1440,140 L1440,320 L0,320 Z",
};

export default function WaveDivider({
  variant = "wave",
  fromColor = "transparent",
  toColor = "rgba(12,7,33,1)",
  flip = false,
  className = "",
  height = 120,
}: {
  variant?: Variant;
  fromColor?: string;
  toColor?: string;
  flip?: boolean;
  className?: string;
  height?: number;
}) {
  const id = `wave-grad-${variant}-${fromColor.slice(0, 4)}-${toColor.slice(0, 4)}`;
  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden leading-none ${className}`}
      style={{ height, transform: flip ? "rotate(180deg)" : undefined }}
    >
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
        </defs>
        <path d={PATHS[variant]} fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
