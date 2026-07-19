import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import client from '../api/client'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user, token } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user || !token) return

    const socket = io(import.meta.env.PROD
      ? 'https://rozwork.onrender.com'
      : 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('user:online', { userId: user._id })
    })

    socket.on('users:online', (users) => {
      setOnlineUsers(users)
    })

    socket.on('message:new', (message) => {
      setMessages((prev) => [...prev, message])
      setConversations((prev) =>
        prev.map((c) =>
          c._id === message.conversationId
            ? { ...c, lastMessage: message, unreadCount: (c.unreadCount || 0) + 1 }
            : c
        )
      )
    })

    socket.on('typing:start', ({ userId, conversationId }) => {
      setTyping((prev) => ({ ...prev, [conversationId]: userId }))
    })

    socket.on('typing:stop', ({ conversationId }) => {
      setTyping((prev) => {
        const next = { ...prev }
        delete next[conversationId]
        return next
      })
    })

    socket.on('message:seen', ({ messageIds, conversationId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id) ? { ...m, seen: true } : m
        )
      )
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, token])

  const fetchConversations = useCallback(async () => {
    try {
      const res = await client.get('/chat/conversations')
      setConversations(res.data.conversations || res.data || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }, [])

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const res = await client.get(`/chat/messages/${conversationId}`)
      setMessages(res.data.messages || res.data || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }, [])

  const sendMessage = useCallback((conversationId, content, type = 'text') => {
    if (!socketRef.current) return
    socketRef.current.emit('message:send', {
      conversationId,
      senderId: user._id,
      content,
      type,
    })
  }, [user])

  const startTyping = useCallback((conversationId) => {
    if (!socketRef.current) return
    socketRef.current.emit('typing:start', {
      conversationId,
      userId: user._id,
    })
  }, [user])

  const stopTyping = useCallback((conversationId) => {
    if (!socketRef.current) return
    socketRef.current.emit('typing:stop', {
      conversationId,
      userId: user._id,
    })
  }, [user])

  const markSeen = useCallback((conversationId, messageIds) => {
    if (!socketRef.current) return
    socketRef.current.emit('message:seen', {
      conversationId,
      messageIds,
      userId: user._id,
    })
  }, [user])

  const createConversation = useCallback(async (participantId) => {
    try {
      const res = await client.post('/chat/conversations', { participantId })
      const conv = res.data.conversation || res.data
      setConversations((prev) => {
        if (prev.find((c) => c._id === conv._id)) return prev
        return [conv, ...prev]
      })
      return conv
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }, [])

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeChat,
        setActiveChat,
        messages,
        typing,
        onlineUsers,
        fetchConversations,
        fetchMessages,
        sendMessage,
        startTyping,
        stopTyping,
        markSeen,
        createConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
