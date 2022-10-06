import React, {useState} from "react";
import "./App.scss";
import NavBar from "./components/navbar/NavBar";
import {User} from "./User";
import BudgetContainer from "./components/budget/BudgetContainer";
import "react-toastify/dist/ReactToastify.css";
import {Routes, Route, useNavigate} from "react-router-dom";
import LoggedOut from "./LoggedOut";
import Bidra from "./components/bidra/Bidra";
import RequireAuth from "./utils/RequireAuth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(new User());
  const authBundle = {user, setUser, isAuthenticated, setIsAuthenticated};
  let navigate = useNavigate();
      return (
        <>
          <NavBar logout={logout} user={user}/>
          <Routes>
            {["/", "/budsjett"].map((path, index) => {
              return (
                <Route path={path} element={
                  <RequireAuth user={user} setUser={setUser} isAuthenticated={isAuthenticated} setAuthenticated={setIsAuthenticated}>
                    <BudgetContainer user={user}/>
                  </RequireAuth>
                } key={index} />
              )
            })}
            <Route path="/bidra" element={<Bidra/>}/>
            <Route path="/logget-ut" element={<LoggedOut/>}/>
            <Route path="*"
                   element={
                     <main style={{padding: "1rem"}}>
                       <p>There's nothing here!</p>
                     </main>
                   }
            />
          </Routes>
        </>
      );

  function logout () {
    setUser(new User())
    setIsAuthenticated(false);
    localStorage.removeItem("user_token");
    navigate('/logget-ut');
  }
}
export default App;
