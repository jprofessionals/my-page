import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { BudgetClass } from "./BudgetClass";

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [responseBudgets, setResponseBudgets] = useState([]);

  useEffect(() => {
    ApiService.getBudgets().then((responseBudgets) => {
      setResponseBudgets(responseBudgets.data);
    });
  }, []);

  useEffect(() => {
    const budgetList = [...budgets];
    for (let i = 0; i < responseBudgets.length; i++) {
      const budgetElement = new BudgetClass(
        responseBudgets[i].name,
        responseBudgets[i].ageOfBudgetInMonths,
        responseBudgets[i].posts
      );
      budgetList[i] = budgetElement;
      setBudgets(budgetList);
    }
    console.log(budgets);
  }, [responseBudgets]);

  const fetchBudgets = () => {
    console.log(responseBudgets);
  };

  return (
    <div>
      {budgets.map((budget) => (
        <Budget key={budget.name} budget={budget} />
      ))}
      <Button onClick={fetchBudgets}>Mine budsjetter</Button>
    </div>
  );
};

export default Budgets;
