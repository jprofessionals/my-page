import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Accordion, Button } from "react-bootstrap";
import Post from "./Post";
import "./Budget.scss";
import CreateBudgetPost from "./CreateBudgetPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRemove } from "@fortawesome/free-solid-svg-icons";
import BudgetInformation from "./BudgetInformation";

const Budget = (props) => {
  const postList = props.budget.posts;
  const [posts, setPosts] = useState([]);
  const [cardItem, setCardItem] = useState();

  const toggler = (e) => {
    if (!cardItem) {
      setCardItem(
        <CreateBudgetPost
          budget={props.budget}
          refreshBudgets={props.refreshBudgets}
          toggle={setCardItem}
        />
      );
      e.target.closest("button").blur();
    } else {
      setCardItem(null);
      e.target.closest("button").blur();
    }
  };

  useEffect(() => {
    setPosts(postList);
  }, [postList]);

  return (
    <Accordion.Item key={props.budget.id} eventKey={props.budget.id}>
      <Accordion.Header title="Åpne/Lukk">
        <ul className="initialBudgetInformation">
          <li>
            <span title="Type budsjett">{props.budget.budgetType.name}</span>
          </li>
          <li>
            <span title="Saldo">{props.budget.balance}kr</span>
          </li>
        </ul>
      </Accordion.Header>
      <Accordion.Body>
        <BudgetInformation budget={props.budget} />
        <div className="posts">
          <div className="header">
            <h3 className="headerText">Historikk</h3>
            <Button
              onClick={toggler}
              className="orange-jpro-round-button btn shadow-none"
            >
              <FontAwesomeIcon
                className="toggleButton"
                icon={cardItem ? faRemove : faPlus}
                title={cardItem ? "Avbryt" : "Legg til ny post"}
              />
            </Button>{" "}
          </div>
        </div>
        {cardItem}
        {posts
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .map((post) => (
            <Post className="post" key={post.id} post={post} />
          ))}
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default Budget;
