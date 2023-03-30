import Post from './Post'
import styles from './BudgetItem.module.scss'
import CreateBudgetPost from './CreateBudgetPost'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faRemove } from '@fortawesome/free-solid-svg-icons'
import { useContext, useEffect, useState } from 'react'
import RequireAdmin from '../../utils/RequireAdmin'
import { Accordion, AccordionContext, Button } from 'react-bootstrap'
import BudgetInformation from './BudgetInformation'
import { Budget } from '@/types'

type Props = {
  budget: Budget
  refreshBudgets: any
}

const BudgetItem = ({ budget, refreshBudgets }: Props) => {
  const postList = budget.posts
  const [posts, setPosts] = useState<any[]>([])
  const [cardItem, setCardItem] = useState<any>()
  const { activeEventKey } = useContext(AccordionContext)

  const toggler = (e: any) => {
    if (!cardItem) {
      setCardItem(
        <CreateBudgetPost
          budget={budget}
          refreshBudgets={refreshBudgets}
          toggle={setCardItem}
        />,
      )
      e.target.closest('button').blur()
    } else {
      setCardItem(null)
      e.target.closest('button').blur()
    }
  }

  useEffect(() => {
    setPosts(postList)
  }, [postList])

  return (
    <Accordion.Item key={budget.id} eventKey={budget.id}>
      <Accordion.Header title={activeEventKey === budget.id ? 'Lukk' : 'Åpne'}>
        <ul className={styles.initialBudgetInformation}>
          <li>
            <span title="Type budsjett">{budget.budgetType.name}</span>
          </li>
          <li>
            <span title="Saldo">
              Saldo:{' '}
              {budget.balance.toLocaleString('no-NO', {
                maximumFractionDigits: 2,
                style: 'currency',
                currency: 'NOK',
              })}
            </span>
          </li>
        </ul>
      </Accordion.Header>
      <Accordion.Body>
        <BudgetInformation budget={budget} />
        <div className={styles.posts}>
          <div className={styles.header}>
            <h3 className={styles.headerText}>Historikk</h3>
            <RequireAdmin>
              <Button onClick={toggler} className="plus shadow-none">
                <FontAwesomeIcon
                  className="toggleButton"
                  icon={cardItem ? faRemove : faPlus}
                  title={cardItem ? 'Avbryt' : 'Legg til ny post'}
                />
              </Button>
            </RequireAdmin>
          </div>
          {cardItem}
          <span style={posts.length > 0 ? { display: 'none' } : {}}>
            Ingen historikk funnet
          </span>
          {posts
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .map((post) => (
              <Post
                // className="post"
                key={post.id}
                post={post}
                budget={budget}
                refreshBudgets={refreshBudgets}
              />
            ))}
        </div>
      </Accordion.Body>
    </Accordion.Item>
  )
}

export default BudgetItem
