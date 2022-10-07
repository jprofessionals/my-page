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
              {budget.budgetType.deposit.toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })} hver{" "}
              {interValOfDeposit(budget.budgetType.intervalOfDepositInMonths)}
            </li>
            <li style={budget.budgetType.rollOver ? {} : { display: "none" }}>
              <span title="Startbeløp">Startbeløp: </span>
              {budget.startAmount.toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })} ({Moment(budget.startDate).format('DD.MM.YYYY')})
            </li>
            <li style={budget.budgetType.rollOver ? { display: "none" } : {}}>
              <span title="Årlig budsjett">Årlig budsjett: </span>
              {budget.budgetType.startAmount.toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}
            </li>
            {budget.posts.length !== 0 ? (
              <li>
                <span title="Dato for siste kjøp">Dato for siste kjøp: </span>
                {Moment(budget.posts.at(0).date).format('DD.MM.YYYY')}
              </li>
            ) : null}
            <li>
              <span title="Forbruk i år">Forbruk i år: </span>
              {budget.sumPostsCurrentYear.toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}
            </li>
            <li>
              <span title="Forbruk siste 12 måneder">Forbruk siste 12 måneder: </span>
              {budget.sumPostsLastTwelveMonths.toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}
            </li>
            <li>
              <span title="Antall timer brukt i år">Antall timer brukt i år: </span>
              {budget.sumHoursCurrentYear===1 ? budget.sumHoursCurrentYear + ' time' : budget.sumHoursCurrentYear + ' timer'}
            </li>
            <li>
              <span title="Antall timer brukt siste 12 måneder">Antall timer brukt siste 12 måneder: </span>
              {budget.sumHoursLastTwelveMonths===1 ? budget.sumHoursLastTwelveMonths + ' time' : budget.sumHoursLastTwelveMonths + ' timer'}
            </li>

          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BudgetInformation;
