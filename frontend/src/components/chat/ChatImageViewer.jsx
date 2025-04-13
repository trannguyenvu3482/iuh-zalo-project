import PropTypes from 'prop-types'
import { useState } from 'react'
import ImageLightbox from '../ImageLightbox'

const ChatImageViewer = ({ imageUrl, sender }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const openLightbox = () => {
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  return (
    <>
      <div
        className="cursor-pointer overflow-hidden rounded-md"
        onClick={openLightbox}
      >
        <img
          src={imageUrl}
          alt={`Image from ${sender?.fullName || 'user'}`}
          className="max-h-72 w-auto object-contain"
          loading="lazy"
        />
      </div>

      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        imageUrl={imageUrl}
        userName={sender?.fullName || 'User'}
      />
    </>
  )
}

ChatImageViewer.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  sender: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
    avatar: PropTypes.string,
  }),
}

export default ChatImageViewer
