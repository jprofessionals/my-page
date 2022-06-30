import React from "react";

function Home(props) {
  return (
    <div style = {{marginTop:20, marginLeft:-5}} className="container">
      <header className="jumbotron">
        <h3>Hei, {props.user.givenName}</h3>
        <p>E-post: {props.user.email}</p>
        <p>Startdato: {props.user.startDate}</p>
      </header>
    </div>
  );
}

export default Home;
