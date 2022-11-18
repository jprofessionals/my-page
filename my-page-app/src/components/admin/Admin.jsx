import "./Admin.scss";
import {useEffect, useState} from "react";
import apiService from "../../services/api.service";
import {toast} from "react-toastify";
import {Spinner, Table} from "react-bootstrap";

function Admin() {
  const [users, setUsers] = useState([]);
  const [budgetTypes, setBudgetTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshTable();
    // eslint-disable-next-line
  }, []);

  const extractListOfBudgets = (users) => {
    if (users.length > 0){
      let extractedBudgetTypes = [];
      users.map(user => user.budgets.forEach(budget =>
          {
            if (!budgetTypeListContains(extractedBudgetTypes, budget)) {
              budget.budgetType.balanceIsHours = false;
              extractedBudgetTypes.push(budget.budgetType);
              if (budget.budgetType.allowTimeBalance) {
                let budgetTypeHours = Object.assign({}, budget.budgetType);
                budgetTypeHours.balanceIsHours = true;
                budgetTypeHours.name += "(timer)";
                extractedBudgetTypes.push(budgetTypeHours);
              }
            }
        }
      ))
      setBudgetTypes(extractedBudgetTypes);
    }
  };

  const budgetTypeListContains = (extractedBudgetTypes, newBudget) => {
    return extractedBudgetTypes.some( (budgetType) => (budgetType.id === newBudget.budgetType.id) )
  };

  const getBudgetBalanceForType = (budgets, type) => {
    var foundBudget = budgets.find(budget => budget.budgetType.id === type.id);
    if (type.balanceIsHours) {
      return budgetBalanceHours(foundBudget);
    } else {
      return budgetBalance(foundBudget);
    }
  };

  const budgetBalance = (budget) => {
    if (budget) {
      return "kr " + budget.balance.toFixed(2);
    } else {
      return "-"
    }
  };

  const budgetBalanceHours = (budget) => {
    if (budget) {
      return budget.sumHours + (budget.sumHours === 1 ? " time" : " timer");
    } else {
      return "-"
    }
  };

  const refreshTable = () => {
    setIsLoading(true);
    apiService.getUsers()
      .then((responseSummary) => {
        setUsers(responseSummary.data);
        extractListOfBudgets(responseSummary.data)
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        toast.error("Klarte ikke laste liste over ansatte, prøv igjen senere");
      });
  };

  if(isLoading) {
    return (
      <div className="loadSpin d-flex align-items-center">
        <Spinner animation="border" className="spinn" />
        <h3>Laster inn oversikt</h3>
      </div>
    )
  } else if (!isLoading && users.length === 0) {
    return (
      <h3>Fant ikke noe data...</h3>
    )
  } else {
    return (
      <>
        <div className="admin-container">
          <h2>Brukere</h2>
          <Table striped bordered hover style={!isLoading && budgetTypes.length > 0 ? {} : {display: "none"}}>
            <thead>
            <tr key={"headerRow"}>
              <th key={"brukerHeader"}>Brukere</th>
              {
                budgetTypes.map((budgetType) => (
                  <th key={budgetType.id + "" + budgetType.balanceIsHours}>{budgetType.name}</th>
                ))
              }
            </tr>
            </thead>
            <tbody>
            {
              users.map((userRow) => (
                <tr key={userRow.email}>
                  <td key={userRow.email}>{userRow.name}</td>
                  {budgetTypes.map((budgetColumn) => (
                    <td key={userRow.email + budgetColumn.id + "" + budgetColumn.balanceIsHours}>
                      {getBudgetBalanceForType(userRow.budgets, budgetColumn)}
                    </td>
                  ))}
                </tr>
              ))
            }
            </tbody>
          </Table>
        </div>
      </>
    );
  }
}

export default Admin;