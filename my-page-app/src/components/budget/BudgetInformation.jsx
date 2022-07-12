import React from "react";
import { Card } from "react-bootstrap";

const BudgetInformation = ({ budget }) => {
  const interValOfDeposit = (interval) => {
    if (interval === 1) {
      return "måned";
    } else {
      return interval + ".måned";
    }
  };

  return (
    <div className="budgetType">
      <Card>
        <Card.Body>
          <ul className="budgetInformation">
            <li
              style={budget.budgetType.deposit === 0 ? { display: "none" } : {}}
            >
              <span title="Opptjening">Opptjening: </span>
              {budget.budgetType.deposit}kr hver{" "}
              {interValOfDeposit(budget.budgetType.intervalOfDepositInMonths)}
            </li>
            <li style={budget.budgetType.rollOver ? {} : { display: "none" }}>
              <span title="Startbeløp">Startbeløp: </span>
              {budget.startAmount}kr ({budget.startDate})
            </li>
            <li style={budget.budgetType.rollOver ? { display: "none" } : {}}>
              <span title="Årlig budsjett">Årlig budsjett: </span>
              {budget.budgetType.startAmount}kr
            </li>
            {budget.posts.length !== 0 ? (
              <li>
                <span title="Dato for siste kjøp">Dato for siste kjøp: </span>
                {budget.posts.at(0).date}
              </li>
            ) : null}
            <li>
              <span title="Forbruk siste året">Forbruk siste året: </span>
              {budget.sumPostsLastTwelveMonths}kr
            </li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BudgetInformation;
