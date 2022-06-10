import React, { useEffect, useState } from "react";
import { useGoogleLogout } from "react-google-login";
import LoginHooks from "./LoginHooks";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function LogoutHooks() {
  const onLogoutSuccess = (res) => {
    localStorage.removeItem("user_token");
    console.log("Logged out Success");
    alert("Logged out Successfully ✌");
    setIsLoggedIn(false);
  };

  const onFailure = () => {
    console.log("Handle failure cases");
  };

  const { signOut } = useGoogleLogout({
    clientId,
    onLogoutSuccess,
    onFailure,
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("user_token") != null) {
      setIsLoggedIn(true);
      console.log(isLoggedIn);
    } else {
      setIsLoggedIn(false);
      console.log(isLoggedIn);
    }
  }, [isLoggedIn]);

  if (isLoggedIn) {
    return (
      <button onClick={signOut} className="button">
        <span className="buttonText">Sign out</span>
      </button>
    );
  } else {
    return <LoginHooks />;
  }

  //   return (
  //     <button onClick={signOut} className="button">
  //       <span className="buttonText">Sign out</span>
  //     </button>
  //   );
}

export default LogoutHooks;
