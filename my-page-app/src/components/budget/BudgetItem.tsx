import Post from './Post'
import CreateBudgetPost from './CreateBudgetPost'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  IconDefinition,
  faGraduationCap,
  faHome,
  faLaptop,
  faMoneyBill,
  faPhone,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import RequireAdmin from '../../utils/RequireAdmin'
import BudgetInformation from './BudgetInformation'
import { Budget } from '@/types'
import getInNok from '@/utils/getInNok'
import { get } from 'radash'
import * as Accordion from '../ui/accordion'
import cn from '@/utils/cn'

type Props = {
  budget: Budget
  isActive: boolean
  setActiveId: (id: string) => void
  refreshBudgets: any
  type: 'list' | 'tiles'
}

const budgetConfigs: Record<
  string,
  {
    bgColor: string
    textColor: string
    icon: IconDefinition | null
  }
> = {
  Kompetanse: {
    bgColor: 'bg-green-600',
    textColor: 'text-white',
    icon: faGraduationCap,
  },
  Mobil: {
    bgColor: 'bg-slate-600',
    textColor: 'text-white',
    icon: faPhone,
  },
  Laptop: {
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    icon: faLaptop,
  },
  Hjemmekontor: {
    bgColor: 'bg-slate-950',
    textColor: 'text-white',
    icon: faHome,
  },
  Bruttotrekk: {
    bgColor: 'bg-stone-200',
    textColor: 'text-black',
    icon: faMoneyBill,
  },
  default: {
    bgColor: 'bg-slate-200',
    textColor: 'text-black',
    icon: null,
  },
}

const BudgetItem = ({ budget, refreshBudgets, type }: Props) => {
  const { posts } = budget
  const [cardItem, setCardItem] = useState<any>()

  const handleAddBudgetItem = () => {
    if (!cardItem) {
      setCardItem(
        <CreateBudgetPost
          budget={budget}
          refreshBudgets={refreshBudgets}
          toggle={setCardItem}
        />,
      )
    } else {
      setCardItem(null)
    }
  }

  const budgetConfig = get(
    budgetConfigs,
    type === 'list' ? 'default' : budget.budgetType.name,
    budgetConfigs.default,
  )

  return (
    <Accordion.Item value={budget.id} className="border-none">
      <Accordion.Trigger
        className={cn(
          'text-sm rounded-lg items-center px-3 gap-2 self-start hover:brightness-90 focus:brightness-90 data-open:brightness-90 data-open:rounded-b-none',
          budgetConfig?.textColor,
          budgetConfig?.bgColor,
        )}
      >
        <div className="flex flex-1 gap-4 justify-between">
          <span
            title="Type budsjett"
            className="flex flex-wrap gap-2 justify-center uppercase"
          >
            {budgetConfig?.icon ? (
              <FontAwesomeIcon
                icon={budgetConfig?.icon}
                size="xl"
                className="w-8"
              />
            ) : null}
            {budget.budgetType.name}{' '}
          </span>
          <span title="Saldo">Saldo: {getInNok(budget.balance)}</span>
        </div>
      </Accordion.Trigger>
      <Accordion.Content className="p-2 rounded-b-lg data-open:border-2">
        <BudgetInformation budget={budget} />
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center py-3 pl-3">
            <h3 className="text-xl font-bold">Historikk</h3>
            <RequireAdmin>
              <button
                onClick={handleAddBudgetItem}
                className="text-xl rounded-full btn btn-info btn-sm"
              >
                <FontAwesomeIcon
                  className={cn(cardItem ? 'rotate-45' : '', 'transition-all')}
                  icon={faPlus}
                  title={cardItem ? 'Avbryt' : 'Legg til ny post'}
                />
              </button>
            </RequireAdmin>
          </div>
          {cardItem}
          {posts.length > 0 ? (
            posts
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  budget={budget}
                  refreshBudgets={refreshBudgets}
                  showActions={type === 'list'}
                />
              ))
          ) : (
            <span>Ingen historikk funnet</span>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

export default BudgetItem
