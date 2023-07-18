import { useState } from 'react'
import ApiService from '../../services/api.service'
import moment from 'moment'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'

type Props = {
    apartmentId: number
}

const CreateBookingPost = ({apartmentId}: Props) => {
    const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'))
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'))
    const [isLoadingPost, setIsLoadingPost] = useState(false)

    const isValid = startDate < endDate && moment(endDate).diff(startDate, 'days') <= 7

    const handleSubmit = (e: any) => {
        e.preventDefault()
        if (!isValid) {
            toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
        } else {
            setIsLoadingPost(true)
            const bookingPost = {
                apartmentID: apartmentId,
                startDate: startDate,
                endDate: endDate,
            }
            ApiService.createBookingPost(bookingPost).then(
                () => {
                    setIsLoadingPost(false)
                    toast.success('Lagret booking')
                },
                (error) => {
                    setIsLoadingPost(false)
                    toast.error(error)
                },
            )
        }
    }

    const handleStartDateChange = (e: any) => {
        setStartDate(e.target.value)
    }
    const handleEndDateChange = (e: any) => {
        setEndDate(e.target.value)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="overflow-hidden w-full rounded-xl border border-gray-500 shadow-sm">
                <div className="flex flex-col gap-2 items-start p-3">
                    <strong>Startdato:</strong>
                    <label>
                        <input
                            type="date"
                            className="w-48 input input-bordered input-sm"
                            name="startDate"
                            onChange={handleStartDateChange}
                            value={startDate}
                            placeholder={startDate}
                        />
                    </label>
                    <strong>Sluttdato:</strong>
                    <label>
                        <input
                            className="w-48 input input-bordered input-sm"
                            type="date"
                            name="endDate"
                            onChange={handleEndDateChange}
                            value={endDate}
                            placeholder={endDate}
                        />
                    </label>
                    <Button type="submit" disabled={!isValid} size="sm" className="mt-4">
            <span>
              Legg til booking
              <Loading isLoading={isLoadingPost} />
            </span>
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default CreateBookingPost
