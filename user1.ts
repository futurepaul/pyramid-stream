#!/usr/bin/env bun
import { joinRoom, selfId, getRelaySockets } from 'trystero/nostr';

console.log('🟦 USER 1 STARTING');
console.log('🆔 My selfId:', selfId);

const config = { 
  appId: 'pyramid_stream',
  relayUrls: ['ws://localhost:10542']
  // Skip rtcPolyfill for now, just test relay connection
};

console.log('🔵 User 1 joining room "test"...');
const room = joinRoom(config, 'test');

// Log relay connections
setTimeout(() => {
  console.log('📡 User 1 relay sockets:', getRelaySockets());
}, 2000);

room.onPeerJoin(peerId => {
  console.log('🟢 User 1 sees peer joined:', peerId);
});

room.onPeerLeave(peerId => {
  console.log('🔴 User 1 sees peer left:', peerId);
});

// Keep the process alive
setInterval(() => {
  console.log('💓 User 1 heartbeat - connected peers:', room.getPeers ? room.getPeers() : 'getPeers not available');
}, 10000);

console.log('✅ User 1 setup complete, waiting for peers...');