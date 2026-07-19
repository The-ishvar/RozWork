import { Conversation, Message } from '../models/Chat.js'
import { User } from '../models/index.js'

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'name photo profession availability')
      .sort({ updatedAt: -1 })
      .lean()

    res.json({ conversations })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message })
  }
}

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name photo')
      .sort({ createdAt: 1 })
      .lean()

    await Message.updateMany(
      { conversationId, senderId: { $ne: req.user.id }, seen: false },
      { seen: true, seenAt: new Date() }
    )

    res.json({ messages })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message })
  }
}

export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body
    const userId = req.user.id

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    }).populate('participants', 'name photo profession availability')

    if (conversation) {
      return res.json({ conversation })
    }

    conversation = await Conversation.create({
      participants: [userId, participantId],
    })

    conversation = await conversation.populate('participants', 'name photo profession availability')
    res.status(201).json({ conversation })
  } catch (error) {
    res.status(500).json({ message: 'Failed to create conversation', error: error.message })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body
    const senderId = req.user.id

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      type,
    })

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: { content, senderId, type, createdAt: new Date() },
      $inc: { unreadCount: 1 },
      updatedAt: new Date(),
    })

    const populated = await message.populate('senderId', 'name photo')
    res.status(201).json({ message: populated })
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message })
  }
}

export const markSeen = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, seen: false },
      { seen: true, seenAt: new Date() }
    )

    await Conversation.findByIdAndUpdate(conversationId, { unreadCount: 0 })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark seen', error: error.message })
  }
}
