import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/nb'

dayjs.locale('nb')

export default function DatePickerExample({
  value,
  onChange,
}: {
  value: Dayjs | null
  onChange: (newValue: Dayjs | null) => void
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Velg hvor gamle utlysninger du vil se (3 måneder som standard)"
        value={value}
        onChange={onChange}
        format="DD.MM.YYYY"
        disableFuture
        slotProps={{ textField: { fullWidth: true } }}
      />
    </LocalizationProvider>
  )
}
