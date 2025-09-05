# MAKE IT REAL: Pyramid Stream Protocol Implementation

## Vision
Transform the current manual room testing into a full Nostr-based pyramid streaming protocol where streams are discoverable via URLs and infinite rebroadcast chains create unlimited scalability.

## Architecture Overview

### Event ID = Room ID Principle
- **Nostr Event ID** (from Kind 30078 stream events) = **Trystero Room Name**
- Perfect 1:1 mapping between streams and P2P rooms
- URL structure: `/stream/nevent123...` maps directly to `joinRoom(config, eventId)`

### URL Structure
- **`/`** - Go Live UI (nsec input + camera + publish stream event)
- **`/stream/nevent123...`** - Stream viewer (fetch event + join room + rebroadcast option)

### Pyramid Hierarchy
```
Original Stream (nevent-abc) 
    ↓
Rebroadcast Level 1 (nevent-def) [e: abc, original: abc]
    ↓  
Rebroadcast Level 2 (nevent-ghi) [e: def, original: abc]
    ↓
Infinite scaling...
```

## Implementation Plan

### Phase 1: Nostr Integration Foundation

#### 1.1 Dependencies & Setup
- [ ] `bun add snstr wouter` - Add Nostr client and routing
- [ ] Create `useNostr` hook for event publishing/fetching
- [ ] Add nsec key management (simple text input + localStorage)

#### 1.2 Core Nostr Operations
- [ ] **Stream Event Publishing** - Publish Kind 30078 when going live
- [ ] **Event Fetching** - Fetch stream events by ID for `/stream/nevent...` URLs  
- [ ] **Rebroadcast Event Publishing** - Reference parent stream in `e` tag
- [ ] **Hierarchy Traversal** - Follow event chains to build stream tree

#### 1.3 Event Structure Implementation
```js
// Original Stream Event
{
  kind: 30078,
  content: JSON.stringify({
    title: "My Stream",
    trystero_room: eventId, // Same as event ID!
    status: "live",
    stream_depth: 0
  }),
  tags: [["d", "com.pyramidstream.stream." + eventId]]
}

// Rebroadcast Event  
{
  kind: 30078,
  content: JSON.stringify({
    title: "Rebroadcast: My Stream", 
    trystero_room: eventId, // This event's ID
    status: "live",
    stream_depth: parentDepth + 1,
    parent_stream: parentEventId
  }),
  tags: [
    ["d", "com.pyramidstream.rebroadcast." + eventId],
    ["e", parentEventId], // Immediate parent
    ["original", originalStreamId] // Root of pyramid
  ]
}
```

### Phase 2: URL Routing & Stream Discovery

#### 2.1 Wouter Integration
- [ ] Setup client-side routing for `/` and `/stream/:nevent` 
- [ ] Route component structure:
  - `/` → `<GoLivePage />` (current retro UI + nsec input)
  - `/stream/:nevent` → `<StreamViewerPage />` (fetch event + join room + rebroadcast)

#### 2.2 Stream Viewer Page (`/stream/nevent123`)
- [ ] **Event Fetching** - Use snstr to fetch stream event by nevent
- [ ] **Room Joining** - Use event ID as Trystero room name
- [ ] **Stream Hierarchy Display** - Show depth and parent chain
- [ ] **Auto-connect** - No manual room input needed
- [ ] **Rebroadcast Button** - Publish new rebroadcast event + create new room

#### 2.3 Go Live Page (`/`)
- [ ] **Nsec Input** - Required before any other setup
- [ ] **Current retro UI** - Keep PYRAMID STREAM aesthetic  
- [ ] **Stream Publishing** - Publish Kind 30078 event when going live
- [ ] **Shareable URL** - Display `/stream/nevent123...` for sharing

### Phase 3: Stream Forwarding & Pyramid Network

#### 3.1 Enhanced Stream Management
- [ ] **Real Stream Detection** - Only show rebroadcast button when receiving streams
- [ ] **Stream Forwarding** - Forward incoming peer streams to rebroadcast room
- [ ] **Multi-stream Support** - Handle multiple incoming streams in rebroadcast

#### 3.2 Hierarchy Traversal & Recovery
- [ ] **Parent Chain Walking** - Traverse `e` tags to build full hierarchy
- [ ] **Dead Stream Recovery** - If stream ended, try parent streams
- [ ] **Stream Health Checking** - Monitor if streams are still active

#### 3.3 Protocol Debug Visibility
- [ ] **Stream Depth Indicator** - "You are 3 levels deep in the pyramid"
- [ ] **Parent Stream Links** - Clickable links to navigate up the chain
- [ ] **Rebroadcast Tree** - Visual representation of downstream rebroadcasts

## Technical Architecture

### File Structure Updates
```
src/
├── pages/
│   ├── GoLivePage.tsx      # `/` route - nsec + retro go live UI
│   └── StreamViewerPage.tsx # `/stream/nevent` - fetch + view + rebroadcast
├── components/
│   ├── NsecInput.tsx       # Private key input component
│   ├── StreamHierarchy.tsx # Visual pyramid depth display
│   ├── ParentStreamLink.tsx # Links to navigate up chain
│   └── [existing components...]
├── hooks/
│   ├── useNostr.ts         # snstr integration for events
│   ├── useWebRTC.ts        # [current Trystero logic]
│   └── useStreamHierarchy.ts # Navigate event chains
└── services/
    ├── nostr.ts            # Event publishing/fetching
    └── streamDiscovery.ts  # Event chain traversal
```

### Layout Design (1vw/1vh Grid)
```
┌─────────────────────────────────────────┐
│ PYRAMID STREAM (10vh)                   │
├─────────────────┬───────────────────────┤
│ Video (50vw)    │ Debug Panels (50vw)   │
│                 │ - Event Details       │
│                 │ - Stream Hierarchy    │
│                 │ - WebRTC State        │
│                 │ - Nostr Relay Status  │
│                 │ - Parent/Child Links  │
├─────────────────┴───────────────────────┤
│ Controls (GO LIVE/REBROADCAST) (10vh)   │
└─────────────────────────────────────────┘
```

## Data Flow

### Stream Publishing Flow
1. **Input nsec** → Store in state/localStorage
2. **GO LIVE** → Get webcam + publish Kind 30078 event  
3. **Event Published** → Use event ID as Trystero room name
4. **Share URL** → Display `/stream/nevent...` for others

### Stream Viewing Flow  
1. **Visit `/stream/nevent123`** → Extract nevent from URL
2. **Fetch Event** → Use snstr to get stream event details
3. **Join Room** → Use event ID as Trystero room name
4. **Display Stream** → Show incoming peer video + hierarchy info
5. **Rebroadcast Option** → If receiving streams, show rebroadcast button

### Rebroadcast Publishing Flow
1. **Click Rebroadcast** → Publish new Kind 30078 event with parent reference
2. **Create New Room** → Use new event ID as room name
3. **Forward Streams** → Relay incoming streams to new room
4. **New URL** → Generate `/stream/nevent-new...` for this rebroadcast

## Success Metrics

### Developer Experience  
- **One-click stream discovery** - Paste nevent URL and immediately connect
- **Full protocol visibility** - See exact Nostr events and WebRTC state
- **Pyramid navigation** - Click through stream hierarchy easily
- **Unlimited scaling proof** - Demonstrate infinite rebroadcast levels

### Protocol Robustness
- **Event-driven architecture** - Everything driven by Nostr events
- **Decentralized discovery** - No central stream list needed
- **Self-healing network** - Navigate up hierarchy when streams end
- **Developer-friendly debugging** - Maximum visibility into all operations

## Next Steps
1. **Start with nsec input and basic Nostr event publishing**
2. **Implement URL routing with Wouter**
3. **Connect event IDs to Trystero room names** 
4. **Build stream hierarchy traversal**
5. **Add pyramid depth visualization**

This transforms the current working P2P streaming into a fully decentralized, URL-based pyramid streaming protocol that scales infinitely!