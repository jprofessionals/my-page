import React, { useEffect, useState } from "react";
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

function App() {
    const [count, setCount] = useState(0);
    const [api_response, setApiResponse] = useState([]);
    const [employeelist, setEmployees] = useState([]);
    const [employeeName, setEmployeeName] = useState([]);
    const [alert, setAlert] = useState(false);



    useEffect(() => {
        ApiService.getTestApiOpen().then(stuff => {
                setApiResponse(stuff)
        })
        },[])

        useEffect(() => {
            ApiService.getEmployees().then(employees => {
                // debugger
                    setEmployees(employees.data)
            })
            },[])


            const handleSubmit = (e) => {
                e.preventDefault();
                // console.log(employeeName)
                const inputobj = {
                    "name": employeeName
                }
                console.log(inputobj)
                // ApiService.postEmployees(inputobj)
                ApiService.postEmployees({
                    name: employeeName}).then((response) => {
                    console.log(response);
                }, (error) => {
                    console.log(error);
                });
            };


        console.log(employeelist)
    

    // useEffect(() => {
    //     console.log('useEffect ran. count is: ', count);
    //   }, [count]);

    //   return (
    //     <div>
    //       <h2>Count: {count}</h2>
    //       <button onClick={() => setCount(count + 1)}>Increment</button>
    //     </div>
    //   );
    return (
        <div><h2>Employees</h2>
        <ul>
            {employeelist.map(employee => <li key = {employee.name}>{employee.name}</li>)}
        </ul>
        <form onSubmit={handleSubmit}>
            <label>
                <p>New employee</p>
                <input type="text" id="name" onChange={e => setEmployeeName(e.target.value)} value={employeeName} />
            </label>
            <button type="submit">Submit</button>
        </form>
        </div>
    );
    };

export default App;
