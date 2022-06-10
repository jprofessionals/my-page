import React, { useEffect, useState } from "react";
import "./App.css";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import Home from "./components/home";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "./components/navbar/NavBar";

function App() {
  const [isLoggedIn, checkLoggedIn] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("user_token") != null) {
      // checkLoggedIn(true);
      console.log(isLoggedIn);
    } else {
      // checkLoggedIn(false);
      console.log(isLoggedIn);
    }
  }, [isLoggedIn]);
  // console.log(isLoggedIn);
  return (
    <div className="App">
      <NavBar />
      {isLoggedIn ? (
        <LogoutHooks onclick={() => checkLoggedIn(false)} />
      ) : (
        <LoginHooks onclick={() => checkLoggedIn(true)} />
      )}
      <Home />
    </div>
  );
}

export default App;
