import React, { useState } from 'react'
import NavBar from '../navbar/NavBar'
import { User } from '@/User'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(new User())
  return (
    <>
      <NavBar logout={logout} user={user} />
    </>
  )

  function logout() {
    setUser(new User())
    setIsAuthenticated(false)
    localStorage.removeItem('user_token')
  }
}
export default App
