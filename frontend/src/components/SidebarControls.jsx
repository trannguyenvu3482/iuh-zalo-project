import React from 'react'
import { useLocation } from 'react-router-dom'
import businessIcon from '../assets/icons/business-btn.png'
import chatIcon from '../assets/icons/chat-btn.png'
import cloudIcon from '../assets/icons/cloud-btn.png'
import contactsIcon from '../assets/icons/contacts-btn.png'
import settingsIcon from '../assets/icons/settings-btn.png'
import todoIcon from '../assets/icons/todo-btn.png'
import zCloudIcon from '../assets/icons/zcloud-btn.png'

const TOP_TAB_BUTTONS = [
  { name: 'Chats', icon: chatIcon, link: '/', active: true },
  { name: 'Contacts', icon: contactsIcon, link: '/contacts', active: false },
  { name: 'To-Do', icon: todoIcon, link: '/todo', active: false },
]

const BOTTOM_TAB_BUTTONS = [
  { name: 'Cloud', icon: cloudIcon, link: '/cloud', active: false },
  { name: 'Business', icon: businessIcon, link: '/business', active: false },
  { name: 'Settings', icon: settingsIcon, link: '/settings', active: false },
]
const SidebarControls = () => {
  const location = useLocation()

  console.log(location.pathname)

  return (
    <div className="controls flex h-full min-w-[64px] select-none flex-col items-center justify-between bg-primary-blue">
      {/* TOP TABS */}
      <div>
        <div className="pt-8">
          <img
            className="h-[48px] w-[48px] rounded-full border border-gray-100"
            src="https://s120-ava-talk.zadn.vn/b/a/c/2/7/120/e67b9b28aa1641d0fb5241e27aee9087.jpg"
            alt=""
          />
        </div>

        {/* Button groups */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2">
          {TOP_TAB_BUTTONS.map((button, index) => (
            <button
              key={index}
              className={`flex flex-col items-center justify-center rounded-md p-3 hover:bg-blue-800 ${
                location.pathname === button.link ? 'bg-blue-800' : ''
              }`}
            >
              <div>
                <img
                  className="box-content flex h-[25px] w-[25px] items-center justify-center object-contain"
                  src={button.icon}
                  alt=""
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM TABS */}
      <div className="pb-3">
        <div className="flex flex-col items-center justify-center gap-1.5">
          {/* Zcloud */}
          <div className="border-b pb-1">
            <button
              className={`flex flex-col items-center justify-center rounded-md p-3 hover:bg-blue-800`}
            >
              <div>
                <img
                  className="box-content flex h-[25px] w-[25px] items-center justify-center object-contain"
                  src={zCloudIcon}
                  alt=""
                />
              </div>
            </button>
          </div>

          {BOTTOM_TAB_BUTTONS.map((button, index) => (
            <button
              key={index}
              className={`flex flex-col items-center justify-center rounded-md p-3 hover:bg-blue-800 ${
                location.pathname === button.link ? 'bg-blue-800' : ''
              }`}
            >
              <div>
                <img
                  className="box-content flex h-[25px] w-[25px] items-center justify-center object-contain"
                  src={button.icon}
                  alt=""
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SidebarControls
