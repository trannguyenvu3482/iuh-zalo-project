import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { FaChevronLeft, FaTimes } from 'react-icons/fa'
import { MdOutlineClose } from 'react-icons/md'
import {
  getUserById,
  getUserInfo,
  updateUserAvatar,
  updateUserProfile,
} from '../../api/apiUser'
import { useFriendship } from '../../hooks/useFriendship'
import { useUser } from '../../hooks/useUser'
import { useUserStore } from '../../zustand/userStore'
import ConfirmDialog from '../ConfirmDialog'
import ImageLightbox from '../ImageLightbox'
import LoadingSpinner from '../LoadingSpinner'
import OtherUserActions from './OtherUserActions'
import ProfileActions from './ProfileActions'
import ProfileForm from './ProfileForm'
import ProfileHeader from './ProfileHeader'
import ProfileInfo from './ProfileInfo'

const ProfileDialog = ({
  isOpen,
  close,
  onProfileUpdate = null,
  userId = null,
  userData: initialUserData = null,
}) => {
  const { setUser } = useUserStore()
  const currentUser = useUser()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [isEditMode, setIsEditMode] = useState(false)

  // Date picker data
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) =>
    (currentYear - i).toString(),
  )

  // Basic state for the component
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male',
    birthDay: '1',
    birthMonth: '1',
    birthYear: '2000',
  })

  // Lightbox state
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    imageUrl: '',
    type: '',
  })

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    action: null,
  })

  // Determine if viewing own profile
  const isCurrentUser = !userId || userId === currentUser?.id

  // Fetch user profile data
  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => {
      if (isCurrentUser) return getUserInfo()
      if (userId) return getUserById(userId)
      return null
    },
    enabled:
      isOpen &&
      (!initialUserData ||
        (isCurrentUser && !userId) ||
        (userId && !isCurrentUser)),
    refetchOnWindowFocus: false,
    staleTime: 0,
    refetchOnMount: true,
  })

  // Force a refetch when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (isCurrentUser && !initialUserData) {
        queryClient.fetchQuery({ queryKey: ['userProfile'] })
      } else if (userId && !initialUserData) {
        queryClient.fetchQuery({ queryKey: ['userProfile', userId] })
      }

      // Always refetch friendship status when dialog opens
      if (!isCurrentUser && userId) {
        // First check if there's a stored API response from localStorage
        const storageKey = `friendship_status_${userId}`
        const storedResponse = localStorage.getItem(storageKey)

        if (storedResponse) {
          try {
            const parsedResponse = JSON.parse(storedResponse)

            // Immediately update the query cache with this data
            queryClient.setQueryData(['friendshipStatus', userId], {
              data: parsedResponse,
            })
          } catch (e) {
            console.error('Error parsing stored friendship status:', e)
          }
        }

        // Then invalidate and fetch fresh data
        queryClient.invalidateQueries({
          queryKey: ['friendshipStatus', userId],
        })
        queryClient.fetchQuery({ queryKey: ['friendshipStatus', userId] })
      }
    }
  }, [isOpen, queryClient, isCurrentUser, initialUserData, userId])

  // Get friendship status and actions
  const {
    friendshipStatus,
    isLoading: isFriendActionLoading,
    handleFriendAction,
    refetchFriendship,
  } = useFriendship(userId, isCurrentUser)

  // Monitor and debug all friendship status changes
  useEffect(() => {
    if (!isCurrentUser && userId) {
      console.log(
        'EFFECT: friendshipStatus changed in ProfileDialog:',
        JSON.stringify(friendshipStatus),
      )
    }
  }, [friendshipStatus, isCurrentUser, userId])

  // Debug friendship status
  useEffect(() => {
    if (!isCurrentUser && userId) {
      console.log(
        'Current friendship status in ProfileDialog:',
        friendshipStatus,
      )
    }
  }, [friendshipStatus, isCurrentUser, userId])

  // Refresh friendship status periodically when dialog is open
  useEffect(() => {
    let intervalId

    if (isOpen && !isCurrentUser && userId) {
      // First immediate refetch
      refetchFriendship()

      // Refresh friendship status every 10 seconds
      intervalId = setInterval(() => {
        refetchFriendship()
      }, 10000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, isCurrentUser, userId, refetchFriendship])

  // Handle avatar update
  const handleAvatarUpdate = (file) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if (!validTypes.includes(file.type)) {
      enqueueSnackbar('Vui lòng chọn file hình ảnh (JPG, PNG, GIF)', {
        variant: 'error',
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      enqueueSnackbar('Kích thước file tối đa là 5MB', { variant: 'error' })
      return
    }

    // Upload file
    const formData = new FormData()
    formData.append('avatar', file)

    // Use the API directly
    updateUserAvatar(formData)
      .then((response) => {
        enqueueSnackbar('Ảnh đại diện đã được cập nhật', { variant: 'success' })
        if (response.data && response.data.avatar) {
          setUser({ ...currentUser, avatar: response.data.avatar })
        }
      })
      .catch((error) => {
        console.error('Error uploading avatar:', error)
        enqueueSnackbar(
          error.response?.data?.message || 'Không thể cập nhật ảnh đại diện',
          { variant: 'error' },
        )
      })
  }

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Form related functions
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const hasFormChanged = () => {
    // Simple implementation - can be enhanced
    return (
      formData.fullName !== getUserToDisplay().fullName ||
      formData.gender !== getUserToDisplay().gender
    )
  }

  const handleSubmit = () => {
    if (!formData.fullName.trim()) {
      enqueueSnackbar('Tên hiển thị không được để trống', { variant: 'error' })
      return
    }

    const birthdate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`

    updateUserProfile({
      fullName: formData.fullName,
      gender: formData.gender,
      birthdate,
    })
      .then((response) => {
        enqueueSnackbar('Thông tin cá nhân đã được cập nhật', {
          variant: 'success',
        })

        if (response.data) {
          setUser({ ...currentUser, ...response.data })
        }

        setIsEditMode(false)

        if (typeof onProfileUpdate === 'function') {
          onProfileUpdate()
        }
      })
      .catch((error) => {
        console.error('Error updating profile:', error)
        enqueueSnackbar(
          error.response?.data?.message || 'Không thể cập nhật thông tin',
          { variant: 'error' },
        )
      })
  }

  const handleCancel = () => {
    if (hasFormChanged()) {
      setConfirmDialog({
        isOpen: true,
        message:
          'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn huỷ không?',
        action: () => {
          setIsEditMode(false)
          // Reset form (simple implementation)
          const user = getUserToDisplay()
          setFormData({
            fullName: user.fullName || '',
            gender: user.gender || 'male',
            birthDay: user.birthdate
              ? new Date(user.birthdate).getDate().toString()
              : '1',
            birthMonth: user.birthdate
              ? (new Date(user.birthdate).getMonth() + 1).toString()
              : '1',
            birthYear: user.birthdate
              ? new Date(user.birthdate).getFullYear().toString()
              : '2000',
          })
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        },
      })
    } else {
      setIsEditMode(false)
    }
  }

  // Utility functions
  const getUserToDisplay = () => {
    let displayUser = initialUserData || {}
    let apiUserData = {}

    if (data?.data) {
      apiUserData = data.data.user || {}
    }

    // Merge data if needed
    if (initialUserData && apiUserData && Object.keys(apiUserData).length > 0) {
      if (
        (!initialUserData.gender && apiUserData.gender) ||
        (!initialUserData.birthdate && apiUserData.birthdate) ||
        (!initialUserData.phoneNumber && apiUserData.phoneNumber)
      ) {
        displayUser = { ...initialUserData, ...apiUserData }
      }
    } else if (apiUserData && Object.keys(apiUserData).length > 0) {
      displayUser = apiUserData
    }

    return displayUser
  }

  // Update form data when profile data changes
  useEffect(() => {
    const userProfile = getUserToDisplay()

    if (userProfile && Object.keys(userProfile).length > 0) {
      setFormData({
        fullName: userProfile.fullName || '',
        gender: userProfile.gender || 'male',
        birthDay: userProfile.birthdate
          ? new Date(userProfile.birthdate).getDate().toString()
          : '1',
        birthMonth: userProfile.birthdate
          ? (new Date(userProfile.birthdate).getMonth() + 1).toString()
          : '1',
        birthYear: userProfile.birthdate
          ? new Date(userProfile.birthdate).getFullYear().toString()
          : '2000',
      })
    }
  }, [data, initialUserData])

  // Dialog actions
  const handleClose = () => {
    if (isEditMode && hasFormChanged()) {
      setConfirmDialog({
        isOpen: true,
        message:
          'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát không?',
        action: () => {
          setIsEditMode(false)
          close()
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        },
      })
    } else {
      close()
    }
  }

  const handleFriendRequest = () => {
    handleFriendAction(getUserToDisplay()).then(() => {
      // Force refresh of friendship status data
      queryClient.invalidateQueries({ queryKey: ['friendshipStatus', userId] })
      queryClient.fetchQuery({ queryKey: ['friendshipStatus', userId] })
    })
  }

  const startChat = () => {
    close()
    // We'll implement chat navigation in a future PR
  }

  // Lightbox functions
  const openLightbox = (imageUrl, type) => {
    setLightboxState({
      isOpen: true,
      imageUrl,
      type,
    })
  }

  const closeLightbox = () => {
    setLightboxState({
      isOpen: false,
      imageUrl: '',
      type: '',
    })
  }

  // Get user data for display
  const userProfileToDisplay = getUserToDisplay()

  // Define form submission status
  const isSubmitting = false // Simplified for now

  return (
    <>
      <Dialog
        open={isOpen}
        as="div"
        className="relative z-[99999] focus:outline-none"
        onClose={handleClose}
      >
        <DialogBackdrop
          onClick={handleClose}
          className="fixed inset-0 bg-black/60"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-[400px] overflow-hidden rounded-md bg-white shadow-lg">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                {isEditMode ? (
                  <>
                    <div className="flex items-center">
                      <button
                        onClick={handleCancel}
                        className="mr-3 text-gray-500 hover:text-gray-700"
                      >
                        <FaChevronLeft className="text-lg" />
                      </button>
                      <h2 className="text-base font-semibold text-gray-800">
                        Cập nhật thông tin cá nhân
                      </h2>
                    </div>
                    <button
                      onClick={handleClose}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </>
                ) : (
                  <div className="relative flex w-full items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-800">
                      Thông tin tài khoản
                    </h2>
                    <button
                      onClick={handleClose}
                      className="absolute right-0 z-10 rounded-full p-1 hover:bg-neutral-200"
                    >
                      <MdOutlineClose className="text-lg text-black" />
                    </button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <LoadingSpinner
                    isLoading={isLoading}
                    size={25}
                    overlayBackground="bg-transparent"
                    zIndex={100000}
                  />
                </div>
              ) : error ? (
                <div className="flex h-[400px] items-center justify-center text-red-500">
                  <p>Failed to load profile. Please try again.</p>
                </div>
              ) : isEditMode ? (
                <ProfileForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  handleCancel={handleCancel}
                  isSubmitting={isSubmitting}
                  isFormChanged={hasFormChanged()}
                  days={days}
                  months={months}
                  years={years}
                />
              ) : (
                <>
                  {/* Profile Header with Avatar and Banner */}
                  <ProfileHeader
                    user={userProfileToDisplay}
                    isCurrentUser={isCurrentUser}
                    onEditClick={() => setIsEditMode(true)}
                    onAvatarUpdate={handleAvatarUpdate}
                    avatarUpdating={false}
                    openLightbox={openLightbox}
                  />

                  {/* Friend request and messaging actions */}
                  <ProfileActions
                    isCurrentUser={isCurrentUser}
                    friendshipStatus={friendshipStatus}
                    onFriendRequest={handleFriendRequest}
                    onStartChat={startChat}
                    isLoading={isFriendActionLoading}
                    userId={userId}
                  />

                  <div className="-mx-4 mt-4 border-b-[6px] border-gray-200"></div>

                  {/* Personal Information */}
                  <ProfileInfo
                    user={userProfileToDisplay}
                    isCurrentUser={isCurrentUser}
                    formatDate={formatDate}
                  />

                  <div className="-mx-4 mt-4 border-b-[6px] border-gray-200"></div>

                  {/* Action Buttons */}
                  <div className="my-4 flex flex-col gap-2">
                    {isCurrentUser ? (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="flex h-full w-full items-center justify-center rounded-md py-2 font-semibold transition-all hover:bg-black/10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                          />
                        </svg>
                        Cập nhật
                      </button>
                    ) : (
                      <OtherUserActions isCurrentUser={isCurrentUser} />
                    )}
                  </div>
                </>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onConfirm={() => confirmDialog.action && confirmDialog.action()}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        title="Xác nhận"
        message={confirmDialog.message}
      />

      {/* Image Lightbox */}
      {lightboxState.isOpen && (
        <ImageLightbox
          isOpen={lightboxState.isOpen}
          onClose={closeLightbox}
          imageUrl={lightboxState.imageUrl}
          userName={userProfileToDisplay?.fullName || 'User'}
        />
      )}
    </>
  )
}

ProfileDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onProfileUpdate: PropTypes.func,
  userId: PropTypes.string,
  userData: PropTypes.object,
}

export default ProfileDialog
