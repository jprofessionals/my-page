import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Card, Button } from "react-bootstrap";
import Post from "./Post";
import "./Budget.scss";
import CreateBudgetPost from "./CreateBudgetPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import "./Budget.scss";
import BudgetInformation from "./BudgetInformation";

const Budget = (props) => {
  const postList = props.budget.posts;
  const [posts, setPosts] = useState([]);
  const [cardItem, setCardItem] = useState();

  const terminateCreateBudgetPost = () => {
    setCardItem(null)
  }

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

  useEffect (() => {
    setPosts(postList)
  }, [postList])


  return (
    <div>
      <BudgetInformation budget={props.budget} />
      <div className="posts">
        <div className="header">
          <h3 className="headerText">Historikk</h3>
          <Button className="orange-jpro-round-button btn shadow-none">
            <FontAwesomeIcon
              className="plus"
              icon={faPlus}
              onClick={addCard}
              title="Legg til ny post"
            />
          </Button>
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
