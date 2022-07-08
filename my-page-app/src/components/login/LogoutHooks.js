import React from "react";
import { useGoogleLogout } from "react-google-login";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const LogoutHooks = (props) => {
  const onLogoutSuccess = (res) => {
    localStorage.removeItem("user_token");
    console.log("Logged out Success");
    props.isAuthenticatedCallBack(true);
  };

  const onFailure = () => {
    toast.error("Utlogging feilet", {
      position: "top-left",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    toast("Utlogging feilet");
    // console.log("Handle failure cases");
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
