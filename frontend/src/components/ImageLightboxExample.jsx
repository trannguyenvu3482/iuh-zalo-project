import { useState } from 'react'
import ImageLightbox from './ImageLightbox'

// Example component showing how to use ImageLightbox
const ImageLightboxExample = () => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  // Sample images
  const images = [
    {
      url: 'https://picsum.photos/800/600?random=1',
      alt: 'Sample image 1',
    },
    {
      url: 'https://picsum.photos/800/600?random=2',
      alt: 'Sample image 2',
    },
    {
      url: 'https://picsum.photos/800/600?random=3',
      alt: 'Sample image 3',
    },
  ]

  const openLightbox = (image) => {
    setSelectedImage(image)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Image Gallery Example</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="cursor-pointer overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105"
            onClick={() => openLightbox(image)}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="h-48 w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* ImageLightbox will render only when isLightboxOpen is true */}
      {isLightboxOpen && selectedImage && (
        <ImageLightbox
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
          imageUrl={selectedImage.url}
          userName="John Doe" // You would typically pass the actual user name here
        />
      )}
    </div>
  )
}

export default ImageLightboxExample
