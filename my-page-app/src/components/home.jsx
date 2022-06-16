import React, { useState, useEffect } from "react";
import ApiService from "../services/api.service";
const Home = () => {
  const [welcomeString, setWelcomeString] = useState("");
  const [mailString, setMailString] = useState("");
  useEffect(() => {
    ApiService.getUser().then(
      (response) => {
        setWelcomeString("Hei, " + response.data.name);
        setMailString("Din mail er: " + response.data.email);
      },
      (error) => {
        const _secureContent =
          (error.response && error.response.data) ||
          error.message ||
          error.toString();
        setWelcomeString(_secureContent);
      }
    );
  }, []);
  return (
    <div className="container">
      <header className="jumbotron">
        <h3>{welcomeString}</h3>
        <h3>{mailString}</h3>
      </header>
    </div>
  );
};
export default Home;
