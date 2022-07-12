import React, { useState } from "react";
import ApiService from "../../services/api.service";
import Moment from "moment";
import { Card, Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateBudgetPost = ({ budget, refreshBudgets, toggle }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(Moment().format("YYYY-MM-DD"));
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  const isValid = () => {
    return amount > 0 && description && description !== "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid()) {
      toast.error("Noen av verdiene var ikke gyldig, prøv igjen", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } else {
      setIsLoadingPost(true);
      const budgetPost = {
        date: date,
        description: description,
        amount: amount,
        expense: true,
      };
      ApiService.createBudgetPost(budgetPost, budget.id).then(
        (response) => {
          refreshBudgets();
          toggle();
          setIsLoadingPost(false);
          toast.success("Lagret post", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        },
        (error) => {
          setIsLoadingPost(false);
          toast.error("Fikk ikke opprettet posten, prøv igjen", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        }
      );
    }
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
                min={budget.startDate}
              ></input>
            </li>
          </ul>
          <Button
            className="addPostBtn"
            type="btn submit"
            style={isValid() ? {} : { display: "none" }}
          >
            <div className="d-flex align-items-center">
              Legg til utlegget
              <div style={isLoadingPost ? {} : { display: "none" }}>
                <Spinner animation="border" style={{ marginLeft: 15 }} />
              </div>
            </div>
          </Button>
        </Card.Body>
      </Card>
    </form>
  );
};

export default CreateBudgetPost;
