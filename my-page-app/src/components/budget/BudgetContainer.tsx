import { ToastContainer } from 'react-toastify'
import Home from '../home'
import Budgets from './Budgets'
import React from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import Loading from '@/components/Loading'

const BudgetContainer = () => {
  const { user } = useAuthContext()

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick={true}
        pauseOnHover={true}
        draggable={true}
        theme="colored"
      />
      <Loading isLoading={!user} loadingText="Laster inn bruker">
        <Home />
        <Budgets user={user!} />
      </Loading>
    </>
  )
}
export default BudgetContainer
