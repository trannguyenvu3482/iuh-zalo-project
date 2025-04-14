import PropTypes from 'prop-types'

const ProfileInfo = ({ user, isCurrentUser, formatDate }) => {
  return (
    <div className="mt-2 px-4">
      <h3 className="font-semibold">Thông tin cá nhân</h3>
      <div className="mt-3 text-gray-600">
        <p className="mb-3 flex items-center gap-11">
          <span className="text-sm">Giới tính</span>
          <span className="text-sm text-black">
            {user.gender ? (user.gender === 'male' ? 'Nam' : 'Nữ') : 'Not set'}
          </span>
        </p>
        <p className="mb-3 flex items-center gap-[34px]">
          <span className="text-sm">Ngày sinh</span>
          <span className="text-sm text-black">
            {user.birthdate ? formatDate(user.birthdate) : 'Not set'}
          </span>
        </p>
        {isCurrentUser && (
          <>
            <p className="mb-3 flex items-center gap-8">
              <span className="text-sm">Điện thoại</span>
              <span className="text-sm text-black">
                {user.phoneNumber || 'Not set'}
              </span>
            </p>
            <p className="my-2">
              <span className="text-[13px]">
                Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

ProfileInfo.propTypes = {
  user: PropTypes.object.isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  formatDate: PropTypes.func.isRequired,
}

export default ProfileInfo
