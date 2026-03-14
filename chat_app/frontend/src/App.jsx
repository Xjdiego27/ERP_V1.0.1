import React, { useEffect } from 'react'
import { useStore } from './store'
import ContactList from './components/ContactList'
import ChatWindow from './components/ChatWindow'

export default function App() {
  const token = useStore(s => s.token)
  const showLogin = useStore(s => s.showLogin)
  const currentUser = useStore(s => s.currentUser)
  const openChats = useStore(s => s.openChats)
  const setCurrentUser = useStore(s => s.setCurrentUser)
  const setToken = useStore(s => s.setToken)
  const logout = useStore(s => s.logout)

  useEffect(() => {
    // Load current user on mount
    if (token && !currentUser) {
      fetchCurrentUser()
    }
  }, [token])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        // Token invalid, clear it
        logout()
        return
      }
      const user = await res.json()
      setCurrentUser(user)
    } catch (err) {
      console.error('Error loading user:', err)
      logout()
    }
  }

  if (showLogin || !token) {
    // Set default token automatically
    const DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFsaWNlIiwiZXhwIjoxNzczNDU4MTMzfQ.cxZYNwUnnNA3loPkfyrF03k2uHR4vrQdDxbeffGsxQo'
    setToken(DEFAULT_TOKEN)
    return null
  }

  if (!currentUser) {
    return <div className="fb-loading"><div className="fb-spinner"></div></div>
  }

  return (
    <div className="fb-app">
      {/* Header */}
      <div className="fb-header">
        <div className="fb-header-content">
          <div className="fb-logo">facebook</div>
          <div className="fb-search">
            <input type="text" placeholder="🔍 Search" />
          </div>
          <div className="fb-user-menu">
            <span className="fb-user-name">
              {currentUser.full_name || currentUser.username}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="fb-container">
        {/* Main Content */}
        <div className="fb-main" style={{ flex: 1 }}>
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            Select a friend to start chatting
          </div>
        </div>

        {/* Chat Windows - Horizontal */}
        <div className="fb-chat-container">
          {openChats.map((chat, idx) => (
            <ChatWindow key={chat.id} chat={{...chat}} />
          ))}
        </div>

        {/* Friends List - Right */}
        <div className="fb-friends-sidebar">
          <ContactList />
        </div>
      </div>
    </div>
  )
}

