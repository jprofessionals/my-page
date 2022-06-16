import React from "react";
import { useGoogleLogout } from "react-google-login";
import "./LogoutHook.scss";
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const LogoutHooks = (props) => {
  const onLogoutSuccess = (res) => {
    localStorage.removeItem("user_token");
    console.log("Logged out Success");
    props.isAuthenticatedCallBack(true);
  };

  const onFailure = () => {
    console.log("Handle failure cases");
  };

  const { signOut } = useGoogleLogout({
    clientId,
    onLogoutSuccess,
    onFailure,
  });

  return (
    <div>
      <button onClick={signOut} className="btn btn-primary btn-sm">
        <span className="buttonText">Logg ut</span>
      </button>
    </div>
  );
};

export default LogoutHooks;
