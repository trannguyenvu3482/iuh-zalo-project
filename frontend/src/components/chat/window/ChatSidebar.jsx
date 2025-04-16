import PropTypes from 'prop-types'
import { useState } from 'react'
import { BiErrorCircle } from 'react-icons/bi'
import { FaPhotoVideo } from 'react-icons/fa'
import {
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineDocument,
  HiOutlineLink,
} from 'react-icons/hi'
import { MdOutlineSettings } from 'react-icons/md'
import { RiDeleteBin6Line } from 'react-icons/ri'

const ChatSidebar = ({ isOpen, receiverInfo }) => {
  const [expandedSections, setExpandedSections] = useState({
    images: true,
    files: true,
    links: true,
    security: false,
  })

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Dummy data for the UI
  const sharedMedia = [
    {
      type: 'image',
      url: 'https://via.placeholder.com/150',
      date: '08/04/2023',
    },
    {
      type: 'image',
      url: 'https://via.placeholder.com/150',
      date: '08/04/2023',
    },
    {
      type: 'image',
      url: 'https://via.placeholder.com/150',
      date: '07/04/2023',
    },
  ]

  const sharedFiles = [
    {
      name: '08042025.pdf',
      size: '282.17 KB',
      date: '08/04/2023',
    },
  ]

  if (!isOpen) return null

  return (
    <div className="flex h-full w-[350px] flex-shrink-0 flex-col border-l border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-[18px]">
        <div className="flex items-center justify-center">
          <h3 className="text-lg font-medium">Thông tin hội thoại</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* User Profile Section */}
        <div className="flex flex-col items-center p-5">
          <img
            src={receiverInfo?.avatar || 'https://via.placeholder.com/100'}
            alt={receiverInfo?.fullName || 'User'}
            className="h-24 w-24 rounded-full object-cover"
          />
          <h4 className="mt-2 text-xl font-semibold">
            {receiverInfo?.fullName || 'User'}
          </h4>
          <span className="rounded-full bg-gray-300 px-2 py-1 text-xs">
            {receiverInfo?.isFriend ? '' : 'Người lạ'}
          </span>
        </div>

        <div className="h-[10px] w-full bg-gray-200"></div>

        {/* Reminder Section */}
        <button className="flex w-full items-center rounded-md p-3 text-left hover:bg-gray-100">
          <HiOutlineClock className="mr-3 h-5 w-5 text-gray-500" />
          <span className="font-medium">Danh sách nhắc hẹn</span>
        </button>

        <div className="h-[10px] w-full bg-gray-200"></div>

        {/* Media & Files Section */}
        <div className="">
          {/* Images/Video Section */}
          <div className="mb-4 p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => toggleSection('images')}
            >
              <div className="flex items-center">
                <FaPhotoVideo className="mr-3 h-5 w-5 text-gray-500" />
                <span className="font-medium">Ảnh/Video</span>
              </div>
              {expandedSections.images ? (
                <HiOutlineChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <HiOutlineChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.images && (
              <div className="mt-3">
                {sharedMedia.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {sharedMedia.map((media, index) => (
                        <div
                          key={index}
                          className="aspect-square cursor-pointer overflow-hidden rounded-md"
                        >
                          <img
                            src={media.url || 'https://picsum.photos/200/300'}
                            alt="Shared media"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <button className="mt-2 w-full text-center text-sm text-blue-500">
                      Xem tất cả
                    </button>
                  </>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    Chưa có Ảnh/Video được chia sẻ trong hội thoại này
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="h-[10px] w-full bg-gray-200"></div>

          {/* Files Section */}
          <div className="mb-4 p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => toggleSection('files')}
            >
              <div className="flex items-center">
                <HiOutlineDocument className="mr-3 h-5 w-5 text-gray-500" />
                <span className="font-medium">File</span>
              </div>
              {expandedSections.files ? (
                <HiOutlineChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <HiOutlineChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.files && (
              <div className="mt-3">
                {sharedFiles.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {sharedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center rounded-md border border-gray-200 p-2"
                        >
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded bg-red-100 text-red-500">
                            PDF
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{file.name}</div>
                            <div className="flex items-center text-xs text-gray-500">
                              <span>{file.size}</span>
                              <span className="mx-1">•</span>
                              <span>{file.date}</span>
                            </div>
                          </div>
                          <button className="text-blue-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="mt-2 w-full text-center text-sm text-blue-500">
                      Xem tất cả
                    </button>
                  </>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    Chưa có File được chia sẻ trong hội thoại này
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="h-[10px] w-full bg-gray-200"></div>

          {/* Links Section */}
          <div className="mb-4 p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => toggleSection('links')}
            >
              <div className="flex items-center">
                <HiOutlineLink className="mr-3 h-5 w-5 text-gray-500" />
                <span className="font-medium">Link</span>
              </div>
              {expandedSections.links ? (
                <HiOutlineChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <HiOutlineChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.links && (
              <div className="mt-3">
                <p className="text-center text-sm text-gray-500">
                  Chưa có Link được chia sẻ trong hội thoại này
                </p>
              </div>
            )}
          </div>

          <div className="h-[10px] w-full bg-gray-200"></div>

          {/* Security Settings Toggle */}
          <div className="mb-4 p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => toggleSection('security')}
            >
              <div className="flex items-center">
                <MdOutlineSettings className="mr-3 h-5 w-5 text-gray-500" />
                <span className="font-medium">Thiết lập bảo mật</span>
              </div>
              {expandedSections.security ? (
                <HiOutlineChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <HiOutlineChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedSections.security && (
              <div className="mt-3 pl-8">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="encrypt"
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor="encrypt" className="text-sm">
                      Mã hoá hai đầu cuộc trò chuyện
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoDelete"
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor="autoDelete" className="text-sm">
                      Tự động xoá tin nhắn sau 24 giờ
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Buttons */}
          <div className="mt-6 px-4">
            <button className="flex w-full items-center rounded-md py-2 pl-1 text-left text-red-600 hover:bg-gray-100">
              <BiErrorCircle className="mr-3 h-5 w-5" />
              <span className="font-medium">Báo xấu</span>
            </button>

            <button className="flex w-full items-center rounded-md py-2 pl-1 text-left text-red-600 hover:bg-gray-100">
              <RiDeleteBin6Line className="mr-3 h-5 w-5" />
              <span className="font-medium">Xoá lịch sử trò chuyện</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

ChatSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  receiverInfo: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
    avatar: PropTypes.string,
    isFriend: PropTypes.bool,
  }),
}

export default ChatSidebar
