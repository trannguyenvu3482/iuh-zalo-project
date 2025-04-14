import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { useRef, useState } from 'react'
import { updateUserProfile } from '../api/apiUser'
import { useUserStore } from '../zustand/userStore'

/**
 * Custom hook to handle profile form state and actions
 * @param {Object} userData - User data to populate form
 * @param {Function} onProfileUpdate - Callback after successful update
 * @param {Function} onSuccess - Additional success callback
 */
export const useProfileForm = (userData, onProfileUpdate, onSuccess) => {
  const { setUser } = useUserStore()
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  // Initialize form data
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    gender: userData?.gender || 'male',
    birthDay: userData?.birthdate
      ? new Date(userData.birthdate).getDate().toString()
      : '1',
    birthMonth: userData?.birthdate
      ? (new Date(userData.birthdate).getMonth() + 1).toString()
      : '1',
    birthYear: userData?.birthdate
      ? new Date(userData.birthdate).getFullYear().toString()
      : '2000',
  })

  // Store initial form data for comparison
  const initialFormData = useRef(JSON.parse(JSON.stringify(formData)))

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (formValues) => {
      const birthdate = `${formValues.birthYear}-${formValues.birthMonth.padStart(2, '0')}-${formValues.birthDay.padStart(2, '0')}`

      return updateUserProfile({
        fullName: formValues.fullName,
        gender: formValues.gender,
        birthdate,
      })
    },
    onSuccess: (response) => {
      // Show success message
      enqueueSnackbar('Thông tin cá nhân đã được cập nhật', {
        variant: 'success',
      })

      // Get the updated user data
      const updatedUserData = response?.data

      if (updatedUserData) {
        // Update the user in the store
        setUser((prev) => ({ ...prev, ...updatedUserData }))
      }

      // Call callbacks
      if (typeof onSuccess === 'function') onSuccess()
      if (typeof onProfileUpdate === 'function') onProfileUpdate()

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
      enqueueSnackbar(
        error.response?.data?.message || 'Không thể cập nhật thông tin',
        { variant: 'error' },
      )
    },
  })

  // Check if form has changed
  const hasFormChanged = () => {
    if (!initialFormData.current) return false
    return JSON.stringify(formData) !== JSON.stringify(initialFormData.current)
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Reset form to initial values
  const resetForm = () => {
    setFormData(JSON.parse(JSON.stringify(initialFormData.current)))
  }

  // Submit form
  const handleSubmit = () => {
    if (!formData.fullName.trim()) {
      enqueueSnackbar('Tên hiển thị không được để trống', { variant: 'error' })
      return
    }

    updateMutation.mutate(formData)
  }

  return {
    formData,
    handleInputChange,
    handleSubmit,
    resetForm,
    isFormChanged: hasFormChanged(),
    isSubmitting: updateMutation.isPending,
    updateMutation,
  }
}
