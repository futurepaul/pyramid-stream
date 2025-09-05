# HOW TO PUBLISH NOSTR EVENTS FOR BABIES 👶

## Don't Be Stupid. Follow These Steps EXACTLY.

### Step 1: Import the Right Things
```typescript
import { Nostr, createEvent } from 'snstr';
```

**DO NOT** import `generateKeys`. Use the client method.

### Step 2: Create Client and Generate Keys
```typescript
// Create client with relay array
const client = new Nostr(["wss://relay.nostr.band"]);

// Generate keys from CLIENT (not imported function!)
const keys = await client.generateKeys();
console.log('Private key:', keys.privateKey); // 64-char hex string
console.log('Public key:', keys.publicKey);   // 64-char hex string

// Connect to relays
await client.connectToRelays();
```

**IMPORTANT**: Use `client.generateKeys()`, NOT the imported function!

### Step 3: Create Event (The Right Way)
```typescript
const event = createEvent({
  kind: 1, // or whatever kind you want
  content: "Hello, world!",
  tags: [], // or your tags
  privateKey: keys.privateKey // Use the generated private key
});
```

**DO NOT** pass `pubkey` to createEvent. It derives it automatically from `privateKey`.

### Step 4: Publish Event (The Only Way)
```typescript
const publishedEvent = await client.publish(event);
console.log('Published event ID:', publishedEvent.id);
```

**DO NOT** use `publishEvent()` or `publishTextNote()`. Use `publish(event)`.

## Complete Working Example for Babies
```typescript
import { Nostr, createEvent } from 'snstr';

async function publishEventLikeABaby() {
  // 1. Create client
  const client = new Nostr(["ws://localhost:10547"]);
  
  // 2. Generate keys FROM CLIENT
  const keys = await client.generateKeys();
  
  // 3. Connect 
  await client.connectToRelays();
  
  // 4. Create event
  const event = createEvent({
    kind: 30078,
    content: JSON.stringify({ message: "test stream" }),
    tags: [['d', 'test-stream-id']],
    privateKey: keys.privateKey
  });
  
  // 5. Publish
  const result = await client.publish(event);
  
  console.log('SUCCESS! Event ID:', result.id);
  return result;
}
```

## Common Mistakes That Make You Look Stupid

❌ **Using client.generateKeys()** - WRONG  
✅ **Using generateKeys() function** - CORRECT

❌ **Using client.publishEvent()** - WRONG  
✅ **Using client.publish(event)** - CORRECT  

❌ **Passing pubkey to createEvent** - WRONG  
✅ **Only passing privateKey** - CORRECT

❌ **Using nsec directly** - WRONG  
✅ **Converting nsec to hex first** - CORRECT

## If You're Still Failing
1. Check private key is 64-char hex string
2. Check you used `generateKeys()` not `client.generateKeys()`  
3. Check you used `publish(event)` not `publishEvent()`
4. Check your relay is actually running

## Don't Be an Idiot
Follow this guide EXACTLY and you won't embarrass yourself again.