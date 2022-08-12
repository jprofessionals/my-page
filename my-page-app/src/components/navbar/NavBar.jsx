import React, { useEffect, useState } from "react";
import { Nav, Navbar } from "react-bootstrap";
import "./NavBar.scss";
import jPro_logo_transparent from "../images/jPro_logo_transparent.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ user, isAuthenticatedCallBack }) => {
  const [isLogoutSuccess, setIsLogoutSuccess] = useState(false);

  useEffect(() => {
    if (isLogoutSuccess) {
      isAuthenticatedCallBack(false);
    }
  }, [isLogoutSuccess]);

  // function handleSigout() {
  //   localStorage.removeItem("user_token");
  //   console.log("Logged out Success");
  //   isAuthenticatedCallBack(false);
  //   window.location.href = "/logged-out";
  // }

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
            <FontAwesomeIcon icon={faSignOut} 
            // onClick={handleSigout} 
            title="Logg ut" />
          </Nav.Link>
          <Nav.Link className="smallNav">
            <FontAwesomeIcon icon={faSignOut} 
            // onClick={handleSigout} 
            title="Logg ut" />
          </Nav.Link>
          <Nav.Item>
            <img className="icon" src={user.icon} alt="Icon"></img>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};
export default NavBar;
