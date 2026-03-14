import create from 'zustand'

// Default token for alice user (set token so we don't show login)
const DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFsaWNlIiwiZXhwIjoxNzczNDU4MTMzfQ.cxZYNwUnnNA3loPkfyrF03k2uHR4vrQdDxbeffGsxQo'

export const useStore = create(set => ({
  // Auth
  token: localStorage.getItem('token') || DEFAULT_TOKEN,
  currentUser: null,
  
  // Contacts/Friends
  contacts: [],
  allUsers: [],
  
  // Chat
  openChats: [],
  nextZ: 100,
  messages: {}, // {userId: [messages]}
  
  // Posts/Feed
  feed: [],
  
  // UI
  showLogin: false,
  
  // Auth actions
  setToken: (token) => set({
    token,
    showLogin: !token
  }),
  
  setCurrentUser: (user) => set({currentUser: user}),
  
  logout: () => {
    localStorage.removeItem('token')
    set({
      token: null,
      currentUser: null,
      showLogin: true,
      contacts: [],
      openChats: [],
      messages: {},
      feed: []
    })
  },
  
  // Contact actions
  setContacts: (contacts) => set({contacts}),
  setAllUsers: (users) => set({allUsers: users}),
  
  // Chat actions
  openChat: (chat) => set(state => {
    const exists = state.openChats.some(c => c.id === chat.id)
    if (exists) return {openChats: state.openChats}
    return {
      openChats: [...state.openChats, {...chat, zIndex: state.nextZ}],
      nextZ: state.nextZ + 1
    }
  }),
  
  focusChat: (id) => set(state => ({
    openChats: state.openChats.map(c =>
      c.id === id ? {...c, zIndex: state.nextZ} : c
    ),
    nextZ: state.nextZ + 1
  })),
  
  closeChat: (id) => set(state => ({
    openChats: state.openChats.filter(c => c.id !== id)
  })),
  
  addMessage: (userId, message) => set(state => ({
    messages: {
      ...state.messages,
      [userId]: [...(state.messages[userId] || []), message]
    }
  })),
  
  setMessages: (userId, messages) => set(state => ({
    messages: {
      ...state.messages,
      [userId]: messages
    }
  })),
  
  // Feed actions
  setFeed: (feed) => set({feed}),
  
  addPost: (post) => set(state => ({
    feed: [post, ...state.feed]
  }))
}))

