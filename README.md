# BOPC Games Arena - Version 1.0

A full-stack multiplayer gaming platform built with modern web technologies. Play classic games like Tic Tac Toe in real-time with friends!

## 🎮 Features

### Version 1.0 Includes:
- **Landing Page** - Beautiful welcome screen with feature highlights
- **Guest Username Entry** - Quick login with custom usernames (no registration required)
- **Game Lobby** - Central hub to create/join rooms or view leaderboards
- **Multiplayer Tic Tac Toe** - Real-time 2-player Tic Tac Toe game
- **Room Creation** - Create private game rooms with auto-generated room codes
- **Room Joining** - Join existing rooms using room codes
- **Basic Leaderboard** - View player rankings based on wins, losses, and win rate
- **Admin Dashboard** - Placeholder for future admin features

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Modern bundler and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - NoSQL database for leaderboard storage
- **Mongoose** - MongoDB ODM

## 📁 Project Structure

```
BOPC-Games-Arena/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── UsernameEntryPage.jsx
│   │   │   ├── GameLobby.jsx
│   │   │   ├── TicTacToePage.jsx
│   │   │   ├── RoomPage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/              # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── CreateRoomModal.jsx
│   │   │   ├── JoinRoomModal.jsx
│   │   │   └── GameBoardTicTacToe.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   └── useSocket.js         # Socket.io connection hook
│   │   ├── App.jsx                  # Main app component with routing
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── index.html                   # HTML template
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── models/
│   │   │   ├── Leaderboard.js       # Leaderboard schema & methods
│   │   │   └── Room.js              # Room management (in-memory)
│   │   ├── routes/
│   │   │   ├── rooms.js             # Room API endpoints
│   │   │   └── leaderboard.js       # Leaderboard API endpoints
│   │   ├── sockets/
│   │   │   └── handlers.js          # Socket.io event handlers
│   │   ├── controllers/             # (Placeholder for future use)
│   │   └── server.js                # Main server entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── README.md                        # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud - MongoDB Atlas recommended)

### Installation

#### 1. Clone and Setup
```bash
# Navigate to the project directory
cd BOPC-Games-Arena

# Setup Frontend
cd client
npm install
cp .env.example .env.local

# Setup Backend
cd ../server
npm install
cp .env.example .env
```

#### 2. Configure Environment Variables

**Backend (.env)**
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bopc-games-arena
CLIENT_URL=http://localhost:5173
TIC_TAC_TOE_TIMEOUT=300000
ROOM_CLEANUP_INTERVAL=60000
SESSION_SECRET=your-super-secret-key-change-in-production
LOG_LEVEL=debug
```

**Frontend (.env.local)**
```env
VITE_SERVER_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

#### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
mongod

# macOS/Linux
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get connection string
- Update MONGODB_URI in .env
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bopc-games-arena
```

#### 4. Run the Application

**Terminal 1 - Start Backend Server**
```bash
cd server
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Start Frontend Dev Server**
```bash
cd client
npm run dev
# App opens at http://localhost:5173
```

## 🎮 How to Play

1. **Open App** - Navigate to http://localhost:5173
2. **Enter Username** - Click "Play as Guest" and enter your username (3-20 characters)
3. **Lobby** - Choose your action:
   - **Create Room** - Start a new game (you become room owner)
   - **Join Room** - Enter a room code from a friend
   - **Leaderboard** - View player rankings
4. **Waiting Room** - Once both players join, room owner clicks "Start Game"
5. **Play** - Take turns clicking cells on the 3x3 board
6. **Win** - Get three in a row (horizontally, vertically, or diagonally)
7. **Results** - View game result and play again or return to lobby

## 📊 Game Rules - Tic Tac Toe

- **2 Players** - One plays as X, one as O
- **Turn-based** - Players alternate placing their symbol
- **Win Condition** - First to get 3 symbols in a row wins
- **Draw** - Game ends in a draw if board is full with no winner
- **Rating** - Win: +25 rating, Loss: -25 rating, Draw: +10 rating

## 🗄️ Database Schema

### Leaderboard Collection
```javascript
{
  username: String,          // Unique player username
  wins: Number,             // Total wins
  losses: Number,           // Total losses
  draws: Number,            // Total draws
  rating: Number,           // ELO-style rating (default: 1000)
  totalGamesPlayed: Number, // Total games
  winRate: Number,          // Win percentage (0-100)
  rank: Number,             // Current rank
  lastGameDate: Date,       // Last game played
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 Socket.io Events

### Client to Server
```javascript
// Join a room
socket.emit('join-room', { roomCode })

// Start a game
socket.emit('start-game', { roomCode })

// Make a move in Tic Tac Toe
socket.emit('make-move', { roomCode, index, playerSymbol })

// Leave a room
socket.emit('leave-room', { roomCode })

// Fetch leaderboard
socket.emit('fetch-leaderboard')
```

### Server to Client
```javascript
// Room joined successfully
socket.on('room-joined', { roomCode, players, isOwner, roomStatus })

// Game is starting
socket.on('game-starting', { roomCode, gameType, players })

// Game state updated
socket.on('game-state-update', { board, currentPlayer, gameOver, winner, gameStatus })

// Move was made
socket.on('move-made', { playerSymbol, index, playerUsername })

// Game ended
socket.on('game-ended', { roomCode, gameStatus, winner, message, isDraw })

// Leaderboard data
socket.on('leaderboard-data', { leaderboard, userStats })

// Error occurred
socket.on('error', { message })
```

## 📡 REST API Endpoints

### Rooms
```
POST   /api/rooms/create        - Create a new room
POST   /api/rooms/join          - Join an existing room
GET    /api/rooms/:roomCode     - Get room details
DELETE /api/rooms/:roomCode     - Delete a room
```

### Leaderboard
```
GET    /api/leaderboard                      - Get top 100 players
GET    /api/leaderboard/user/:username       - Get specific user stats
POST   /api/leaderboard/record-game          - Record game result
```

## 🔒 Security Considerations

For production deployment:
- [ ] Add user authentication (JWT tokens)
- [ ] Validate all user inputs
- [ ] Use HTTPS/WSS for encrypted connections
- [ ] Implement rate limiting
- [ ] Add CORS protection
- [ ] Use environment variables for secrets
- [ ] Implement game state validation to prevent cheating
- [ ] Add input sanitization

## 🐛 Troubleshooting

### Connection Issues
- **Confirm MongoDB is running** - Check your MongoDB connection string
- **Port conflicts** - Ensure ports 3000 and 5173 are not in use
- **CORS errors** - Verify CLIENT_URL matches your frontend URL

### Socket.io Connection Fails
- Check browser console for errors
- Verify server is running: `curl http://localhost:3000/health`
- Check firewall settings

### Games Not Saving Stats
- Ensure MongoDB is connected
- Check server logs for database errors
- Verify Leaderboard model connection

## 📝 Development Tips

### Adding a New Game
1. Create game logic class in `server/src/sockets/handlers.js`
2. Add Socket.io event handlers for game moves
3. Create game board component in `client/src/components/`
4. Add game page in `client/src/pages/`
5. Update GameLobby.jsx with new game option
6. Add game route in App.jsx

### Testing
```bash
# Backend tests (when available)
cd server
npm test

# Frontend tests (when available)
cd client
npm test
```

## 📚 Learning Resources

- [React Docs](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Socket.io Guide](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)

## 🚢 Deployment

### Deploy Backend (Heroku/Railway)
```bash
cd server
git init
git add .
git commit -m "Initial commit"
# Follow platform-specific deployment instructions
```

### Deploy Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Follow platform-specific deployment instructions
```

## 📋 Future Features (v2.0+)

- [ ] User authentication and accounts
- [ ] More games (Chess, Connect Four, Checkers, etc.)
- [ ] Chat in game rooms
- [ ] Friends list
- [ ] Match history
- [ ] Player profiles
- [ ] Tournaments
- [ ] Mobile app (React Native)
- [ ] Spectator mode
- [ ] Replay system
- [ ] Custom game settings
- [ ] Achievement system
- [ ] Seasonal rankings

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Built with ❤️ for gaming enthusiasts**

Version 1.0 - May 2026
