import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { PostClass } from "./PostClass";
import { Card, Button } from "react-bootstrap";
import Post from "./Post";
import "./Budget.scss";
import CreateBudgetPost from "./CreateBudgetPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRemove } from "@fortawesome/free-solid-svg-icons";
import "./Budget.scss";
import BudgetInformation from "./BudgetInformation";

const Budget = (props) => {
  const postList = props.budget.posts;
  const [posts, setPosts] = useState([]);
  const [cardItem, setCardItem] = useState();

  const addOrCancelButton = () => {
    if (cardItem == null) {
      return (
        <FontAwesomeIcon
          onClick={addCard}
          className="plus"
          icon={faPlus}
          title="Legg til ny post"
        />
      );
    } else {
      return (
        <FontAwesomeIcon
          onClick={terminateCreateBudgetPost}
          className="remove"
          icon={faRemove}
          title="Avbryt"
        />
      );
    }
  };

  const terminateCreateBudgetPost = () => {
    setCardItem(null);
  };

  const addCard = (e) => {
    setCardItem(
      <Card>
        <Card.Body>
          <CreateBudgetPost
            budget={props.budget}
            refreshBudgets={props.refreshBudgets}
            terminate={terminateCreateBudgetPost}
          />
        </Card.Body>
      </Card>
    );
  };

  useEffect(() => {
    const updatedPosts = [...posts];
    for (let i = 0; i < postList.length; i++) {
      const post = new PostClass(
        postList[i].date,
        postList[i].description,
        postList[i].amount,
        postList[i].expense
      );
      updatedPosts[i] = post;
      setPosts(updatedPosts);
    }
  }, [postList]);

  return (
    <div>
      <BudgetInformation budget={props.budget} />
      <div className="posts">
        <div className="header">
          <h3 className="headerText">Historikk</h3>
          <Button className="orange-jpro-round-button btn shadow-none">
            {addOrCancelButton()}
          </Button>
        </div>
      </div>
      {cardItem}
      {posts.map((post) => (
        <Post className="post" key={post.description} post={post} />
      ))}
    </div>
  );
};

export default Budget;
