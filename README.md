# Meet Stranger Clone - Video Chat App

A modern video chat application inspired by Omegle, built with Next.js, WebRTC, and Socket.IO.

## Features

- 🎥 **Video Chat**: Real-time video communication using WebRTC
- 💬 **Text Chat**: Instant messaging between users
- 🎯 **Interest Matching**: Connect with users who share similar interests
- 🌙 **Dark Theme**: Modern dark UI design
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔒 **Secure**: Peer-to-peer connections with signaling server

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Real-time Communication**: WebRTC, Socket.IO
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd video-chat-app
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:3001" > .env.local
```

4. Start the development servers:

```bash
# Start both frontend and backend
npm run dev:full

# Or start them separately:
# Terminal 1: Start Socket.IO server
npm run server

# Terminal 2: Start Next.js development server
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Landing Page**: Choose between text or video chat, optionally add interests
2. **Video Chat**:
   - Top video window shows the other user
   - Bottom video window shows your own webcam
   - Chat panel on the right for messaging
3. **Text Chat**: Simple text-based communication
4. **Matching**: Users are randomly matched based on availability

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Landing page
│   ├── chat/
│   │   └── page.tsx      # Chat interface
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── hooks/
│   └── useWebRTC.ts      # WebRTC connection hook
server.js                 # Socket.IO signaling server
```

## API Endpoints

The Socket.IO server handles:

- User matching and room creation
- WebRTC signaling (offers, answers, ICE candidates)
- Chat message relay
- Connection state management

## Browser Compatibility

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
