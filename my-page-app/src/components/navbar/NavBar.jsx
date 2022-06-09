import React from "react";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./NavBar.scss";
import jPro_logo_transparent from "../images/jPro_logo_transparent.svg";

export default function NavBar() {
  return (
    <Navbar className="navbar" collapseOnSelect expand="sm" variant="dark">
      <Navbar.Brand href="#home">
        <img src={jPro_logo_transparent} alt="jPro" />
      </Navbar.Brand>
      <Navbar.Toggle className="button" aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse className="navtext" id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="/hjem">Hjem</Nav.Link>
          <Nav.Link href="/min_side">Min side</Nav.Link>
          <Nav.Link href="/mine_utlegg">Mine utlegg</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}
