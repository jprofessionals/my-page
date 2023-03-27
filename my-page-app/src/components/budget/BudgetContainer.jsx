import {ToastContainer} from "react-toastify";
import {Spinner} from "react-bootstrap";
import Home from "../home";
import Budgets from "./Budgets";
import React from "react";
import styles from "./BudgetContainer.module.scss";


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
      <div className={`${styles.loadSpinUser} d-flex align-items-center`}>
        <Spinner animation="border"/>
        <h3>Laster inn bruker</h3>
      </div>
    </div>
    <div style={!user.loaded ? {display: "none"} : {}}>
      <Home user={user}/>
      {!user.loaded ? null :
        <Budgets user={user}></Budgets>
      }
    </div>
  </>;
}
export default BudgetContainer;
