import Post from './Post'
import CreateBudgetPost from './CreateBudgetPost'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  IconDefinition,
  faChevronDown,
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
import clsx from 'clsx'
import { get } from 'radash'

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
    bgColor: 'bg-slate-100',
    textColor: 'text-black',
    icon: null,
  },
}

const BudgetItem = ({
  budget,
  refreshBudgets,
  type,
  isActive,
  setActiveId,
}: Props) => {
  const { posts } = budget
  const [cardItem, setCardItem] = useState<any>()

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

  const budgetConfig = get(
    budgetConfigs,
    type === 'list' ? 'default' : budget.budgetType.name,
    budgetConfigs.default,
  )

  return (
    <div
      style={{
        margin: 0,
      }}
      className={clsx(
        'collapse show card flex card-bordered self-start shadow-lg',
        {
          'first:rounded-t-lg last:rounded-b-lg rounded-none': type === 'list',
        },
        isActive ? 'collapse-open' : '',
      )}
    >
      <button
        className={clsx(
          'text-sm grid grid-cols-2 items-center pr-6 collapse-title self-start hover:brightness-90 focus:brightness-90',
          budgetConfig?.textColor,
          budgetConfig?.bgColor,
        )}
        onClick={() => setActiveId(isActive ? '' : budget.id)}
      >
        <span title="Type budsjett" className="flex gap-2 uppercase">
          {budgetConfig?.icon ? (
            <FontAwesomeIcon
              icon={budgetConfig?.icon}
              size="xl"
              className="w-8"
            />
          ) : null}
          {budget.budgetType.name}{' '}
        </span>
        <div className="flex gap-4 justify-end">
          <span title="Saldo">Saldo: {getInNok(budget.balance)}</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={clsx(
              isActive ? 'rotate-180' : 'rotate-0',
              'place-self-end self-center',
            )}
          />
        </div>
      </button>
      <div className="collapse-content">
        {isActive ? (
          <>
            <BudgetInformation budget={budget} />
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-3 pl-3">
                <h3 className="text-xl font-bold">Historikk</h3>
                <RequireAdmin>
                  <button
                    onClick={toggler}
                    className="text-xl rounded-full btn btn-info btn-sm"
                  >
                    <FontAwesomeIcon
                      className={clsx(
                        cardItem ? 'rotate-45' : '',
                        'transition-all',
                      )}
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
                <span style={posts.length > 0 ? { display: 'none' } : {}}>
                  Ingen historikk funnet
                </span>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default BudgetItem
