import React, { useEffect, useState } from "react";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { Accordion, Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
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
        toast.error("Klarte ikke laste budsjettene, prøv igjen senere", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      });
  };

  if (!budgets.length) {
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

            <Button onClick={refreshBudgets} className="shadow-none">
              <FontAwesomeIcon
                className="refresh"
                icon={faRefresh}
                title="Oppdater"
              />
            </Button>
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
