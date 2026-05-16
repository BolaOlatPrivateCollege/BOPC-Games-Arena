export default function TargetArenaBoard({ targets, onTargetClick, disabled }) {
  return (
    <div className="relative h-[420px] min-h-[320px] w-full overflow-hidden rounded-[2rem] bg-slate-950/90 border border-slate-800 shadow-inner">
      {targets.map((target) => (
        <button
          key={target.id}
          type="button"
          onClick={() => !disabled && onTargetClick(target.id, target.type)}
          className={`absolute flex items-center justify-center rounded-full border-2 transition-transform duration-150 focus:outline-none ${
            target.type === 'normal'
              ? 'bg-indigo-500 border-indigo-300'
              : target.type === 'fast'
                ? 'bg-emerald-400 border-emerald-200'
                : target.type === 'golden'
                  ? 'bg-yellow-300 border-amber-400 shadow-[0_0_15px_rgba(250,204,21,0.35)]'
                  : 'bg-slate-700 border-slate-500'
          } ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-110'}`}
          style={{
            left: `${target.x}%`,
            top: `${target.y}%`,
            width: `${target.size}px`,
            height: `${target.size}px`,
            transform: 'translate(-50%, -50%)'
          }}
          aria-label={`${target.type} target`}
        >
          <span className="text-lg font-bold text-slate-950 select-none">
            {target.type === 'normal' && '🎈'}
            {target.type === 'fast' && '⭐'}
            {target.type === 'golden' && '✨'}
            {target.type === 'wrong' && '🤖'}
          </span>
        </button>
      ))}
    </div>
  )
}
