import { EventEmitter } from 'node:events'

const platformEvents = new EventEmitter()
platformEvents.setMaxListeners(50)

export const emitPlatformEvent = (eventName, payload = {}) => {
  platformEvents.emit('platform:update', { event: eventName, ...payload, timestamp: new Date().toISOString() })
}

export const addPlatformListener = (listener) => {
  platformEvents.on('platform:update', listener)
  return () => platformEvents.off('platform:update', listener)
}
