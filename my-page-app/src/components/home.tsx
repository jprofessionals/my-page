import React from 'react'
import Moment from 'moment'
import { useAuthContext } from '@/providers/AuthProvider'

function Home() {
  const { user } = useAuthContext()
  return (
    <div style={{ marginTop: 20, marginLeft: -5 }} className="container">
      <header className="jumbotron">
        <h3>Hei, {user?.givenName}</h3>
        <p>E-post: {user?.email}</p>
        <p style={user?.startDate ? {} : { display: 'none' }}>
          Startdato: {Moment(user?.startDate).format('DD.MM.YYYY')}
        </p>
      </header>
    </div>
  )
}

export default Home
