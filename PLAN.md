# Pyramid Stream Implementation Plan

## Project Overview
A decentralized streaming platform using Nostr for discovery and Trystero for WebRTC peer-to-peer streaming. The system creates a pyramid/tree topology where viewers can become rebroadcasters, allowing unlimited scalability without servers.

## Architecture

### Core Components
1. **Frontend (React + Wouter routing)**
2. **Nostr Integration (snstr library)**
3. **WebRTC P2P Streaming (Trystero)**
4. **Stream Discovery & Management**
5. **Rebroadcast Network**

## Technical Stack

### Dependencies to Add
```bash
bun add wouter snstr trystero react react-dom
bun add -d @types/react @types/react-dom
```

### File Structure
```
/
├── index.html          # Main HTML entry point
├── src/
│   ├── index.tsx       # React app root
│   ├── components/
│   │   ├── StreamHost.tsx     # Host streaming interface
│   │   ├── StreamViewer.tsx   # Viewer interface
│   │   ├── StreamList.tsx     # Available streams
│   │   ├── RebroadcastButton.tsx
│   │   ├── RetroHeader.tsx    # PYRAMID STREAM title component
│   │   ├── GoLiveButton.tsx   # Windows 95-style button
│   │   ├── RoomStatus.tsx     # Current room/stream ID display
│   │   └── DebugPanel.tsx     # Collapsible debug info
│   ├── hooks/
│   │   ├── useNostr.ts        # Nostr event management
│   │   ├── useWebRTC.ts       # Trystero WebRTC handling
│   │   └── useStream.ts       # Stream state management
│   ├── services/
│   │   ├── nostr.ts           # Nostr client wrapper
│   │   ├── webrtc.ts          # Trystero room management
│   │   └── streamDiscovery.ts # Stream/restream discovery
│   ├── styles/
│   │   └── retro.css          # Windows 95 + Times New Roman styling
│   └── types/
│       └── index.ts           # TypeScript definitions
├── server.ts           # Bun development server
└── dist/              # Build output for deployment
```

## Implementation Phases

### Phase 1: Basic Streaming Infrastructure

#### 1.1 Setup Development Environment
- [x] Bun React project initialized
- [ ] Install dependencies (wouter, snstr, trystero)
- [ ] Setup basic HTML entry point with camera access
- [ ] Create Bun development server with hot reload

#### 1.2 Camera Access & Local Streaming
- [ ] Implement camera permission request
- [ ] Create video preview component
- [ ] Setup MediaStream capture
- [ ] Basic "GO LIVE" button functionality

#### 1.3 Nostr Integration
- [ ] Setup snstr client with relay connections
- [ ] Use Kind 30078 (Application Data) for stream announcements
- [ ] Implement stream announcement publishing
- [ ] Create shareable URLs with event IDs (`/s/nevent123...`)

### Phase 2: WebRTC P2P Streaming

#### 2.1 Trystero Integration
- [ ] Setup Trystero room creation for streams
- [ ] Implement peer discovery and connection
- [ ] Stream sharing to connected peers
- [ ] Handle peer joining/leaving events

#### 2.2 Stream Discovery
- [ ] Subscribe to stream announcement events
- [ ] Display active streams list
- [ ] Join stream rooms as viewers
- [ ] Handle stream capacity management (max 2 viewers initially)

#### 2.3 Basic Viewer Experience
- [ ] Stream selection interface
- [ ] Video playback component
- [ ] Connection status indicators
- [ ] Automatic fallback when streams are full

### Phase 3: Rebroadcast Network

#### 3.1 Rebroadcast Functionality
- [ ] "Rebroadcast" button for viewers
- [ ] Create new Nostr event referencing original stream
- [ ] Setup new Trystero room for rebroadcast
- [ ] Forward original stream to new viewers

#### 3.2 Stream Topology Management
- [ ] Track viewer counts for each stream/rebroadcast
- [ ] Publish capacity information to Nostr
- [ ] Implement intelligent stream selection (prefer available capacity)
- [ ] Handle stream/rebroadcast disconnections

#### 3.3 Multi-level Rebroadcasting
- [ ] Support re-restreams (streams of rebroadcasts)
- [ ] Maintain stream quality across hops
- [ ] Track and display stream hierarchy
- [ ] Optimize peer discovery across network topology

### Phase 4: User Experience & Polish

#### 4.1 Routing & URLs
- [ ] Implement Wouter routing for stream URLs
- [ ] Handle `/s/nevent123...` pattern
- [ ] Stream metadata display
- [ ] Share functionality for stream URLs

#### 4.2 UI/UX Design
- [ ] **Retro 90s aesthetic**: HUGE Times New Roman "PYRAMID STREAM" title
- [ ] **Windows 95-style GO LIVE button** with Times New Roman font
- [ ] **Clear room identification**: Display current room/stream ID prominently
- [ ] **Debug UI panels**: Collapsible `<details>` sections with JSON data:
  - Available rooms list
  - Original event IDs
  - Available restreams
  - WebRTC connection states
  - Nostr relay status
  - Peer connection details
- [ ] Stream thumbnails/previews
- [ ] Viewer count displays  
- [ ] Connection quality indicators
- [ ] Mobile responsive design (while maintaining retro aesthetic)

#### 4.3 Error Handling & Recovery
- [ ] Connection failure recovery
- [ ] Stream quality adaptation
- [ ] Graceful degradation when peers disconnect
- [ ] User feedback for connection issues

### Phase 5: Advanced Features

#### 5.1 Stream Management
- [ ] Stream titles and descriptions
- [ ] Category/tag system
- [ ] Stream scheduling
- [ ] Historical stream records

#### 5.2 Network Optimization
- [ ] Bandwidth monitoring
- [ ] Dynamic quality adjustment
- [ ] Peer selection optimization
- [ ] Load balancing across rebroadcasters

#### 5.3 Security & Privacy
- [ ] Stream authentication options
- [ ] Private/unlisted streams
- [ ] Content moderation tools
- [ ] Spam prevention

## Data Structures

### Nostr Event Types

#### Stream Announcement Event (Kind 30078)
```json
{
  "kind": 30078,
  "content": "{\"title\": \"My Stream\", \"description\": \"...\", \"capacity\": 2, \"viewers\": 1, \"trystero_room\": \"room-id-for-webrtc\", \"status\": \"live\"}",
  "tags": [
    ["d", "com.pyramidstream.stream.stream-unique-id"]
  ]
}
```

#### Rebroadcast Event (Kind 30078)
```json
{
  "kind": 30078,
  "content": "{\"title\": \"Rebroadcast: My Stream\", \"capacity\": 2, \"viewers\": 0, \"trystero_room\": \"rebroadcast-room-id\", \"status\": \"live\", \"original_stream_id\": \"original-stream-event-id\", \"is_rebroadcast\": true}",
  "tags": [
    ["d", "com.pyramidstream.rebroadcast.rebroadcast-unique-id"],
    ["e", "original-stream-event-id"],
    ["p", "original-streamer-pubkey"]
  ]
}
```

### WebRTC Room Structure
- Original stream: `stream-{event-id}`
- Rebroadcast: `restream-{rebroadcast-event-id}`
- Room messages for capacity updates and peer management

## Development Workflow

1. **Start with Phase 1.1** - Get basic infrastructure working
2. **Test each component individually** - Camera, Nostr, WebRTC separately
3. **Iterative integration** - Combine components step by step
4. **Test with multiple browsers/devices** - Ensure P2P connections work
5. **Deploy static build to Vercel** - No backend required

## Key Technical Challenges

1. **WebRTC Connection Limits** - Managing browser peer connection limits
2. **Stream Quality** - Maintaining quality across rebroadcast hops
3. **Network Topology** - Efficient peer discovery and load balancing
4. **Mobile Compatibility** - WebRTC support across devices
5. **Relay Reliability** - Handling Nostr relay failures

## Testing Strategy

1. **Local Development** - Test with multiple browser tabs/windows
2. **Network Testing** - Test across different networks/NAT configurations
3. **Load Testing** - Simulate multiple viewers and rebroadcasters
4. **Mobile Testing** - Ensure mobile browser compatibility
5. **Relay Testing** - Test with different Nostr relay configurations

## Deployment

- **Frontend Only** - Static build deployed to Vercel
- **All routing to index.html** - SPA with client-side routing
- **No backend dependencies** - Pure P2P + Nostr architecture
- **CDN Distribution** - Fast global access to the application

This plan provides a structured approach to building the decentralized streaming platform while maintaining the core vision of unlimited scalability through peer-to-peer rebroadcasting.