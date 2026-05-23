export default function PassAnimation() {
  return (
    <div className="pass-anim w-full max-w-sm mx-auto px-6 pb-8 pt-12">
      <svg viewBox="0 0 300 80" className="w-full h-auto">
        <g stroke="#000000" strokeWidth="1.8" fill="none" strokeLinecap="round">
          {/* Left stickman (faces right) */}
          <g className="stickman-l">
            <circle cx="40" cy="18" r="6" />
            <line x1="40" y1="24" x2="40" y2="48" />
            <line x1="40" y1="32" x2="32" y2="42" className="l-arm-back" />
            <line x1="40" y1="32" x2="48" y2="42" className="l-arm-front" />
            <line x1="40" y1="48" x2="34" y2="66" className="l-leg-stand" />
            <line x1="40" y1="48" x2="46" y2="66" className="l-leg-kick" />
          </g>

          {/* Right stickman (faces left) */}
          <g className="stickman-r">
            <circle cx="260" cy="18" r="6" />
            <line x1="260" y1="24" x2="260" y2="48" />
            <line x1="260" y1="32" x2="252" y2="42" className="r-arm-front" />
            <line x1="260" y1="32" x2="268" y2="42" className="r-arm-back" />
            <line x1="260" y1="48" x2="254" y2="66" className="r-leg-kick" />
            <line x1="260" y1="48" x2="266" y2="66" className="r-leg-stand" />
          </g>
        </g>

        {/* Ground line */}
        <line x1="20" y1="68" x2="280" y2="68" stroke="#000000" strokeWidth="0.8" />

        {/* Ball */}
        <circle r="3.5" fill="#000000" className="pass-ball" />
      </svg>
    </div>
  );
}
