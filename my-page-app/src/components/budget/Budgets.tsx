import React, { useEffect, useState } from 'react'
import ApiService from '../../services/api.service'
import Budget from './Budget'
import { Accordion } from 'react-bootstrap'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { User } from '@/types'
import Loading from '@/components/Loading'

type Props = {
  useLoggedInUser?: boolean
  user: User
}

const Budgets = ({ useLoggedInUser = true, user }: Props) => {
  const [budgets, setBudgets] = useState<any[]>([])
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false)

  useEffect(() => {
    refreshBudgets()
  }, [])

  const refreshBudgets = async () => {
    setIsLoadingBudgets(true)
    const loadedBudgets = useLoggedInUser
      ? ApiService.getBudgets()
      : ApiService.getBudgetsForEmployee(user.employeeNumber)

    loadedBudgets
      .then((responseBudgets) => {
        setBudgets(responseBudgets.data)
        setIsLoadingBudgets(false)
      })
      .catch((error) => {
        setIsLoadingBudgets(false)
        toast.error('Klarte ikke laste budsjettene, prøv igjen senere')
      })
  }

  if (!budgets.length && !isLoadingBudgets) {
    return (
      <div className="budgets">
        <h3>Du har ingen budsjetter</h3>
        <p className="headerText">
          Kontakt ledelsen for å få opprettet budsjettene dine
        </p>
      </div>
    )
  } else {
    return (
      <div className="budgets">
        <Loading
          isLoading={isLoadingBudgets}
          loadingText="Laster inn dine budsjetter"
        >
          <div className="headerBudgets">
            <h3 className="headerText">Dine budsjetter</h3>
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
        </Loading>
      </div>
    )
  }
}

export default Budgets
