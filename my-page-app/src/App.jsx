import React, { useState, useEffect } from "react";
import "./App.scss";
import "./Common.scss";
import LoginHooks from "./components/login/LoginHooks";
import NavBar from "./components/navbar/NavBar";
import Home from "./components/home";
import ApiService from "./services/api.service";
import { User } from "./User";
import Budgets from "./components/budget/Budgets";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(new User());

  useEffect(() => {
    if (isAuthenticated) {
      ApiService.getUser().then(
        (response) => {
          setUser(
            new User(
              response.data.name,
              response.data.email,
              response.data.givenName,
              response.data.familyName,
              response.data.icon,
              response.data.startDate
            )
          );
        },
        (error) => {
          const _secureContent =
            (error.response && error.response.data) ||
            error.message ||
            error.toString();
          console.log(_secureContent);
        }
      );
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div>
        <LoginHooks isAuthenticatedCallBack={setIsAuthenticated} />
      </div>
    );
  } else {
    return (
      <div>
        <NavBar isAuthenticatedCallBack={setIsAuthenticated} user={user} />
        <Home user={user} />
        <Budgets></Budgets>
      </div>
    );
  }
}

export default App;
