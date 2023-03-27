import { Nav, Navbar } from "react-bootstrap";
import styles from "./NavBar.module.scss"
import jPro_logo_transparent from "../images/jPro_logo_transparent.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import RequireAdmin from "../../utils/RequireAdmin";
import Link from "next/link";
import Image from "next/image";
import {useAuthContext} from "@/context/auth";

const NavBar = ({ logout }) => {

  const [isAuthenticated, setIsAuthenticated, user, setUser] = useAuthContext();

  return (
    <Navbar className={`${styles.navbar} navbar`} collapseOnSelect expand="sm" variant="dark">
      <Navbar.Brand href="/" title="min side">
        <Image className={`${styles.logo} logo`} src={jPro_logo_transparent} alt="jPro" />
      </Navbar.Brand>
      <Navbar.Toggle className="button" aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse className={`${styles.navtext} navtext`} id="responsive-navbar-nav">
        <Nav className={`${styles.containerFluid} container-fluid`}>
          <Link className={`${styles.navLink} nav-link`} href="/budsjett">Budsjett</Link>
          <Link className={`${styles.navLink} nav-link`} href="/kalkulator">Lønnskalkulator</Link>
          <Link className={`${styles.navLink} nav-link`} href="/bidra">Bidra til Min side</Link>
          <RequireAdmin user={user}>
            <Link className={`${styles.navLink} nav-link`} href="/admin">Admin</Link>
          </RequireAdmin>
          <Nav.Link className={`${styles.navLink}`} as="a" href="https://intranet.jpro.no">
            Intranett
          </Nav.Link>
          <Nav.Link className={`${styles.navLink} ms-auto`} style={!user.loaded ? {display: "none"} : {}}>
            <FontAwesomeIcon icon={faSignOut}
                             onClick={() => {
                               logout();
                             }}
                             title="Logg ut" />
          </Nav.Link>
          <Nav.Link className="smallNav" style={!user.loaded ? {display: "none"} : {}}>
            <FontAwesomeIcon icon={faSignOut}
                             onClick={() => {
                               logout();
                             }}
                             title="Logg ut" />
          </Nav.Link>
          <Nav.Item style={!user.loaded ? {display: "none"} : {}}>
            <img className={`${styles.icon} icon`} src={user.icon} alt="Icon"></img>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};
export default NavBar;