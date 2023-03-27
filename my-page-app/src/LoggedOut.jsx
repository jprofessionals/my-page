import './App.scss'
import jPro_logo_transparent from './components/images/jPro_logo_transparent.svg'
import Link from 'next/link'

function LoggedOut() {
  return (
    <div className="vertical-center">
      <Link href="/">
        <img className="logo" src={jPro_logo_transparent} alt="jPro" />
      </Link>
      <h2 className="headerText">Du er nå logget ut</h2>
    </div>
  )
}

export default LoggedOut
