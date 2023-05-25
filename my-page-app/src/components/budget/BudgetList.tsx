import { Budget } from '@/types'
import BudgetItem from '@/components/budget/BudgetItem'
import clsx from 'clsx'

type Props = {
  budgets: Budget[]
  refreshBudgets: (userId?: string) => void
  activeBudgetId: string | null
  updateActiveBudget: (budgetId: string) => void
  type: 'tiles' | 'list'
}

const BudgetList = ({
  budgets,
  refreshBudgets,
  type,
  activeBudgetId,
  updateActiveBudget,
}: Props) => {
  if (budgets.length === 0) {
    return (
      <div>
        <div>
          <h3>Du har ingen budsjetter</h3>
          <p>Kontakt ledelsen for å få opprettet budsjettene dine</p>
        </div>
      </div>
    )
  } else {
    return (
      <div className="p-4">
        {type === 'tiles' ? (
          <h3 className="mb-6 text-3xl font-light">
            Oversikt over dine budsjetter
          </h3>
        ) : null}
        <div
          className={clsx(
            type === 'tiles' ? 'gap-y-2 gap-x-3 lg:grid grid-cols-2' : '',
          )}
        >
          {budgets.map((budget) => (
            <BudgetItem
              key={budget.id}
              isActive={budget.id === activeBudgetId}
              budget={budget}
              refreshBudgets={refreshBudgets}
              setActiveId={updateActiveBudget}
              type={type}
            />
          ))}
        </div>
      </div>
    )
  }
}

export default BudgetList
