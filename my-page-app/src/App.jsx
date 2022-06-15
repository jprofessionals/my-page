import React, { useState } from "react";
import "./App.scss";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import NavBar from "./components/navbar/NavBar";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div>
        <LoginHooks isAuthenticatedCallBack={setIsAuthenticated} />
      </div>
    );
  } else {
    return (
      <div>
        <NavBar />
        <LogoutHooks isAuthenticatedCallBack={setIsAuthenticated} />
      </div>
    );
  }
}

export default App;
