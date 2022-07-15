import React, { useState, useEffect, useContext } from "react";
import { Accordion, Button, AccordionContext } from "react-bootstrap";
import Post from "./Post";
import "./Budget.scss";
import CreateBudgetPost from "./CreateBudgetPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRemove } from "@fortawesome/free-solid-svg-icons";
import BudgetInformation from "./BudgetInformation";

const Budget = ({ budget, refreshBudgets }) => {
  const postList = budget.posts;
  const [posts, setPosts] = useState([]);
  const [cardItem, setCardItem] = useState();
  const { activeEventKey } = useContext(AccordionContext);

  const toggler = (e) => {
    if (!cardItem) {
      setCardItem(
        <CreateBudgetPost
          budget={budget}
          refreshBudgets={refreshBudgets}
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
    <Accordion.Item key={budget.id} eventKey={budget.id}>
      <Accordion.Header title={activeEventKey === budget.id ? "Lukk" : "Åpne"}>
        <ul className="initialBudgetInformation">
          <li>
            <span title="Type budsjett">{budget.budgetType.name}</span>
          </li>
          <li>
            <span title="Saldo">Saldo: {budget.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} kr</span>
          </li>
        </ul>
      </Accordion.Header>
      <Accordion.Body>
        <BudgetInformation budget={budget} />
        <div className="posts">
          <div className="header">
            <h3 className="headerText">Historikk</h3>
            <Button onClick={toggler} className="plus shadow-none">
              <FontAwesomeIcon
                className="toggleButton"
                icon={cardItem ? faRemove : faPlus}
                title={cardItem ? "Avbryt" : "Legg til ny post"}
              />
            </Button>
          </div>
          {cardItem}
          <span style={posts.length > 0 ? { display: "none" } : {}}>
            Ingen historikk funnet
          </span>
          {posts
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .map((post) => (
              <Post
                className="post"
                key={post.id}
                post={post}
                budget={budget}
                refreshBudgets={refreshBudgets}
              />
            ))}
        </div>
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default Budget;
