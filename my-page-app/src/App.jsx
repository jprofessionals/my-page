import React, { useState } from "react";
import "./App.css";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "./components/navbar/NavBar";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setAuthentication = () => {
    setIsAuthenticated(true);
  };

  const removeAuthentication = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div>
        <LoginHooks authentication={setAuthentication} />
      </div>
    );
  } else {
    return (
      <div>
        <NavBar />
        <LogoutHooks authentication={removeAuthentication} />
      </div>
    );
  }
}

export default App;
