import { ChangeEvent, Fragment, useEffect, useState } from 'react'
import apiService from '../../services/api.service'
import { toast } from 'react-toastify'
import {
  Budget,
  BudgetSummary,
  BudgetType,
  BudgetYearSummary,
  User,
} from '@/types'
import BudgetList from '@/components/budget/BudgetList'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronCircleDown } from '@fortawesome/free-solid-svg-icons/faChevronCircleDown'
import NewUserModal from '@/components/admin/NewUserModal'
import { useAuthContext } from '@/providers/AuthProvider'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'
import cn from '@/utils/cn'

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
  const [activeBudget, setActiveBudget] = useState<string | null>(null)
  const [budgetSummary, setBudgetsummary] = useState<BudgetSummary[]>([])
  const { user, settings } = useAuthContext()

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

  const getBudgetBalanceForSummary = (
    budgets: BudgetYearSummary[],
    type: BudgetType,
  ) => {
    const foundBudget = budgets.find(
      (budget) => budget.budgetType.id === type.id,
    )
    if (!foundBudget) return null
    if (type.balanceIsHours) {
      return budgetBalanceHoursCurrentYearForSummary(foundBudget)
    } else {
      return budgetBalanceForSummary(foundBudget)
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

  const budgetBalanceForSummary = (budget: BudgetYearSummary) => {
    if (budget) {
      return (
        budget.sum.toLocaleString('no-NO', {
          maximumFractionDigits: 2,
          style: 'currency',
          currency: 'NOK',
        }) +
        ' (' +
        budget.balance.toLocaleString('no-NO', {
          maximumFractionDigits: 2,
          style: 'currency',
          currency: 'NOK',
        }) +
        ')'
      )
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

  const budgetBalanceHoursCurrentYearForSummary = (
    budget: BudgetYearSummary,
  ) => {
    if (budget) {
      return budget.hours + (budget.hours === 1 ? ' time' : ' timer')
    } else {
      return '-'
    }
  }

  const handleExpandUser = (user: User) => {
    // Check if the clicked target is not a child of the expanded area
    setExpandedUser(expandedUser === user.email ? '' : user.email)
  }

  const updateSetting = (event: ChangeEvent<HTMLInputElement>) => {
    const setting =
      settings == null
        ? null
        : settings.find((element) => element.settingId === event.target.id)
    if (setting != null) {
      setting.settingValue = event.target.value
      apiService.patchSetting(setting.settingId, setting)
    }
  }

  const refreshTable = () => {
    setIsLoading(true)
    apiService
      .getUsers()
      .then((responseSummary) => {
        setUsers(responseSummary.data)
        extractListOfBudgets(responseSummary.data)

        apiService
          .getBudgetSummary()
          .then((budgetSummary) => {
            setBudgetsummary(budgetSummary)
            setIsLoading(false)
          })
          .catch(() => {
            setIsLoading(false)
            toast.error('Klarte ikke laste oppsumeringen, prøv igjen senere')
          })
      })
      .catch(() => {
        setIsLoading(false)
        toast.error('Klarte ikke laste liste over ansatte, prøv igjen senere')
      })
  }

  if (!user?.admin) return null

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center mt-[30%] gap-4">
        <FontAwesomeIcon icon={faRefresh} className="animate-spin" size="3x" />
        <h3>Laster inn oversikt</h3>
      </div>
    )
  } else if (!isLoading && users.length === 0) {
    return <h3>Fant ikke noe data...</h3>
  } else {
    return (
      <>
        <div className="overflow-auto p-4">
          <h2 className="prose prose-xl">Våre ansatte</h2>

          {/* Add text input field */}
          <div className="flex gap-16">
            <div className="mb-4 form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Filtrer ansatte…"
                  className="input input-bordered"
                  onChange={(e) => setFilterValue(e.target.value)}
                />
                <button className="btn btn-square">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <NewUserModal />
          </div>

          <table className="table overflow-x-auto mt-4 shadow-xl table-xs border-slate-600">
            <thead>
              <tr className="text-base text-slate-900">
                <th className="rounded-tl-lg bg-slate-300">Brukere</th>
                {budgetTypes.map((budgetType) => (
                  <th
                    key={budgetType.id + '' + budgetType.balanceIsHours}
                    className="bg-slate-300"
                  >
                    {budgetType.name}
                  </th>
                ))}
                <th key="action" className="px-6 rounded-tr-lg bg-slate-300" />
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
                    <tr
                      key={userRow.email}
                      className={cn(
                        userRow.email === expandedUser && 'active',
                        'hover',
                      )}
                    >
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
                        className="text-center cursor-pointer hover:brightness-90"
                      >
                        <FontAwesomeIcon
                          icon={faChevronCircleDown}
                          size="xl"
                          className={cn(
                            userRow.email === expandedUser && 'rotate-180',
                          )}
                        />
                      </td>
                    </tr>
                    {expandedUser === userRow.email ? (
                      <tr key={`${userRow.email}-expanded`}>
                        <td colSpan={budgetTypes.length + 2}>
                          {/* +2 for brukere and expand button columns */}
                          <span className="text-lg font-bold">
                            {userRow.name}
                          </span>
                          <BudgetList
                            type="list"
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
          </table>
        </div>
        <div className="overflow-auto p-4">
          <h2 className="prose prose-xl">Oppsummering</h2>
          <table className="table overflow-x-auto mt-4 shadow-xl table-xs border-slate-600">
            <thead>
              <tr className="text-base text-slate-900">
                <th className="rounded-tl-lg bg-slate-300">År</th>
                {budgetTypes.map((budgetType) => (
                  <th
                    key={budgetType.id + '' + budgetType.balanceIsHours}
                    className="bg-slate-300"
                  >
                    {budgetType.name}
                  </th>
                ))}
                <th key="action" className="px-6 rounded-tr-lg bg-slate-300" />
              </tr>
            </thead>
            <tbody>
              {budgetSummary
                .sort((a, b) => a.year - b.year)
                .map((budgetYearSummary) => (
                  <Fragment key={budgetYearSummary.year}>
                    <tr key={budgetYearSummary.year}>
                      <td key={budgetYearSummary.year}>
                        {budgetYearSummary.year}
                      </td>
                      {budgetTypes.map((budgetColumn) => (
                        <td
                          key={
                            budgetYearSummary.year +
                            budgetColumn.id +
                            '' +
                            budgetColumn.balanceIsHours
                          }
                        >
                          {getBudgetBalanceForSummary(
                            budgetYearSummary.yearSummary!,
                            budgetColumn,
                          )}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-auto p-4">
          <h2 className="prose prose-xl">Konfigurasjon</h2>
          <table className="table overflow-x-auto mt-4 shadow-xl table-xs border-slate-600">
            <thead>
              <tr className="text-base text-slate-900">
                <th className="w-3/4 rounded-tl-lg bg-slate-300">
                  innstilling
                </th>
                <th className="w-1/4 rounded-tr-lg bg-slate-300">Verdi</th>
              </tr>
            </thead>
            <tbody>
              {settings == null
                ? ''
                : settings
                    .sort((a, b) => a.priority - b.priority)
                    .map((setting) => (
                      <tr key={setting.settingId}>
                        <td>{setting.description}</td>
                        <td>
                          <input
                            id={setting.settingId}
                            type="text"
                            className="input input-bordered"
                            defaultValue={setting.settingValue}
                            onChange={(e) => updateSetting(e)}
                          />
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }
}

export default Admin
