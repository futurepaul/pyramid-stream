const {floor, random, sin} = Math

export const libName = 'Trystero'

export const alloc = (n, f) => Array(n).fill().map(f)

const charSet = '0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz'

export const genId = n =>
  alloc(n, () => charSet[floor(random() * charSet.length)]).join('')

export const selfId = genId(20)

export const all = Promise.all.bind(Promise)

export const isBrowser = typeof window !== 'undefined'

export const {entries, fromEntries, keys} = Object

export const noOp = () => {}

export const mkErr = msg => new Error(`${libName}: ${msg}`)

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const encodeBytes = txt => encoder.encode(txt)

export const decodeBytes = buffer => decoder.decode(buffer)

export const toHex = buffer =>
  buffer.reduce((a, c) => a + c.toString(16).padStart(2, '0'), '')

export const topicPath = (...parts) => parts.join('@')

export const shuffle = (xs, seed) => {
  const a = [...xs]
  const rand = () => {
    const x = sin(seed++) * 10_000
    return x - floor(x)
  }

  let i = a.length

  while (i) {
    const j = floor(rand() * i--)
    ;[a[i], a[j]] = [a[j], a[i]]
  }

  return a
}

export const getRelays = (config, defaults, defaultN, deriveFromAppId) => {
  const relayUrls =
    config.relayUrls ||
    (deriveFromAppId ? shuffle(defaults, strToNum(config.appId)) : defaults)

  return relayUrls.slice(
    0,
    config.relayUrls
      ? config.relayUrls.length
      : config.relayRedundancy || defaultN
  )
}

export const toJson = JSON.stringify

export const fromJson = JSON.parse

export const strToNum = (str, limit = Number.MAX_SAFE_INTEGER) =>
  str.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % limit

const defaultRetryMs = 3333
const socketRetryPeriods = {}

export const makeSocket = (url, onMessage) => {
  const client = {}

  const init = () => {
    console.log('🔌 TRYSTERO: Attempting WebSocket connection to:', url)
    const socket = new WebSocket(url)

    socket.onclose = (event) => {
      console.log('❌ TRYSTERO: WebSocket closed:', url, 'Code:', event.code, 'Reason:', event.reason)
      socketRetryPeriods[url] ??= defaultRetryMs
      console.log('⏰ TRYSTERO: Retrying connection in', socketRetryPeriods[url], 'ms')
      setTimeout(init, socketRetryPeriods[url])
      socketRetryPeriods[url] *= 2
    }

    socket.onerror = (error) => {
      console.log('🔥 TRYSTERO: WebSocket error:', url, error)
    }

    socket.onopen = () => {
      console.log('✅ TRYSTERO: WebSocket connected successfully:', url)
      socketRetryPeriods[url] = defaultRetryMs
    }

    socket.onmessage = e => {
      console.log('📨 TRYSTERO: Received message from', url, ':', e.data.substring(0, 100) + '...')
      onMessage(e.data)
    }
    
    client.socket = socket
    client.url = socket.url
    client.ready = new Promise(
      res =>
        (socket.onopen = () => {
          res(client)
          socketRetryPeriods[url] = defaultRetryMs
        })
    )
    client.send = data => {
      if (socket.readyState === 1) {
        socket.send(data)
      }
    }
  }

  init()

  return client
}

export const socketGetter = clientMap => () =>
  fromEntries(entries(clientMap).map(([url, client]) => [url, client.socket]))
