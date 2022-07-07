import React, { useEffect, useState } from "react";
import { Nav, Navbar } from "react-bootstrap";
import "./NavBar.scss";
import jPro_logo_transparent from "../images/jPro_logo_transparent.svg";
import LogoutHooks from "../login/LogoutHooks";

const NavBar = (props) => {
  const [isLogoutSuccess, setIsLogoutSuccess] = useState(false);

  useEffect(() => {
    if (isLogoutSuccess) {
      props.isAuthenticatedCallBack(false);
    }
  }, [isLogoutSuccess]);

  return (
    <Navbar className="navbar" collapseOnSelect expand="sm" variant="dark">
      <Navbar.Brand href="/" title="min side">
        <img className="logo" src={jPro_logo_transparent} alt="jPro" />
      </Navbar.Brand>
      <Navbar.Toggle className="button" aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse className="navtext" id="responsive-navbar-nav">
        <Nav className="container-fluid">
          <Nav.Link href="/">Min side</Nav.Link>
          <Nav.Link as="a" href="https://intranet.jpro.no">
            Intranett
          </Nav.Link>
          <Nav.Link className="ms-auto">
            <LogoutHooks isAuthenticatedCallBack={setIsLogoutSuccess} />
          </Nav.Link>
          <Nav.Link className="smallNav">
            <LogoutHooks isAuthenticatedCallBack={setIsLogoutSuccess} />
          </Nav.Link>
          <Nav.Item>
            <img className="icon" src={props.user.icon} alt="Icon"></img>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};
export default NavBar;
