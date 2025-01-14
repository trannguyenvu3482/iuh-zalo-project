import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../zustand/userStore'
const ChatsTest = () => {
  const { logout } = useUserStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase.from('messages').select('*')

      if (error) {
        console.log(error)
      }

      console.log('>> Messages: ', data)
      setMessages(data)
    }

    fetchMessages()
  }, [])

  // Realtime listener
  useEffect(() => {
    const channel = supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Change received: ', payload)
          setMessages([...messages, payload.new])
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('messages')
      .insert([
        { text: inputMessage, send_by: '0e014799-8643-4b1f-b9dc-4635e43b48d8' },
      ])

    if (error) {
      console.log(error)
    }

    setInputMessage('')
  }

  return (
    <div className="max-h-screen w-full overflow-auto">
      <div className="mx-auto flex h-full w-full flex-col bg-blue-300">
        <h1 className="text-center text-2xl font-bold">Chats</h1>

        <ul className="">
          {messages.map((message) => (
            <li
              className="mt-2 w-fit rounded-md bg-gray-300 px-4 py-2 font-bold text-blue-500"
              key={message.id}
            >
              {message.text}
            </li>
          ))}
        </ul>

        <form>
          <input
            type="text"
            id="UserEmail"
            placeholder="Enter your message"
            className="mt-1 h-full rounded-md border-gray-200 p-2 shadow-sm sm:text-sm"
            onChange={(e) => setInputMessage(e.target.value)}
            value={inputMessage}
          />

          <button
            type="submit"
            onClick={handleSendMessage}
            className="inline-block rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatsTest
