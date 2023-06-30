import jPro_Hytte from '../images/jPro_Hytte.png'
import { useState } from 'react'
import Image from 'next/image'

import { PickDate } from '@/components/ui/pickDate'
import MonthOverview from '@/components/hyttebooking/MonthOverview'
import YearOverview from '@/components/hyttebooking/YearOverview'

import { Button } from '@/components/ui/button'
import * as React from 'react'
import ApiService from '@/services/api.service'

function Hyttebooking() {
  const [showMonthOverview, setShowMonthOverview] = useState(true)
  const [showYearOverview, setShowYearOverview] = useState(false)

  const handleShowMonthOverview = () => {
    setShowMonthOverview(true)
    setShowYearOverview(false)
  }

  const handleShowYearOverview = () => {
    setShowYearOverview(true)
    setShowMonthOverview(false)
  }

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex overflow-hidden gap-2 items-center p-2 max-w-7xl rounded-lg border prose bgColor: bg-slate-200">
          <div className="relative flex-1">
            <h1>Påmelding firmahytte</h1>
            <div className="h-1.5 bg-orange-500"></div>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>

          <Image
            src={jPro_Hytte}
            alt="jPro"
            style={{ marginLeft: '10px', borderRadius: '8px' }}
          />
        </div>

        <p>
          <span>
            <strong>Overtagelse:</strong>
          </span>{' '}
          overtagelse onsdag kl 16. Det betyr at man kan bli til onsdag, så
          lenge hytta er klar til kl 16.
        </p>

        <p>
          <span>
            <strong>Grønne perioder:</strong>
          </span>{' '}
          Alle som er interesserte sier i fra innen 15. september. Så trekker vi
          rekkefølgen. Deretter velger folk etter tur. Kommer vi til slutten av
          listen, snur vi trekkrekkefølgen og fortsetter å velge til alle
          periodene er tatt.
        </p>

        <p>
          <span>
            <strong>Vanlig helger:</strong>
          </span>{' '}
          Førstemann til mølla, men hvis en annen kommer innen 7 dager (File
          -&gt; Revision history), så skal vi trekke. Eventuelt kan man kanskje
          snakke sammen?
        </p>
      </div>
      <div className="flex justify-end p-4">
        <Button
          size="sm"
          className={`mt-4 mr-4 ${showMonthOverview ? 'bg-orange-500' : ''}`}
          onClick={handleShowMonthOverview}
        >
          Måned oversikt
        </Button>
        <Button
          size="sm"
          className={`mt-4 mr-4 ${showYearOverview ? 'bg-orange-500' : ''}`}
          onClick={handleShowYearOverview}
        >
          År oversikt
        </Button>
      </div>

      {showMonthOverview && <MonthOverview />}
      {showYearOverview && <YearOverview />}
    </div>
  )
}

export default Hyttebooking
