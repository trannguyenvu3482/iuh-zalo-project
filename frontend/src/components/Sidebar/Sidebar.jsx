import { useMutation, useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
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

const Sidebar = () => {
  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { enqueueSnackbar } = useSnackbar()
  const debouncedSearchValue = useDebounce(searchValue, 2000)

  const {
    mutate,
    isPending,
    data: searchResult,
    error,
  } = useMutation({
    mutationFn: async ({ input, isPhoneNumber }) => {
      if (isPhoneNumber) {
        return await searchUserByPhoneNumber(input)
      } else {
        return await searchConversationsByName(input)
      }
    },
    onSuccess: (response) => {
      console.log(response)

      if (response?.statusCode === 200) {
        enqueueSnackbar('Tìm kiếm thành công', { variant: 'success' })
      } else throw new Error('Tìm kiếm thất bại')
    },
    onError: (err) => {
      console.log(error)
      enqueueSnackbar(err.message || 'Tìm kiếm thất bại', { variant: 'error' })
    },
  })

  // Fetch conversations
  const { data: conversationsResponse, isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ['conversations'],
      queryFn: getAllConversations,
      staleTime: 60000, // 1 minute
    })

  // Ensure conversations is always an array
  const conversations = Array.isArray(conversationsResponse?.data)
    ? conversationsResponse.data
    : []

  useEffect(() => {
    const handleSearch = async () => {
      // Check if the search value is phone number
      if (debouncedSearchValue.match(/^0\d{9}$/)) {
        mutate({ input: debouncedSearchValue, isPhoneNumber: true })
      } else if (debouncedSearchValue.length > 0) {
        mutate({ input: debouncedSearchValue, isPhoneNumber: false })
      }
    }

    handleSearch()
  }, [debouncedSearchValue, mutate])

  return (
    <aside className="flex h-screen max-w-[410px]">
      <SidebarControls />
      <div className="right h-screen w-[410px] overflow-hidden border-r border-gray-300">
        {/* Search form */}
        <div className="top-search mb-5 mt-4 flex items-center justify-between px-4">
          <form className="form relative">
            <button className="absolute left-2 top-1/2 -translate-y-1/2 p-1">
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
              className="input rounded-md border border-transparent bg-[#ebecf0] py-[5px] pl-8 pr-12 text-sm placeholder-gray-500 transition-all duration-300 focus:border-blue-500 focus:outline-none"
              placeholder="Tìm kiếm"
              required=""
              type="text"
              onFocus={() => setIsSearching(true)}
              onChange={(e) => setSearchValue(e.target.value)}
              value={searchValue}
            />
          </form>

          <div className="flex h-[30px] w-fit items-center justify-center">
            {isSearching ? (
              <button
                onClick={() => {
                  setSearchValue('')
                  setIsSearching(false)
                }}
                className="h-full w-full rounded-sm px-3.5 font-semibold hover:bg-gray-200"
              >
                Đóng
              </button>
            ) : (
              <>
                <button className="flex h-full items-center justify-center rounded-md p-2 hover:bg-gray-200">
                  <img src={addFriendIcon} alt="" />
                </button>
                <button className="flex h-full items-center justify-center rounded-md p-2 hover:bg-gray-200">
                  <img src={createGroupIcon} alt="" />
                </button>
              </>
            )}
          </div>
        </div>

        <>
          {isSearching ? (
            <>
              {isPending && <LoadingSpinner />}

              {/* Nav */}
              {searchValue.length > 0 ? (
                <>
                  <div className="border-b-2">
                    <div className="flex w-full items-center justify-between px-4">
                      <div className="hidden sm:block">
                        <div className="border-gray-200">
                          <nav className="-mb-px flex gap-3" aria-label="Tabs">
                            <button className="shrink-0 border-b-2 border-primary-blue pb-1 text-sm font-semibold text-primary-blue hover:text-primary-blue">
                              Tất cả
                            </button>

                            <button className="shrink-0 border-b-2 border-transparent pb-1 text-sm font-semibold text-gray-500 hover:text-primary-blue">
                              Liên hệ
                            </button>

                            <button className="shrink-0 border-b-2 border-transparent pb-1 text-sm font-semibold text-gray-500 hover:text-primary-blue">
                              Tin nhắn
                            </button>

                            <button className="shrink-0 border-b-2 border-transparent pb-1 text-sm font-semibold text-gray-500 hover:text-primary-blue">
                              File
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>

                  {searchResult && !error ? (
                    <div className="overflow-y-auto">
                      <ConversationPreviewCard
                        conversation={searchResult?.data?.user}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mt-16 flex h-full flex-col items-center">
                        <img
                          className="h-[130px] w-[160px]"
                          src={SearchEmptyIcon}
                          alt="search-empty"
                        />
                        <p className="pt-8 text-sm font-semibold">
                          Không tìm thấy kết quả
                        </p>

                        <p className="pt-2 text-center text-sm text-gray-500">
                          Vui lòng thử lại từ khóa khác hoặc sử dụng ứng dụng
                          Zalo trên điện thoại để tìm tin nhắn trước ngày{' '}
                          {format(subDays(new Date(), 1), 'dd/MM/yyyy')}.
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="border-b px-4 pb-6">
                    <p className="mb-4 text-sm font-semibold">Tìm gần đây</p>
                    <span className="text-sm">
                      Không có tìm kiếm nào gần đây
                    </span>
                  </div>
                  <div className="border-b px-4 pb-6 pt-4">
                    <p className="mb-4 text-sm font-semibold">Lọc tin nhắn</p>
                    <div className="flex gap-2">
                      <span className="cursor-pointer whitespace-nowrap rounded-full bg-gray-200 px-3 py-1.5 text-sm text-black hover:bg-gray-300">
                        Nhắc bạn
                      </span>
                      <span className="cursor-pointer whitespace-nowrap rounded-full bg-gray-200 px-3 py-1.5 text-sm text-black hover:bg-gray-300">
                        Biểu cảm
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Nav */}
              <div className="">
                <div className="flex w-full items-center justify-between px-4">
                  <div className="hidden sm:block">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex gap-3" aria-label="Tabs">
                        <a
                          href="#"
                          className="shrink-0 border-b-2 border-primary-blue pb-1 text-sm font-semibold text-primary-blue hover:text-primary-blue"
                        >
                          Ưu tiên
                        </a>

                        <a
                          href="#"
                          className="shrink-0 border-b-2 border-transparent pb-1 text-sm font-semibold text-gray-500 hover:text-primary-blue"
                        >
                          Khác
                        </a>
                      </nav>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="flex items-center gap-2.5 rounded-full px-2 py-1 text-xs transition-all hover:bg-gray-200">
                      Phân loại
                      <img src={chevronDown} alt="" />
                    </button>

                    <button className="flex h-6 w-6 items-center gap-2 rounded-full p-1 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-200 hover:text-primary-blue">
                      <img src={moreIcon} alt="" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat list */}
              <div className="max-h-[calc(100vh-64px)] overflow-y-auto border-t border-gray-200">
                {isLoadingConversations ? (
                  <div className="flex h-40 items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-gray-500">No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {conversations.map((conversation) => (
                      <ChatRoom
                        key={conversation.id}
                        id={conversation.id}
                        name={
                          conversation.type === 'PRIVATE'
                            ? conversation.members[0]?.fullname ||
                              'Unnamed Contact'
                            : conversation.name || 'Group Chat'
                        }
                        avatar={
                          conversation.type === 'PRIVATE'
                            ? conversation.members[0]?.avatar
                            : conversation.avatar
                        }
                        lastMessage={conversation.lastMessage}
                        lastActivity={conversation.created_at}
                        type={conversation.type}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      </div>
    </aside>
  )
}

export default Sidebar
