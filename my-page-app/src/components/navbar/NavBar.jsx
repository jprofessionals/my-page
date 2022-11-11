import { Nav, Navbar } from "react-bootstrap";
import "./NavBar.scss";
import jPro_logo_transparent from "../images/jPro_logo_transparent.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import RequireAdmin from "../../utils/RequireAdmin";

const NavBar = ({ logout, user }) => {

  return (
    <Navbar className="navbar" collapseOnSelect expand="sm" variant="dark">
      <Navbar.Brand href="/" title="min side">
        <img className="logo" src={jPro_logo_transparent} alt="jPro" />
      </Navbar.Brand>
      <Navbar.Toggle className="button" aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse className="navtext" id="responsive-navbar-nav">
        <Nav className="container-fluid">
          <Link className="nav-link" to="/budsjett">Budsjett</Link>
          <Link className="nav-link" to="/bidra">Bidra til Min side</Link>
          <RequireAdmin user={user}>
            <Link className="nav-link" to="/admin">Admin</Link>
          </RequireAdmin>
          <Nav.Link as="a" href="https://intranet.jpro.no">
            Intranett
          </Nav.Link>
          <Nav.Link className="ms-auto" style={!user.loaded ? {display: "none"} : {}}>
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
            <img className="icon" src={user.icon} alt="Icon"></img>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};
export default NavBar;
