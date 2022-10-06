import {ToastContainer} from "react-toastify";
import {Spinner} from "react-bootstrap";
import Home from "../home";
import Budgets from "./Budgets";
import React from "react";

const BudgetContainer = ({user}) => {
  return <>
    <ToastContainer
      position="top-right"
      autoClose={2000}
      hideProgressBar={false}
      closeOnClick={true}
      pauseOnHover={true}
      draggable={true}
      progress={undefined}
      theme="colored"
    />
    <div style={!user.loaded ? {} : {display: "none"}}>
      <div className="loadSpinUser d-flex align-items-center">
        <Spinner animation="border"/>
        <h3>Laster inn bruker</h3>
      </div>
    </div>
    <div style={!user.loaded ? {display: "none"} : {}}>
      <Home user={user}/>
      {!user.loaded ? null :
        <Budgets></Budgets>
      }
    </div>
  </>;
}
export default BudgetContainer;
