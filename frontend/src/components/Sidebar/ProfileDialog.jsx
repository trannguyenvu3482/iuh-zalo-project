import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import React from 'react'
import { FiCamera } from 'react-icons/fi'

const ProfileDialog = ({ isOpen, close }) => {
  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-[99999] focus:outline-none"
      onClose={close}
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
                <h2 className="text-base font-semibold text-gray-800">
                  Thông tin tài khoản
                </h2>
                <button
                  onClick={close}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Banner Image */}
              <div className="relative">
                <img
                  src="https://cover-talk.zadn.vn/2/3/6/c/2/e67b9b28aa1641d0fb5241e27aee9087.jpg" // Replace with your banner image URL
                  alt="Banner"
                  className="h-[170px] w-full object-cover"
                />
              </div>

              {/* Profile Section */}
              <div className="relative px-4 pt-16">
                {/* Profile Picture */}
                <div className="absolute -top-4 left-4">
                  <img
                    src="https://s120-ava-talk.zadn.vn/b/a/c/2/7/120/e67b9b28aa1641d0fb5241e27aee9087.jpg" // Replace with your profile picture URL
                    alt="Profile"
                    className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
                  />
                </div>

                <div className="absolute left-16 top-8 rounded-full border border-gray-300 bg-gray-200 p-2">
                  <FiCamera className="" />
                </div>

                {/* Name and Edit Icon */}
                <div className="absolute left-28 top-2 flex items-center justify-between">
                  <h2 className="mr-2 text-lg font-semibold text-gray-800">
                    Vũ Trần
                  </h2>
                  <button className="text-gray-500 hover:text-gray-700">
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
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="-mx-4 mt-4 border-b-[6px] border-gray-200"></div>

                {/* Personal Information */}
                <div className="mt-2 border-b border-gray-300">
                  <h3 className="font-semibold">Thông tin cá nhân</h3>
                  <div className="mt-3 text-gray-600">
                    <p className="mb-3 flex items-center gap-11">
                      <span className="text-sm">Giới tính</span>
                      <span className="text-sm text-black">Nam</span>
                    </p>
                    <p className="mb-3 flex items-center gap-[34px]">
                      <span className="text-sm">Ngày sinh</span>
                      <span className="text-sm text-black">
                        23 tháng 11, 2003
                      </span>
                    </p>
                    <p className="mb-3 flex items-center gap-7">
                      <span className="text-sm">Điện thoại</span>
                      <span className="text-sm text-black">
                        +84 903 252 508
                      </span>
                    </p>
                    <p className="my-2">
                      <span className="text-[13px]">
                        Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được
                        số này
                      </span>
                    </p>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="my-4">
                  <button className="flex h-full w-full items-center justify-center py-1 font-semibold transition-all hover:bg-black/10">
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
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

export default ProfileDialog
