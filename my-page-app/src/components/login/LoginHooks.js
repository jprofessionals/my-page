import React, { useEffect, useState } from "react";
import { useGoogleLogin } from "react-google-login";

// refresh token
import { refreshTokenSetup } from "../../utils/refreshToken";
import LogoutHooks from "./LogoutHooks";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function LoginHooks() {
  const onSuccess = (res) => {
    console.log("Login Success: currentUser:", res.profileObj);
    console.log("Login Success: token:", res.tokenObj);
    alert(
      `Logged in successfully welcome ${res.profileObj.name} 😍. \n See console for full profile object.`
    );

    if (res.tokenObj) {
      localStorage.setItem("user_token", JSON.stringify(res.tokenObj));
      setIsLoggedIn(true);
    }

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
    isSignedIn: true,
    accessType: "offline",
    // responseType: 'code',
    // prompt: 'consent',
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("user_token") != null) {
      setIsLoggedIn(false);
      console.log(isLoggedIn);
    } else {
      setIsLoggedIn(false);
      console.log(isLoggedIn);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <button onClick={signIn} className="button">
        <span className="buttonText">Sign in with Google</span>
      </button>
    );
  } else {
    return <LogoutHooks />;
  }

  //   return (
  //     <button onClick={signIn} className="button">
  //       <span className="buttonText">Sign in with Google</span>
  //     </button>
  //   );
}

export default LoginHooks;
