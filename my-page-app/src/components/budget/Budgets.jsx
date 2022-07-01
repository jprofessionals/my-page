import React, { useEffect, useState } from "react";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { BudgetClass } from "./BudgetClass";
import { Accordion, Col, Button} from "react-bootstrap";
import "./Budget.scss";


const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [responseBudgets, setResponseBudgets] = useState([]);
  const [fireFetchBudgets, setFireFetchBudgets] = useState(false)

  useEffect(() => {
    ApiService.getBudgets().then((responseBudgets) => {
      setResponseBudgets(responseBudgets.data);
    });
  }, [fireFetchBudgets]);

  useEffect(() => {
    const budgetList = [...budgets];
    for (let i = 0; i < responseBudgets.length; i++) {
      const budgetElement = new BudgetClass(
        responseBudgets[i].id,
        responseBudgets[i].name,
        responseBudgets[i].ageOfBudgetInMonths,
        responseBudgets[i].posts
      );
      budgetList[i] = budgetElement;
      setBudgets(budgetList);
    }
  }, [responseBudgets]);

  const handleRefresh = () => {
    if (fireFetchBudgets === true){
        setFireFetchBudgets(false)
    }else {
        setFireFetchBudgets(true);
    }
  }


  return (
    <div style={{marginTop:15}}>
    <h3 style= {{marginLeft:5}}>Dine budsjetter</h3>
    <Button onClick={handleRefresh}>Refresh budsjetter</Button>
    <Accordion defaultActiveKey="0"> 
       {budgets.map((budget) => ( 
    <Accordion.Item key={budget.id} eventKey={budget.id}>
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
