import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getAllConversations } from '../api/apiMessage'
import ChatWindow from '../components/ChatWindow'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'

const Chats = () => {
  const { id: conversationId } = useParams()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const isFriend = location.state?.isFriend
  const user = location.state?.user

  // Check for authentication
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated])

  // Fetch all conversations
  const {
    data: conversationsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: getAllConversations,
    staleTime: 60000, // 1 minute
    retry: 1, // Only retry once on failure
    enabled: isAuthenticated,
  })

  // Extract conversations from the response
  const conversations = useMemo(
    () => conversationsResponse?.data || [],
    [conversationsResponse?.data],
  )

  // Debug log for incoming user data
  useEffect(() => {
    if (user) {
      console.log('User data for new conversation:', user)
    }
  }, [user])

  // Update selected conversation when conversationId changes or newUserData is provided
  useEffect(() => {
    console.log('Conversation ID:', conversationId)
    console.log('User data from location:', user)
    console.log('Is friend:', isFriend)
    console.log('All conversations:', conversations)

    if (conversationId && conversations.length > 0) {
      // Case 1: We have a conversationId and it exists in our conversations
      const conversation = conversations.find(
        (conv) => conv.id === conversationId,
      )
      if (conversation) {
        console.log('Found existing conversation:', conversation)
        setSelectedConversation(conversation)
        return
      }

      // Case 2: We have a conversationId but no matching conversation,
      // and we also have user data from navigation state
      if (user) {
        console.log(
          'Conversation ID not found but user data available. Creating new conversation.',
        )
        createNewConversationFromUser(user)
        return
      }
    }

    // Case 3: We have user data from navigation state (creating a new conversation)
    if (user && !conversationId) {
      console.log(
        'No conversation ID, but user data available. Creating new conversation.',
      )
      createNewConversationFromUser(user)
      return
    }

    // Case 4: We have a conversationId but it doesn't exist in our conversations yet
    if (conversationId && conversations.length > 0) {
      console.log('Conversation ID not found in loaded conversations')
      setSelectedConversation({
        id: conversationId,
        messages: [],
        isLoading: true,
      })
      return
    }

    // Default case: No conversation selected
    setSelectedConversation(null)
  }, [conversationId, conversations, user, isFriend])

  // Helper function to create a new conversation object from user data
  const createNewConversationFromUser = (userData) => {
    // Ensure user object matches expected format in ChatWindow
    const formattedUser = {
      id: userData.id,
      userId: userData.id, // Some components might expect userId instead of id
      fullName:
        userData.fullName ||
        userData.name ||
        userData.username ||
        'Unknown User',
      avatar:
        userData.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || 'User')}&background=random`,
      status: userData.status || 'active',
      phoneNumber: userData.phoneNumber || userData.phone || null,
    }

    // Create a properly formatted conversation object that matches what the ChatWindow expects
    const newConversation = {
      id: null, // No ID yet since it's a new conversation
      user: formattedUser, // The user we're chatting with
      members: [formattedUser], // Members excluding current user
      type: 'PRIVATE',
      messages: [], // Start with empty messages
      isNew: true, // Flag to indicate new conversation
      name: formattedUser.fullName, // For display in header
      avatar: formattedUser.avatar, // For display in header
      lastMessage: null, // No messages yet
    }

    console.log('Created new conversation object:', newConversation)
    setSelectedConversation(newConversation)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">
          Failed to load conversations. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="h-screen w-full">
      {selectedConversation ? (
        <ChatWindow conversation={selectedConversation} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-gray-50">
          <img
            src="https://avatar.iran.liara.run/public/48"
            alt="Select a conversation"
            className="h-32 w-32 opacity-30"
          />
          <p className="mt-6 text-xl font-light text-gray-500">
            Select a conversation to start chatting
          </p>
        </div>
      )}
    </div>
  )
}

export default Chats
