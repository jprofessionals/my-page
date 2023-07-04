import jPro_Hytte from '../images/jPro_Hytte.png'
import { useState } from 'react'
import Image from 'next/image'

import { PickDate } from '@/components/ui/pickDate'
import MonthOverview from '@/components/hyttebooking/MonthOverview'
import YearOverview from '@/components/hyttebooking/YearOverview'

import { Button } from '@/components/ui/button'

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
              Denne siden er under produksjon av årets tre sommerstudenter. Vi håper dere får god nytte av denne i nærmeste fremtid!
              Med vennlig hilsen,
              Sophie, Ulrik og Torbjørn.
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
        {/*<Button
          size="sm"
          className={`mt-4 mr-4 ${showYearOverview ? 'bg-orange-500' : ''}`}
          onClick={handleShowYearOverview}
        >
          År oversikt
        </Button>*/}
      </div>

      {showMonthOverview && <MonthOverview />}
      {showYearOverview && <YearOverview />}

      <div className="flex flex-col gap-3 mt-7">
        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-orange-brand" />
          <span>
            Stor leilighet: 13 sengeplasser (dyr <strong>ikke</strong> tilatt)
          </span>
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-blue-small-appartment" />
          Liten leilighet: 11 sengeplasser (dyr tilatt, men ikke på soverom)
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-teal-annex" />
          <span>
            Annekset: 10 sengeplasser (dyr <strong>ikke</strong> tilatt)
          </span>
        </div>

        <div className="flex gap-2 p-0 mb-10 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-red-not-available" />
          Ikke tilgjengelig - arbeid på hytta
        </div>
      </div>
    </div>
  )
}

export default Hyttebooking
