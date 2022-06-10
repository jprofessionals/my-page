import React from "react";
import "./App.css";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import Home from "./components/home";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "./components/navbar/NavBar";

function App() {
  return (
    <div className="App">
      <NavBar />
      <LoginHooks />
      <LogoutHooks />
      <Home />
    </div>
  );
}

export default App;
