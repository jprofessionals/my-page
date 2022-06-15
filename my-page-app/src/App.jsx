import React, { useState } from "react";
import "./App.scss";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "./components/navbar/NavBar";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setAuthentication = (auth) => {
    setIsAuthenticated(auth);
  };



  if (!isAuthenticated) {
    return (
      <div>
        <LoginHooks isAuthenticatedCallBack={setAuthentication} />
      </div>
    );
  } else {
    return (
      <div>
        <NavBar />
        <LogoutHooks isAuthenticatedCallBack={setAuthentication} />
      </div>
    );
  }
}

export default App;
