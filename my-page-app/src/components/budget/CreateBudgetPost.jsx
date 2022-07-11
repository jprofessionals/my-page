import React, { useState } from "react";
import ApiService from "../../services/api.service";
import Moment from "moment";
import { Card, Button, Spinner } from "react-bootstrap";

const CreateBudgetPost = (props) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(Moment().format("YYYY-MM-DD"));
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  const submitButton = () => {
    if (amount <= 0 || description === "") {
      return null;
    } else {
      return (
        <Button className="addPostBtn" type="btn submit">
          <div className="d-flex align-items-center">
            Legg til utlegget
            <div style={isLoadingPost ? {} : { display: "none" }}>
              <Spinner animation="border" style={{ marginLeft: 15 }} />
            </div>
          </div>
        </Button>
      );
    }
  };

  const handleSubmit = (e) => {
    setIsLoadingPost(true);
    e.preventDefault();
    const budgetPost = {
      date: date,
      description: description,
      amount: amount,
      expense: true,
    };
    ApiService.createBudgetPost(budgetPost, props.budget.id).then(
      (response) => {
        props.refreshBudgets();
        props.toggle();
        setIsLoadingPost(false);
      },

      (error) => {
        alert("Noe gikk feil, prøv igjen");
      }
    );
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="inputCard">
        <Card.Header>
          <input
            className="description"
            type="text"
            name="description"
            placeholder="Beskrivelse"
            onChange={handleDescriptionChange}
            value={description}
            required
          />
        </Card.Header>
        <Card.Body>
          <ul className="addPost">
            <li>
              <span className="priceTitle">Pris:</span>
              <input
                type="number"
                name="amount"
                placeholder="Pris"
                onChange={handleAmountChange}
                value={amount}
                required
              />
            </li>
            <li>
              <span className="datoTitle">Dato:</span>
              <input
                className="inputDate"
                type="date"
                name="date"
                onChange={handleDateChange}
                value={date}
                min={props.budget.startDate}
              ></input>
            </li>
          </ul>
          {submitButton()}
        </Card.Body>
      </Card>
    </form>
  );
};

export default CreateBudgetPost;
