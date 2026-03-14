import React, { useState } from 'react'
import { useStore } from '../store'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    confirm_password: ''
  })

  const setToken = useStore(s => s.setToken)
  const setCurrentUser = useStore(s => s.setCurrentUser)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // Login
        const res = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Login failed')
        
        localStorage.setItem('token', data.access_token)
        setToken(data.access_token)

        // Get user info
        const meRes = await fetch('http://localhost:8000/api/me', {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        })
        const user = await meRes.json()
        setCurrentUser(user)
        
      } else {
        // Register
        if (formData.password !== formData.confirm_password) {
          throw new Error('Passwords do not match')
        }
        
        const res = await fetch('http://localhost:8000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Registration failed')
        
        localStorage.setItem('token', data.access_token)
        setToken(data.access_token)

        // Get user info
        const meRes = await fetch('http://localhost:8000/api/me', {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        })
        const user = await meRes.json()
        setCurrentUser(user)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fb-login-page">
      <div className="fb-login-left">
        <h1>facebook</h1>
        <p>
          Connect with friends and the world around you on Facebook.
        </p>
      </div>

      <div className="fb-login-right">
        <div className="fb-login-box">
          <div className="fb-login-tabs">
            <div
              className={`fb-login-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </div>
            <div
              className={`fb-login-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </div>
          </div>

          {error && <div className="fb-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isLogin ? (
              <>
                <div className="fb-form-group">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="fb-form-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="fb-form-group">
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="fb-form-group">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="fb-form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="fb-form-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="fb-form-group">
                  <input
                    type="password"
                    name="confirm_password"
                    placeholder="Confirm Password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="fb-login-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="fb-signup-link">
            {isLogin ? (
              <>
                Don't have an account? <span onClick={() => setIsLogin(false)}>Sign up</span>
              </>
            ) : (
              <>
                Already have an account? <span onClick={() => setIsLogin(true)}>Log in</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
