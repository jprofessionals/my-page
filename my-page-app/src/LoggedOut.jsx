import './App.scss'
import jPro_logo_transparent from './components/images/jPro_logo_transparent.svg'

function LoggedOut() {
  return (
    <div className="vertical-center">
      <a href="/">
        <img className="logo" src={jPro_logo_transparent} alt="jPro" />
      </a>
      <h2 className="headerText">Du er nå logget ut</h2>
    </div>
  )
}

export default LoggedOut
