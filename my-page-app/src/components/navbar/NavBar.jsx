import React, { useState } from "react";
import { Nav, Navbar } from "react-bootstrap";
import "./NavBar.scss";
import jPro_logo_transparent from "../images/jPro_logo_transparent.svg";
import LogoutHooks from "../login/LogoutHooks";

const NavBar = (props) => {
  const [isLogoutSuccess, setIsLogoutSuccess] = useState(false);
  if (isLogoutSuccess) {
    props.isAuthenticatedCallBack(false);
  }
  return (
    <Navbar className="navbar" collapseOnSelect expand="sm" variant="dark">
      <Navbar.Brand href="/">
        <img src={jPro_logo_transparent} alt="jPro" />
      </Navbar.Brand>
      <Navbar.Toggle className="button" aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse className="navtext" id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="/">Min side</Nav.Link>
          <Nav.Link as="a" href="https://intranet.jpro.no" target="_blank">
            Intranett
          </Nav.Link>
          <LogoutHooks isAuthenticatedCallBack={setIsLogoutSuccess} />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};
export default NavBar;
