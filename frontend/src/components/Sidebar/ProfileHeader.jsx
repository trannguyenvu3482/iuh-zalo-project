import PropTypes from 'prop-types'
import { useRef } from 'react'
import { FiCamera } from 'react-icons/fi'
import { LuPencilLine } from 'react-icons/lu'

const ProfileHeader = ({
  user,
  isCurrentUser,
  onEditClick,
  onAvatarUpdate,
  avatarUpdating = false,
  openLightbox,
}) => {
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    onAvatarUpdate(file)
  }

  return (
    <>
      {/* Banner Image */}
      <div className="relative">
        <img
          src={
            user.banner ||
            'https://cover-talk.zadn.vn/2/3/6/c/2/e67b9b28aa1641d0fb5241e27aee9087.jpg'
          }
          alt="Banner"
          className="h-[170px] w-full cursor-pointer object-cover"
          onClick={() =>
            openLightbox(
              user.banner ||
                'https://cover-talk.zadn.vn/2/3/6/c/2/e67b9b28aa1641d0fb5241e27aee9087.jpg',
              'banner',
            )
          }
        />
      </div>

      {/* Profile Section */}
      <div className="relative pt-16">
        {/* Profile Picture */}
        <div className="absolute -top-4 left-4">
          <img
            src={
              user.avatar ||
              'https://s120-ava-talk.zadn.vn/b/a/c/2/7/120/e67b9b28aa1641d0fb5241e27aee9087.jpg'
            }
            alt="Profile"
            className="h-20 w-20 cursor-pointer rounded-full border-2 border-gray-200 object-cover"
            onClick={() =>
              openLightbox(
                user.avatar ||
                  'https://s120-ava-talk.zadn.vn/b/a/c/2/7/120/e67b9b28aa1641d0fb5241e27aee9087.jpg',
                'avatar',
              )
            }
          />
        </div>

        {isCurrentUser && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={handleAvatarClick}
              className="absolute left-16 top-8 rounded-full border border-gray-300 bg-gray-200 p-2 hover:bg-gray-300"
              title="Cập nhật ảnh đại diện"
            >
              <FiCamera className={avatarUpdating ? 'animate-pulse' : ''} />
            </button>
          </>
        )}

        {/* Name and Edit Icon */}
        <div className="absolute left-28 top-4 flex items-center justify-between">
          <h2 className="mr-2 text-lg font-semibold text-gray-800">
            {user.fullName || 'User'}
          </h2>
          {isCurrentUser && (
            <button
              onClick={onEditClick}
              className="text-gray-500 hover:text-gray-700"
            >
              <LuPencilLine />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

ProfileHeader.propTypes = {
  user: PropTypes.object.isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onAvatarUpdate: PropTypes.func.isRequired,
  avatarUpdating: PropTypes.bool,
  openLightbox: PropTypes.func.isRequired,
}

export default ProfileHeader
