import React, { useEffect, useState } from "react";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { Accordion, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);

  useEffect(() => {
    refreshBudgets();
  }, []);

  const refreshBudgets = () => {
    setIsLoadingBudgets(true);
    ApiService.getBudgets()
      .then((responseBudgets) => {
        setBudgets(responseBudgets.data);
        setIsLoadingBudgets(false);
      })
      .catch((error) => {
        setIsLoadingBudgets(false);
        toast.error("Klarte ikke laste budsjettene, prøv igjen senere");
      });
  };

  if (!budgets.length && !isLoadingBudgets) {
    return (
      <div className="budgets">
        <div style={isLoadingBudgets ? {} : { display: "none" }}>
          <div className="loadSpin d-flex align-items-center">
            <Spinner animation="border" className="spinn" />
            <h3>Laster inn dine budsjetter</h3>
          </div>
        </div>
        <div>
          <h3>Du har ingen budsjetter</h3>
          <p className="headerText">
            Kontakt ledelsen for å få opprettet budsjettene dine
          </p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="budgets">
        <div style={isLoadingBudgets ? {} : { display: "none" }}>
          <div className="loadSpin d-flex align-items-center ">
            <Spinner animation="border" />
            <h3>Laster inn dine budsjetter</h3>
          </div>
        </div>
        <div style={!isLoadingBudgets ? {} : { display: "none" }}>
          <div className="headerBudgets">
            <h3 className="headerText">Dine budsjetter</h3>
          </div>
          <Accordion defaultActiveKey="0">
            {budgets.map((budget) => (
              <Budget
                key={budget.id}
                budget={budget}
                refreshBudgets={refreshBudgets}
              />
            ))}
          </Accordion>
        </div>
      </div>
    );
  }
};

export default Budgets;
