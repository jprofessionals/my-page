import React from "react";

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      {/* <a className="navbar-brand" href="#">
        Navbar
      </a> */}
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNavDropdown"
        aria-controls="navbarNavDropdown"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNavDropdown">
        <ul className="navbar-nav">
          <li className="nav-item active">
            <a className="nav-link" href="#">
              Hjem
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Min profil
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Mine utlegg
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
