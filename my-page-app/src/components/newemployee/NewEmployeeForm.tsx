import { ChangeEvent, Dispatch, SetStateAction } from 'react'
import styles from './NewEmployeeForm.module.scss'
import { NewEmployee } from '@/types'


type Props = {
  inputData: NewEmployee,
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
    <form className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor='email'>E-post:</label>
        <input
          id='email'
          type='email'
          value={inputData.email}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor='employeeNumber'>Ansattnummer:</label>
        <input
          id='employeeNumber'
          type='number'
          value={inputData.employeeNumber}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor='budgetStartDate'>Startdato for budsjetter:</label>
        <input
          id='budgetStartDate'
          type='date'
          value={inputData.budgetStartDate}
          onChange={handleChange}
        />
      </div>
    </form>
  )
}

export default NewEmployeeForm