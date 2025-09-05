import { useState, useRef } from 'react';
import { Nostr, createEvent } from 'snstr';
import { createSignedEvent } from 'snstr/dist/src/nip01/event';
import { nip19, getPublicKey } from 'nostr-tools';

interface NostrState {
  client: Nostr | null;
  isConnected: boolean;
  nsec: string;
  npub: string;
  privateKey: string;
  error: string | null;
}

interface StreamEvent {
  id: string;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
  kind: number;
}

export function useNostr() {
  const [state, setState] = useState<NostrState>({
    client: null,
    isConnected: false,
    nsec: '',
    npub: '',
    privateKey: '',
    error: null
  });

  const clientRef = useRef<Nostr | null>(null);

  const connectWithNsec = async (nsec: string) => {
    try {
      console.log('🔑 Connecting to Nostr LIKE A BABY...');
      
      // Create client  
      const client = new Nostr(['ws://localhost:10547']);
      
      // First test: generate random keys to see format
      const generatedKeys = await client.generateKeys();
      console.log('🔍 Generated keys for comparison:');
      console.log('   - Generated private key:', generatedKeys.privateKey);
      console.log('   - Generated public key:', generatedKeys.publicKey);
      
      // Convert user input (handle both nsec and hex)
      let userHexPrivateKey: string;
      if (nsec.startsWith('nsec')) {
        // Convert nsec to hex
        const decoded = nip19.decode(nsec);
        if (decoded.type !== 'nsec') {
          throw new Error('Invalid nsec format');
        }
        const privateKeyBytes = decoded.data as Uint8Array;
        userHexPrivateKey = Array.from(privateKeyBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } else if (nsec.length === 64) {
        // Assume it's already hex
        userHexPrivateKey = nsec.toLowerCase();
      } else {
        throw new Error('Invalid key format. Use nsec1... or 64-char hex');
      }
      
      const userHexPublicKey = getPublicKey(userHexPrivateKey);
      const userNpub = nip19.npubEncode(userHexPublicKey);
      
      console.log('🔍 Your key converted:');
      console.log('   - Your hex private key:', userHexPrivateKey);
      console.log('   - Your hex public key:', userHexPublicKey);
      console.log('   - Your npub:', userNpub);
      
      // Connect to relays
      await client.connectToRelays();
      console.log('✅ Connected to relays');
      
      // Set YOUR private key on the client
      console.log('🔑 Setting YOUR private key on client...');
      client.setPrivateKey(userHexPrivateKey);
      clientRef.current = client;
      
      setState({
        client,
        isConnected: true,
        nsec,
        npub: userNpub, // Use YOUR public key
        privateKey: userHexPrivateKey, // Use YOUR private key
        error: null
      });

      console.log('✅ Nostr connected successfully with YOUR identity');
      console.log('🔑 Your npub:', userNpub);
      
      return client;
    } catch (error) {
      console.error('❌ Nostr connection failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      return null;
    }
  };

  const publishStreamEvent = async (title: string = 'My Stream') => {
    if (!clientRef.current || !state.privateKey) {
      throw new Error('Not connected to Nostr or missing private key');
    }

    console.log('📡 Publishing Kind 30078 stream event...');
    console.log('🔍 About to createEvent with privateKey:', state.privateKey.substring(0, 10) + '...');
    console.log('🔍 Private key length:', state.privateKey.length);

    // Get the public key from the private key  
    const decoded = nip19.decode(state.nsec);
    const privateKeyBytes = decoded.data as Uint8Array;
    const hexPrivateKey = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const hexPublicKey = getPublicKey(hexPrivateKey);
    
    console.log('🔍 Using pubkey for createEvent:', hexPublicKey);
    
    // 1. Create unsigned event
    const unsignedEvent = createEvent({
      kind: 30078,
      content: JSON.stringify({
        title,
        status: 'live',
        stream_depth: 0
      }),
      tags: [['d', `com.pyramidstream.stream.${Date.now()}`]]
    }, hexPublicKey);
    
    console.log('📝 Created unsigned event');
    
    // 2. Sign the event to get ID
    const signedEvent = await createSignedEvent(unsignedEvent, hexPrivateKey);
    
    console.log('✅ Signed event with ID:', signedEvent.id);
    
    // 3. Return the signed event (we have the real ID now!)
    return signedEvent as StreamEvent;
  };

  const publishRebroadcastEvent = async (
    trysteroRoom: string, 
    parentEventId: string,
    originalEventId: string,
    streamDepth: number,
    title: string = 'Rebroadcast Stream'
  ) => {
    if (!clientRef.current) {
      throw new Error('Not connected to Nostr');
    }

    console.log('📡 Publishing rebroadcast event for room:', trysteroRoom);

    const content = JSON.stringify({
      title,
      trystero_room: trysteroRoom,
      status: 'live', 
      stream_depth: streamDepth,
      parent_stream: parentEventId
    });

    const event = await clientRef.current.publishEvent({
      kind: 30078,
      content,
      tags: [
        ['d', `com.pyramidstream.rebroadcast.${trysteroRoom}`],
        ['e', parentEventId], // Immediate parent
        ['original', originalEventId] // Root of pyramid
      ]
    });

    console.log('✅ Rebroadcast event published:', event.id);
    return event as StreamEvent;
  };

  const fetchStreamEvent = async (eventId: string): Promise<StreamEvent | null> => {
    if (!clientRef.current) {
      throw new Error('Not connected to Nostr');
    }

    console.log('🔍 Fetching stream event:', eventId);

    try {
      const event = await clientRef.current.fetchOne(
        [{ ids: [eventId] }],
        { maxWait: 5000 }
      );
      
      if (event) {
        console.log('✅ Stream event fetched:', event);
        return event as StreamEvent;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch stream event:', error);
      return null;
    }
  };

  const getStreamHierarchy = async (eventId: string): Promise<StreamEvent[]> => {
    const hierarchy: StreamEvent[] = [];
    let currentEventId = eventId;
    
    console.log('🌳 Building stream hierarchy for:', eventId);

    while (currentEventId && hierarchy.length < 10) { // Prevent infinite loops
      const event = await fetchStreamEvent(currentEventId);
      if (!event) break;
      
      hierarchy.unshift(event); // Add to beginning to get root → current order
      
      // Look for parent event in 'e' tag
      const parentTag = event.tags.find(tag => tag[0] === 'e');
      currentEventId = parentTag?.[1] || null;
      
      console.log('🔗 Found parent event:', currentEventId);
    }

    console.log('✅ Stream hierarchy built:', hierarchy.length, 'levels');
    return hierarchy;
  };

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnectFromRelays();
      clientRef.current = null;
    }
    
    setState({
      client: null,
      isConnected: false,
      nsec: '',
      npub: '', 
      error: null
    });
  };

  const getDebugInfo = () => {
    return {
      isConnected: state.isConnected,
      npub: state.npub,
      nsec: state.nsec.substring(0, 10) + '...',
      relays: ['ws://localhost:10547'],
      error: state.error
    };
  };

  return {
    ...state,
    connectWithNsec,
    publishStreamEvent,
    publishRebroadcastEvent,
    fetchStreamEvent,
    getStreamHierarchy,
    disconnect,
    getDebugInfo
  };
}