import React, { useEffect, useState } from "react";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { BudgetClass } from "./BudgetClass";
import { Accordion, Col} from "react-bootstrap";


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
  }, [responseBudgets]);


  return (
    <div style={{marginTop:15}}>
    <h3 style= {{marginLeft:5}}>Dine budsjetter</h3>
    <Accordion defaultActiveKey="0"> 
       {budgets.map((budget) => ( 
    <Accordion.Item key={budget.name} eventKey={budget.name}>
      <Accordion.Header>
        <Col>{budget.name}</Col>
        <Col>{budget.ageOfBudgetInMonths}</Col>
        </Accordion.Header>
      <Accordion.Body>
        <Budget budget={budget}/>
      </Accordion.Body>
    </Accordion.Item>
    ))}
  </Accordion>
  </div>
    
  );
};

export default Budgets;
