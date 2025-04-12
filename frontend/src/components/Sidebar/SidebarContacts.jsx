import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { useDebounce } from '../../hooks'
import { searchConversationsByName } from '../../api/apiConversation'
import { searchUserByPhoneNumber } from '../../api/apiUser'
import addFriendIcon from '../../assets/icons/add-friend-btn.png'
import createGroupIcon from '../../assets/icons/create-group-btn.png'
import SearchEmptyIcon from '../../assets/icons/search-empty.png'
import { ConversationPreviewCard, LoadingSpinner } from '../index'
import SidebarControls from './SidebarControls'
import { NavLink } from 'react-router-dom'
import { FiUsers, FiUserPlus } from 'react-icons/fi'
import { HiUserGroup } from 'react-icons/hi'

const CONTACT_TABS = [
  { name: 'Danh sách bạn bè', link: '/contacts', icon: <FiUsers /> },
  { name: 'Danh sách nhóm và cộng đồng', link: '/contacts/groups', icon: <HiUserGroup /> },
  { name: 'Lời mời kết bạn', link: '/contacts/requests', icon: <FiUserPlus /> },
  { name: 'Lời mời vào nhóm và cộng đồng', link: '/contacts/group-requests', icon: <HiUserGroup /> },
]

const ContactSidebar = () => {
  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { enqueueSnackbar } = useSnackbar()
  const debouncedSearchValue = useDebounce(searchValue, 1000)

  const { mutate, isPending, data: searchResult, error } = useMutation({
    mutationFn: async ({ input, isPhoneNumber }) => {
      if (isPhoneNumber) return await searchUserByPhoneNumber(input)
      return await searchConversationsByName(input)
    },
    onSuccess: () => {
      enqueueSnackbar('Tìm kiếm thành công', { variant: 'success' })
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Tìm kiếm thất bại', { variant: 'error' })
    },
  })

  useEffect(() => {
    if (!debouncedSearchValue) return
    if (debouncedSearchValue.match(/^0\d{9}$/)) {
      mutate({ input: debouncedSearchValue, isPhoneNumber: true })
    } else {
      mutate({ input: debouncedSearchValue, isPhoneNumber: false })
    }
  }, [debouncedSearchValue, mutate])

  return (
    <aside className="flex h-screen max-w-[410px]">
      <SidebarControls />

      <aside className="w-[240px] border-r border-gray-200 p-3 flex flex-col">
        <div className="mb-2 px-2 text-[15px] font-medium text-gray-500">Bạn bè</div>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative w-full">
            <input
              placeholder="Tìm kiếm"
              className="w-full rounded-md border border-gray-200 bg-[#ebecf0] py-1.5 pl-8 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              onFocus={() => setIsSearching(true)}
              onChange={(e) => setSearchValue(e.target.value)}
              value={searchValue}
            />
            <button className="absolute left-2 top-1/2 -translate-y-1/2 p-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="5" />
                <line x1="11" y1="11" x2="15" y2="15" />
              </svg>
            </button>
          </div>

          <button className="p-2 hover:bg-gray-200 rounded-md">
            <img src={addFriendIcon} alt="add-friend" />
          </button>
          
          <button className="p-2 hover:bg-gray-200 rounded-md">
            <img src={createGroupIcon} alt="create-group" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {CONTACT_TABS.map((tab) => (
            <NavLink key={tab.link} to={tab.link} className={({ isActive }) =>
              `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium hover:bg-blue-100 ${
                isActive ? 'bg-blue-100 text-primary-blue' : 'text-gray-700'
              }`}>
              {tab.icon}
              {tab.name}
            </NavLink>
          ))}
        </div>

        {isSearching && (
          <div className="mt-4">
            {isPending && <LoadingSpinner />}
            {searchResult && !error && <ConversationPreviewCard conversation={searchResult?.data?.user} />}
            {!searchResult && !isPending && (
              <div className="flex flex-col items-center mt-10">
                <img src={SearchEmptyIcon} className="h-[130px] w-[160px]" alt="empty" />
                <p className="pt-8 text-sm font-semibold">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>
        )}
      </aside>
    </aside>
  )
}

export default ContactSidebar
