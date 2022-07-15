import React from "react";
import { Card } from "react-bootstrap";
import Moment from "moment";

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
              {budget.budgetType.deposit.toLocaleString(undefined, { maximumFractionDigits: 2 })} kr hver{" "}
              {interValOfDeposit(budget.budgetType.intervalOfDepositInMonths)}
            </li>
            <li style={budget.budgetType.rollOver ? {} : { display: "none" }}>
              <span title="Startbeløp">Startbeløp: </span>
              {budget.startAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} kr ({Moment(budget.startDate).format('DD.MM.YYYY')})
            </li>
            <li style={budget.budgetType.rollOver ? { display: "none" } : {}}>
              <span title="Årlig budsjett">Årlig budsjett: </span>
              {budget.budgetType.startAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} kr
            </li>
            {budget.posts.length !== 0 ? (
              <li>
                <span title="Dato for siste kjøp">Dato for siste kjøp: </span>
                {Moment(budget.posts.at(0).date).format('DD.MM.YYYY')}
              </li>
            ) : null}
            <li>
              <span title="Forbruk siste året">Forbruk siste året: </span>
              {budget.sumPostsLastTwelveMonths.toLocaleString(undefined, { maximumFractionDigits: 2 })} kr
            </li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BudgetInformation;
