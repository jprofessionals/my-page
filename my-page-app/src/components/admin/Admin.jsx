import './Admin.scss'
import { useEffect, useState, Fragment } from 'react'
import apiService from '../../services/api.service'
import { toast } from 'react-toastify'
import { Spinner, Table } from 'react-bootstrap'
import Budgets from '../budget/Budgets'

function Admin() {
  const [users, setUsers] = useState([])
  const [budgetTypes, setBudgetTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState(null)
  const [filterValue, setFilterValue] = useState('')

  useEffect(() => {
    refreshTable()
    // eslint-disable-next-line
  }, [])

  const extractListOfBudgets = (users) => {
    if (users.length > 0) {
      const extractedBudgetTypes = []
      users.map((user) =>
        user.budgets.forEach((budget) => {
          if (!budgetTypeListContains(extractedBudgetTypes, budget)) {
            budget.budgetType.balanceIsHours = false
            extractedBudgetTypes.push(budget.budgetType)
            if (budget.budgetType.allowTimeBalance) {
              const budgetTypeHours = Object.assign({}, budget.budgetType)
              budgetTypeHours.balanceIsHours = true
              budgetTypeHours.name += '(timer)'
              extractedBudgetTypes.push(budgetTypeHours)
            }
          }
        }),
      )
      setBudgetTypes(extractedBudgetTypes)
    }
  }

  const budgetTypeListContains = (extractedBudgetTypes, newBudget) => {
    return extractedBudgetTypes.some(
      (budgetType) => budgetType.id === newBudget.budgetType.id,
    )
  }

  const getBudgetBalanceForType = (budgets, type) => {
    var foundBudget = budgets.find((budget) => budget.budgetType.id === type.id)
    if (type.balanceIsHours) {
      return budgetBalanceHoursCurrentYear(foundBudget)
    } else {
      return budgetBalance(foundBudget)
    }
  }

  const budgetBalance = (budget) => {
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

  const budgetBalanceHours = (budget) => {
    if (budget) {
      return budget.sumHours + (budget.sumHours === 1 ? ' time' : ' timer')
    } else {
      return '-'
    }
  }

  const budgetBalanceHoursCurrentYear = (budget) => {
    if (budget) {
      return (
        budget.sumHoursCurrentYear +
        (budget.sumHoursCurrentYear === 1 ? ' time' : ' timer')
      )
    } else {
      return '-'
    }
  }

  const handleExpandUser = (user, event) => {
    // Check if the clicked target is not a child of the expanded area
    const expandedArea = document.querySelector(
      `[data-expanded-user="${user.email}"]`,
    )
    if (expandedArea === null || !expandedArea.contains(event.target)) {
      setExpandedUser(user === expandedUser ? null : user)
    }
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
                  user.name.toLowerCase().includes(filterValue.toLowerCase()),
                ) // Filter users by text input value
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((userRow) => (
                  <Fragment key={userRow.email}>
                    <tr key={userRow.email}>
                      {' '}
                      {/* pass event object to handleExpandUser */}
                      <td key={userRow.email}>{userRow.name}</td>
                      {budgetTypes.map((budgetColumn) => (
                        <td
                          key={
                            userRow.email +
                            budgetColumn.id +
                            '' +
                            budgetColumn.balanceIsHours
                          }
                          onClick={(event) => handleExpandUser(userRow, event)}
                        >
                          {getBudgetBalanceForType(
                            userRow.budgets,
                            budgetColumn,
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandedUser === userRow && (
                      <tr
                        key={`${userRow.email}-expanded`}
                        data-expanded-user={userRow.email}
                      >
                        {' '}
                        {/* add data-expanded-user attribute */}
                        <td colSpan={budgetTypes.length + 2}>
                          {' '}
                          {/* +2 for brukere and expand button columns */}
                          {<Budgets user={userRow} useLogggedInUser={false} />}
                        </td>
                      </tr>
                    )}
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
