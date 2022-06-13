import React, { useEffect, useState, refetch, Component } from "react";
import "./App.css";
import LoginHooks from "./components/login/LoginHooks";
import LogoutHooks from "./components/login/LogoutHooks";
import Home from "./components/home";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "./components/navbar/NavBar";
import ApiService from './services/api.service';
import { ListGroup, NavItem } from "react-bootstrap";

// function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   useEffect(() => {
//     if (localStorage.getItem("user_token") != null) {
//       setIsLoggedIn(true);
//       console.log(isLoggedIn);
//     } else {
//         setIsLoggedIn(false);
//       console.log(isLoggedIn);
//     }
//   }, [isLoggedIn]);
//   console.log(isLoggedIn);
//   return (
//     <div className="App">
//       <NavBar />
//       {isLoggedIn ? (
//         <LogoutHooks />
//       ) : (
//         <LoginHooks />
//       )}
//       <Home />
//     </div>
//   );
// };



function App(props) {
    const [count, setCount] = useState(0);
    const [api_response, setApiResponse] = useState([]);
    const [employeelist, setEmployees] = useState([]);
    const [employeeName, setEmployeeName] = useState([]);
    const [alert, setAlert] = useState(false);
    // const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userToken, setUserToken] = useState([]);

    const getCallBackValue = () => {
        alert("HEI dette er callback")
    }



   

    useEffect(() => {
        if(employeelist.length && !alert) {
            return;
        }
        ApiService.getEmployees().then(employees => {
                setEmployees(employees.data)
        })
        },[alert,employeelist])

        useEffect(() => {
            if(alert) {
                setTimeout(() => {
                    setAlert(false);
                },1000)
            }
        },[alert])


        const handleSubmit = (e) => {
            e.preventDefault();
            const inputobj = {
                "name": employeeName
            }
            const authenticationObj = LoginHooks.authentication;
            console.log(localStorage)
            // console.log(isAuthenticated)
            // console.log(isAuthenticated);
            // console.log(ApiService.teststreng)
            ApiService.postEmployees(inputobj).then(() => {
                setEmployeeName('');
                setAlert(true);
            })
        };

    return (
        <div>
            <><NavBar />
            <LoginHooks callBackValue={() => getCallBackValue}  />
            <LogoutHooks />
            <h2>Employees</h2><ul>
                {employeelist.map(employee => <li key={employee.name}>{employee.name}</li>)}
            </ul></>
        {alert && <h2>Submit Successful</h2>}
        <form onSubmit={handleSubmit}>
            <label>
                <p>New employee</p>
                <input type="text" id="name" onChange={e => setEmployeeName(e.target.value)} value={employeeName} />
            </label>
            <button type="submit">Submit</button>
        </form>
        </div>
    );
    

}

export default App;
