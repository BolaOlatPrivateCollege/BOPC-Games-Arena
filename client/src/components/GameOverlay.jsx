/**
 * Game Overlay Component
 * Displays centered game messages with fade animation
 * Used for countdowns, turn indicators, and result messages
 */
export default function GameOverlay({ message, show = false, duration = null, onComplete = null }) {
  if (!show && !message) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        className={`text-center transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        style={{
          animation: show && duration ? `fadeInOut ${duration}ms ease-in-out` : 'none'
        }}
        onAnimationEnd={onComplete}
      >
        <div className="bg-slate-950/70 backdrop-blur-sm rounded-3xl px-8 py-12 sm:px-12 sm:py-16 max-w-xs mx-4 shadow-2xl">
          <p className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
            {message}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  )
}
