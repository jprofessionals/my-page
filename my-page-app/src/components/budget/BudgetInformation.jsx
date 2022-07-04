import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import {Accordion, Card} from "react-bootstrap"
import ApiService from "../../services/api.service";

const BudgetInformation =  (props) => {


    const [budgetTypeResponse, setBudgetTypeResponse] = useState();


    useEffect (() => {
        ApiService.getBudgetType(props.budget.budgetTypeId)
        .then(responseBudgetType => {
                setBudgetTypeResponse(responseBudgetType.data)
        })
    }, [])
        

    return (
        <div>
        <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey={props.budget.id}>
        <Accordion.Header>Budsjettinformasjon</Accordion.Header>
        <Accordion.Body>
        <Card>
        <Card.Body>
        <p><b>Type budsjett: </b>Informasjon om hva slags budsjett</p>
        <p><b>Periode på innskudd: </b>Hvor ofte er periodisk innskudd?</p> 
        <p><b>Beløp på periodisk innskudd: </b>Hvor mye er det periodiske innskuddet?</p>
        <p><b>Startbeløp: </b>Beløpet budsjettet startet med</p>
        </Card.Body>
        </Card>
        </Accordion.Body>
        </Accordion.Item>
        </Accordion>
        </div>
    )
} 

export default BudgetInformation;