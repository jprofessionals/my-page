import "./Admin.scss";
import {Spinner, Table} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import ApiService from "../../services/api.service";
import {toast} from "react-toastify";

function Admin() {

  const [table, setTable] = useState({});
  const [isLoadingTable, setIsLoadingTable] = useState(true);

  useEffect(() => {
    refreshTable();
  }, []);

  const refreshTable = () => {
    setIsLoadingTable(true);
    ApiService.getEmployeeSummary()
      .then((responseSummary) => {
        setTable(responseSummary.data);
        setIsLoadingTable(false);
      })
      .catch((error) => {
        setIsLoadingTable(false);
        toast.error("Klarte ikke laste liste over ansatte, prøv igjen senere");
      });
  };
  if(isLoadingTable) {
    return (
      <div className="loadSpin d-flex align-items-center">
        <Spinner animation="border" className="spinn" />
        <h3>Laster inn oversikt</h3>
      </div>
    )
  } else if (!isLoadingTable && !table) {
    return (
      <h3>Fant ikke noe data...</h3>
    )
  } else {
    return (
      <>
        <div className="admin-container">
          <h3>Administrasjon</h3>
          <a href={"/api/swagger-ui/index.html"}>Swagger-ui</a>
        <h2>Brukere</h2>
        <div style={isLoadingTable && !table.users ? {} : {display: "none"}}>
          <b>Laster ting</b>
        </div>
        <Table striped bordered hover style={!isLoadingTable && table.headers ? {} : {display: "none"}}>
          <thead>
          <tr>
          {
            table.headers.map((header) => (
              <th key={header.key}>{header.label}</th>
            ))
          }
          </tr>
          </thead>
          <tbody>
            {
              table.rows.map((row) => (
                <tr>
                  {row.map((cell) => (
                    <td key={cell.key}>{cell.label}</td>
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