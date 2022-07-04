import React from "react";
import { useGoogleLogout } from "react-google-login";
import "./LogoutHook.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOut } from '@fortawesome/free-solid-svg-icons'

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
      <FontAwesomeIcon icon={faSignOut} onClick={signOut} title="Logg ut" />      
    </div>
  );
};

export default LogoutHooks;
