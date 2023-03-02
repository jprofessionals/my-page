import React, {useState} from "react";
import "./AddUser.scss";
import {Button} from "react-bootstrap";
import ApiService from "../../services/api.service";
import {toast} from "react-toastify";

export default function AddUser() {

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = {
      email: email,
      name: name,
    };
    ApiService.createUser(user).then(
      (response) => {
        toast.success("Ny ansatt ble opprettet");
      },
      (error) => {
        toast.error("Klarte ikke å opprette ny ansatt");
      }
    );
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  return (
    <>
      <h1>Legg til ny ansatt</h1>
      <form onSubmit={handleSubmit}>
        <ul className="addUser">
          <li>
            <span className="emailTitle">E-post:</span>
            <input
              className="email"
              type="text"
              name="email"
              onChange={handleEmailChange}
              value={email}
              required
            />
          </li>
          <li>
            <span className="nameTitle">Navn:</span>
            <input
              className="name"
              type="text"
              name="name"
              onChange={handleNameChange}
              value={name}
              required
            />
          </li>
        </ul>
        <Button
          className="addUserBtn"
          type="btn submit"
        >
          <div className="d-flex align-items-center">
            Legg til ny ansatt
          </div>
        </Button>
      </form>
    </>
  );
}