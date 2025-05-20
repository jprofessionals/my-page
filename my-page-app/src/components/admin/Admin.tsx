import { ChangeEvent, Fragment, useEffect, useState } from 'react'
import apiService from '../../services/api.service'
import { toast } from 'react-toastify'
import {
  Budget,
  BudgetSummary,
  BudgetType,
  BudgetYearSummary, ToggleActive, ToggleAdmin,
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
  const [disabledUsers, setDisabledUsers] = useState<User[]>([])
  const [budgetTypes, setBudgetTypes] = useState<BudgetType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string>('')
  const [filterValue, setFilterValue] = useState('')
  const [activeBudget, setActiveBudget] = useState<string | null>(null)
  const [budgetSummary, setBudgetsummary] = useState<BudgetSummary[]>([])
  const { user, settings } = useAuthContext()
  const [newAdminUser, setNewAdminUser] = useState<ToggleAdmin>()
  const [deactivateUser, setDeactivateUser] = useState<ToggleActive>()
  const [activateUser, setActivateUser] = useState<ToggleActive>()

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
        maximumFractionDigits: 0,
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
          maximumFractionDigits: 0,
          style: 'currency',
          currency: 'NOK',
        }) +
        ' (' +
        budget.balance.toLocaleString('no-NO', {
          maximumFractionDigits: 0,
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
        Math.round(budget.sumHoursCurrentYear) +
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
      return Math.round(budget.hours) + (budget.hours === 1 ? ' time' : ' timer')
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
          .getDisabledUsers()
          .then((disabledUsers) => {
            setDisabledUsers(disabledUsers.data)
          })
          .catch(() => {
            toast.error('Klarte ikke laste deaktiverte brukere, prøv igjen senere')
          })

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

  async function handleMakeAdmin() {
      if (!newAdminUser) return;
      try {
        await apiService.toggleAdmin(newAdminUser.email, newAdminUser.isAdmin);
        toast.success("Admin oppdatert");
        refreshTable();
        setNewAdminUser(undefined);
      } catch {
        toast.error("Feil ved oppdatering av admin-status");
      }
  }

  async function handleDeactivateUser() {
    if (!deactivateUser) return;
    try {
      await apiService.toggleActive(deactivateUser.email, deactivateUser.isActive);
      toast.success("Bruker deaktivert");
      refreshTable();
      setNewAdminUser(undefined);
    } catch {
      toast.error("Feil ved oppdatering av bruker");
    }
  }

  async function handleActivateUser() {
    if (!activateUser) return;
    try {
      await apiService.toggleActive(activateUser.email, activateUser.isActive);
      toast.success("Bruker aktivert");
      refreshTable();
      setNewAdminUser(undefined);
    } catch {
      toast.error("Feil ved oppdatering av bruker");
    }
  }

  // Handler to remove admin status
  async function handleRemoveAdmin(email: string) {
    try {
      await apiService.toggleAdmin(email, false);
      toast.success("Admin-status fjernet");
      refreshTable();
    } catch {
      toast.error("Feil ved fjerning av admin-status");
    }
  }

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
          <h2 className="prose prose-xl">Budsjetter</h2>
          <div>Viser budsjetter og forbruk for alle ansatte. <b>Kompetanse</b> og <b>Laptop & mobil</b> viser hvor mye ansatte har igjen på respektive budsjett, <b>Kompetanse(timer)</b> viser hvor mye som er forbrukt inneværende år mens <b>Hjemmekontor</b> og <b>Bruttotrekk</b> viser hvor mye som er brukt.</div>
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
                  (user.budgets != undefined && user.budgets?.length > 0) &&
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
          <span>Viser totalt forbruk per år og hvor mye som er utestående (for <b>Kompetanse</b> & <b>Laptop & mobil</b>). NB! Kompetansebudsjett nulles hvert år, mens Laptop & mobil fortsetter å akumulere.</span>
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
        <div className="overflow-auto p-4">
          <h2 className="prose prose-xl">Admin brukere</h2>
          <ul className="mt-4 space-y-2">
            {users.filter(user => user.admin).map(userRow => (
              <li key={userRow.email} className="flex items-center">
                <span>{userRow.name ?? userRow.email}</span>
                <button
                  onClick={() => handleRemoveAdmin(userRow.email)}
                  className="btn btn-secondary btn-sm ml-4"
                >
                  Fjern admin
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center space-x-2">
            <select
              value={newAdminUser?.email || ''}
              onChange={(e) => setNewAdminUser({ email: e.target.value, isAdmin: true })}
              className="select select-bordered"
            >
              <option value="">Velg bruker…</option>
              {users.filter(u => !u.admin).sort((a, b) => compareUsers(a, b)).map(u => (
                <option key={u.email} value={u.email}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleMakeAdmin}
              disabled={!newAdminUser}
              className="btn btn-primary"
            >
              Gjør til admin
            </button>
          </div>
        </div>


        <div className="overflow-auto p-4">
          <h2 className="prose prose-xl">Deaktiverte brukere</h2>
          <div className="mt-4 flex items-center space-x-2">
            <select
              value={activateUser?.email || ''}
              onChange={(e) => setActivateUser({ email: e.target.value, isActive: true })}
              className="select select-bordered"
            >
              <option value="">Velg bruker du vil aktivere</option>
              {disabledUsers.sort((a, b) => compareUsers(a, b)).map(u => (
                <option key={u.email} value={u.email}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleActivateUser}
              disabled={!activateUser}
              className="btn btn-primary"
            >
              Aktiver
            </button>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <select
              value={deactivateUser?.email || ''}
              onChange={(e) => setDeactivateUser({ email: e.target.value, isActive: false })}
              className="select select-bordered"
            >
              <option value="">Velg bruker du vil deaktivere</option>
              {users.filter(u => !u.admin).sort((a, b) => compareUsers(a, b)).map(u => (
                <option key={u.email} value={u.email}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleDeactivateUser}
              disabled={!deactivateUser}
              className="btn btn-primary"
            >
              Deaktiver
            </button>
          </div>
        </div>

      </>
    )
  }
}

export default Admin
