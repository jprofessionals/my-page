import React from 'react'
import classes from './BookingBar.module.css'

export enum BarType {
  mine,
  theirs,
  train,
}

type Props = {
  isStart: boolean
  isEnd: boolean
  label?: string
  barType: BarType
  onClick: () => void
}

const BookingBar = ({ isStart, isEnd, label, barType, onClick }: Props) => {
  return <div
    onClick={onClick}
    className={`
              ${classes.bookingBar} 
              ${isStart && classes.bookingBarPeriodStart}  
              ${isEnd && classes.bookingBarPeriodEnd}
              ${barType === BarType.mine && classes.bookingBarMine}
              ${barType === BarType.theirs && classes.bookingBarTheirs} 
              ${barType === BarType.train && classes.bookingBarTrain} 
          `}
  >
    {isStart && <div
        className={`
                  ${classes.bookingBarNameLabel}
              `}
      >
        {label}
      </div>}
  </div>
}

export default BookingBar
