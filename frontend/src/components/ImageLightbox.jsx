import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import PropTypes from 'prop-types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaSearchMinus, FaSearchPlus } from 'react-icons/fa'
import { MdOutlineClose } from 'react-icons/md'

const ImageLightbox = ({ isOpen, onClose, imageUrl, userName }) => {
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const startPointRef = useRef({ x: 0, y: 0 })
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const rafRef = useRef(null)

  // Reset scale, position and loading state when image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      lastPositionRef.current = { x: 0, y: 0 }
      setIsLoading(true)
    }
  }, [isOpen, imageUrl])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case '0':
          resetZoom()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Calculate drag multiplier based on scale for smoother and faster movement
  const getDragMultiplier = useCallback(() => {
    // Adjusts drag speed based on zoom level
    // Higher values = faster drag at higher zoom levels
    return Math.max(1, scale * 0.8)
  }, [scale])

  const handleZoomIn = () => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.25, 3)
      // Reset position if zooming back to 1
      if (prev < 1 && newScale >= 1) {
        setPosition({ x: 0, y: 0 })
        lastPositionRef.current = { x: 0, y: 0 }
      }
      return newScale
    })
  }

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.25, 0.5)
      // Reset position if zooming back to 1
      if (prev > 1 && newScale <= 1) {
        setPosition({ x: 0, y: 0 })
        lastPositionRef.current = { x: 0, y: 0 }
      }
      return newScale
    })
  }

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop, not the image
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    lastPositionRef.current = { x: 0, y: 0 }
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // Mouse wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  // Completely reworked mouse drag handlers to fix the jumping issue
  const handleMouseDown = (e) => {
    if (scale <= 1) return

    e.preventDefault()

    // Store where the drag started
    startPointRef.current = {
      x: e.clientX,
      y: e.clientY,
    }

    // Enable dragging mode
    setIsDragging(true)

    // Cancel any existing animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
  }

  const updatePosition = useCallback(
    (clientX, clientY) => {
      if (!isDragging) return

      // Calculate how far we've moved from where the drag started
      const deltaX = clientX - startPointRef.current.x
      const deltaY = clientY - startPointRef.current.y

      // Apply speed multiplier
      const multiplier = getDragMultiplier()

      // Calculate new position based on the last position plus the delta
      const newX = lastPositionRef.current.x + deltaX * multiplier
      const newY = lastPositionRef.current.y + deltaY * multiplier

      // Use requestAnimationFrame to update state less frequently
      rafRef.current = requestAnimationFrame(() => {
        setPosition({ x: newX, y: newY })
      })

      // Update the starting point to prevent accumulating deltas
      startPointRef.current = { x: clientX, y: clientY }
      // Update the last position ref to track our current position
      lastPositionRef.current = { x: newX, y: newY }
    },
    [isDragging, getDragMultiplier],
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        updatePosition(e.clientX, e.clientY)
      }
    },
    [isDragging, updatePosition],
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      // Keep last position in our ref for the next drag
      lastPositionRef.current = { ...position }
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [isDragging, position])

  // Touch support for mobile
  const handleTouchStart = (e) => {
    if (scale <= 1 || e.touches.length !== 1) return

    e.preventDefault()

    // Store where the touch started
    startPointRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }

    // Enable dragging mode
    setIsDragging(true)

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
  }

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || e.touches.length !== 1) return
      updatePosition(e.touches[0].clientX, e.touches[0].clientY)
    },
    [isDragging, updatePosition],
  )

  const handleTouchEnd = handleMouseUp

  // Add mouse up and mouse move handlers to window to handle dragging outside the image
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove, { passive: false })
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }
  }, [isOpen, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Update lastPositionRef when position state changes to keep them in sync
  useEffect(() => {
    if (!isDragging) {
      lastPositionRef.current = position
    }
  }, [position, isDragging])

  // Clean up animations when component unmounts
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  // Determine if buttons should be disabled
  const isZoomInDisabled = scale >= 3
  const isZoomOutDisabled = scale <= 0.5

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[99999]">
      <DialogBackdrop
        className="fixed inset-0 bg-black"
        onClick={handleBackdropClick}
      />

      <DialogPanel>
        <div className="fixed inset-0 z-10 flex flex-col items-center">
          {/* Header */}
          <div className="relative z-20 flex w-full items-center justify-between bg-[#333] px-4 py-0.5 text-white">
            <div className="w-10"></div> {/* Spacer for centering */}
            <h2 className="text-center font-medium">{userName}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white/20"
              aria-label="Close lightbox"
            >
              <MdOutlineClose className="h-6 w-6" />
            </button>
          </div>

          {/* Image Container */}
          <div
            ref={containerRef}
            className="z-10 flex h-full w-full flex-grow items-center justify-center overflow-hidden"
            onWheel={handleWheel}
          >
            <DialogPanel
              className="flex h-full w-full max-w-full items-center justify-center p-4"
              onClick={handleBackdropClick}
            >
              {isLoading && (
                <div className="absolute flex items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-white"></div>
                </div>
              )}
              <img
                ref={imageRef}
                src={imageUrl}
                alt={`Shared by ${userName}`}
                className={`max-h-full max-w-full object-contain transition-transform duration-75 ease-out ${scale > 1 ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  opacity: isLoading ? 0 : 1,
                  willChange: isDragging ? 'transform' : 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={resetZoom}
                onLoad={handleImageLoad}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                draggable="false"
                suppressHydrationWarning
              />
            </DialogPanel>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-0 left-1/2 z-20 flex w-full -translate-x-1/2 items-center justify-center gap-2 bg-[#333] px-4 py-2 text-white">
            <button
              onClick={handleZoomIn}
              className={`rounded-full p-2 transition-opacity ${isZoomInDisabled ? 'opacity-30' : 'hover:bg-white/20'}`}
              disabled={isZoomInDisabled}
              aria-label="Zoom in"
            >
              <FaSearchPlus className="h-5 w-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className={`rounded-full p-2 transition-opacity ${isZoomOutDisabled ? 'opacity-30' : 'hover:bg-white/20'}`}
              disabled={isZoomOutDisabled}
              aria-label="Zoom out"
            >
              <FaSearchMinus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  )
}

ImageLightbox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  userName: PropTypes.string,
}

export default ImageLightbox
