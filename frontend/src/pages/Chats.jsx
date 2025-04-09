import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAllConversations } from '../api/apiMessage'
import ChatWindow from '../components/ChatWindow'
import LoadingSpinner from '../components/LoadingSpinner'

const Chats = () => {
  const { id: conversationId } = useParams()
  const [selectedConversation, setSelectedConversation] = useState(null)

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
  })

  // Extract conversations from the response
  const conversations = useMemo(
    () => conversationsResponse?.data || [],
    [conversationsResponse?.data],
  )

  // Update selected conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) => conv.id === conversationId,
      )
      setSelectedConversation(conversation)
    } else {
      setSelectedConversation(null)
    }
  }, [conversationId, conversations])

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
