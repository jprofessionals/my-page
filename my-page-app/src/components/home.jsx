import React, { useState, useEffect } from "react";
import ApiService from "../services/api.service";
const Home = () => {
  const [content, setContent] = useState("");
  const [secureContent, setSecureContent] = useState("");
  useEffect(() => {
    ApiService.getTestApi().then(
      (response) => {
        setSecureContent(response.data);
      },
      (error) => {
        const _secureContent =
          (error.response && error.response.data) ||
          error.message ||
          error.toString();
          setSecureContent(_secureContent);
      }
    );

    ApiService.getTestApiOpen().then(
      (response) => {
        setContent(response.data);
      },
      (error) => {
        const _content =
          (error.response && error.response.data) ||
          error.message ||
          error.toString();
        setContent(_content);
      }
    );
  }, []);
  return (
    <div className="container">
      <header className="jumbotron">
        <h3>{content}</h3>
        <h3>{secureContent}</h3>
      </header>
    </div>
  );
};
export default Home;