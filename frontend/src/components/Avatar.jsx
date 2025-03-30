import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useState } from 'react'
import { FiExternalLink } from 'react-icons/fi'
import ProfileDialog from './Sidebar/ProfileDialog.jsx'

const Avatar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="text-right">
      <ProfileDialog isOpen={isOpen} close={() => setIsOpen(false)} />
      <Menu>
        <MenuButton className="inline-flex items-center gap-2 text-sm/6 font-semibold text-white focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white">
          <img
            className="h-[48px] w-[48px] rounded-full border border-gray-100"
            src="https://s120-ava-talk.zadn.vn/b/a/c/2/7/120/e67b9b28aa1641d0fb5241e27aee9087.jpg"
            alt=""
          />
        </MenuButton>

        <MenuItems
          transition
          anchor="right"
          className="ml-2 mt-8 w-[300px] origin-top-right rounded-lg border border-white/5 bg-white py-1 text-sm/6 shadow-lg duration-100 ease-out [--anchor-gap:var(--spacing-1)] *:transition focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <MenuItem>
            <button className="group mx-3 flex w-[calc(100%-24px)] items-center gap-2 border-b-2 border-gray-300 px-1 py-1 text-lg font-semibold data-[focus]:bg-white/10">
              Vũ Trần
            </button>
          </MenuItem>
          <MenuItem className="mt-1">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://business.zbox.vn/nang-cap-business-pro"
              className="group flex w-full items-center justify-between gap-2 px-3 py-1.5 data-[focus]:bg-gray-200"
            >
              <span>Nâng cấp tài khoản</span>
              <FiExternalLink className="text-lg" />
            </a>
          </MenuItem>
          <MenuItem className="mt-1">
            <button
              onClick={() => setIsOpen(true)}
              className="group flex w-full items-center gap-2 px-3 py-1.5 data-[focus]:bg-gray-200"
            >
              Hồ sơ của bạn
            </button>
          </MenuItem>
          <MenuItem className="mt-1">
            <button className="group flex w-full items-center gap-2 px-3 py-1.5 data-[focus]:bg-gray-200">
              Cài đặt
            </button>
          </MenuItem>
          <div className="mx-2 border-b border-gray-300"></div>
          <MenuItem className="mt-1">
            <button className="group flex w-full items-center gap-2 px-3 py-1.5 data-[focus]:bg-gray-200">
              Đăng xuất
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  )
}

export default Avatar
