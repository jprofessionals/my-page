import React, { useState } from "react";
import "./Budget.scss";
import ApiService from "../../services/api.service";
import Form from "react-bootstrap/Form";
import Moment from 'moment';

const CreateBudgetPost = (props) => {
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(Moment().format('YYYY-MM-DD'));
  const isEnabled = description.length > 0 && !isNaN(amount) && amount > 0;

  const handleSubmit = (e) => {
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
        props.terminate();
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
      <div>
        <input
          type="text"
          name="description"
          placeholder="Beskrivelse"
          onChange={handleDescriptionChange}
          value={description}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Pris"
          onChange={handleAmountChange}
          value={amount}
          required
        />
        <Form.Control
          type="date"
          name="date"
          onChange={handleDateChange}
          value={date}
        ></Form.Control>

        <button type="submit" disabled={!isEnabled}>
          Legg til utlegget
        </button>
      </div>
    </form>
  );
};

export default CreateBudgetPost;
