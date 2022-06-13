import React, { Component, useEffect, useRef, useState } from "react";
import { useGoogleLogin } from "react-google-login";
import { setIsAuthenticated } from "../../App";

// refresh token
import { refreshTokenSetup } from "../../utils/refreshToken";
import LogoutHooks from "./LogoutHooks";
import Authentication from "./Authentication";
import App from "../../App";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function LoginHooks(props) {
  //   const [isAuthenticated, setIsAuthenticated] = useState();
  //   const authentication = {
  //     isAuthenticated: false,
  //     onAuthentication() {
  //       this.isAuthenticated = true;
  //     },
  //     onNotAuthentication() {
  //       this.isAuthenticated = false;
  //     },
  //     getAuthenticationStatus() {
  //       return this.isAuthenticated;
  //     },
  //   };

  //   const authenticationStatus = () => {
  //     return isAuthenticated;
  //   };
  const getTokens = () => {};

  const onSuccess = (res, state) => {
    console.log("Login Success: currentUser:", res.profileObj);
    console.log("Login Success: token:", res.tokenObj);
    // console.log(isAuthenticated);

    alert(
      `Logged in successfully welcome ${res.profileObj.name} 😍. \n See console for full profile object.`
    );

    if (res.tokenObj) {
      localStorage.setItem("user_token", JSON.stringify(res.tokenObj));
      //   App.setIsAuthenticated();
      //   setIsAuthenticated(true);
      //   //   authentication.onAuthentication();
      //   console.log(isAuthenticated);
      //   const authenticationObj = new Authentication(true);
      //   console.log(authenticationObj);
    }

    //refreshTokenSetup(res);
  };

  const onFailure = (res) => {
    console.log("Login failed: res:", res);
    alert(
      `Failed to login. 😢 Please ping this to repo owner twitter.com/sivanesh_fiz`
    );

    // setIsAuthenticated(false);
  };

  const { signIn } = useGoogleLogin({
    onSuccess,
    onFailure,
    clientId,
    isSignedIn: true,
    accessType: "offline",
    // responseType: 'code',
    // prompt: 'consent',
  });

  const loggedIn = () => {
    console.log("clicked");
    if (localStorage.getItem("user_token") != null) {
      const isAuthenicated = true;
    }
  };

  const handleClick = () => {
    console.log(this.props);
    console.log("Callback");
  };

  return (
    <div>
      <button onClick={signIn} className="button">
        <span className="buttonText">Sign in with Google</span>
      </button>
      <button onClick={handleClick} className="button2">
        Ny knapp
      </button>
    </div>
  );
}

export default LoginHooks;
