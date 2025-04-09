import PropTypes from 'prop-types'
import ChatWindow from './chat/window'

// Export the refactored ChatWindow component directly
export default ChatWindow

ChatWindow.propTypes = {
  conversation: PropTypes.object,
}
