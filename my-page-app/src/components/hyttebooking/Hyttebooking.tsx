import jPro_Hytte from '../images/jPro_Hytte.png'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import MonthOverview from '@/components/hyttebooking/MonthOverview'
import YearOverview from '@/components/hyttebooking/YearOverview'
import { Button } from '@/components/ui/button'
import AdminBooking from "@/components/hyttebooking/AdminBooking";

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

  const fastsatt_tip = "Hytten er opptatt i den angitte perioden"
  const pending_tip = "Hytten er ledig i perioden. En eller flere brukere har lagt inn et ønske om å reservere hytten, og det er fortsatt mulig å melde seg på trekningen"

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex overflow-hidden gap-2 items-center p-2 max-w-7xl rounded-lg border prose bgColor: bg-slate-200">
          <div className="relative flex-1">
            <h1>Reservasjon av firmahytte</h1>
            <div className="h-1.5 bg-orange-500"></div>
            <p>
              På denne siden får du oversikt over når de forskjellige enhetene på hytta er ledig.
              Siden er under kontinuerlig utvikling og vi setter stor pris på alle tilbakemeldinger og bidrag :)
            </p>  
            <p>Mer informasjon finnes <a
            href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/hyttereglement?authuser=1"
            className="text-warning"> her</a> og på <a href="https://jpro.slack.com/archives/C83007C8L" className="text-warning">Slack</a>.</p>          
          </div>
          <Image
            className="hidden md:block mt-0 rounded"
            src={jPro_Hytte}
            alt="jPro"
          />
        </div>

        <p>
          <span>
            <strong>Overtagelse:</strong>
          </span>{' '}
          som hovedregel er overtagelse onsdag kl 16. Det betyr at man kan bli
          til onsdag, så lenge hytta er klar til kl 16.
        </p>

        <p>
          <span>
            <strong>Trekning:</strong>
          </span>{' '}
          det vil foregå to trekninger iløpet av kalenderåret, én på våren og én
          på høsten. Dato for trekning vil bli oppdatert når endelig dato er
          satt. Alle som melder interesse vil bli satt opp i en tilfeldig
          rangert liste. Deretter fordeles perioder etter tur, fra topp til bunn.
          Kommer vi til slutten av listen, snur vi trekkrekkefølgen og
          går gjennom listen en gang til. Det er ingen funksjonalitet for dette
          så trekningen vil skje eksternt og resultatet legges her når trekningen er gjennomført.
        </p>

        <p>
          <span>
            <strong>Ledige dager:</strong>
          </span>{' '}
          etter trekning vil det muligens være dager hvor hytte-enhetene er
          ledig. Da kan man legge inn ønske om å få en enhet ved å trykke på en dato og velge 
          enhet og ønsket start og slutt for periode. Merk at en periode ikke kan være 7 mer enn dager.
          Om det er mer enn 7 dager til ønsket periode starter vil det gjøres en
          automatisk trekning mellom de som har meldt interesse etter at 7 dager
          har gått fra det første ønsket ble meldt. Er det mindre en 7 dager til 
          ønsket periode starter må trekningen gjøres manuelt, si ifra til
          Roger for få gjennomført en trekning. Når en trekning er gjennomført postes
          det en melding til <a href="https://jpro.slack.com/archives/C83007C8L" className="text-warning">#hytte</a> på Slack.
        </p>

        <p>
          <span>
            <strong>Reservering:</strong>
          </span>{' '}
          oppretting, endring og sletting av reservasjoner eller ønsker vil foregå når man
          trykker på en bestemt dato. Siste reserverbare dato markeres med en{' '}
          <span className="text-red-500">rød</span> kant i kalenderen, og det er
          ikke mulig å reservere datoer etter denne dagen. 
        </p>

        <p>
          <span>
            <strong>Informasjon om reservasjoner:</strong>
          </span>{' '}
          Ved å trykke på en bestemt dag får man opp en fullstendig oversikt
          over alle hyttene, hvem som har reservert, og i hvilken periode. I
          tillegg får man opp eventuelle ledige hytter på den dagen. Dersom du
          lurer på hvem som eier en spesifikk reservasjon kan du holde musa over
          den i kalenderen. Dine egne reservasjoner markeres med en svart kant.
        </p>

        <p>
          For mer informasjon se{' '}
          <a
            href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/hyttereglement?authuser=1"
            className="text-warning"
          >
            Hytteregelment.
          </a>
        </p>

        <AdminBooking/>

        <div className="flex flex-col gap-3 mt-7">
          <div className="flex gap-2 bg-gray-100 rounded-lg">
            <div className="w-6 rounded-lg bg-orange-brand tooltip tooltip-right" data-tip={fastsatt_tip} />
            /
            <div className="w-6 rounded-lg bg-pattern bg-yellow-200 tooltip tooltip-right" data-tip={pending_tip} />
            <span>
              Stor leilighet: 13 sengeplasser (dyr <strong>ikke</strong> tilatt)
            </span>
          </div>

          <div className="flex gap-2 bg-gray-100 rounded-lg tooltip">
            <div className="w-6 rounded-lg bg-blue-small-appartment tooltip tooltip-right" data-tip={fastsatt_tip}/>
            /
            <div className="w-6 rounded-lg bg-pattern bg-purple-200 tooltip tooltip-right" data-tip={pending_tip}/>
            Liten leilighet: 11 sengeplasser (dyr tilatt, men ikke på soverom)
          </div>

          <div className="flex gap-2 bg-gray-100 rounded-lg">
            <div className="w-6 rounded-lg bg-teal-annex tooltip tooltip-right" data-tip={fastsatt_tip} />
            /
            <div className="w-6 rounded-lg bg-pattern bg-green-200 tooltip tooltip-right" data-tip={pending_tip}/>
            <span>
              Annekset: 10 sengeplasser (dyr <strong>ikke</strong> tilatt)
            </span>
          </div>
        </div>
      </div>

      {showMonthOverview && <MonthOverview />}
      {showYearOverview && <YearOverview />}
    </div>
  )
}

export default Hyttebooking
