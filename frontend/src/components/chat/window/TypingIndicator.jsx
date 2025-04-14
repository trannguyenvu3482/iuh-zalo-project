import PropTypes from 'prop-types'

const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null

  const displayText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].fullName || 'Someone'} is typing...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].fullName || 'Someone'} and ${
        typingUsers[1].fullName || 'someone else'
      } are typing...`
    } else {
      return `${typingUsers.length} people are typing...`
    }
  }

  return (
    <div className="my-2 flex animate-pulse items-center">
      <div className="mr-2 flex space-x-1">
        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
      </div>
      <span className="text-xs text-gray-500">{displayText()}</span>
    </div>
  )
}

TypingIndicator.propTypes = {
  typingUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      fullName: PropTypes.string,
    }),
  ),
}

export default TypingIndicator

export const formatTypingUsers = (typingUsers) => {
  if (!typingUsers || typingUsers.length === 0) return ''
  if (typingUsers.length === 1) {
    return `${typingUsers[0].fullName || 'Someone'} is typing...`
  } else if (typingUsers.length === 2) {
    return `${typingUsers[0].fullName || 'Someone'} and ${
      typingUsers[1].fullName || 'someone else'
    } are typing...`
  } else {
    return `${typingUsers.length} people are typing...`
  }
}
