import React from "react";
import "./App.css";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import Navbar from "./components/navbar/Navbar";
import Home from "./components/home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hjem from "./components/navbar/Hjem";

function App() {
  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" exact component={Hjem} />
        </Routes>
      </Router>
      <LoginHooks />
      <LogoutHooks />

      <Home />
    </div>
  );
}

export default App;
