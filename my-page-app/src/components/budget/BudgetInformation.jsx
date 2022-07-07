import React from "react";
import { Card } from "react-bootstrap";

const BudgetInformation = (props) => {
  const interValOfDeposit = (interval) => {
    if (interval === 1) {
      return "Månedlig";
    } else if (interval === 12) {
      return "Årlig";
    }
  };

  const rollOver = (rollOverValue) => {
    if (rollOverValue) {
      return "Ja";
    } else {
      return "Nei";
    }
  };

  return (
    <div className="budgetType">
      <Card>
        <Card.Body>
          <ul className="budgetInformation">
            <li>
              <span>Type budsjett: </span>
              {props.budget.budgetType.name}
            </li>
            <li>
              <span>Roll over: </span>
              {rollOver(props.budget.budgetType.rollOver)}
            </li>
            <li>
              <span>Periode på innskudd: </span>
              {interValOfDeposit(
                props.budget.budgetType.intervalOfDepositInMonths
              )}
            </li>
            <li>
              <span>Periodisk innskudd: </span>
              {props.budget.budgetType.deposit},-
            </li>
            <li>
              <span>Startbeløp: </span>
              {props.budget.budgetType.startAmount},-
            </li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BudgetInformation;
