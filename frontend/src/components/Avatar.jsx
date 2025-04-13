import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import PropTypes from 'prop-types'
import { memo, useEffect, useState } from 'react'
import { FiExternalLink } from 'react-icons/fi'
import { useUser } from '../hooks/useUser'
import { useUserStore } from '../zustand/userStore.js'
import ProfileDialog from './Sidebar/ProfileDialog.jsx'

// Optimized Avatar component with lazy loading and fallback
const AvatarImage = memo(
  ({
    src,
    alt = 'User avatar',
    size = 'md',
    className = '',
    fallbackSrc = null,
    ...props
  }) => {
    const [imgSrc, setImgSrc] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)

    // Size classes
    const sizeClasses = {
      xs: 'h-8 w-8',
      sm: 'h-10 w-10',
      md: 'h-12 w-12',
      lg: 'h-16 w-16',
      xl: 'h-20 w-20',
    }

    // Generate initials from alt text
    const getInitials = () => {
      if (!alt || typeof alt !== 'string') return '?'

      return alt
        .split(' ')
        .map((word) => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    }

    // Handle image load
    useEffect(() => {
      if (!src) {
        setIsLoading(false)
        setError(true)
        return
      }

      setIsLoading(true)
      setError(false)

      const img = new Image()
      img.src = src

      img.onload = () => {
        setImgSrc(src)
        setIsLoading(false)
      }

      img.onerror = () => {
        setIsLoading(false)
        setError(true)
        if (fallbackSrc) {
          setImgSrc(fallbackSrc)
        }
      }

      return () => {
        img.onload = null
        img.onerror = null
      }
    }, [src, fallbackSrc])

    const sizeClass = sizeClasses[size] || sizeClasses.md

    // Default placeholder
    if (isLoading) {
      return (
        <div
          className={`${sizeClass} flex items-center justify-center rounded-full bg-gray-200 text-gray-500 ${className}`}
          {...props}
        >
          <span className="animate-pulse">·</span>
        </div>
      )
    }

    // Error/fallback state
    if (error && !fallbackSrc) {
      return (
        <div
          className={`${sizeClass} flex items-center justify-center rounded-full bg-gray-200 text-gray-700 ${className}`}
          {...props}
        >
          <span className="text-sm font-medium">{getInitials()}</span>
        </div>
      )
    }

    // Actual image
    return (
      <img
        src={imgSrc}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        loading="lazy"
        {...props}
      />
    )
  },
)

// Add display name
AvatarImage.displayName = 'AvatarImage'

// Add prop types
AvatarImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  fallbackSrc: PropTypes.string,
}

const Avatar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const user = useUser()
  const { logout } = useUserStore()

  // Function to handle dialog reopening
  const handleProfileUpdate = () => {
    // Close the dialog first
    setIsOpen(false)

    // Force a complete window refresh
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="text-right">
      {isOpen && (
        <ProfileDialog
          isOpen={true}
          close={() => setIsOpen(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      <Menu>
        <MenuButton className="inline-flex items-center gap-2 text-sm/6 font-semibold text-white focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white">
          <AvatarImage
            className="h-[48px] w-[48px] rounded-full border border-gray-100"
            src={user?.avatar}
            alt=""
          />
        </MenuButton>

        <MenuItems
          transition
          anchor="right"
          className="ml-2 mt-8 w-[300px] origin-top-right rounded-lg border border-white/5 bg-white py-1 text-sm/6 shadow-lg duration-100 ease-out [--anchor-gap:var(--spacing-1)] *:transition focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <MenuItem>
            <button className="group mx-3 flex w-[calc(100%-24px)] items-center gap-2 border-b-2 border-gray-300 px-1 py-1 text-lg font-semibold data-[focus]:bg-white/10">
              {user?.fullName}
            </button>
          </MenuItem>
          <MenuItem className="mt-1">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://business.zbox.vn/nang-cap-business-pro"
              className="group flex w-full items-center justify-between gap-2 px-3 py-1.5 data-[focus]:bg-gray-200"
            >
              <span>Nâng cấp tài khoản</span>
              <FiExternalLink className="text-lg" />
            </a>
          </MenuItem>
          <MenuItem className="mt-1">
            <button
              onClick={() => setIsOpen(true)}
              className="group flex w-full items-center gap-2 px-3 py-1.5 data-[focus]:bg-gray-200"
            >
              Hồ sơ của bạn
            </button>
          </MenuItem>
          <MenuItem className="mt-1">
            <button className="group flex w-full items-center gap-2 px-3 py-1.5 data-[focus]:bg-gray-200">
              Cài đặt
            </button>
          </MenuItem>
          <div className="mx-2 border-b border-gray-300"></div>
          <MenuItem className="mt-1">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-2 px-3 py-1.5 data-[focus]:bg-gray-200"
            >
              Đăng xuất
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  )
}

export default Avatar
