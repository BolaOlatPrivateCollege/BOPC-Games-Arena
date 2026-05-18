/**
 * Game Overlay Component
 * Displays centered game messages with fade animation
 * Used for countdowns, turn indicators, and result messages
 * Responsive text sizing for mobile, tablet, and desktop
 */
export default function GameOverlay({ message, show = false, duration = null, onComplete = null }) {
  if (!show && !message) return null

  // Determine text size and wrapping based on message length
  // Short messages (≤12 chars) stay on one line: START, DRAW, TIME UP, YOU WIN, YOU LOSE, numbers
  // Longer messages allow wrapping: OPPONENT'S TURN, BOT IS THINKING, HIT THE TARGETS
  const isShortMessage = message && message.length <= 12
  
  const textSizeClass = isShortMessage 
    ? 'text-3xl sm:text-4xl md:text-5xl' 
    : 'text-2xl sm:text-3xl md:text-4xl'
  
  const textWrapClass = isShortMessage
    ? 'whitespace-nowrap'
    : 'whitespace-normal break-words'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        className={`text-center transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        style={{
          animation: show && duration ? `fadeInOut ${duration}ms ease-in-out` : 'none'
        }}
        onAnimationEnd={onComplete}
      >
        <div className="bg-slate-950/70 backdrop-blur-sm rounded-3xl px-6 py-8 sm:px-10 sm:py-12 md:px-12 md:py-16 max-w-[95%] w-auto min-w-fit mx-auto shadow-2xl">
          <p className={`${textSizeClass} font-black text-white text-center ${textWrapClass}`}>
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
