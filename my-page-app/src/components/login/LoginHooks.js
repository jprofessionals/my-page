import React from "react";
import { useGoogleLogin } from "react-google-login";
import "./LoginHook.scss";
// refresh token
import jPro_logo_transparent from "../images/jPro_logo_transparent.svg";
import { refreshTokenSetup } from "../../utils/refreshToken";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const LoginHooks = ({ isAuthenticatedCallBack }) => {
  const onSuccess = (res) => {
    console.log("Login Success: currentUser:", res.profileObj);
    console.log("Login Success: token:", res.tokenObj);

    if (res.tokenObj) {
      localStorage.setItem("user_token", JSON.stringify(res.tokenObj));
    }
    isAuthenticatedCallBack(true);

    //refreshTokenSetup(res);
  };

  const onFailure = (res) => {
    console.log("Login failed: res:", res);
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

  return (
    <div className="vertical-center">
      <img className="logo" src={jPro_logo_transparent} alt="jPro" />
      <h2 className="headerText">Velkommen til Min side!</h2>
      <button className="btn btn-primary btn-lg loginBtn" onClick={signIn}>
        <span className="buttonText">Logg inn med Google</span>
      </button>
    </div>
  );
};

export default LoginHooks;
