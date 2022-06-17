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
      <svg
        onClick={signOut}
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        fill="currentColor"
        className="bi bi-door-closed"
        viewBox="0 0 16 16"
      >
        <path d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V2zm1 13h8V2H4v13z" />
        <path d="M9 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
      </svg>
    </div>
  );
};

export default LogoutHooks;
