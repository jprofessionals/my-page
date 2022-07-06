import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Button } from "react-bootstrap";
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
        <Button
          onClick={addCard}
          className="orange-jpro-round-button btn shadow-none"
        >
          <FontAwesomeIcon
            className="plus"
            icon={faPlus}
            title="Legg til ny post"
          />
        </Button>
      );
    } else {
      return (
        <Button
          onClick={terminateCreateBudgetPost}
          className="orange-jpro-round-button btn shadow-none"
        >
          <FontAwesomeIcon className="remove" icon={faRemove} title="Avbryt" />
        </Button>
      );
    }
  };

  const terminateCreateBudgetPost = (e) => {
    setCardItem(null);
    e.target.closest("button").blur();
  };

  const addCard = (e) => {
    setCardItem(
      <CreateBudgetPost
        budget={props.budget}
        refreshBudgets={props.refreshBudgets}
        terminate={terminateCreateBudgetPost}
      />
    );
  };

  useEffect(() => {
    setPosts(postList);
  }, [postList]);

  return (
    <div>
      <BudgetInformation budget={props.budget} />
      <div className="posts">
        <div className="header">
          <h3 className="headerText">Historikk</h3>
          {addOrCancelButton()}
        </div>
      </div>
      {cardItem}
      {posts.map((post) => (
        <Post className="post" key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Budget;
