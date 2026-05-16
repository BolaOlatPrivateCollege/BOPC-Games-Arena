/**
 * Game Board Tic Tac Toe Component
 * Renders the 3x3 game board with clickable cells
 */
export default function GameBoardTicTacToe({
  board = Array(9).fill(null),
  onCellClick,
  disabled = false,
  gameOver = false,
  statusMessage = ''
}) {
  const renderCell = (index) => {
    const value = board[index]

    return (
      <button
        key={index}
        onClick={() => {
          if (!disabled && !gameOver && value === null) {
            onCellClick(index)
          }
        }}
        disabled={disabled || gameOver || value !== null}
        className={`h-24 w-24 rounded-3xl border border-slate-300 bg-white text-5xl font-bold transition duration-200 ${disabled || gameOver || value !== null ? 'cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-indigo-50'} ${value === 'X' ? 'text-indigo-600' : ''} ${value === 'O' ? 'text-rose-600' : ''}`}
      >
        {value}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="inline-block border-4 border-gray-400 rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-3 gap-0">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(index => renderCell(index))}
        </div>
      </div>

      {gameOver && (
        <div className="text-center text-gray-600">
          <p className="text-lg">Game has ended</p>
        </div>
      )}

      {!gameOver && statusMessage && (
        <div className="text-center text-gray-600">
          <p className="text-lg">{statusMessage}</p>
        </div>
      )}
    </div>
  )
}