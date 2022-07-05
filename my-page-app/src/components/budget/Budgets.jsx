import React, { useEffect, useState } from "react";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { BudgetClass } from "./BudgetClass";
import { Accordion, Col, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import "./Budgets.scss";

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [responseBudgets, setResponseBudgets] = useState([]);

  useEffect(() => {
    refreshBudgets();
  }, []);

  useEffect(() => {
    const budgetList = [...budgets];
    for (let i = 0; i < responseBudgets.length; i++) {
      const budgetElement = new BudgetClass(
        responseBudgets[i].id,
        responseBudgets[i].name,
        responseBudgets[i].ageOfBudgetInMonths,
        responseBudgets[i].posts,
        responseBudgets[i].budgetType
      );
      budgetList[i] = budgetElement;
      setBudgets(budgetList);
    }
  }, [responseBudgets]);

  const refreshBudgets = () => {
    ApiService.getBudgets().then((responseBudgets) => {
      setResponseBudgets(responseBudgets.data);
    });
  };
  return (
    <div className="budgets">
      <div className="headerBudgets">
        <h3 className="headerText">Dine budsjetter</h3>
        <Button className="orange-jpro-round-button btn shadow-none">
          <FontAwesomeIcon
            className="refresh"
            icon={faRefresh}
            onClick={refreshBudgets}
            title="Oppdater"
          />
        </Button>
      </div>
      <Accordion defaultActiveKey="0">
        {budgets.map((budget) => (
          <Accordion.Item title="utvid" key={budget.id} eventKey={budget.id}>
            <Accordion.Header>
              <Col title="Navn på budsjettet">{budget.name}</Col>
              <Col title="Budsjettets alder">{budget.ageOfBudgetInMonths}</Col>
            </Accordion.Header>
            <Accordion.Body>
              <Budget budget={budget} refreshBudgets={refreshBudgets} />
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default Budgets;
