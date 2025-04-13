import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import PropTypes from 'prop-types'
import { FaExclamationTriangle } from 'react-icons/fa'

const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message }) => {
  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-[999999]">
      <DialogBackdrop className="fixed inset-0 bg-black/60" />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-yellow-600">
              <FaExclamationTriangle className="h-6 w-6" />
              <h3 className="text-lg font-medium">{title}</h3>
            </div>

            <div className="mt-4">
              <p className="text-gray-600">{message}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={onCancel}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={onConfirm}
              >
                Xác nhận
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
}

ConfirmDialog.defaultProps = {
  title: 'Xác nhận',
  message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
}

export default ConfirmDialog
