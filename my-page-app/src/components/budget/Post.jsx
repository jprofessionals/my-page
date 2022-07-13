import React, { useState } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import Moment from "moment";
import DeleteBudgetPostModal from "./DeleteBudgetPostModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

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
      <div className="postHeader">
        <Card.Header>
            <b>{post.description}</b>
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
                setIsLoadingPost={setIsLoadingPost}
              />
              <div title="Logg ut">
                <div style={isLoadingPost ? { display: "none" } : {}}>
                  <FontAwesomeIcon icon={faTrash} />
                </div>
                <div style={isLoadingPost ? {} : { display: "none" }}>
                  <Spinner animation="border" size="sm" />
                </div>
              </div>
            </Button>
        </Card.Header>
      </div>
      <Card.Body>
        <Card.Text>
          <b>Pris:</b> {post.amount}
        </Card.Text>
        <Card.Text>
          <b>Dato:</b> {post.date}
        </Card.Text>
        <div style={!post.locked ? {} : { display: "none" }}></div>
      </Card.Body>
    </Card>
  );
};

export default Post;
