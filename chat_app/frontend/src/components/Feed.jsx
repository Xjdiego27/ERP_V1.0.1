import React, { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function Feed() {
  const token = useStore(s => s.token)
  const feed = useStore(s => s.feed)
  const setFeed = useStore(s => s.setFeed)
  const currentUser = useStore(s => s.currentUser)
  const [loading, setLoading] = useState(true)
  const [postContent, setPostContent] = useState('')

  useEffect(() => {
    if (token) {
      fetchFeed()
    }
  }, [token, setFeed])

  const fetchFeed = async () => {
    if (!token) return
    try {
      const res = await fetch('http://localhost:8000/api/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        console.error('Failed to load feed:', res.status)
        setLoading(false)
        return
      }
      const data = await res.json()
      setFeed(data)
    } catch (err) {
      console.error('Error loading feed:', err)
      setFeed([])
    } finally {
      setLoading(false)
    }
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault()
    if (!postContent.trim()) return

    try {
      // In production, create actual post endpoint
      setPostContent('')
      // Refresh feed
      await fetchFeed()
    } catch (err) {
      console.error('Error creating post:', err)
    }
  }

  return (
    <div>
      {/* Status update box */}
      {currentUser && (
        <div className="fb-status-box">
          <img
            src={currentUser.avatar}
            alt="Your avatar"
            className="fb-avatar"
          />
          <input
            type="text"
            className="fb-status-input"
            placeholder={`What's on your mind, ${currentUser.full_name || currentUser.username}?`}
            onClick={() => alert('Post feature coming soon!')}
          />
        </div>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="fb-loading">
          <div className="fb-spinner"></div>
        </div>
      ) : feed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#65676b' }}>
          No posts yet. Start connecting with friends!
        </div>
      ) : (
        feed.map(post => (
          <div key={post.id} className="fb-post">
            <div className="fb-post-header">
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="fb-avatar"
              />
              <div className="fb-post-author">
                <div className="fb-post-author-name">
                  {post.author.full_name || post.author.username}
                </div>
                <div className="fb-post-time">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="fb-post-content">
              {post.content}
            </div>
            <div className="fb-post-actions">
              <div className="fb-post-action">👍 Like</div>
              <div className="fb-post-action">💬 Comment</div>
              <div className="fb-post-action">→ Share</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
