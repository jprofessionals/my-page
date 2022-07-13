import React, { useState } from "react";
import ApiService from "../../services/api.service";
import Moment from "moment";
import { Card, Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRemove, faCheck } from "@fortawesome/free-solid-svg-icons";

const EditBudgetPost = ({
  toggle,
  refreshBudgets,
  budget,
  post,
  setIsLoadingPost,
  isLoadingPost,
}) => {
  const [description, setDescription] = useState(post.description);
  const [amount, setAmount] = useState(post.amount);
  const [date, setDate] = useState(Moment().format(post.date));

  const isValid = () => {
    return amount > 0 && description && description !== "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid()) {
      toast.error("Noen av verdiene var ikke gyldig, prøv igjen");
    } else {
      setIsLoadingPost(true);
      const budgetPost = {
        date: date,
        description: description,
        amount: amount,
      };
      ApiService.editBudgetPost(post.id, budgetPost).then(
        (response) => {
          refreshBudgets();
          toggle();
          setIsLoadingPost(false);
          toast.success("Lagret", post.description);
        },
        (error) => {
          setIsLoadingPost(false);
          toast.error("Fikk ikke oppdatert", post.description, "prøv igjen");
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
    <Card className="inputCard editPost">
      <Card.Header className="editPostHeader">
        <input
          className="description"
          type="text"
          name="description"
          placeholder={post.description}
          onChange={handleDescriptionChange}
          value={description}
        />
        <div className="editCardBtns">
          <Button
            className="addPostBtn"
            type="btn submit"
            style={isValid() ? {} : { display: "none" }}
            onClick={handleSubmit}
            title="Lagre Post"
          >
            <div style={isLoadingPost ? { display: "none" } : {}}>
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div style={isLoadingPost ? {} : { display: "none" }}>
              <Spinner animation="border" size="sm" />
            </div>
          </Button>
          <Button
            className="canselEditButton"
            type="btn"
            title="Avbryt redigering"
            onClick={toggle}
          >
            <div style={isLoadingPost ? { display: "none" } : {}}>
              <FontAwesomeIcon icon={faRemove} />
            </div>
            <div style={isLoadingPost ? {} : { display: "none" }}>
              <Spinner animation="border" size="sm" />
            </div>
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <ul className="addPost">
          <li>
            <span className="priceTitle">Pris:</span>
            <input
              type="number"
              name="amount"
              placeholder={post.amount}
              onChange={handleAmountChange}
              value={amount}
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
              placeholder={post.date}
            ></input>
          </li>
        </ul>
      </Card.Body>
    </Card>
  );
};

export default EditBudgetPost;
