import React, { useEffect, useState } from "react";
import ApiService from "../../services/api.service";
import Budget from "./Budget";
import { Accordion, Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);

  useEffect(() => {
    refreshBudgets();
  }, []);

  const refreshBudgets = () => {
    setIsLoadingBudgets(true);
    ApiService.getBudgets().then((responseBudgets) => {
      setBudgets(responseBudgets.data);
      setIsLoadingBudgets(false);
    });
  };

  if (!budgets.length) {
    return (
      <div className="budgets">
        {isLoadingBudgets ? (
          <div className="loadSpin d-flex align-items-center">
            <Spinner animation="border" className="spinn" />{" "}
            <h3>Laster inn dine budsjetter</h3>
          </div>
        ) : (
          <div>
            <h3>Du har ingen budsjetter</h3>
            <p className="headerText">
              Kontakt ledelsen for å få opprettet budsjettene dine
            </p>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="budgets">
        {isLoadingBudgets ? (
          <div className="loadSpin d-flex align-items-center ">
            <Spinner animation="border" />
            <h3>Laster inn dine budsjetter</h3>
          </div>
        ) : (
          <div>
            <div className="headerBudgets">
              <h3 className="headerText">Dine budsjetter</h3>

              <Button
                onClick={refreshBudgets}
                className="orange-jpro-round-button btn shadow-none"
              >
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
        )}
      </div>
    );
  }
};

export default Budgets;
