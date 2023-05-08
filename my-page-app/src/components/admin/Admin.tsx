import React, { Fragment, useEffect, useState } from 'react'
import apiService from '../../services/api.service'
import { toast } from 'react-toastify'
import { Spinner, Table } from 'react-bootstrap'
import { Budget, BudgetType, User } from '@/types'
import BudgetList from '@/components/budget/BudgetList'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronCircleUp } from '@fortawesome/free-solid-svg-icons'
import { faChevronCircleDown } from '@fortawesome/free-solid-svg-icons/faChevronCircleDown'
import { AccordionEventKey } from 'react-bootstrap/AccordionContext'
import NewUserModal from '@/components/admin/NewUserModal'

function compareUsers(a: User, b: User): number {
  if (a.name === null && b.name === null) {
    return a.email.localeCompare(b.email)
  } else if (a.name === null) {
    return a.email.localeCompare(b.name)
  } else if (b.name === null) {
    return a.name.localeCompare(b.email)
  } else {
    return a.name.localeCompare(b.name)
  }
}

function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [budgetTypes, setBudgetTypes] = useState<BudgetType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string>('')
  const [filterValue, setFilterValue] = useState('')
  const [activeBudget, setActiveBudget] = useState<AccordionEventKey | null>(
    null,
  )

  useEffect(() => {
    refreshTable()
    // eslint-disable-next-line
  }, [])

  const extractListOfBudgets = (users: User[]) => {
    if (users.length > 0) {
      const extractedBudgetTypes: BudgetType[] = []
      users.map((user) =>
        user?.budgets?.forEach((budget) => {
          if (!budgetTypeListContains(extractedBudgetTypes, budget)) {
            extractedBudgetTypes.push(budget.budgetType)
            if (budget.budgetType.allowTimeBalance) {
              const budgetType = {
                ...budget.budgetType,
                balanceIsHours: true,
                name: budget.budgetType.name + '(timer)',
              }
              extractedBudgetTypes.push(budgetType)
            }
          }
        }),
      )
      setBudgetTypes(extractedBudgetTypes)
    }
  }

  const budgetTypeListContains = (
    extractedBudgetTypes: BudgetType[],
    newBudget: Budget,
  ) => {
    return extractedBudgetTypes.some(
      (budgetType: BudgetType) => budgetType.id === newBudget.budgetType.id,
    )
  }

  const getBudgetBalanceForType = (budgets: Budget[], type: BudgetType) => {
    const foundBudget = budgets.find(
      (budget) => budget.budgetType.id === type.id,
    )
    if (!foundBudget) return null
    if (type.balanceIsHours) {
      return budgetBalanceHoursCurrentYear(foundBudget)
    } else {
      return budgetBalance(foundBudget)
    }
  }

  const budgetBalance = (budget: Budget) => {
    if (budget) {
      return budget.balance.toLocaleString('no-NO', {
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'NOK',
      })
    } else {
      return '-'
    }
  }

  const budgetBalanceHours = (budget: Budget) => {
    if (budget) {
      return budget.sumHours + (budget.sumHours === 1 ? ' time' : ' timer')
    } else {
      return '-'
    }
  }

  const budgetBalanceHoursCurrentYear = (budget: Budget) => {
    if (budget) {
      return (
        budget.sumHoursCurrentYear +
        (budget.sumHoursCurrentYear === 1 ? ' time' : ' timer')
      )
    } else {
      return '-'
    }
  }

  const handleExpandUser = (user: User) => {
    // Check if the clicked target is not a child of the expanded area
    setExpandedUser(expandedUser === user.email ? '' : user.email)
  }

  const refreshTable = () => {
    setIsLoading(true)
    apiService
      .getUsers()
      .then((responseSummary) => {
        setUsers(responseSummary.data)
        extractListOfBudgets(responseSummary.data)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
        toast.error('Klarte ikke laste liste over ansatte, prøv igjen senere')
      })
  }

  if (isLoading) {
    return (
      <div className="loadSpin d-flex align-items-center">
        <Spinner animation="border" className="spinn" />
        <h3>Laster inn oversikt</h3>
      </div>
    )
  } else if (!isLoading && users.length === 0) {
    return <h3>Fant ikke noe data...</h3>
  } else {
    return (
      <>
        <div className="admin-container">
          <h2>Brukere</h2>

          {/* Add text input field */}
          <div className="mb-3">
            <label htmlFor="filterInput" className="form-label">
              Filtrer brukere:
            </label>
            <input
              type="text"
              className="form-control"
              id="filterInput"
              onChange={(e) => setFilterValue(e.target.value)}
              style={{ width: '300px' }}
            />
          </div>

          <NewUserModal />

          <Table
            striped
            bordered
            hover
            style={
              !isLoading && budgetTypes.length > 0 ? {} : { display: 'none' }
            }
          >
            <thead>
              <tr key={'headerRow'}>
                <th key={'brukerHeader'}>Brukere</th>
                {budgetTypes.map((budgetType) => (
                  <th key={budgetType.id + '' + budgetType.balanceIsHours}>
                    {budgetType.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) =>
                  (user.name
                    ? user.name.toLowerCase()
                    : user.email.toLowerCase()
                  ).includes(filterValue.toLowerCase()),
                ) // Filter users by text input value
                .sort((a, b) => compareUsers(a, b))
                .map((userRow) => (
                  <Fragment key={userRow.email}>
                    <tr key={userRow.email}>
                      {/* pass event object to handleExpandUser */}
                      <td key={userRow.email}>
                        {userRow.name ? userRow.name : userRow.email}
                      </td>
                      {budgetTypes.map((budgetColumn) => (
                        <td
                          key={
                            userRow.email +
                            budgetColumn.id +
                            '' +
                            budgetColumn.balanceIsHours
                          }
                        >
                          {getBudgetBalanceForType(
                            userRow.budgets!,
                            budgetColumn,
                          )}
                        </td>
                      ))}
                      <td
                        onClick={() => handleExpandUser(userRow)}
                        style={{
                          display: 'flex',
                          height: 41,
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            userRow.email === expandedUser
                              ? faChevronCircleUp
                              : faChevronCircleDown
                          }
                        />
                      </td>
                    </tr>
                    {expandedUser === userRow.email ? (
                      <tr key={`${userRow.email}-expanded`}>
                        <td colSpan={budgetTypes.length + 2}>
                          {/* +2 for brukere and expand button columns */}
                          <BudgetList
                            budgets={userRow.budgets ?? []}
                            refreshBudgets={refreshTable}
                            activeBudgetId={activeBudget}
                            updateActiveBudget={setActiveBudget}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
            </tbody>
          </Table>
        </div>
      </>
    )
  }
}

export default Admin
