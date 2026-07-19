import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Image, MapPin, Search, MoreVertical, Phone, Video,
  ChevronLeft, Paperclip, Smile, Check, CheckCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../components/ui/Toast'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { EmptyMessageState } from '../components/ui/EmptyState'
import client from '../api/client'

const ChatPage = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const {
    conversations, activeChat, setActiveChat, messages, typing,
    onlineUsers, fetchConversations, fetchMessages, sendMessage,
    startTyping, stopTyping, markSeen
  } = useChat()
  const toast = useToast()
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id)
      markSeen(activeChat._id, messages.filter(m => !m.seen && m.senderId !== user?._id).map(m => m._id))
    }
  }, [activeChat?._id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!messageText.trim() || !activeChat) return
    setSending(true)
    try {
      sendMessage(activeChat._id, messageText.trim())
      setMessageText('')
      stopTyping(activeChat._id)
    } catch {
      toast.error('Error', 'Message नहीं भेजी जा सकी')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (e) => {
    setMessageText(e.target.value)
    if (activeChat) {
      startTyping(activeChat._id)
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeChat._id)
      }, 2000)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleShareLocation = async () => {
    if (!navigator.geolocation || !activeChat) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        sendMessage(activeChat._id, `📍 Location: https://maps.google.com/?q=${latitude},${longitude}`, 'location')
      },
      () => toast.error('Error', 'Location share नहीं हो सकी')
    )
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true
    const participant = c.participants?.find((p) => p._id !== user?._id)
    return participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getParticipant = (conv) => {
    return conv.participants?.find((p) => p._id !== user?._id) || {}
  }

  const isOnline = (userId) => onlineUsers.includes(userId)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 md:h-[calc(100vh-4rem)]">
      {/* Sidebar - Conversations List */}
      <div className={`w-full border-r border-slate-200 dark:border-slate-800 md:w-80 lg:w-96 ${activeChat ? 'hidden md:flex' : 'flex'} flex-col`}>
        <div className="p-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('chat.messages', 'Messages')}
          </h2>
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('chat.search', 'Search conversations...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 py-2.5"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <EmptyMessageState />
          ) : (
            filteredConversations.map((conv) => {
              const participant = getParticipant(conv)
              const online = isOnline(participant._id)
              const isActive = activeChat?._id === conv._id

              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveChat(conv)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Avatar src={participant.photo} alt={participant.name} size="md" status={online ? 'available' : 'offline'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {participant.name || 'Unknown'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-slate-400">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex flex-1 flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <button
                onClick={() => setActiveChat(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Avatar
                src={getParticipant(activeChat).photo}
                alt={getParticipant(activeChat).name}
                size="sm"
                status={isOnline(getParticipant(activeChat)._id) ? 'available' : 'offline'}
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {getParticipant(activeChat).name}
                </p>
                {typing[activeChat._id] ? (
                  <p className="text-xs text-brand-500">typing...</p>
                ) : (
                  <p className="text-xs text-slate-400">
                    {isOnline(getParticipant(activeChat)._id) ? 'Online' : 'Offline'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Video className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?._id
                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isMine
                            ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-md'
                        }`}
                      >
                        {msg.type === 'location' ? (
                          <a href={msg.content} target="_blank" rel="noopener" className="flex items-center gap-2 underline">
                            <MapPin className="h-4 w-4" /> Location Shared
                          </a>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                        <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMine && (
                            msg.seen ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex items-end gap-2">
                <button
                  onClick={handleShareLocation}
                  className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-800"
                >
                  <MapPin className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={messageText}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat.typeMessage', 'Type a message...')}
                    rows={1}
                    className="input-field resize-none py-2.5"
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim()}
                  loading={sending}
                  size="icon"
                  icon={Send}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyMessageState />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
