import jPro_Hytte from '../images/jPro_Hytte.png'
import {useState} from 'react'
import Image from 'next/image'
import MonthOverview from '@/components/hyttebooking/MonthOverview'
import YearOverview from '@/components/hyttebooking/YearOverview'
import {Button} from '@/components/ui/button'

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
              Denne siden er under produksjon av årets sommerstudenter.
              Vi håper den vil være til stor nytte i nærmeste fremtid!
              Med vennlig hilsen,
              Sophie, Ulrik og Torbjørn.
            </p>
            <p>
              Vi setter pris på tilbakemeldinger for forbedringer:)
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
           som hovedregel er overtagelse onsdag kl 16. Det betyr at man kan bli til onsdag, så
          lenge hytta er klar til kl 16.
        </p>

        <p>
          <span>
            <strong>Trekning:</strong>
          </span>{' '}
          det vil foregå to trekninger iløpet av kalenderåret, én på våren og én på høsten.
          Dato for trekning vil bli oppdatert når endelig dato er satt.
          Alle som melder interesse vil bli satt opp i en tilfeldig rangert liste.
          Deretter velger folk etter tur, fra topp til bunn. Kommer vi til slutten av
          listen, snur vi trekkrekkefølgen og fortsetter til toppen av listen.
        </p>

        <p>
          <span>
            <strong>Ledige dager:</strong>
          </span>{' '}
          etter trekning vil det muligens være dager hvor hytte-enhetene står ledig.
          Her er det førstemann til mølla som gjelder. Med unntak, hvis en annen melder interesse innen 7 dager.
          Det vil da foregå en ny trekning mellom de interesserte.
        </p>

        <p>
          <span>
            <strong>Booking:</strong>
          </span>{' '}
          oppretting, endring og sletting av bookinger vil foregå når man trykker på en bestemt dato.
          Dette er foreløpig under produksjon. Her planlegges det å opprette et varslingssytem på slack
          så alle ansatte blir oppdatert på visse endringer.
        </p>

        <p>
          For mer informasjon se {' '}
          <a
              href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/hyttereglement?authuser=1"
              className="text-warning"
          >
            Hytteregelment.
          </a>
        </p>

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
        </div>
      </div>
      {/*<div className="flex justify-end p-4">
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
      </div>*/}

      {showMonthOverview && <MonthOverview />}
      {showYearOverview && <YearOverview />}

    </div>
  )
}

export default Hyttebooking
