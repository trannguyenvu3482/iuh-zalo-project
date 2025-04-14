import PropTypes from 'prop-types'

const ProfileForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  handleCancel,
  isSubmitting,
  isFormChanged,
  days,
  months,
  years,
}) => {
  return (
    <div className="p-5">
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">Tên hiển thị</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="mb-5">
        <h3 className="mb-3 text-sm font-medium">Thông tin cá nhân</h3>

        <div className="mb-4">
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === 'male'}
                onChange={handleInputChange}
                className="mr-2 h-4 w-4 accent-blue-500"
              />
              <span>Nam</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === 'female'}
                onChange={handleInputChange}
                className="mr-2 h-4 w-4 accent-blue-500"
              />
              <span>Nữ</span>
            </label>
          </div>
        </div>

        <div className="pb-24">
          <p className="mb-2 text-sm">Ngày sinh</p>
          <div className="flex gap-2">
            <select
              name="birthDay"
              value={formData.birthDay}
              onChange={handleInputChange}
              className="w-1/3 rounded-md border border-gray-300 p-2 text-sm"
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select
              name="birthMonth"
              value={formData.birthMonth}
              onChange={handleInputChange}
              className="w-1/3 rounded-md border border-gray-300 p-2 text-sm"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              name="birthYear"
              value={formData.birthYear}
              onChange={handleInputChange}
              className="w-1/3 rounded-md border border-gray-300 p-2 text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3 border-t pt-4">
        <button
          onClick={handleCancel}
          className="rounded-[4px] bg-gray-200 px-4 py-2 text-center font-medium hover:bg-gray-300"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormChanged}
          className={`rounded-[4px] bg-blue-500 px-4 py-2 text-center font-medium text-white hover:bg-blue-600 ${
            isSubmitting || !isFormChanged
              ? 'cursor-not-allowed opacity-50'
              : ''
          }`}
        >
          {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
        </button>
      </div>
    </div>
  )
}

ProfileForm.propTypes = {
  formData: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  isFormChanged: PropTypes.bool.isRequired,
  days: PropTypes.array.isRequired,
  months: PropTypes.array.isRequired,
  years: PropTypes.array.isRequired,
}

export default ProfileForm
