import React, { useEffect, useState } from "react";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { Accordion, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import "./Budgets.scss";

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    refreshBudgets();
  }, []);

  const refreshBudgets = () => {
    ApiService.getBudgets().then((responseBudgets) => {
      setBudgets(responseBudgets.data);
    });
  };

  return (
    <div className="budgets">
      <div className="headerBudgets">
        <h3 className="headerText">Dine budsjetter</h3>
        <Button
          onClick={refreshBudgets}
          className="orange-jpro-round-button btn shadow-none"
        >
          <FontAwesomeIcon
            className="refresh"
            icon={faRefresh}
            title="Oppdater"
          />
        </Button>
      </div>
      <Accordion defaultActiveKey="0">
        {budgets.map((budget) => (
          <Budget
            key={budget.id}
            budget={budget}
            refreshBudgets={refreshBudgets}
          />
        ))}
      </Accordion>
    </div>
  );
};

export default Budgets;
