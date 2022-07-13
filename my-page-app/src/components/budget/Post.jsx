import React, { useState } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import Moment from "moment";
import DeleteBudgetPostModal from "./DeleteBudgetPostModal";
import EditBudgetPost from "./EditBudgetPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

const Post = ({ refreshBudgets, post, budget }) => {
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);

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

  const togglerEdit = () => {
    if (isEditPostOpen) {
      console.log("hei");
      setIsEditPostOpen(false);
    } else {
      console.log("hei");
      setIsEditPostOpen(true);
    }
  };
  return (
    <div className="post">
      <Card
        border={postInFuture() ? "grey" : "dark"}
        style={isEditPostOpen ? { display: "none" } : {}}
      >
        <div className="postHeaderDiv">
          <Card.Header className="postHeader">
            <div className="headerPost">
              <b>{post.description}</b>
              <div className="btns">
                <Button
                  className="editPostBtn"
                  type="btn"
                  title="Rediger post"
                  onClick={togglerEdit}
                >
                  <div title="Rediger Post">
                    <div style={isLoadingPost ? { display: "none" } : {}}>
                      <FontAwesomeIcon icon={faEdit} />
                    </div>
                    <div style={isLoadingPost ? {} : { display: "none" }}>
                      <Spinner animation="border" size="sm" />
                    </div>
                  </div>
                </Button>
                <Button
                  className="removePostBtn"
                  type="btn"
                  title="Slett post"
                  onClick={toggler}
                >
                  <DeleteBudgetPostModal
                    isDeleteModalOpen={isDeleteModalOpen}
                    togglerDelete={toggler}
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
              </div>
            </div>
          </Card.Header>
        </div>
        <Card.Body>
          <Card.Text>
            <b>Pris:</b> {post.amount}
          </Card.Text>
          <Card.Text>
            <b>Dato:</b> {post.date}
          </Card.Text>
        </Card.Body>
      </Card>
      <div style={isEditPostOpen ? {} : { display: "none" }}>
        <EditBudgetPost
          toggle={togglerEdit}
          refreshBudgets={refreshBudgets}
          budget={budget}
          post={post}
          setIsLoadingPost={setIsLoadingPost}
          isLoadingPost={isLoadingPost}
        />
      </div>
    </div>
  );
};

export default Post;
