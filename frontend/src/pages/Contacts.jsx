import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getFriends } from '../api/apiFriends'
import { LoadingSpinner } from '../components'

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'

  // Fetch friends using react-query
  const { data, isLoading, error } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await getFriends()
      return response.data
    },
    staleTime: 300000, // 5 minutes
  })

  // Filter friends based on search term
  const filteredFriends =
    data?.filter((friend) =>
      friend.fullName?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  // Sort friends by name
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    const nameA = a.fullName?.toLowerCase() || ''
    const nameB = b.fullName?.toLowerCase() || ''
    return sortOrder === 'asc'
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA)
  })

  // Group friends by first letter of name
  const groupedFriends = sortedFriends.reduce((acc, friend) => {
    // Make sure fullName exists and is not empty
    if (!friend.fullName || friend.fullName.trim() === '') return acc

    const letter = friend.fullName[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(friend)
    return acc
  }, {})

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h1 className="mb-1 text-lg font-semibold">Danh sách bạn bè</h1>
        <p className="text-sm text-gray-500">
          {isLoading ? 'Đang tải...' : `Bạn bè (${filteredFriends.length})`}
        </p>
      </div>

      <div className="flex items-center gap-2 p-4">
        <input
          placeholder="Tìm bạn"
          className="w-full rounded-md border border-gray-200 bg-[#ebecf0] px-3 py-1.5 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="rounded border px-2 py-1 text-sm hover:bg-gray-100"
          onClick={toggleSortOrder}
        >
          Tên ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-red-500">
          <p>Không thể tải danh sách bạn bè</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4 text-gray-500">
          {searchTerm
            ? 'Không tìm thấy bạn bè phù hợp'
            : 'Bạn chưa có bạn bè nào'}
        </div>
      ) : (
        <div className="overflow-y-auto p-4">
          {Object.keys(groupedFriends)
            .sort()
            .map((letter) => (
              <div key={letter} className="mb-4">
                <p className="mb-2 text-sm font-semibold text-gray-500">
                  {letter}
                </p>
                {groupedFriends[letter].map((friend) => (
                  <div key={friend.id} className="flex items-center gap-2 py-1">
                    <img
                      src={
                        friend.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName)}&background=random`
                      }
                      alt={friend.fullName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="text-sm">{friend.fullName}</span>
                    {friend.isBusiness && (
                      <span className="ml-auto rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-500">
                        Business
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default Contacts
