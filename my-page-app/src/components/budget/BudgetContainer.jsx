import { ToastContainer } from 'react-toastify'
import { Spinner } from 'react-bootstrap'
import Home from '../home'
import Budgets from './Budgets'
import React from 'react'
import styles from './BudgetContainer.module.scss'

const BudgetContainer = ({ user }) => {
  if (!user)
    return (
      <div className={`${styles.loadSpinUser} d-flex align-items-center`}>
        <Spinner animation="border" />
        <h3>Laster inn bruker</h3>
      </div>
    )
  return (
    <>
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
      <Home user={user} />
      <Budgets user={user} />
    </>
  )
}
export default BudgetContainer
