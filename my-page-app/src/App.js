import React from "react";
import "./App.css";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import Navbar from "./components/navbar/Navbar";
import Home from "./components/home";
import Hjem from "./components/navbar/Hjem";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="App">
      <Navbar />
      <LoginHooks />
      <LogoutHooks />

      <Home />
    </div>
  );
}

export default App;
