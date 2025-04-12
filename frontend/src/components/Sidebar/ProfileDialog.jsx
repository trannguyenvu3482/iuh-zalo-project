import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { FaChevronLeft, FaTimes } from 'react-icons/fa'
import { FiCamera } from 'react-icons/fi'
import { LuPencilLine } from 'react-icons/lu'
import { getUserInfo, updateUserProfile } from '../../api/apiUser'
import { useUserStore } from '../../zustand/userStore'
import LoadingSpinner from '../LoadingSpinner'

const ProfileDialog = ({ isOpen, close, onProfileUpdate }) => {
  const { setUser } = useUserStore()
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
  const initialFormData = useRef(formData)

  // Force a refetch when dialog opens
  useEffect(() => {
    if (isOpen) {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    }
  }, [isOpen, queryClient])

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserInfo,
    enabled: isOpen,
    refetchOnWindowFocus: false,
    staleTime: 0,
    refetchOnMount: true,
  })

  const updateMutation = useMutation({
    mutationFn: (userData) => updateUserProfile(userData),
    onSuccess: async () => {
      // Show success message
      enqueueSnackbar('Thông tin cá nhân đã được cập nhật', {
        variant: 'success',
      })

      // If parent provided a callback for handling updates, use it
      if (typeof onProfileUpdate === 'function') {
        onProfileUpdate()
      } else {
        // Otherwise just close the dialog
        close()
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

  useEffect(() => {
    if (data?.data) {
      const userData = data.data
      setUser(userData)
      const newFormData = {
        fullName: userData.fullName || '',
        gender: userData.gender || 'male',
        birthDay: userData.birthdate
          ? new Date(userData.birthdate).getDate().toString()
          : '23',
        birthMonth: userData.birthdate
          ? (new Date(userData.birthdate).getMonth() + 1).toString()
          : '11',
        birthYear: userData.birthdate
          ? new Date(userData.birthdate).getFullYear().toString()
          : '2003',
      }
      setFormData(newFormData)
      initialFormData.current = JSON.parse(JSON.stringify(newFormData))
    }
  }, [data, setUser])

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
    setIsEditMode(false)
    setFormData(JSON.parse(JSON.stringify(initialFormData.current)))
  }

  const userData = data?.data || {}
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) =>
    (currentYear - i).toString(),
  )
  const isFormChanged = hasFormChanged()
  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-[99999] focus:outline-none"
      onClose={isEditMode ? () => {} : close}
      transition
    >
      <DialogBackdrop className="fixed inset-0 bg-black/60" />

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
                      onClick={close}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-semibold text-gray-800">
                      Thông tin tài khoản
                    </h2>
                    <button
                      onClick={close}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </>
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
                        userData.banner ||
                        'https://cover-talk.zadn.vn/2/3/6/c/2/e67b9b28aa1641d0fb5241e27aee9087.jpg'
                      }
                      alt="Banner"
                      className="h-[170px] w-full object-cover"
                    />
                  </div>

                  {/* Profile Section */}
                  <div className="relative px-4 pt-16">
                    {/* Profile Picture */}
                    <div className="absolute -top-4 left-4">
                      <img
                        src={
                          userData.avatar ||
                          'https://s120-ava-talk.zadn.vn/b/a/c/2/7/120/e67b9b28aa1641d0fb5241e27aee9087.jpg'
                        }
                        alt="Profile"
                        className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
                      />
                    </div>

                    <div className="absolute left-16 top-8 rounded-full border border-gray-300 bg-gray-200 p-2">
                      <FiCamera className="" />
                    </div>

                    {/* Name and Edit Icon */}
                    <div className="absolute left-28 top-4 flex items-center justify-between">
                      <h2 className="mr-2 text-lg font-semibold text-gray-800">
                        {userData.fullName || 'User'}
                      </h2>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <LuPencilLine />
                      </button>
                    </div>

                    <div className="-mx-4 mt-4 border-b-[6px] border-gray-200"></div>

                    {/* Personal Information */}
                    <div className="mt-2 border-b border-gray-300">
                      <h3 className="font-semibold">Thông tin cá nhân</h3>
                      <div className="mt-3 text-gray-600">
                        <p className="mb-3 flex items-center gap-11">
                          <span className="text-sm">Giới tính</span>
                          <span className="text-sm text-black">
                            {userData.gender
                              ? userData.gender === 'male'
                                ? 'Nam'
                                : 'Nữ'
                              : 'Not set'}
                          </span>
                        </p>
                        <p className="mb-3 flex items-center gap-[34px]">
                          <span className="text-sm">Ngày sinh</span>
                          <span className="text-sm text-black">
                            {userData.birthdate
                              ? formatDate(userData.birthdate)
                              : 'Not set'}
                          </span>
                        </p>
                        <p className="mb-3 flex items-center gap-8">
                          <span className="text-sm">Điện thoại</span>
                          <span className="text-sm text-black">
                            {userData.phoneNumber || 'Not set'}
                          </span>
                        </p>
                        <p className="my-2">
                          <span className="text-[13px]">
                            Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem
                            được số này
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <div className="my-4">
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="flex h-full w-full items-center justify-center py-1 font-semibold transition-all hover:bg-black/10"
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
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

ProfileDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  onProfileUpdate: PropTypes.func,
}

ProfileDialog.defaultProps = {
  onProfileUpdate: null,
}

export default ProfileDialog
