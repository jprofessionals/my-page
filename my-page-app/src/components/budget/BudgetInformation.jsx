import React from "react";
import {Card } from "react-bootstrap";
import "./Budget.scss";

const BudgetInformation = (props) => {

 const interValOfDeposit = (interval) => {
    if (interval === 1) {
        return ("Månedlig")
    } else if (interval === 12) {
        return ("Årlig")
    }
 }

 const rollOver = (rollOverValue) => {
    if (rollOverValue) {
        return ("Budjsettet har roll over")
    } else{
        return ("Budsjettet har ikke roll over")
    }
 }

  return (
    <div className="budgetType">
      <Card>
        <Card.Body>
          <p>
            <span>Type budsjett: </span>{props.budget.budgetType.name}
          </p>
          <p>
            <span>Roll over: </span>{rollOver(props.budget.budgetType.rollOver)}
          </p>
          <p>
            <span>Periode på innskudd: </span>{interValOfDeposit(props.budget.budgetType.intervalOfDepositInMonths)}
          </p>
          <p>
            <span>Periodisk innskudd: </span>{props.budget.budgetType.deposit},-
          </p>
          <p>
          <span>Startbeløp: </span>{props.budget.budgetType.startAmount},-
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BudgetInformation;
