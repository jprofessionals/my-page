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

  return (
    <div className="budgetType">
      <Card>
        <Card.Body>
          <ul className="budgetInformation">
            <li>
              <span title="Periode på inskudd">Periode på innskudd: </span>
              {interValOfDeposit(
                props.budget.budgetType.intervalOfDepositInMonths
              )}
            </li>
            <li>
              <span title="Periodisk inskudd">Periodisk innskudd: </span>
              {props.budget.budgetType.deposit}kr
            </li>
            {props.budget.posts ? null : (
              <li>
                <span title="Dato for siste kjøp">Dato for siste kjøp: </span>
                {props.budget.posts.at(0).date}
              </li>
            )}
            <li>
              <span title="Forbruk siste året">Forbruk siste året: </span>
              {props.budget.sumPostsLastTwelveMonths}kr
            </li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BudgetInformation;
