import { Calendar } from '@/components/ui/calendar'
import jPro_Hytte from '../images/jPro_Hytte.png'
import React from 'react'
import Image from 'next/image'
import { pickDate } from '@/components/ui/pickDate'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'

function Hyttebooking() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 p-4">
        <div className="prose items-center rounded-lg max-w-7xl overflow-hidden border bgColor: bg-slate-200 gap-2 p-2 flex">
          <div className=" flex-1 relative">
            <h1>Påmelding firmahytte</h1>
            <div className="bg-orange-500 h-1.5"></div>
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

        <div>{pickDate()}</div>

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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }} className="p-4 ">
        <Button type="submit" size="sm" className="mt-4 mr-4">
          <span>Måned oversikt</span>
        </Button>
        <Button type="submit" size="sm" className="mt-4 mr-4">
          <span>År oversikt</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
        />
      </div>


    </div>
  )
}

export default Hyttebooking

/*
<div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div className="flex justify-between items-center">


        <div className="flex flex-col gap-4 p-4">
            <div className="prose items-center rounded-lg max-w-7xl overflow-hidden border bgColor: bg-slate-200 gap-2 p-2 flex">
                <div className=" flex-1 relative">
                    <h2 >Påmelding firmahytte</h2>
                    <div className="bg-orange-500 h-1.5"></div>
                    <p>
                        Tekst her
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <Image
                        src={jPro_Hytte}
                        alt="jPro"
                        style={{ marginLeft: '10px', borderRadius: '8px' }}
                    />
                </div>
            </div>

            <div>
                {pickDate()}
            </div>

            <p>
                <span><strong>Overtagelse:</strong></span> overtagelse onsdag kl 16. Det betyr at man kan bli til onsdag, så lenge hytta er klar til kl 16.
            </p>

            <p>
                <span><strong>Grønne perioder:</strong></span> Alle som er interesserte sier i fra innen 15. september. Så trekker vi rekkefølgen. Deretter velger folk etter tur. Kommer vi til slutten av listen, snur vi trekkrekkefølgen og fortsetter å velge til alle periodene er tatt.
            </p>

            <p>
                <span><strong>Vanlig helger:</strong></span> Førstemann til mølla, men hvis en annen kommer innen 7 dager (File -&gt; Revision history), så skal vi trekke. Eventuelt kan man kanskje snakke sammen?
            </p>

            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"

            />
        </div>




<div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between items-center rounded-lg bgColor: bg-slate-200 gap-2 p-2 flex">
                <div className=" flex-1 relative">
                    <b >Påmelding firmahytte</b>
                    <div className="bg-orange-500 h-1.5"></div>
                    <p>
                        Tekst her
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <Image
                        src={jPro_Hytte}
                        alt="jPro"
                        style={{ marginLeft: '10px', borderRadius: '8px' }}
                    />
                </div>
            </div>
            <div>
                {pickDate()}
            </div>
        </div>



 */
