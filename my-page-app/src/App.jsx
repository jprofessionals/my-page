import React, {useState, useEffect} from "react";
import "./App.scss";
import NavBar from "./components/navbar/NavBar";
import ApiService from "./services/api.service";
import {User} from "./User";
import BudgetContainer from "./components/budget/BudgetContainer";
import {ToastContainer, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jPro_logo_transparent from "./components/images/jPro_logo_transparent.svg";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import LoggedOut from "./LoggedOut";
import Bidra from "./components/bidra/Bidra";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(new User());
  const [loadUser, setLoadUser] = useState(false);

  const [scriptLoaded, setScriptLoaded] = useState(false);

  function handleGoogleSignIn(response) {
    if (response.credential) {
      localStorage.setItem("user_token", JSON.stringify({'id_token': response.credential}));
    }
    setIsAuthenticated(true);
  }

  useEffect(() => {
    if (scriptLoaded) return undefined;

    const initializeGoogle = () => {
      if (!window.google || scriptLoaded) return;

      setScriptLoaded(true);
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        auto_select: true,
        prompt_parent_id: "signInDiv",
        callback: handleGoogleSignIn,
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          window.google.accounts.id.renderButton(
            document.getElementById("signInDiv"),
            {
              type: "standard",
              theme: "outline",
              size: "medium",
              text: "continue_with",
              shape: "rectangular"
            }
          );
        }
      });
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = initializeGoogle;
    script.async = true;
    script.id = "google-client-script";
    document.querySelector("body")?.appendChild(script);

    return () => {
      window.google?.accounts.id.cancel();
      document.getElementById("google-client-script")?.remove();
    };
  }, [scriptLoaded]);

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
      <div className="vertical-center">
        <img className="logo" src={jPro_logo_transparent} alt="jPro"/>
        {/* <h2 className="headerText">Velkommen til Min side!</h2> */}
        <div id="signInDiv"></div>
        <div><ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          closeOnClick={true}
          pauseOnHover={true}
          draggable={true}
          progress={undefined}/>
        </div>
      </div>
    );
  } else {
    return (
      <BrowserRouter>
        <NavBar isAuthenticatedCallBack={setIsAuthenticated} user={user}/>
        <Routes>
          {["/", "/budsjett"].map((path, index) => {
            return (
              <Route path={path} element={
                <BudgetContainer loadUser={loadUser} user={user}/>
              }
                     key={index}
              />
            )
          })}
          <Route path="/bidra" element={<Bidra/>}/>
          <Route path="/logget-ut" element={<LoggedOut/>}/>
          <Route path="*"
                 element={
                   <main style={{padding: "1rem"}}>
                     <p>There's nothing here!</p>
                   </main>
                 }
          />

        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
