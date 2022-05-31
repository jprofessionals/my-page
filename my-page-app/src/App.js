import React from 'react';
import './App.css';
import LoginHooks from './components/login/LoginHooks';
import LogoutHooks from './components/login/LogoutHooks';
import Home from './components/home';

function App() {
  return (
    <div className="App">
      <LoginHooks />
      <LogoutHooks />

      <Home />
    </div>
  );
}

export default App;
