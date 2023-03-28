import { Nav, Navbar } from 'react-bootstrap'
import styles from './NavBar.module.scss'
import jPro_logo_transparent from '../images/jPro_logo_transparent.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOut } from '@fortawesome/free-solid-svg-icons'
import RequireAdmin from '../../utils/RequireAdmin'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthContext } from '@/providers/AuthProvider'

const NavBar = () => {
  const { user } = useAuthContext()
  const logout = () => true
  return (
    <Navbar
      className={`${styles.navbar} navbar`}
      collapseOnSelect
      expand="sm"
      variant="dark"
    >
      <Link href="/">
        <Navbar.Brand title="min side">
          <Image
            className={`${styles.logo} logo`}
            src={jPro_logo_transparent}
            alt="jPro"
          />
        </Navbar.Brand>
      </Link>
      <Navbar.Toggle className="button" aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse
        className={`${styles.navtext} navtext`}
        id="responsive-navbar-nav"
      >
        <Nav className={`${styles.containerFluid} container-fluid`}>
          <Link className={`${styles.navLink} nav-link`} href="/budsjett">
            Budsjett
          </Link>
          <Link className={`${styles.navLink} nav-link`} href="/kalkulator">
            Lønnskalkulator
          </Link>
          <Link className={`${styles.navLink} nav-link`} href="/bidra">
            Bidra til Min side
          </Link>
          <RequireAdmin>
            <Link className={`${styles.navLink} nav-link`} href="/admin">
              Admin
            </Link>
          </RequireAdmin>
          <Nav.Link
            className={`${styles.navLink}`}
            as="a"
            href="https://intranet.jpro.no"
          >
            Intranett
          </Nav.Link>

          {user ? (
            <>
              <Nav.Link className={`${styles.navLink} ms-auto`}>
                <FontAwesomeIcon
                  icon={faSignOut}
                  onClick={() => {
                    logout()
                  }}
                  title="Logg ut"
                />
              </Nav.Link>
              <Nav.Link className="smallNav">
                <FontAwesomeIcon
                  icon={faSignOut}
                  onClick={() => {
                    logout()
                  }}
                  title="Logg ut"
                />
              </Nav.Link>
              <Nav.Item>
                <Image
                  className={`${styles.icon} icon`}
                  src={user.icon}
                  alt="Icon"
                  width="40"
                  height="40"
                ></Image>
              </Nav.Item>
            </>
          ) : null}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}
export default NavBar
