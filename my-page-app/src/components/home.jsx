import React from "react";

function Home(props) {
  return (
    <div className="container">
      <header className="jumbotron">
        <h3>Hei, {props.user.givenName}</h3>
        <h3>Din mail er: {props.user.email}</h3>
      </header>
    </div>
  );
}

export default Home;
