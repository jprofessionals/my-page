import { useState } from 'react'
import ApiService from '../../services/api.service'
import Moment from 'moment'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Budget } from '@/types'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'

type Props = {
  budget: Budget
  refreshBudgets: Function
  toggle: Function
}

const CreateBudgetPost = ({ budget, refreshBudgets, toggle }: Props) => {
  const [description, setDescription] = useState('')
  const [amountExMva, setAmountExMva] = useState(0)
  const [date, setDate] = useState(Moment().format('YYYY-MM-DD'))
  const [isLoadingPost, setIsLoadingPost] = useState(false)

  const isValid = amountExMva > 0 && description && description !== ''

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      setIsLoadingPost(true)
      const budgetPost = {
        date: date,
        description: description,
        amountExMva: amountExMva,
        expense: true,
      }
      ApiService.createBudgetPost(budgetPost, budget.id).then(
        () => {
          refreshBudgets()
          toggle()
          setIsLoadingPost(false)
          toast.success('Lagret ' + description)
        },
        () => {
          setIsLoadingPost(false)
          toast.error('Fikk ikke opprettet ' + description + ', prøv igjen')
        },
      )
    }
  }

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value)
  }

  const handleAmountChange = (e: any) => {
    setAmountExMva(e.target.value)
  }

  const handleDateChange = (e: any) => {
    setDate(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="overflow-hidden w-full rounded-xl border border-gray-500 shadow-sm">
        <div className="flex justify-between items-center p-2 w-full text-sm bg-accent/80">
          <input
            className="input input-md"
            type="text"
            name="description"
            placeholder="Beskrivelse"
            onChange={handleDescriptionChange}
            value={description}
          />
        </div>
        <div className="flex flex-col gap-2 items-start p-3">
          <strong>Pris:</strong>
          <label>
            <input
              type="number"
              className="w-48 input input-bordered input-sm"
              name="amountExMva"
              placeholder="Pris"
              onChange={handleAmountChange}
              value={amountExMva}
            />
          </label>
          <strong>Dato:</strong>
          <label>
            <input
              className="w-48 input input-bordered input-sm"
              type="date"
              name="date"
              onChange={handleDateChange}
              value={date}
              placeholder={date}
            />
          </label>
          <Button type="submit" disabled={!isValid} size="sm" className="mt-4">
            <span>
              Legg til utlegg
              <Loading isLoading={isLoadingPost} />
            </span>
          </Button>
        </div>
      </div>
    </form>
  )
}

export default CreateBudgetPost
