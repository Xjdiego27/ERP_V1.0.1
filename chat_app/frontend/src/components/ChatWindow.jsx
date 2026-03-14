import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import io from 'socket.io-client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSmile, faBell, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import EmojiPicker from 'emoji-picker-react'

const EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '😍', '😱', '🎉', '😢', '💯', '✨', '🙏']
const STICKERS = ['👋', '🎮', '🍕', '🍰', '☕', '🎵']

export default function ChatWindow({ chat }) {
  const currentUser = useStore(s => s.currentUser)
  const token = useStore(s => s.token)
  const focusChat = useStore(s => s.focusChat)
  const closeChat = useStore(s => s.closeChat)
  const messages = useStore(s => s.messages)
  const addMessage = useStore(s => s.addMessage)

  const messagesEndRef = useRef()
  const [text, setText] = useState('')
  const [socket, setSocket] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io('http://localhost:8000/ws', {
      query: { token },
      reconnection: true
    })

    newSocket.on('connect', () => {
      console.log('Connected to chat:', chat.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('message', (msg) => {
      addMessage(msg.receiver_id || msg.sender_id, msg)
    })

    newSocket.on('buzz', (data) => {
      if (data.from === chat.id) {
        setShaking(true)
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==')
        audio.play().catch(() => {})
        setTimeout(() => setShaking(false), 1000)
      }
    })

    newSocket.on('error', (err) => {
      console.error('Socket error:', err)
    })

    setSocket(newSocket)

    return () => {
      newSocket.off('message')
      newSocket.off('buzz')
      newSocket.off('error')
      newSocket.close()
    }
  }, [token, chat.id])

  useEffect(() => {
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [messages[chat.id]])

  const handleSendMessage = (content, type = 'text') => {
    if (!content.trim() || !socket || !currentUser) return

    // Add message to UI immediately
    addMessage(chat.id, {
      sender_id: currentUser.id,
      receiver_id: chat.id,
      content: content,
      content_type: type,
      created_at: new Date().toISOString()
    })

    // Send to server
    socket.emit('send_message', {
      receiver_id: chat.id,
      content: content,
      content_type: type
    })

    setText('')
    setShowPicker(false)
  }

  const handleEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji
    handleSendMessage(emoji, 'sticker')
  }

  const handleBuzz = () => {
    if (!socket || !currentUser) return
    socket.emit('send_buzz', { receiver_id: chat.id }, (res) => {
      if (res?.status === 'error') {
        alert('Buzz en cooldown. Espera 10 segundos')
      }
    })
  }

  const chatMessages = messages[chat.id] || []

  return (
    <div
      className={`fb-chat-window ${shaking ? 'animate-shake' : ''}`}
      style={{ zIndex: chat.zIndex }}
      onMouseDown={() => focusChat(chat.id)}
    >
      <div className="fb-chat-header">
        <div className="fb-chat-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {chat.name}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#31a24c' : '#ccc'
            }}
            title={isConnected ? 'Connected' : 'Disconnected'}
          ></div>
        </div>
        <button
          className="fb-chat-close"
          onClick={() => closeChat(chat.id)}
          title="Close"
        >
          ×
        </button>
      </div>

      <div className="fb-chat-messages">
        {chatMessages.length === 0 ? (
          <div style={{ padding: '10px', fontSize: '12px', color: '#999' }}>
            No messages yet. Start chatting!
          </div>
        ) : (
          chatMessages.map((m, i) => (
            <div
              key={i}
              className={`fb-message ${m.sender_id === currentUser?.id ? 'sent' : 'received'}`}
            >
              {m.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showPicker && (
        <div style={{ borderTop: '1px solid #2a2a2a', background: '#1a1a1a' }}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            height={300}
            width="100%"
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
          />
        </div>
      )}

      <div className="fb-chat-input">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage(text, 'text')
            }
          }}
          placeholder="Aa"
        />
        <button onClick={() => setShowPicker(!showPicker)} title="Emojis y Stickers" className="fb-chat-icon-btn">
          <FontAwesomeIcon icon={faSmile} />
        </button>
        <button onClick={handleBuzz} title="Zumbido" className="fb-chat-icon-btn">
          <FontAwesomeIcon icon={faBell} />
        </button>
        <button onClick={() => handleSendMessage(text, 'text')} className="fb-chat-send-btn" title="Enviar">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  )
}



