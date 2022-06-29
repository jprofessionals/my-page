import React from "react";

const Budget = (props) => {
  return (
    <div>
      <ul>
        <li key={props.budget.name}>{props.budget.name}</li>
      </ul>
    </div>
  );
};

export default Budget;
