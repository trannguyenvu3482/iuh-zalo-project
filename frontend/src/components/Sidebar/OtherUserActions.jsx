import PropTypes from 'prop-types'
import { BsBan } from 'react-icons/bs'
import { CiWarning } from 'react-icons/ci'
import { RiGroupLine, RiIdCardLine } from 'react-icons/ri'

const OtherUserActions = ({ isCurrentUser }) => {
  if (isCurrentUser) return null

  return (
    <div>
      <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
        <RiGroupLine className="mr-3 h-5 w-5 text-gray-500" />
        Nhóm chung {`(0)`}
      </button>

      <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
        <RiIdCardLine className="mr-3 h-5 w-5 text-gray-500" />
        Chia sẻ danh thiếp
      </button>

      <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
        <BsBan className="mr-3 h-5 w-5 text-gray-500" />
        Chặn tin nhắn và cuộc gọi
      </button>

      <button className="flex w-full items-center px-4 py-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
        <CiWarning className="mr-3 h-5 w-5 text-gray-500" />
        Báo xấu
      </button>
    </div>
  )
}

OtherUserActions.propTypes = {
  isCurrentUser: PropTypes.bool.isRequired,
}

export default OtherUserActions
