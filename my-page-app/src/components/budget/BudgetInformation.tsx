import moment from 'moment'
import { Budget } from '@/types'
import getInNok from '@/utils/getInNok'

type Props = {
  budget: Budget
}

const intervalOfDeposit = (interval: number) =>
  interval === 1 ? 'måned' : `${interval}.måned`

const BudgetInformation = ({ budget }: Props) => (
  <div className="w-full">
    <div className="grid grid-cols-2 gap-4 p-2">
      {budget.budgetType.deposit > 0 ? (
        <div className="flex flex-col">
          <strong title="Opptjening">Opptjening: </strong>
          <span>
            {`${getInNok(budget.budgetType.deposit)} hver ${intervalOfDeposit(
              budget.budgetType.intervalOfDepositInMonths,
            )}`}
          </span>
        </div>
      ) : null}
      {budget.budgetType.rollOver ? (
        <>
          <div className="flex flex-col">
            <strong title="Startbeløp">Startbeløp: </strong>
            {getInNok(budget.startAmount)} (
            {moment(budget.startDate).format('DD.MM.YYYY')})
          </div>          
        </>
      ) : <>
        <div className="flex flex-col">
            <strong title="Årlig budsjett">Årlig budsjett: </strong>
            {getInNok(budget.budgetType.startAmount)}
        </div>
      </>
      }
      {budget.posts.length > 0 ? (
        <div className="flex flex-col">
          <strong title="Dato for siste kjøp">Dato for siste kjøp: </strong>
          {budget.posts[0]
            ? moment(budget.posts[0].date).format('DD.MM.YYYY')
            : 'aldri'}
        </div>
      ) : null}
      <div className="flex flex-col">
        <strong title="Forbruk i år">Forbruk i år: </strong>
        {getInNok(budget.sumPostsCurrentYear)}
      </div>
      <div className="flex flex-col">
        <strong title="Forbruk siste 12 måneder">
          Forbruk siste 12 måneder:{' '}
        </strong>
        {getInNok(budget.sumPostsLastTwelveMonths)}
      </div>
      {budget.budgetType.allowTimeBalance ? (
        <>
          <div className="flex flex-col">
            <strong title="Antall timer brukt i år">
              Antall timer brukt i år:{' '}
            </strong>
            {budget.sumHoursCurrentYear === 1
              ? budget.sumHoursCurrentYear + ' time'
              : budget.sumHoursCurrentYear + ' timer'}
          </div>
          <div className="flex flex-col">
            <strong title="Antall timer brukt siste 12 måneder">
              Antall timer brukt siste 12 måneder:{' '}
            </strong>
            {budget.sumHoursLastTwelveMonths === 1
              ? budget.sumHoursLastTwelveMonths + ' time'
              : budget.sumHoursLastTwelveMonths + ' timer'}
          </div>
        </>
      ) : null}
    </div>
  </div>
)

export default BudgetInformation
