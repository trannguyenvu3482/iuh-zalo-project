import { useEffect } from 'react'
import { PacmanLoader } from 'react-spinners'

const LoadingSpinner = ({
  isLoading = true,
  color = '#fcaf17',
  size = 30,
  zIndex = 9999,
  overlayBackground = 'bg-black/70',
}) => {
  useEffect(() => {
    if (isLoading) {
      document.body.classList.add('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center ${overlayBackground} z-[${zIndex}]`}
      style={{ zIndex }}
      role="status"
      aria-live="polite"
    >
      <PacmanLoader color={color} size={size} aria-label="Loading Spinner" />
    </div>
  )
}

export default LoadingSpinner
