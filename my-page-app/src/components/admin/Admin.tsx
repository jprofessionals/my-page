import React, { Fragment, useState } from 'react'
import apiService, { API_URL } from '../../services/api.service'
import { Spinner, Table } from 'react-bootstrap'
import { Budget, BudgetType, User } from '@/types'
import BudgetList from '@/components/budget/BudgetList'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronCircleUp } from "@fortawesome/free-solid-svg-icons";
import { faChevronCircleDown } from "@fortawesome/free-solid-svg-icons/faChevronCircleDown";
import { useQuery } from "react-query";
import axios from "axios";
import authHeader from "@/services/auth-header";

const budgetTypeListContains = (
  extractedBudgetTypes: BudgetType[],
  newBudget: Budget,
) => {
  return extractedBudgetTypes.some(
    (budgetType: BudgetType) => budgetType.id === newBudget.budgetType.id,
  )
}

const getBudgetTypes = async (): Promise<BudgetType[]> => {
  const response = await axios.get(API_URL + 'budget', { headers: authHeader() })
  const budgets: Budget[] = response.data
  const extractedBudgetTypes: BudgetType[] = []

  budgets.map((budget) => {
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
  })

  return extractedBudgetTypes
}

const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(API_URL + 'user', { headers: authHeader() })
  return response.data
}

function Admin() {
  const [expandedUser, setExpandedUser] = useState<string>('')
  const [filterValue, setFilterValue] = useState('')

  const { data: users = [], isLoading: isLoadingUsers } = useQuery('users', () => getUsers())
  const { data: budgetTypes = [], isLoading: isLoadingBudgetTypes } = useQuery('budgetTypes', () => getBudgetTypes())

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

  if (isLoadingUsers || isLoadingBudgetTypes) {
    return (
      <div className="loadSpin d-flex align-items-center">
        <Spinner animation="border" className="spinn" />
        <h3>Laster inn oversikt</h3>
      </div>
    )
  } else if (!isLoadingUsers && users.length === 0) {
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
              !isLoadingBudgetTypes && budgetTypes.length > 0 ? {} : { display: 'none' }
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
                      >
                        {getBudgetBalanceForType(
                          userRow.budgets!,
                          budgetColumn,
                        )}
                      </td>
                    ))}
                    <td onClick={() => handleExpandUser(userRow)}
                        style={{
                          display: 'flex',
                          height: 41,
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}>
                      <FontAwesomeIcon
                        icon={userRow.email === expandedUser ? faChevronCircleUp : faChevronCircleDown}
                      />
                    </td>
                  </tr>
                  {expandedUser === userRow.email ? (
                    <tr
                      key={`${userRow.email}-expanded`}
                    >
                      <td colSpan={budgetTypes.length + 2}>
                        {/* +2 for brukere and expand button columns */}
                        <BudgetList
                          budgets={userRow.budgets ?? []}
                          refreshBudgets={getUsers}
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
