import { useCallback, useEffect, useState } from 'react'
import { HiPhone, HiPhoneIncoming, HiUser, HiX } from 'react-icons/hi'
import { useSocket } from '../contexts/SocketContext'
import * as socketService from '../service/socket'
import { useUserStore } from '../zustand/userStore'

// Initialize global registry
if (typeof window !== 'undefined') {
  window.callRegistry = window.callRegistry || {
    hasListener: false,
    activeCalls: new Map(),
    isComponentMounted: false,
    currentCall: null,
    activeRingtones: new Map(),
    currentAutoRejectTimeout: null,
  }
}

const IncomingCallNotification = () => {
  const { user } = useUserStore()
  const { socket } = useSocket()
  const [currentCall, setCurrentCall] = useState(null)
  const directSocket = socketService.getSocket()

  // Handle audio cleanup
  const stopRingtone = useCallback((callId) => {
    try {
      // Specific ringtone handling
      if (callId && window.callRegistry.activeRingtones?.has(callId)) {
        const ringtone = window.callRegistry.activeRingtones.get(callId)
        ringtone.pause()
        ringtone.currentTime = 0
        ringtone.src = ''
        try {
          ringtone.load()
        } catch {
          /* ignore */
        }
        window.callRegistry.activeRingtones.delete(callId)
        console.log(`Ringtone for call ${callId} stopped`)
        return
      }

      // Stop all ringtones if no callId provided or specific one not found
      if (window.callRegistry.activeRingtones?.size > 0) {
        window.callRegistry.activeRingtones.forEach((ringtone) => {
          try {
            ringtone.pause()
            ringtone.currentTime = 0
            ringtone.src = ''
            ringtone.load()
          } catch {
            /* ignore */
          }
        })
        window.callRegistry.activeRingtones.clear()
        console.log('All ringtones stopped')
      }

      // Legacy cleanup
      if (window.callRegistry.ringtone) {
        window.callRegistry.ringtone.pause()
        window.callRegistry.ringtone = null
      }
    } catch (error) {
      console.error('Error stopping ringtone:', error)
      // Emergency cleanup
      window.callRegistry.activeRingtones = new Map()
      window.callRegistry.ringtone = null
    }
  }, [])

  // Accept call handler
  const acceptCall = useCallback(
    (callData) => {
      const callId = `${callData.callerId}-${callData.timestamp}`
      stopRingtone(callId)

      const activeSocket = socket || directSocket
      if (!activeSocket || !user) return

      // Clean up registry
      if (window.callRegistry) {
        window.callRegistry.activeCalls.delete(callId)
        window.callRegistry.currentCall = null
      }
      setCurrentCall(null)

      // Navigate to call page
      const callUrl = `/call/${callData.channelName}?callerId=${callData.callerId}&callerName=${encodeURIComponent(callData.callerName)}&type=${callData.type}`
      window.location.href = callUrl
    },
    [socket, directSocket, user, stopRingtone],
  )

  // Reject call handler
  const rejectCall = useCallback(
    (callData, reason = 'rejected') => {
      const callId = `${callData.callerId}-${callData.timestamp}`
      stopRingtone(callId)

      const activeSocket = socket || directSocket
      if (!activeSocket || !user) return

      // Clean up registry
      if (window.callRegistry) {
        window.callRegistry.activeCalls.delete(callId)
        window.callRegistry.currentCall = null
      }
      setCurrentCall(null)

      // Notify caller
      activeSocket.emit('call:reject', {
        callerId: callData.callerId,
        calleeId: user.id,
        reason,
      })
    },
    [socket, directSocket, user, stopRingtone],
  )

  // Action handler for UI buttons
  const handleCallAction = useCallback(
    (action, callData) => {
      const callId = `${callData.callerId}-${callData.timestamp}`
      stopRingtone(callId)

      // Small delay to ensure audio processing completes
      setTimeout(() => {
        action === 'accept' ? acceptCall(callData) : rejectCall(callData)
      }, 50)
    },
    [acceptCall, rejectCall, stopRingtone],
  )

  // Set up event handlers on mount
  useEffect(() => {
    if (!user) return

    // Skip if already mounted
    if (window.callRegistry.isComponentMounted) return

    console.log('IncomingCallNotification mounting')
    window.callRegistry.isComponentMounted = true

    // Handler for incoming calls
    const handleIncomingCall = (data) => {
      const callId = `${data.callerId}-${data.timestamp}`

      // Prevent duplicates
      if (window.callRegistry.activeCalls.has(callId)) {
        console.warn('Duplicate call detected, ignoring')
        return
      }

      // Play ringtone
      try {
        // Skip if already playing for this call
        if (window.callRegistry.activeRingtones?.has(callId)) return

        // Initialize ringtone registry if needed
        if (!window.callRegistry.activeRingtones) {
          window.callRegistry.activeRingtones = new Map()
        }

        const ringtone = new Audio('/src/assets/sounds/ringtone.mp3')
        ringtone.volume = 0.4
        ringtone.loop = true

        // Store before playing
        window.callRegistry.activeRingtones.set(callId, ringtone)

        // Play with error handling
        ringtone.play().catch((err) => {
          console.error('Could not play ringtone:', err)
          window.callRegistry.activeRingtones.delete(callId)
        })
      } catch (error) {
        console.error('Failed to create ringtone:', error)
      }

      // Store call data
      window.callRegistry.activeCalls.set(callId, data)
      window.callRegistry.currentCall = data
      setCurrentCall(data)

      // Auto-reject after 30 seconds
      const autoRejectTimeout = setTimeout(() => {
        if (window.callRegistry.activeCalls.has(callId)) {
          stopRingtone(callId)
          setTimeout(() => rejectCall(data, 'timeout'), 50)
        }
      }, 30000)

      window.callRegistry.currentAutoRejectTimeout = autoRejectTimeout
    }

    // Register handler once globally
    if (!window.callRegistry.hasListener) {
      const activeSocket = socket || directSocket
      if (activeSocket) {
        activeSocket.on('call:incoming', handleIncomingCall)
        window.callRegistry.hasListener = true
        window.callRegistry.socket = activeSocket
        window.callRegistry.handler = handleIncomingCall
      }
    }

    // Set current call if one exists
    if (window.callRegistry.currentCall) {
      setCurrentCall(window.callRegistry.currentCall)
    }

    // Cleanup on unmount
    return () => {
      if (window.callRegistry.currentAutoRejectTimeout) {
        clearTimeout(window.callRegistry.currentAutoRejectTimeout)
        window.callRegistry.currentAutoRejectTimeout = null
      }

      stopRingtone()
      window.callRegistry.isComponentMounted = false
    }
  }, [user, socket, directSocket, stopRingtone, rejectCall])

  // Clean up on logout
  useEffect(() => {
    if (!user) {
      if (window.callRegistry?.hasListener) {
        const { socket: storedSocket, handler } = window.callRegistry
        if (storedSocket && handler) {
          storedSocket.off('call:incoming', handler)
          window.callRegistry.hasListener = false
          window.callRegistry.socket = null
          window.callRegistry.handler = null
          window.callRegistry.activeCalls.clear()
          window.callRegistry.currentCall = null
          stopRingtone()
        }
      }
    }

    return () => {}
  }, [user, stopRingtone])

  // Don't render anything if no active call
  if (!currentCall) return null

  // UI rendering
  const callTimestamp = new Date(currentCall.timestamp)
  const timeElapsed = Math.floor((Date.now() - callTimestamp) / 1000)
  const callType = currentCall.type || 'audio'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative mx-4 max-w-md overflow-hidden rounded-xl bg-white shadow-2xl sm:mx-0">
        <div className="bg-blue-600 py-4 text-center text-white">
          <div className="flex justify-center text-4xl">
            <div className="rounded-full bg-white/20 p-4">
              <HiPhoneIncoming className="h-10 w-10" />
            </div>
          </div>
          <h2 className="mt-2 text-xl font-semibold">Incoming Call</h2>
          <p className="text-sm text-blue-100">
            {callType === 'video' ? 'Video Call' : 'Audio Call'}
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
              <HiUser className="h-12 w-12 text-gray-500" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold">
              {currentCall.callerName || 'Unknown Caller'}
            </h3>
            <p className="text-sm text-gray-500">is calling you...</p>
            <div className="mt-1 text-xs text-gray-400">
              {timeElapsed < 60
                ? `${timeElapsed} seconds ago`
                : `${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')} ago`}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-6">
            <button
              onClick={() => handleCallAction('reject', currentCall)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
              title="Decline Call"
            >
              <HiX className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleCallAction('accept', currentCall)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
              title="Accept Call"
            >
              <HiPhone className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            Call will be automatically declined in{' '}
            {Math.max(0, 30 - timeElapsed)} seconds
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallNotification
