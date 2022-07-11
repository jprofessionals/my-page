import React from "react";
import { Card } from "react-bootstrap";
import Moment from "moment";

const Post = ({ post }) => {
  const postInFuture = () => {
    return post.date > Moment().format("YYYY-MM-DD");
  };

  return (
    <Card border={postInFuture() ? "grey" : "dark"}>
      <Card.Header>
        <b>{post.description}</b>
      </Card.Header>
      <Card.Body>
        <Card.Text>
          <b>Pris:</b> {post.amount}
        </Card.Text>
        <Card.Text>
          <b>Dato:</b> {post.date}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Post;
