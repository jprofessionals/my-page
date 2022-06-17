import React, { useState } from "react";
import "./App.scss";
import LoginHooks from "./components/login/LoginHooks";
import NavBar from "./components/navbar/NavBar";
import Home from "./components/home";

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
        <NavBar isAuthenticatedCallBack={setIsAuthenticated} />
        <Home />
      </div>
    );
  }
}

export default App;
