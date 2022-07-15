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
  setIsLoadingEditPost,
  isLoadingEditPost,
}) => {
  const [description, setDescription] = useState(post.description);
  const [amountExMva, setAmountExMva] = useState(
    post.amountExMva
  );
  const [date, setDate] = useState(Moment().format(post.date));

  const isValid = () => {
    return amountExMva > 0 && description && description !== "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid()) {
      toast.error("Noen av verdiene var ikke gyldig, prøv igjen");
    } else {
      setIsLoadingEditPost(true);
      const budgetPost = {
        date: date,
        description: description,
        amountExMva: amountExMva,
      };
      ApiService.editBudgetPost(post.id, budgetPost).then(
        (response) => {
          refreshBudgets();
          toggle();
          setIsLoadingEditPost(false);
          toast.success("Lagret " + description);
        },
        (error) => {
          setIsLoadingEditPost(false);
          toast.error("Fikk ikke oppdatert " + description + ", prøv igjen");
        }
      );
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleAmountChange = (e) => {
    setAmountExMva(e.target.value);
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
          placeholder="Beskrivelse"
          onChange={handleDescriptionChange}
          value={description}
        />
        <div className="rightBtnsDiv">
          <Button
            className="leftBtn"
            type="btn submit"
            style={isValid() ? {} : { display: "none" }}
            onClick={handleSubmit}
            title="Lagre Post"
          >
            <div style={isLoadingEditPost ? { display: "none" } : {}}>
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div style={isLoadingEditPost ? {} : { display: "none" }}>
              <Spinner animation="border" size="sm" />
            </div>
          </Button>
          <div style={isLoadingEditPost ? { display: "none" } : {}}>
            <Button
              className="canselEditButton"
              type="btn"
              title="Avbryt redigering"
              onClick={toggle}
            >
              <div style={isLoadingEditPost ? { display: "none" } : {}}>
                <FontAwesomeIcon icon={faRemove} />
              </div>
              <div style={isLoadingEditPost ? {} : { display: "none" }}>
                <Spinner animation="border" size="sm" />
              </div>
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <ul className="addPost">
          <li>
            <span className="priceTitle">Pris:</span>
            <input
              type="number"
              name="amountExMva"
              placeholder="Pris"
              onChange={handleAmountChange}
              value={amountExMva}
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
              placeholder={date}
            ></input>
          </li>
        </ul>
      </Card.Body>
    </Card>
  );
};

export default EditBudgetPost;
