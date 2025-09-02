It's like a pyramid scheme but for streaming
It's one big web page (index.html) and you load it up and you click "GO LIVE" and it asks for camera access
It publishes an "I'm streaming" event to some custom nostr kind (idk which one to use, ask the nostr book)
https://nostrbook.dev/
You get a shareable url with the event id of your stream. If someone visits that url they find you in there streaming!
They get your video stream because you're all using trystero to find each other in the "room" for the stream
https://github.com/dmotz/trystero
If someone starts watching your stream they can also rebroadcast it (need to look into trystero internals to make sure we can do this)
That's a new nostr event that tags the original stream with a e reference or whatever (again, look at nostr book docs)
now when people join the original stream url it loads up all the restream events as well and they pick one to stream from
the original stream and each restream should publish how many current viewers they have, and what their max capacity is (we'll hardcode it to 2 for the start of the experiment)
the user should try to enter a trystero webrtc "room" for just one specific restream so they don't overload the root stream
ultimately we'll end up with a graph or ring topology with streams, restreams, and even re-restreams. but it should always be possible to discover a stream with available capacity to join (the whole point of doing this is so that we can stream to an unlimited amount of people using only our browsers no server required other than the nostr service that trystero relies on and the event publishing to relays obviously)
I did a bun init for a simple react app that we can use as our dev server but we'll deploy just a frontend no backend needed (use the dist folder and the vercel config to route everything to index)
use wouter for the wouter https://github.com/molefrog/wouter so we can have routes like pyramidstream.com/s/nevent123...
use snstr for nostr stuff: https://github.com/AustinKelsay/snstr
