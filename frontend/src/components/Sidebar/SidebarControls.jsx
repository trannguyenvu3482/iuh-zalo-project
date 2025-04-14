import { Link, useLocation } from 'react-router-dom'
import businessIcon from '../../assets/icons/business-btn.png'
import chatIcon from '../../assets/icons/chat-btn.png'
import cloudIcon from '../../assets/icons/cloud-btn.png'
import contactsIcon from '../../assets/icons/contacts-btn.png'
import settingsIcon from '../../assets/icons/settings-btn.png'
import todoIcon from '../../assets/icons/todo-btn.png'
import zCloudIcon from '../../assets/icons/zcloud-btn.png'
import { Avatar } from '../index'

const TOP_TAB_BUTTONS = [
  { name: 'Chats', icon: chatIcon, link: '/', active: true },
  { name: 'Contacts', icon: contactsIcon, link: '/contacts', active: true },
  { name: 'To-Do', icon: todoIcon, link: '/todo', active: false },
]

const BOTTOM_TAB_BUTTONS = [
  { name: 'Cloud', icon: cloudIcon, link: '/cloud', active: false },
  { name: 'Business', icon: businessIcon, link: '/business', active: false },
  { name: 'Settings', icon: settingsIcon, link: '/settings', active: false },
]

const SidebarControls = () => {
  const location = useLocation()

  return (
    <div className="controls flex h-full min-w-[64px] select-none flex-col items-center justify-between bg-primary-blue">
      {/* TOP TABS */}
      <div>
        <div className="pt-8">
          <Avatar />
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2">
          {TOP_TAB_BUTTONS.map((button, index) => (
            <Link to={button.link} key={index}>
              <button
                className={`flex flex-col items-center justify-center rounded-md p-3 hover:bg-blue-800 ${
                  location.pathname === button.link ? 'bg-blue-800' : ''
                }`}
              >
                <img
                  className="box-content flex h-[25px] w-[25px] items-center justify-center object-contain"
                  src={button.icon}
                  alt=""
                />
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* BOTTOM TABS */}
      <div className="pb-3">
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="border-b pb-1">
            <Link to="/zcloud">
              <button className="flex flex-col items-center justify-center rounded-md p-3 hover:bg-blue-800">
                <img
                  className="box-content flex h-[25px] w-[25px] items-center justify-center object-contain"
                  src={zCloudIcon}
                  alt=""
                />
              </button>
            </Link>
          </div>

          {BOTTOM_TAB_BUTTONS.map((button, index) => (
            <Link to={button.link} key={index}>
              <button
                className={`flex flex-col items-center justify-center rounded-md p-3 hover:bg-blue-800 ${
                  location.pathname === button.link ? 'bg-blue-800' : ''
                }`}
              >
                <img
                  className="box-content flex h-[25px] w-[25px] items-center justify-center object-contain"
                  src={button.icon}
                  alt=""
                />
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SidebarControls
