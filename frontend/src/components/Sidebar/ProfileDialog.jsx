import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { BsBan } from 'react-icons/bs'
import { CiWarning } from 'react-icons/ci'
import { FaChevronLeft, FaCommentDots, FaTimes } from 'react-icons/fa'
import { FiCamera } from 'react-icons/fi'
import { LuPencilLine } from 'react-icons/lu'
import { MdOutlineClose } from 'react-icons/md'
import { RiGroupLine, RiIdCardLine } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import {
  getUserById,
  getUserInfo,
  updateUserAvatar,
  updateUserProfile,
} from '../../api/apiUser'
import { useUser } from '../../hooks/useUser'
import { onProfileUpdated } from '../../service/socket'
import { useUserStore } from '../../zustand/userStore'
import ConfirmDialog from '../ConfirmDialog'
import ImageLightbox from '../ImageLightbox'
import LoadingSpinner from '../LoadingSpinner'
const ProfileDialog = ({
  isOpen,
  close,
  onProfileUpdate = null,
  userId = null,
  userData: initialUserData = null,
}) => {
  const { setUser } = useUserStore()
  const currentUser = useUser()
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male',
    birthDay: '23',
    birthMonth: '11',
    birthYear: '2003',
  })

  // Add state for image lightbox
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    imageUrl: '',
    type: '', // 'avatar' or 'banner'
  })

  const navigate = useNavigate()
  const initialFormData = useRef(formData)

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    action: null,
  })

  // Determine if this is the current user's profile or someone else's
  const isCurrentUser = !userId || userId === currentUser?.id

  // Force a refetch when dialog opens for current user
  useEffect(() => {
    if (isOpen) {
      if (isCurrentUser && !initialUserData) {
        queryClient.fetchQuery({ queryKey: ['userProfile'] })
      } else if (userId && !initialUserData) {
        queryClient.fetchQuery({ queryKey: ['userProfile', userId] })
      }
    }
  }, [isOpen, queryClient, isCurrentUser, initialUserData, userId])

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => {
      if (isCurrentUser) {
        return getUserInfo()
      } else if (userId) {
        return getUserById(userId)
      }
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

  const updateMutation = useMutation({
    mutationFn: (userData) => updateUserProfile(userData),
    onSuccess: async (response) => {
      // Show success message
      enqueueSnackbar('Thông tin cá nhân đã được cập nhật', {
        variant: 'success',
      })

      // Get the updated user data from the response
      const updatedUserData = response?.data

      if (updatedUserData) {
        // Update the user in the store directly
        const updatedUser = { ...currentUser, ...updatedUserData }
        setUser(updatedUser)

        // Exit edit mode
        setIsEditMode(false)
      }

      // If parent provided a callback for handling updates, use it
      if (typeof onProfileUpdate === 'function') {
        onProfileUpdate()
      }
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
      enqueueSnackbar(
        error.response?.data?.message || 'Không thể cập nhật thông tin',
        { variant: 'error' },
      )
    },
  })

  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current.click()
  }

  const avatarMutation = useMutation({
    mutationFn: (file) => updateUserAvatar(file),
    onSuccess: (data) => {
      // Show success message
      enqueueSnackbar('Ảnh đại diện đã được cập nhật', {
        variant: 'success',
      })

      // Update user in store with new avatar
      if (data.data && data.data.avatar) {
        setUser({
          ...currentUser,
          avatar: data.data.avatar,
        })
      }

      // No need to invalidate queries since we're using socket updates
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error)
      enqueueSnackbar(
        error.response?.data?.message || 'Không thể cập nhật ảnh đại diện',
        { variant: 'error' },
      )
    },
  })

  const handleFileChange = (event) => {
    const file = event.target.files[0]
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
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      enqueueSnackbar('Kích thước file tối đa là 5MB', { variant: 'error' })
      return
    }

    // Upload file
    const formData = new FormData()
    formData.append('avatar', file)
    avatarMutation.mutate(formData)
  }

  useEffect(() => {
    // User profile data can come from two sources:
    // 1. initialUserData (passed as prop - often incomplete)
    // 2. API response (complete profile data)

    // Log data sources for debugging
    console.log('Profile dialog data sources:', {
      initialUserData, // From prop (partial data)
      apiResponse: data?.data, // Complete data from API
    })

    // Start with initialUserData (quick display) or empty object
    let userProfile = initialUserData || {}

    // If we have API data, we need to extract the user object
    let apiUserData = {}
    if (data?.data) {
      // API response structure: { data: { user: {...}, isFriend: boolean } }
      apiUserData = data.data.user || {}
    }

    // Merge strategy: If initialUserData exists but is missing details,
    // and API data has those details, merge them
    if (
      initialUserData &&
      Object.keys(initialUserData).length > 0 &&
      apiUserData &&
      Object.keys(apiUserData).length > 0
    ) {
      // Check if initial data is missing important fields that API data has
      if (
        (!initialUserData.gender && apiUserData.gender) ||
        (!initialUserData.birthdate && apiUserData.birthdate) ||
        (!initialUserData.phoneNumber && apiUserData.phoneNumber)
      ) {
        console.log('Merging partial user data with complete API data')
        userProfile = { ...initialUserData, ...apiUserData }
      }
    } else if (apiUserData && Object.keys(apiUserData).length > 0) {
      // If we only have API data, use that
      userProfile = apiUserData
    }

    // Only proceed if we have actual user data to work with
    if (userProfile && Object.keys(userProfile).length > 0) {
      // If this is the current user, update the global store
      if (isCurrentUser) {
        setUser(userProfile)
      }

      // Initialize the form with available data
      const newFormData = {
        fullName: userProfile.fullName || '',
        gender: userProfile.gender || 'male',
        birthDay: userProfile.birthdate
          ? new Date(userProfile.birthdate).getDate().toString()
          : '23',
        birthMonth: userProfile.birthdate
          ? (new Date(userProfile.birthdate).getMonth() + 1).toString()
          : '11',
        birthYear: userProfile.birthdate
          ? new Date(userProfile.birthdate).getFullYear().toString()
          : '2003',
      }
      setFormData(newFormData)
      initialFormData.current = JSON.parse(JSON.stringify(newFormData))
    }
  }, [data, initialUserData, setUser, isCurrentUser])

  // Listen for profile updates via socket when dialog is open
  useEffect(() => {
    if (!isOpen) return

    // Setup socket listener for profile updates
    const unsubscribe = onProfileUpdated((data) => {
      console.log('Profile dialog received update via socket:', data)
      if (data && data.user && (!userId || data.user.id === userId)) {
        // If this is the current user, update the store
        if (isCurrentUser) {
          setUser((prevUser) => ({ ...prevUser, ...data.user }))
        }

        // Update the form data if in edit mode
        if (data.user.fullName || data.user.gender || data.user.birthdate) {
          const newFormData = {
            fullName: data.user.fullName || formData.fullName,
            gender: data.user.gender || formData.gender,
            birthDay: data.user.birthdate
              ? new Date(data.user.birthdate).getDate().toString()
              : formData.birthDay,
            birthMonth: data.user.birthdate
              ? (new Date(data.user.birthdate).getMonth() + 1).toString()
              : formData.birthMonth,
            birthYear: data.user.birthdate
              ? new Date(data.user.birthdate).getFullYear().toString()
              : formData.birthYear,
          }
          setFormData(newFormData)
          initialFormData.current = JSON.parse(JSON.stringify(newFormData))
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isOpen, userId, isCurrentUser, initialUserData, formData])

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const hasFormChanged = () => {
    if (!initialFormData.current) return false
    const current = JSON.stringify(formData)
    const initial = JSON.stringify(initialFormData.current)
    return current !== initial
  }

  const handleSubmit = () => {
    if (!formData.fullName.trim()) {
      enqueueSnackbar('Tên hiển thị không được để trống', { variant: 'error' })
      return
    }
    const birthdate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`

    updateMutation.mutate({
      fullName: formData.fullName,
      gender: formData.gender,
      birthdate,
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
          setFormData(JSON.parse(JSON.stringify(initialFormData.current)))
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        },
      })
    } else {
      setIsEditMode(false)
    }
  }

  const startChat = () => {
    // Start with initialUserData or empty object
    let userToChat = initialUserData || {}

    // Get API data if available
    let apiUserData = {}
    if (data?.data) {
      apiUserData = data.data.user || {}
    }

    // Use the same merging logic as in the useEffect
    if (initialUserData && apiUserData && Object.keys(apiUserData).length > 0) {
      if (
        (!initialUserData.gender && apiUserData.gender) ||
        (!initialUserData.birthdate && apiUserData.birthdate) ||
        (!initialUserData.phoneNumber && apiUserData.phoneNumber)
      ) {
        userToChat = { ...initialUserData, ...apiUserData }
      }
    } else if (apiUserData && Object.keys(apiUserData).length > 0) {
      userToChat = apiUserData
    }

    // Get friend status from API response if available
    const isFriend = data?.data?.isFriend || false

    close()
    // navigate(`/chat`, {
    //   state: {
    //     user: userToChat,
    //     isFriend: isFriend,
    //   },
    // })
  }

  const handleClose = () => {
    // If in edit mode with changes, confirm before closing
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
      // Otherwise just close
      close()
    }
  }

  // Helper function to get the user data to display
  const getUserToDisplay = () => {
    // Start with initialUserData
    let displayUser = initialUserData || {}

    // Extract API user data if available
    let apiUserData = {}
    if (data?.data) {
      apiUserData = data.data.user || {}
    }

    // Apply the same merging logic
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

  // Get user for displaying in the UI
  const userProfileToDisplay = getUserToDisplay()

  // Get friend status from API response if available
  const isFriendStatus = data?.data?.isFriend || false

  // In the Component function, add a new state for friend request
  const [hasSentRequest, setHasSentRequest] = useState(false)

  // Handle friend request function
  const handleFriendRequest = () => {
    // For now, just toggle the state locally
    // Later this will be implemented with actual API calls
    setHasSentRequest(!hasSentRequest)

    // Show a notification
    enqueueSnackbar(
      hasSentRequest ? 'Đã huỷ lời mời kết bạn' : 'Đã gửi lời mời kết bạn',
      { variant: 'success' },
    )
  }

  // Close dialog function
  const handleCloseDialog = () => {
    // For chat page, we can just close the dialog as we're already in the chat
    // For other pages, we might need to navigate to chat
    close()
  }

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) =>
    (currentYear - i).toString(),
  )
  const isFormChanged = hasFormChanged()

  // Add handlers for opening/closing the lightbox
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

  return (
    <>
      <Dialog
        open={isOpen}
        as="div"
        className="relative z-[99999] focus:outline-none"
        onClose={handleClose}
        transition
      >
        <DialogBackdrop
          onClick={handleClose}
          className="fixed inset-0 bg-black/60"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="data-[closed]:transform-[scale(0)] duration-400 w-full max-w-[400px] rounded-md bg-red-500 transition-all ease-out data-[closed]:opacity-0"
            >
              <div className="mx-auto max-w-md overflow-hidden rounded-md bg-white shadow-lg">
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
                        onClick={handleCloseDialog}
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
                  <div className="p-5">
                    <div className="mb-5">
                      <label className="mb-2 block text-sm font-medium">
                        Tên hiển thị
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="mb-5">
                      <h3 className="mb-3 text-sm font-medium">
                        Thông tin cá nhân
                      </h3>

                      <div className="mb-4">
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="male"
                              checked={formData.gender === 'male'}
                              onChange={handleInputChange}
                              className="mr-2 h-4 w-4 accent-blue-500"
                            />
                            <span>Nam</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="female"
                              checked={formData.gender === 'female'}
                              onChange={handleInputChange}
                              className="mr-2 h-4 w-4 accent-blue-500"
                            />
                            <span>Nữ</span>
                          </label>
                        </div>
                      </div>

                      <div className="pb-24">
                        <p className="mb-2 text-sm">Ngày sinh</p>
                        <div className="flex gap-2">
                          <select
                            name="birthDay"
                            value={formData.birthDay}
                            onChange={handleInputChange}
                            className="w-1/3 rounded-md border border-gray-300 p-2 text-sm"
                          >
                            {days.map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                          <select
                            name="birthMonth"
                            value={formData.birthMonth}
                            onChange={handleInputChange}
                            className="w-1/3 rounded-md border border-gray-300 p-2 text-sm"
                          >
                            {months.map((month) => (
                              <option key={month} value={month}>
                                {month}
                              </option>
                            ))}
                          </select>
                          <select
                            name="birthYear"
                            value={formData.birthYear}
                            onChange={handleInputChange}
                            className="w-1/3 rounded-md border border-gray-300 p-2 text-sm"
                          >
                            {years.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-3 border-t pt-4">
                      <button
                        onClick={handleCancel}
                        className="rounded-[4px] bg-gray-200 px-4 py-2 text-center font-medium hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending || !isFormChanged}
                        className={`rounded-[4px] bg-blue-500 px-4 py-2 text-center font-medium text-white hover:bg-blue-600 ${
                          updateMutation.isPending || !isFormChanged
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        }`}
                      >
                        {updateMutation.isPending
                          ? 'Đang cập nhật...'
                          : 'Cập nhật'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Banner Image */}
                    <div className="relative">
                      <img
                        src={
                          userProfileToDisplay.banner ||
                          'https://cover-talk.zadn.vn/2/3/6/c/2/e67b9b28aa1641d0fb5241e27aee9087.jpg'
                        }
                        alt="Banner"
                        className="h-[170px] w-full cursor-pointer object-cover"
                        onClick={() =>
                          openLightbox(
                            userProfileToDisplay.banner ||
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
                            userProfileToDisplay.avatar ||
                            'https://s120-ava-talk.zadn.vn/b/a/c/2/7/120/e67b9b28aa1641d0fb5241e27aee9087.jpg'
                          }
                          alt="Profile"
                          className="h-20 w-20 cursor-pointer rounded-full border-2 border-gray-200 object-cover"
                          onClick={() =>
                            openLightbox(
                              userProfileToDisplay.avatar ||
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
                            <FiCamera
                              className={
                                avatarMutation.isPending ? 'animate-pulse' : ''
                              }
                            />
                          </button>
                        </>
                      )}

                      {/* Name and Edit Icon */}
                      <div className="absolute left-28 top-4 flex items-center justify-between">
                        <h2 className="mr-2 text-lg font-semibold text-gray-800">
                          {userProfileToDisplay.fullName || 'User'}
                        </h2>
                        {isCurrentUser && (
                          <button
                            onClick={() => setIsEditMode(true)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <LuPencilLine />
                          </button>
                        )}
                      </div>

                      {/* Friend request and message buttons for non-current users - moved here */}
                      {!isCurrentUser && (
                        <div className="mb-3 mt-4 flex w-full gap-2 px-4">
                          {/* Friend request button */}
                          <button
                            onClick={handleFriendRequest}
                            className={`flex h-full flex-1 items-center justify-center rounded-md py-2 font-semibold transition-all ${
                              isFriendStatus || hasSentRequest
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {isFriendStatus
                              ? 'Huỷ kết bạn'
                              : hasSentRequest
                                ? 'Huỷ lời mời'
                                : 'Kết bạn'}
                          </button>

                          {/* Message button */}
                          <button
                            onClick={startChat}
                            className="flex h-full flex-1 items-center justify-center rounded-md bg-gray-200 py-2 font-semibold text-gray-700 transition-all hover:bg-gray-300"
                          >
                            <FaCommentDots className="mr-2" />
                            Nhắn tin
                          </button>
                        </div>
                      )}

                      <div className="-mx-4 mt-4 border-b-[6px] border-gray-200"></div>

                      {/* Personal Information */}
                      <div className="mt-2 px-4">
                        <h3 className="font-semibold">Thông tin cá nhân</h3>
                        <div className="mt-3 text-gray-600">
                          <p className="mb-3 flex items-center gap-11">
                            <span className="text-sm">Giới tính</span>
                            <span className="text-sm text-black">
                              {userProfileToDisplay.gender
                                ? userProfileToDisplay.gender === 'male'
                                  ? 'Nam'
                                  : 'Nữ'
                                : 'Not set'}
                            </span>
                          </p>
                          <p className="mb-3 flex items-center gap-[34px]">
                            <span className="text-sm">Ngày sinh</span>
                            <span className="text-sm text-black">
                              {userProfileToDisplay.birthdate
                                ? formatDate(userProfileToDisplay.birthdate)
                                : 'Not set'}
                            </span>
                          </p>
                          {isCurrentUser && (
                            <p className="mb-3 flex items-center gap-8">
                              <span className="text-sm">Điện thoại</span>
                              <span className="text-sm text-black">
                                {userProfileToDisplay.phoneNumber || 'Not set'}
                              </span>
                            </p>
                          )}
                          {isCurrentUser && (
                            <p className="my-2">
                              <span className="text-[13px]">
                                Chỉ bạn bè có lưu số của bạn trong danh bạ máy
                                xem được số này
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

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
                          <>
                            {/* Remove friend request and message buttons from here */}

                            {/* Additional action buttons */}
                            <div className="">
                              <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
                                <RiGroupLine className="mr-3 h-5 w-5 text-gray-500" />
                                Nhóm chung {`(0)`}
                              </button>

                              <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
                                <RiIdCardLine className="mr-3 h-5 w-5 text-gray-500" />
                                Chia sẻ danh thiếp
                              </button>

                              <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
                                <BsBan className="mr-3 h-5 w-5 text-gray-500" />
                                Chặn tin nhắn và cuộc gọi
                              </button>

                              <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
                                <CiWarning className="mr-3 h-5 w-5 text-gray-500" />
                                Báo xấu
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
