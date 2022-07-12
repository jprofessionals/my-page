import React, { useState, useEffect } from "react";
import "./App.scss";
import LoginHooks from "./components/login/LoginHooks";
import NavBar from "./components/navbar/NavBar";
import Home from "./components/home";
import ApiService from "./services/api.service";
import { User } from "./User";
import Budgets from "./components/budget/Budgets";
import { Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(new User());
  const [loadUser, setLoadUser] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadUser(true);
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
          setLoadUser(false);
        },
        (error) => {
          const _secureContent =
            (error.response && error.response.data) ||
            error.message ||
            error.toString();
          toast.error("Får ikke lastet inn bruker, prøv igjen senere");
          setLoadUser(false);
        }
      );
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div>
        <LoginHooks isAuthenticatedCallBack={setIsAuthenticated} />
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          closeOnClick={true}
          pauseOnHover={true}
          draggable={true}
          progress={undefined}
        />
      </div>
    );
  } else {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          closeOnClick={true}
          pauseOnHover={true}
          draggable={true}
          progress={undefined}
          theme="colored"
        />
        <div style={loadUser ? {} : { display: "none" }}>
          <div className="loadSpinUser d-flex align-items-center">
            <Spinner animation="border" />
            <h3>Laster inn bruker</h3>
          </div>
        </div>
        <div style={loadUser ? { display: "none" } : {}}>
          <NavBar isAuthenticatedCallBack={setIsAuthenticated} user={user} />
          <Home user={user} />
          <Budgets></Budgets>
        </div>
      </>
    );
  }
}

export default App;
