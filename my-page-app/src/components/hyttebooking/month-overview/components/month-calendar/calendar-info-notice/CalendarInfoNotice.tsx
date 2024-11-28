import React, {useState} from 'react'
import { InfoBooking } from '@/types'
import style from './CalendarInfoNotice.module.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircleExclamation} from "@fortawesome/free-solid-svg-icons";

type Props = {
  infoNotice: InfoBooking
}

const CalendarInfoNotice = ({ infoNotice }: Props) => {
  const [showNoticeDescription, setShowNoticeDescription] =
    useState<boolean>(false)

  return (
    <div
      className={style.info}
      onClick={() => setShowNoticeDescription(!showNoticeDescription)}
    >
      <FontAwesomeIcon icon={faCircleExclamation} className={style.icon}/>
      {showNoticeDescription && (
        <div id="dialog" className={style.dialog}>
          {infoNotice.description}
        </div>
      )}
    </div>
  )
}
export default CalendarInfoNotice
