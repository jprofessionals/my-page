import React from "react";
import { Card } from "react-bootstrap";

const Post = (props) => {
  return (
    <Card border="dark">
      <Card.Header>
        <b>{props.post.description}</b>
      </Card.Header>
      <Card.Body>
        <Card.Text>
          <b>Pris:</b> {props.post.amount}
        </Card.Text>
        <Card.Text>
          <b>Dato:</b> {props.post.date}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Post;
