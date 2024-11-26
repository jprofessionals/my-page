import React, { useState } from 'react'
import ApiService from '../../services/api.service'
import moment from 'moment'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Budget } from '@/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'

type Props = {
  isDeleteModalOpen?: boolean
  toggle: () => void
  refreshBudgets: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: any
  budget: Budget
  setIsLoadingEditPost: (isLoadingEditPost: boolean) => void
  isLoadingEditPost: boolean
}

const EditBudgetPost = ({
  toggle,
  refreshBudgets,
  post,
  setIsLoadingEditPost,
  isLoadingEditPost,
}: Props) => {
  const [description, setDescription] = useState(post.description)
  const [amountExMva, setAmountExMva] = useState(post.amountExMva)
  const [date, setDate] = useState(moment().format(post.date))

  const isValid = () => {
    return amountExMva > 0 && description && description !== ''
  }

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!isValid()) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      setIsLoadingEditPost(true)
      const budgetPost = {
        date: date,
        description: description,
        amountExMva: amountExMva,
      }
      ApiService.editBudgetPost(post.id, budgetPost).then(
        () => {
          refreshBudgets()
          toggle()
          setIsLoadingEditPost(false)
          toast.success('Lagret ' + description)
        },
        () => {
          setIsLoadingEditPost(false)
          toast.error('Fikk ikke oppdatert ' + description + ', prøv igjen')
        },
      )
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountExMva(e.target.value)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
  }

  return (
    <div className="overflow-hidden w-full rounded-xl border-2 border-gray-500 border-solid shadow-sm">
      <div className="flex justify-between items-center px-3 pt-3 pb-2 w-full text-sm bg-gray-200">
        <input
          className="input input-sm"
          type="text"
          name="description"
          placeholder="Beskrivelse"
          onChange={handleDescriptionChange}
          value={description}
        />
        <div className="btn-group">
          <button
            className="btn btn-success btn-sm"
            type="submit"
            disabled={!isValid()}
            onClick={handleSubmit}
            title="Lagre Post"
          >
            {isLoadingEditPost ? (
              <FontAwesomeIcon
                icon={faRefresh}
                className="animate-spin"
                size="sm"
              />
            ) : (
              //<FontAwesomeIcon icon={faCheck} />
              'Lagre'
            )}
          </button>
          <button
            className="btn btn-sm"
            type="button"
            title="Avbryt redigering"
            disabled={isLoadingEditPost}
            onClick={() => toggle()}
          >
            {!isLoadingEditPost ? (
              'Avbryt'
            ) : (
              <FontAwesomeIcon
                icon={faRefresh}
                className="animate-spin"
                size="sm"
              />
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
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
      </div>
    </div>
  )
}

export default EditBudgetPost
