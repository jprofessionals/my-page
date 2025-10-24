import { useState, useEffect } from 'react'
import jPro_Hytte from '../images/jPro_Hytte.png'
import Image from 'next/image'
import Link from 'next/link'
import MonthOverview from '@/components/hyttebooking/month-overview/MonthOverview'
import AdminBooking from '@/components/hyttebooking/AdminBooking'
import InfoNotices from './InfoNotices'
import bookingBarStyles from '@/components/hyttebooking/month-overview/components/month-calendar/calendar-cell/booking-bar/BookingBar.module.css'
import cabinLotteryService from '@/services/cabinLottery.service'

function Hyttebooking() {
  const [currentDrawing, setCurrentDrawing] = useState<{ status: string } | null>(null)
  const [loadingDrawing, setLoadingDrawing] = useState(true)

  // Test user selection (for local dev)
  const testUsers = [
    { id: '', name: 'Standard bruker' },
    { id: '1', name: 'Steinar Hansen (Admin)' },
    { id: '2', name: 'Test User' },
    { id: '3', name: 'Ola Nordmann' },
    { id: '4', name: 'Kari Hansen' },
    { id: '5', name: 'Per Jensen' },
    { id: '6', name: 'Anne Olsen' },
  ]
  const [selectedTestUser, setSelectedTestUser] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('testUserId') || ''
    }
    return ''
  })

  // Update localStorage when test user changes
  const handleTestUserChange = (userId: string) => {
    setSelectedTestUser(userId)
    if (userId) {
      localStorage.setItem('testUserId', userId)
    } else {
      localStorage.removeItem('testUserId')
    }
    // Reload page to apply new user context
    window.location.reload()
  }

  useEffect(() => {
    cabinLotteryService
      .getCurrentDrawing()
      .then((response) => {
        setCurrentDrawing(response.data)
      })
      .catch((error) => {
        console.error('Failed to fetch current drawing:', error)
      })
      .finally(() => {
        setLoadingDrawing(false)
      })
  }, [])

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 p-4">
        {/* Test user selector - Only works in development (backend enforces this) */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <span className="text-sm font-medium text-yellow-800">🧪 DEV MODE</span>
            </div>
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test som bruker:
              </label>
              <select
                value={selectedTestUser}
                onChange={(e) => handleTestUserChange(e.target.value)}
                className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {testUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Velg en bruker for å teste hyttebooking og hyttetrekning som forskjellige personer. Fungerer kun i lokal utviklingsmodus.
          </p>
        </div>
        <div className="flex overflow-hidden gap-2 items-center p-2 max-w-7xl rounded-lg prose bgColor: bg-slate-200">
          <div className="relative flex-1">
            <h1>Reservasjon av firmahytte</h1>
            <div className="h-1.5 bg-orange-500"></div>
            <p>
              På denne siden får du oversikt over når de forskjellige enhetene
              på hytta er ledig. Siden er under kontinuerlig utvikling og vi
              setter stor pris på alle tilbakemeldinger og bidrag :)
            </p>
            <p>
              Mer informasjon finnes{' '}
              <a
                href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/hyttereglement?authuser=1"
                className="text-warning"
              >
                {' '}
                her
              </a>{' '}
              og på{' '}
              <a
                href="https://jpro.slack.com/archives/C83007C8L"
                className="text-warning"
              >
                Slack
              </a>
              .
            </p>
          </div>
          <Image
            className="hidden md:block mt-0 rounded-sm"
            src={jPro_Hytte}
            alt="jPro"
            priority={true}
          />
        </div>

        {!loadingDrawing && currentDrawing && currentDrawing.status === 'OPEN' && (
          <Link href="/hyttetrekning" className="block no-underline">
            <div className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Hyttetrekning</h2>
                  <p className="text-lg text-white opacity-90">
                    Meld dine ønsker for kommende periode og delta i trekningen
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        <p>
          <span>
            <strong>Overtagelse:</strong>
          </span>{' '}
          som hovedregel er overtagelse onsdag kl 16. Det betyr at man kan bli
          til onsdag, så lenge hytta er klar til kl 16. Hytta vaskes mellom 11
          og 17 hver onsdag og vaskepersonalet trenger da tilgang til
          leilighetene.
        </p>

        <p>
          <span>
            <strong>Trekning:</strong>
          </span>{' '}
          det vil foregå to trekninger iløpet av kalenderåret, én på våren og én
          på høsten. Dato for trekning vil bli oppdatert når endelig dato er
          satt. Alle som melder interesse vil bli satt opp i en tilfeldig
          rangert liste. Deretter fordeles perioder etter tur, fra topp til
          bunn. Kommer vi til slutten av listen, snur vi trekkrekkefølgen og går
          gjennom listen en gang til. Det er ingen funksjonalitet for dette så
          trekningen vil skje eksternt og resultatet legges her når trekningen
          er gjennomført.
        </p>

        <p>
          <span>
            <strong>Ledige dager:</strong>
          </span>{' '}
          etter trekning vil det muligens være dager hvor hytte-enhetene er
          ledig. Da kan man legge inn ønske om å få en enhet ved å trykke på en
          dato for en ledig enhet og ønsket start og slutt for periode. Merk at
          en periode ikke kan være 7 mer enn dager. Om det er minst 4 dager til
          ønsket periode starter vil det gjøres en automatisk trekning mellom de
          som har meldt interesse. Trekning finner sted midt mellom oppholdets
          startdato, rundet oppover, og datoen det første ønsket ble meldt, men
          aldri mer enn 7 dager etter det første ønsket ble meldt. Er det mindre
          enn 4 dager til ønsket periode starter må trekningen gjøres manuelt,
          si ifra til Amalie for få gjennomført en trekning. Når en trekning er
          gjennomført postes det en melding til{' '}
          <a
            href="https://jpro.slack.com/archives/C83007C8L"
            className="text-warning"
          >
            #hytte
          </a>{' '}
          på Slack.
        </p>

        <p>
          <span>
            <strong>Reservering:</strong>
          </span>{' '}
          oppretting, endring og sletting av reservasjoner eller ønsker vil
          foregå når man trykker på en bestemt dato. Siste reserverbare dato
          markeres med en <span className="text-red-500">rød</span> kant i
          kalenderen, og det er ikke mulig å reservere datoer etter denne dagen.
        </p>

        <div>
          <span>
            <strong>Enheter:</strong>
          </span>{' '}
          <ul>
            <li>
              Stor leilighet: 13 sengeplasser (dyr <strong>ikke</strong> tilatt)
            </li>
            <li>
              Liten leilighet: 11 sengeplasser (dyr tilatt, men ikke på soverom)
            </li>
            <li>
              Annekset: 10 sengeplasser (dyr <strong>ikke</strong> tilatt)
            </li>
          </ul>
        </div>

        <p>
          For mer informasjon se{' '}
          <a
            href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/hyttereglement?authuser=1"
            className="text-warning"
          >
            Hytteregelment.
          </a>
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexGrow: '1',
          }}
        >
          <AdminBooking />
          <InfoNotices />
        </div>
        <div className="flex flex-col gap-3 mt-7">
          <div className="flex gap-2 bg-gray-100 rounded-lg">
            <div
              className={`w-6 rounded-lg tooltip tooltip-right ${bookingBarStyles.bookingBarMine}`}
            />
            Dine reservasjoner
          </div>

          <div className="flex gap-2 bg-gray-100 rounded-lg tooltip">
            <div
              className={`w-6 rounded-lg tooltip tooltip-right ${bookingBarStyles.bookingBarTheirs}`}
            />
            Andres reservasjoner
          </div>

          <div className="flex gap-2 bg-gray-100 rounded-lg">
            <div
              className={`w-6 rounded-lg tooltip tooltip-right ${bookingBarStyles.bookingBarTrain}`}
              style={{ borderLeftWidth: '6px', borderRightWidth: '6px' }}
            />
            Trekninger
          </div>
        </div>
      </div>

      <MonthOverview />
    </div>
  )
}

export default Hyttebooking
