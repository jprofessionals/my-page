import {User} from "../User";
import ApiService from "../services/api.service";
import {toast} from "react-toastify";

function RequireAuth({ isAuthenticated, setAuthenticated, user, setUser, children }) {
  if (!isAuthenticated || !user.loaded) {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    document.querySelector("body")?.appendChild(script);
    script.addEventListener('load', () => {
      authenticate();
    })
    return <div id="signInDiv"></div>;
  } else {
    return children;
  }

  function authenticate(setAuthenticated) {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      auto_select: true,
      prompt_parent_id: "signInDiv",
      callback: handleGoogleSignIn
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
  }

  function handleGoogleSignIn(response) {
    if (response.credential) {
      localStorage.setItem("user_token", JSON.stringify({'id_token': response.credential}));
      ApiService.getUser().then(
        (response) => {
          setUser(
            new User(
              response.data.name,
              response.data.email,
              response.data.givenName,
              response.data.familyName,
              response.data.icon,
              response.data.startDate,
              true
            )
          );
          setAuthenticated(true);
        },
        () => {
          toast.error("Får ikke lastet inn bruker, prøv igjen senere");
        }
      )
    }
  }
}

export default RequireAuth;