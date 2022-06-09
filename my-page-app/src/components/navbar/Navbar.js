import React from "react";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Router, Link } from "react-router-dom";

export default function NavBar() {
  const mql = window.matchMedia("(max-width: 575px)");

  let mobileView = mql.matches;

  return (
    <Navbar className="navbar" collapseOnSelect expand="sm" variant="dark">
      <Navbar.Brand href="#home">jPro</Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
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
