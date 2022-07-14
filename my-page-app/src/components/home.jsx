import React from "react";

function Home({ user }) {
  return (
    <div style={{ marginTop: 20, marginLeft: -5 }} className="container">
      <header className="jumbotron">
        <h3>Hei, {user.givenName}</h3>
        <p>E-post: {user.email}</p>
        <p style={user.startDate ? {} : { display: "none" }}>
          Startdato: {user.startDate}
        </p>
      </header>
    </div>
  );
}

export default Home;
