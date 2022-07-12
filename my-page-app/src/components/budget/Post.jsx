import React, { useState } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import Moment from "moment";
import DeleteBudgetPostModal from "./DeleteBudgetPostModal";

const Post = ({ refreshBudgets, post, budgetId }) => {
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const postInFuture = () => {
    return post.date > Moment().format("YYYY-MM-DD");
  };

  const toggler = () => {
    if (isDeleteModalOpen) {
      setIsDeleteModalOpen(false);
    } else {
      setIsDeleteModalOpen(true);
    }
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
        <div style={!post.locked ? {} : { display: "none" }}>
          <Button
            className="removePostBtn btn"
            type="btn"
            title="Slett post"
            onClick={toggler}
          >
            <DeleteBudgetPostModal
              isDeleteModalOpen={isDeleteModalOpen}
              toggler={toggler}
              refreshBudgets={refreshBudgets}
              post={post}
              budgetId={budgetId}
              setIsLoadingPost={setIsLoadingPost}
            />
            <div className="d-flex align-items-center">
              Slett post
              <div style={isLoadingPost ? {} : { display: "none" }}>
                <Spinner animation="border" style={{ marginLeft: 15 }} />
              </div>
            </div>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Post;
