import { Budget } from '@/types'
import BudgetItem from '@/components/budget/BudgetItem'
import styles from './BudgetList.module.scss'
import { Accordion } from 'react-bootstrap'
import {AccordionEventKey} from "react-bootstrap/AccordionContext";

type Props = {
  budgets: Budget[]
  refreshBudgets: (userId?: string) => void
  activeBudgetId: AccordionEventKey | null
  updateActiveBudget: (budgetId: AccordionEventKey) => void
}

const BudgetList = ({ budgets, refreshBudgets,activeBudgetId, updateActiveBudget }: Props) => {
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
      <div className={styles.budgets}>
        <div className={styles.headerBudgets}>
          <h3>Dine budsjetter</h3>
        </div>
        <div>
          <Accordion
              activeKey={activeBudgetId}
              onSelect={(selectedBudget) => {
                  updateActiveBudget(selectedBudget)
              }}
          >
            {budgets.map((budget) => (
              <BudgetItem
                key={budget.id}
                budget={budget}
                refreshBudgets={refreshBudgets}
              />
            ))}
          </Accordion>
        </div>
      </div>
    )
  }
}

export default BudgetList
