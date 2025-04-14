import { useMutation, useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { useSnackbar } from 'notistack'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiUserPlus, FiUsers } from 'react-icons/fi'
import { HiUserGroup } from 'react-icons/hi'
import { NavLink, useLocation } from 'react-router-dom'
import { searchConversationsByName } from '../../api/apiConversation'
import { getAllConversations } from '../../api/apiMessage'
import { searchUserByPhoneNumber } from '../../api/apiUser'
import addFriendIcon from '../../assets/icons/add-friend-btn.png'
import chevronDown from '../../assets/icons/chevron-down.png'
import createGroupIcon from '../../assets/icons/create-group-btn.png'
import moreIcon from '../../assets/icons/more-btn.png'
import SearchEmptyIcon from '../../assets/icons/search-empty.png'
import { useDebounce } from '../../hooks'
import { ChatRoom, ConversationPreviewCard, LoadingSpinner } from '../index'
import SidebarControls from './SidebarControls'

const SearchTabs = {
  ALL: 'Tất cả',
  CONTACTS: 'Liên hệ',
  MESSAGES: 'Tin nhắn',
  FILES: 'File',
}

const ConversationTabs = {
  PRIORITY: 'Ưu tiên',
  OTHER: 'Khác',
}

// Contact navigation tabs
const CONTACT_TABS = [
  {
    name: 'Danh sách bạn bè',
    link: '/contacts',
    icon: <FiUsers className="h-5 w-5" />,
  },
  {
    name: 'Danh sách nhóm và cộng đồng',
    link: '/contacts/groups',
    icon: <HiUserGroup className="h-5 w-5" />,
  },
  {
    name: 'Lời mời kết bạn',
    link: '/contacts/requests',
    icon: <FiUserPlus className="h-5 w-5" />,
  },
  {
    name: 'Lời mời vào nhóm và cộng đồng',
    link: '/contacts/group-requests',
    icon: <HiUserGroup className="h-5 w-5" />,
  },
]

const Sidebar = () => {
  const location = useLocation()
  const isContactsPage = location.pathname.includes('/contacts')

  // Common state
  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { enqueueSnackbar } = useSnackbar()
  const debouncedSearchValue = useDebounce(searchValue, 500) // Reduced debounce time for better UX

  // Conversations state
  const [activeSearchTab, setActiveSearchTab] = useState(SearchTabs.ALL)
  const [activeConversationTab, setActiveConversationTab] = useState(
    ConversationTabs.PRIORITY,
  )

  // Search mutation with better error handling
  const {
    mutate,
    isPending,
    data: searchResult,
    error,
    reset: resetSearch,
  } = useMutation({
    mutationFn: async ({ input, isPhoneNumber }) => {
      if (isPhoneNumber) {
        return await searchUserByPhoneNumber(input)
      } else {
        return await searchConversationsByName(input)
      }
    },
    onError: (err) => {
      console.error('Search error:', err)
      enqueueSnackbar(err.message || 'Tìm kiếm thất bại', { variant: 'error' })
    },
  })

  // Fetch conversations with refetch interval for real-time updates
  const {
    data: conversationsResponse,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: getAllConversations,
    staleTime: 60000, // 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    enabled: !isContactsPage, // Only fetch conversations when not on contacts page
  })

  // Use useMemo to improve performance when rendering conversations
  const conversations = useMemo(() => {
    return Array.isArray(conversationsResponse?.data)
      ? conversationsResponse.data
      : []
  }, [conversationsResponse])

  // Filter conversations by active tab
  const filteredConversations = useMemo(() => {
    if (activeConversationTab === ConversationTabs.PRIORITY) {
      return conversations.filter(
        (conv) => conv.priority || conv.unreadCount > 0,
      )
    }
    return conversations.filter(
      (conv) => !conv.priority && conv.unreadCount === 0,
    )
  }, [conversations, activeConversationTab])

  // Search handler using useCallback to prevent unnecessary recreations
  const handleSearch = useCallback(() => {
    if (!debouncedSearchValue.trim()) {
      resetSearch()
      return
    }

    // Check if the search value is phone number
    if (debouncedSearchValue.match(/^0\d{9}$/)) {
      mutate({ input: debouncedSearchValue, isPhoneNumber: true })
    } else {
      mutate({ input: debouncedSearchValue, isPhoneNumber: false })
    }
  }, [debouncedSearchValue, mutate, resetSearch])

  // Handle clean search/close search
  const handleCloseSearch = () => {
    setSearchValue('')
    setIsSearching(false)
    resetSearch()
  }

  // Search effect
  useEffect(() => {
    handleSearch()
  }, [handleSearch])

  // Refetch conversations when the component mounts or gains focus
  useEffect(() => {
    if (!isContactsPage) {
      refetchConversations()

      // Refetch conversations when window regains focus
      const handleFocus = () => {
        refetchConversations()
      }

      window.addEventListener('focus', handleFocus)
      return () => {
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [refetchConversations, isContactsPage])

  // Render search bar component - common to both views
  const renderSearchBar = () => (
    <div
      className={`top-search sticky top-0 z-10 mb-3 mt-4 flex items-center justify-between bg-white px-4 ${isContactsPage ? 'mb-2' : ''}`}
    >
      <form
        className="form relative mr-2 flex-1"
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
      >
        <button
          type="submit"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1"
          aria-label="Search"
        >
          <svg
            width="17"
            height="16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-labelledby="search"
            className="h-5 w-5 text-gray-700"
          >
            <path
              d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
              stroke="currentColor"
              strokeWidth="1.333"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </button>
        <input
          className="input w-full rounded-md border border-transparent bg-[#ebecf0] py-[5px] pl-8 pr-12 text-sm placeholder-gray-500 transition-all duration-300 focus:border-blue-500 focus:outline-none"
          placeholder="Tìm kiếm"
          required=""
          type="text"
          onFocus={() => setIsSearching(true)}
          onChange={(e) => setSearchValue(e.target.value)}
          value={searchValue}
          aria-label="Search contacts and messages"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </form>

      <div className="flex h-[30px] w-fit items-center justify-center">
        {isSearching ? (
          <button
            onClick={handleCloseSearch}
            className="h-full w-full rounded-sm px-3.5 font-semibold hover:bg-gray-200"
          >
            Đóng
          </button>
        ) : (
          <>
            <button
              className="flex h-full items-center justify-center rounded-md p-2 hover:bg-gray-200"
              aria-label="Add friend"
              title="Thêm bạn"
            >
              <img src={addFriendIcon} alt="Add friend" />
            </button>
            <button
              className="flex h-full items-center justify-center rounded-md p-2 hover:bg-gray-200"
              aria-label="Create group"
              title="Tạo nhóm"
            >
              <img src={createGroupIcon} alt="Create group" />
            </button>
          </>
        )}
      </div>
    </div>
  )

  // Render the search results component - common to both views
  const renderSearchResults = () => (
    <>
      {isPending && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {/* Search Tabs */}
      {searchValue.length > 0 ? (
        <>
          <div className="sticky top-0 z-10 border-b-2 bg-white">
            <div className="flex w-full items-center justify-between px-4">
              <div className="w-full sm:block">
                <div className="border-gray-200">
                  <nav
                    className="-mb-px flex gap-3 overflow-x-auto"
                    aria-label="Tabs"
                  >
                    {Object.values(SearchTabs).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSearchTab(tab)}
                        className={`shrink-0 whitespace-nowrap border-b-2 pb-1 text-sm font-semibold ${
                          activeSearchTab === tab
                            ? 'border-primary-blue text-primary-blue'
                            : 'border-transparent text-gray-500 hover:text-primary-blue'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchResult && !error ? (
              <div className="p-4">
                <h3 className="px-3 pt-3 text-sm font-semibold">
                  Tìm bạn qua số điện thoại:
                </h3>
                <ConversationPreviewCard
                  isFriend={searchResult?.data?.isFriend}
                  user={searchResult?.data?.user}
                />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-4">
                <img
                  className="h-[130px] w-[160px]"
                  src={SearchEmptyIcon}
                  alt="No results found"
                />
                <p className="pt-4 text-sm font-semibold">
                  Không tìm thấy kết quả
                </p>
                <p className="pt-2 text-center text-sm text-gray-500">
                  Vui lòng thử lại từ khóa khác hoặc sử dụng ứng dụng Zalo trên
                  điện thoại để tìm tin nhắn trước ngày{' '}
                  {format(subDays(new Date(), 1), 'dd/MM/yyyy')}.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="border-b px-4 pb-6">
            <p className="mb-4 text-sm font-semibold">Tìm gần đây</p>
            <span className="text-sm">Không có tìm kiếm nào gần đây</span>
          </div>
          <div className="border-b px-4 pb-6 pt-4">
            <p className="mb-4 text-sm font-semibold">Lọc tin nhắn</p>
            <div className="flex flex-wrap gap-2">
              <span className="cursor-pointer whitespace-nowrap rounded-full bg-gray-200 px-3 py-1.5 text-sm text-black hover:bg-gray-300">
                Nhắc bạn
              </span>
              <span className="cursor-pointer whitespace-nowrap rounded-full bg-gray-200 px-3 py-1.5 text-sm text-black hover:bg-gray-300">
                Biểu cảm
              </span>
              <span className="cursor-pointer whitespace-nowrap rounded-full bg-gray-200 px-3 py-1.5 text-sm text-black hover:bg-gray-300">
                Ảnh
              </span>
              <span className="cursor-pointer whitespace-nowrap rounded-full bg-gray-200 px-3 py-1.5 text-sm text-black hover:bg-gray-300">
                Video
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )

  // Render the conversations content
  const renderConversationsContent = () => (
    <>
      {/* Conversation Tabs */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex w-full items-center justify-between px-4">
          <div className="hidden sm:block">
            <div className="border-gray-200">
              <nav className="-mb-px flex gap-3" aria-label="Tabs">
                {Object.values(ConversationTabs).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveConversationTab(tab)}
                    className={`shrink-0 border-b-2 pb-1 text-sm font-semibold ${
                      activeConversationTab === tab
                        ? 'border-primary-blue text-primary-blue'
                        : 'border-transparent text-gray-500 hover:text-primary-blue'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-2.5 rounded-full px-2 py-1 text-xs transition-all hover:bg-gray-200">
              Phân loại
              <img src={chevronDown} alt="" />
            </button>

            <button
              className="flex h-6 w-6 items-center gap-2 rounded-full p-1 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-200 hover:text-primary-blue"
              aria-label="More options"
            >
              <img src={moreIcon} alt="More options" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex h-40 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center p-4">
            <p className="mb-2 text-gray-500">Không có cuộc trò chuyện nào</p>
            <button className="text-sm text-primary-blue hover:underline">
              Bắt đầu cuộc trò chuyện mới
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ChatRoom
                key={conversation.id}
                id={conversation.id}
                name={
                  conversation.type === 'PRIVATE'
                    ? conversation.members[0]?.fullName || 'Unnamed Contact'
                    : conversation.name || 'Group Chat'
                }
                avatar={
                  conversation.type === 'PRIVATE'
                    ? conversation.members[0]?.avatar
                    : conversation.avatar
                }
                lastMessage={conversation.lastMessage}
                lastActivity={conversation.createdAt || conversation.created_at}
                type={conversation.type}
                unreadCount={conversation.unreadCount}
                isActive={conversation.isActive}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )

  // Render contacts navigation
  const renderContactsNavigation = () => (
    <>
      <div className="mt-2 flex flex-col gap-1">
        {CONTACT_TABS.map((tab) => (
          <NavLink
            key={tab.link}
            to={tab.link}
            end={tab.link === '/contacts'}
            className={({ isActive }) =>
              `flex items-center gap-4 rounded px-6 py-4 text-base font-semibold hover:bg-blue-100 ${
                isActive ? 'bg-blue-100 text-primary-blue' : 'text-gray-700'
              }`
            }
          >
            {tab.icon}
            {tab.name}
          </NavLink>
        ))}
      </div>
    </>
  )

  return (
    <aside className="flex h-screen max-w-[410px]">
      <SidebarControls />
      <div className="right flex h-screen w-[410px] flex-col overflow-hidden border-r border-gray-300">
        {renderSearchBar()}

        <div className="flex flex-1 flex-col overflow-hidden">
          {isSearching
            ? renderSearchResults()
            : isContactsPage
              ? renderContactsNavigation()
              : renderConversationsContent()}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
