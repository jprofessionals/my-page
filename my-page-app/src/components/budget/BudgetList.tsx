import { Budget } from '@/types'
import BudgetItem from '@/components/budget/BudgetItem'
import styles from './BudgetList.module.scss'
import { Accordion } from 'react-bootstrap'

type Props = {
  budgets: Budget[]
  refreshBudgets: () => void
}

const BudgetList = ({ budgets, refreshBudgets }: Props) => {
  console.log('Budgets: ', { budgets })
  return (
    <div>
      <div className={styles.headerBudgets}>
        <h3 className={styles.headerText}>Dine budsjetter</h3>
      </div>
      <div>
        <Accordion>
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

export default BudgetList
