import React, { useState } from 'react'
import { InfoBooking } from '@/types'
import style from './CalendarInfoNotice.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'

type Props = {
  infoNotices: InfoBooking[]
}

const CalendarInfoNotice = ({ infoNotices }: Props) => {
  const [showNotices, setShowNotices] = useState<boolean>(false)

  return (
    <div className={style.info} onClick={() => setShowNotices(!showNotices)}>
      <FontAwesomeIcon icon={faCircleExclamation} className={style.icon} />
      {showNotices && (
        <div id="dialog" className={style.dialog}>
          <ul>
            {infoNotices.map((infoNotice) => (
              <li key={infoNotice.id}>{infoNotice.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
export default CalendarInfoNotice
