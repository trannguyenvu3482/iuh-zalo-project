import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { FaCamera } from 'react-icons/fa'
import { createGroup } from '../../api/apiConversation'
import { getFriends } from '../../api/apiFriends'
import LoadingSpinner from '../LoadingSpinner'

const CreateGroupDialog = ({ isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const { enqueueSnackbar } = useSnackbar()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch friends list using react-query
  const {
    data: friendsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    staleTime: 300000, // 5 minutes
    enabled: isOpen, // Only fetch when dialog is open
  })

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const friends = friendsResponse?.data || []

  // Filter friends based on search term and category
  const filteredFriends = friends.filter(
    (friend) =>
      friend.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.phoneNumber?.includes(searchTerm),
  )

  // Group friends by first letter for display
  const groupedFriends = filteredFriends.reduce((acc, friend) => {
    // Make sure fullName exists and is not empty
    if (!friend.fullName || friend.fullName.trim() === '') return acc

    const letter = friend.fullName[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(friend)
    return acc
  }, {})

  const toggleContactSelection = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
    } else {
      setSelectedContacts([...selectedContacts, contactId])
    }
  }

  const handleCreateGroup = async () => {
    if (groupName.trim() && selectedContacts.length > 0) {
      setIsSubmitting(true)

      try {
        // Call the API to create the group
        const result = await createGroup({
          name: groupName,
          userIds: selectedContacts,
        })

        // Call the parent component's callback with the created group
        onCreateGroup(result.data.data)

        // Show success message
        enqueueSnackbar('Nhóm đã được tạo thành công!', { variant: 'success' })

        // Reset and close
        resetForm()
        onClose()
      } catch (error) {
        console.error('Error creating group:', error)
        enqueueSnackbar(error.message || 'Không thể tạo nhóm.', {
          variant: 'error',
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const resetForm = () => {
    setGroupName('')
    setSelectedContacts([])
    setSearchTerm('')
    setActiveCategory('all')
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[999999]">
      <DialogBackdrop className="fixed inset-0 bg-black/60" />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Tạo nhóm</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <FaCamera className="text-gray-600" />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Nhập tên nhóm..."
                  className={`w-full border-b pb-2 outline-none focus:border-b-blue-500 focus:ring-0 ${groupName ? 'border-blue-500' : ''}`}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="mt-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tên, số điện thoại hoặc danh sách số điện thoại"
                    className="w-full rounded-full border border-gray-300 px-4 py-2 pr-8 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                <button
                  className={`flex-shrink-0 rounded-full border border-gray-300 px-4 py-1 text-sm ${activeCategory === 'all' ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  Tất cả
                </button>
                <button
                  className={`flex-shrink-0 rounded-full border border-gray-300 px-4 py-1 text-sm ${activeCategory === 'family' ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => setActiveCategory('family')}
                >
                  Gia đình
                </button>
                <button
                  className={`flex-shrink-0 rounded-full border border-gray-300 px-4 py-1 text-sm ${activeCategory === 'other' ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => setActiveCategory('other')}
                >
                  Khác
                </button>
              </div>

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-gray-500">
                  Danh bạ ({filteredFriends.length})
                </h4>

                {isLoading ? (
                  <div className="flex h-60 items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : error ? (
                  <div className="py-4 text-center text-red-500">
                    Không thể tải danh sách bạn bè. Vui lòng thử lại sau.
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    {searchTerm
                      ? 'Không tìm thấy bạn bè phù hợp.'
                      : 'Bạn chưa có bạn bè nào.'}
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {Object.keys(groupedFriends)
                      .sort()
                      .map((letter) => (
                        <div key={letter}>
                          <div className="bg-gray-50 px-2 py-1 font-medium text-gray-500">
                            {letter}
                          </div>
                          {groupedFriends[letter].map((friend) => (
                            <div
                              key={friend.id}
                              className="flex items-center py-2"
                            >
                              <input
                                type="checkbox"
                                id={`contact-${friend.id}`}
                                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600"
                                checked={selectedContacts.includes(friend.id)}
                                onChange={() =>
                                  toggleContactSelection(friend.id)
                                }
                              />
                              <label
                                htmlFor={`contact-${friend.id}`}
                                className="flex flex-1 cursor-pointer items-center"
                              >
                                <div className="mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                                  <img
                                    src={
                                      friend.avatar ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName)}&background=random`
                                    }
                                    alt={friend.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <span>{friend.fullName}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-4">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                onClick={handleCreateGroup}
                disabled={
                  !groupName.trim() ||
                  selectedContacts.length === 0 ||
                  isSubmitting
                }
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo nhóm'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

CreateGroupDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateGroup: PropTypes.func.isRequired,
}

export default CreateGroupDialog
