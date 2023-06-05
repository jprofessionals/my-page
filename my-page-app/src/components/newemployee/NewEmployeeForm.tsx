import { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { NewEmployee } from '@/types'

type Props = {
  inputData: NewEmployee
  setInputData: Dispatch<SetStateAction<NewEmployee>>
}

const NewEmployeeForm = ({ inputData, setInputData }: Props) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target
    setInputData((prevState) => ({
      ...prevState,
      [id]: value,
    }))
  }

  return (
    <form className="flex flex-col gap-4">
      <div className="form-control">
        <label className="w-full input-group">
          <span>E-post</span>
          <input
            id="email"
            type="email"
            className="flex-1 input input-bordered"
            value={inputData.email}
            onChange={handleChange}
          />
          <span>@jpro.no</span>
        </label>
        <label className="justify-end pb-0 label">
          <span className="label-text">
            (@jpro.no blir automagisk lagt til)
          </span>
        </label>
      </div>

      <div className="form-control">
        <label className="w-full input-group">
          <span>AnsattNummer</span>
          <input
            id="employeeNumber"
            type="number"
            min={0}
            value={inputData.employeeNumber}
            onChange={handleChange}
            className="flex-1 input input-bordered"
          />
        </label>
      </div>
      <div className="form-control">
        <label className="w-full input-group">
          <span>Startdato for budsjetter</span>
          <input
            id="budgetStartDate"
            type="date"
            value={inputData.budgetStartDate}
            onChange={handleChange}
            className="flex-1 input input-bordered"
          />
        </label>
      </div>
    </form>
  )
}

export default NewEmployeeForm
