import React, { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function ContactList() {
  const token = useStore(s => s.token)
  const currentUser = useStore(s => s.currentUser)
  const contacts = useStore(s => s.contacts)
  const setContacts = useStore(s => s.setContacts)
  const openChat = useStore(s => s.openChat)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      setLoading(true)
      fetchContacts()
    } else {
      setLoading(false)
    }
  }, [token, setContacts])

  const fetchContacts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        console.error('Failed to load contacts:', res.status)
        setContacts([])
      } else {
        const data = await res.json()
        setContacts(data)
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = (contact) => {
    openChat({
      id: contact.id,
      name: contact.full_name || contact.username,
      avatar: contact.avatar
    })
  }

  return (
    <div className="fb-sidebar">
      <div className="fb-sidebar-box">
        <div className="fb-sidebar-title">Todos los amigos</div>
        <ul className="fb-sidebar-list">
          {loading ? (
            <li style={{ padding: '10px' }}>Cargando...</li>
          ) : contacts.length === 0 ? (
            <li style={{ padding: '10px', fontSize: '12px', color: '#9a9a9a' }}>
              No hay amigos
            </li>
          ) : (
            contacts.map(contact => {
              // Simular conexión aleatoria para demostración
              const isOnline = Math.random() > 0.3
              return (
                <li
                  key={contact.id}
                  className="fb-sidebar-item"
                >
                  <div
                    className="fb-sidebar-link"
                    onClick={() => handleStartChat(contact)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                      <img
                        src={contact.avatar || 'https://via.placeholder.com/36'}
                        alt={contact.username}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                      <div 
                        className={`fb-online-indicator ${isOnline ? 'online' : 'offline'}`} 
                        style={{ bottom: '-2px', right: '-2px', position: 'absolute' }}
                      ></div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {contact.full_name || contact.username}
                      </div>
                      <div style={{ fontSize: '12px', color: isOnline ? '#31a24c' : '#9a9a9a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isOnline ? 'En línea' : 'Desconectado'}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}

