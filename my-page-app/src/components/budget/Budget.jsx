import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { PostClass } from "./PostClass";
import { Card, Button } from "react-bootstrap";
import Post from "./Post";
import "./Budget.scss";
import CreateBudgetPost from "./CreateBudgetPost";

const Budget = (props) => {
  const postList = props.budget.posts;
  const [posts, setPosts] = useState([]);
  const [cardItem, setCardItem] = useState();

  const addCard = (e) => {
    setCardItem(
      <Card>
        <Card.Body>
          <CreateBudgetPost
            budget={props.budget}
            refreshBudgets={props.refreshBudgets}
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
      <Button onClick={addCard}>Legg til utlegg</Button>
      {cardItem}
      {posts.map((post) => (
        <Post key={post.description} post={post} />
      ))}
    </div>
  );
};

export default Budget;
