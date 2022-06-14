import React, { Component, useEffect, useRef, useState } from "react";
import { useGoogleLogin } from "react-google-login";

// refresh token
import { refreshTokenSetup } from "../../utils/refreshToken";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const LoginHooks = (props) => {
  const onSuccess = (res) => {
    console.log("Login Success: currentUser:", res.profileObj);
    console.log("Login Success: token:", res.tokenObj);

    alert(
      `Logged in successfully welcome ${res.profileObj.name} 😍. \n See console for full profile object.`
    );

    if (res.tokenObj) {
      localStorage.setItem("user_token", JSON.stringify(res.tokenObj));
    }
    props.authentication();

    //refreshTokenSetup(res);
  };

  const onFailure = (res) => {
    console.log("Login failed: res:", res);
    alert(
      `Failed to login. 😢 Please ping this to repo owner twitter.com/sivanesh_fiz`
    );
  };

  const { signIn } = useGoogleLogin({
    onSuccess,
    onFailure,
    clientId,
    isSignedIn: false,
    accessType: "offline",
    // responseType: 'code',
    // prompt: 'consent',
  });

  return (
    <div>
      <button onClick={signIn} className="button">
        <span className="buttonText">Sign in with Google</span>
      </button>
    </div>
  );
};

export default LoginHooks;
