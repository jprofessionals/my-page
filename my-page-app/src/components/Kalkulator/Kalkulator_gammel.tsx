import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
// import moment from 'moment'
// import { Button } from '../ui/button'
import getInNok from '@/utils/getInNok'
import getSetting from '@/utils/getSetting'
import { Settings } from '@/types'
import { useAuthContext } from '@/providers/AuthProvider'


function Kalkulator_gammel() {
  // const [selectedMonth, setSelectedMonth] = useState(moment().format('MM'))
  // const [selectedYear, setSelectedYear] = useState(moment().format('yyyy'))

  const [garantilonn, setGarantilonn] = useState(0)
  const [grunnbelop, setGrunnbelop] = useState(0)
  const [timeprisKompetanse, setTimeprisKompetanse] = useState(0)

  const [bonus, setBonus] = useState(0)
  const [restKompetanseBudsjett, setRestKompetanseBudsjett] = useState(0)
  const [timeprisProsjekt, setTimeprisProsjekt] = useState(0)

  const [billableHoursThisYear] = useState(
    1695,
  )

  const [antallTimerMnd, setAntallTimerMnd] = useState(
    162.5,
  )
  const [antallTimerFakturert, setAntallTimerFakturert] =
    useState(antallTimerMnd)

  const [antallTimerKompetanse, setAntallTimerKompetanse] = useState(0)
  const [antallTimerInterntid, setAntallTimerInterntid] = useState(0)
  const [antallTimerInterntidMedKomp, setAntallTimerInterntidMedKom] =
    useState(0)
  const [antallTimerFerie, setAntallTimerFerie] = useState(0)
  const [antallTimerSyk, setAntallTimerSyk] = useState(0)

  const { settings } = useAuthContext()
  const [prevSettings, setPrevSettings] = useState<Settings[] | undefined>(settings)
  if (settings != prevSettings) {
    setPrevSettings(settings)
    setGarantilonn(parseInt(getSetting(settings, 'CALC_GARANTILONN') ?? '0'))
    setGrunnbelop(parseInt(getSetting(settings, 'CALC_GRUNNBELOP') ?? '0'))
    setTimeprisKompetanse(parseInt(getSetting(settings, 'CALC_TIMEPRIS_KOMPETANSE') ?? '0'))
    setBonus(parseInt(getSetting(settings, 'CALC_BONUS') ?? '0'))
    setRestKompetanseBudsjett(parseInt(getSetting(settings, 'CALC_RESTKOMPETANSE') ?? '0'))
    setTimeprisProsjekt(parseInt(getSetting(settings, 'CALC_TIMEPRIS') ?? '0'))
  }

  function Timelonn9G() {
    return (grunnbelop * 9) / 1880
  }

  function SumSykeLonn() {
    return Timelonn9G() * AntallTimerSyk()
  }

  function AntallTimerSyk() {
    return antallTimerSyk
  }

  function SumFakturertTid() {
    return timeprisProsjekt * 0.52 * antallTimerFakturert
  }

  function SumIntertidMedKomp() {
    return timeprisProsjekt * 0.52 * antallTimerInterntidMedKomp
  }

  function SumBetaltTid() {
    return (
      +SumSykeLonn() +
      +SumFakturertTid() +
      +SumKompetanse() +
      +SumIntertidMedKomp()
    )
  }

  function SumKompetanse() {
    return (
      timeprisKompetanse *
      0.52 *
      Math.min(antallTimerKompetanse, restKompetanseBudsjett)
    )
  }

  function SumTilgjengeligTid() {
    return (
      +antallTimerFakturert +
      +antallTimerKompetanse +
      +antallTimerInterntid +
      +antallTimerInterntidMedKomp +
      +AntallTimerSyk()
    )
  }

  function BeregnetGarantilonn() {
    return Math.min(1, +SumTilgjengeligTid() / antallTimerMnd) * garantilonn
  }

  function Bruttolonn() {
    return +Math.max(BeregnetGarantilonn(), SumBetaltTid()) + +bonus
  }

  function BruttoArsLonn() {
    return billableHoursThisYear * timeprisProsjekt * 0.52 * 1.12 + +bonus
  }

  // const handleMonthAndYearChange = () => {
  //   const billableHoursForMonth = getBillableHours(selectedYear, selectedMonth)
  //   setBillableHoursThisYear(getBillabeHoursEntireYear(selectedYear))
  //   setAntallTimerMnd(billableHoursForMonth)
  //   setAntallTimerFakturert(billableHoursForMonth)
  // }

  // const handleGarantilonnChange = (e: any) => {
  //   setGarantilønn(e.target.value)
  // }
  //
  // const handleGrunnbelopChange = (e: any) => {
  //   setGrunnbelop(e.target.value)
  // }
  // const handleTimeprisKompetanseChange = (e: any) => {
  //   setTimeprisKompetanse(e.target.value)
  // }

  const handleAntallTimerMndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAntallTimerMnd(Number(e.target.value))
  }

  const handleRestKompetanseBudsjettChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestKompetanseBudsjett(Number(e.target.value))
  }

  const handleTimeprisProsjektChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeprisProsjekt(Number(e.target.value))
  }

  const handleAntallTimerFakturertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAntallTimerFakturert(Number(e.target.value))
  }

  const handleAntallTimerKompetanseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAntallTimerKompetanse(Number(e.target.value))
  }

  const handleAntallTimerInterntidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAntallTimerInterntid(Number(e.target.value))
  }

  const handleAntallTimerInterntidMedKomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAntallTimerInterntidMedKom(Number(e.target.value))
  }

  const handleAntallTimerFerieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAntallTimerFerie(Number(e.target.value))
  }

  const handleAntallTimerSykChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAntallTimerSyk(Number(e.target.value))
  }

  const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBonus(Number(e.target.value))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="prose">
        <h2>Lønnskalkulator</h2>
        <p>
          Her kan du se omtrentlig hvordan vi beregner lønn hver måned. Du kan
          selv leke med tallene for å se hvordan dette påvirker beregningen av
          bruttolønn. Mer info om timeføring og lønnsberegning finner du på{' '}
          <a href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/l%C3%B8nn-og-timef%C3%B8ring">
            intranett
          </a>
          . Forklaring av tilgjengelige timeføringskontoer finnes også på{' '}
          <a href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/l%C3%B8nn-og-timef%C3%B8ring/timef%C3%B8ring">
            intranett
          </a>
          .
        </p>
        {/*<p>Se utregning basert på år og måned:</p>*/}
        {/*<div className="flex flex-wrap gap-2 p-2 -mt-4 rounded-lg border border-gray-300 border-solid calculator-group w-fit">*/}
        {/*  <label className="input-group">*/}
        {/*    <span>År</span>*/}
        {/*    <select*/}
        {/*      className="text-right input input-bordered"*/}
        {/*      onChange={(e) => setSelectedYear(e.target.value)}*/}
        {/*      value={selectedYear}*/}
        {/*    >*/}
        {/*      {years.map((year) => (*/}
        {/*        <option key={year} value={year}>*/}
        {/*          {year}*/}
        {/*        </option>*/}
        {/*      ))}*/}
        {/*    </select>*/}
        {/*  </label>*/}
        {/*  <label className="input-group">*/}
        {/*    <span>Måned</span>*/}

        {/*    <select*/}
        {/*      className="text-right input input-bordered"*/}
        {/*      onChange={(e) => setSelectedMonth(e.target.value)}*/}
        {/*      value={selectedMonth}*/}
        {/*    >*/}
        {/*      {months.map((month) => (*/}
        {/*        <option key={month.name} value={month.value}>*/}
        {/*          {month.name}*/}
        {/*        </option>*/}
        {/*      ))}*/}
        {/*    </select>*/}
        {/*  </label>*/}
        {/*  <Button onClick={handleMonthAndYearChange} variant="primary">*/}
        {/*    Oppdater*/}
        {/*  </Button>*/}
        {/*</div>*/}
      </div>
      <div className="flex flex-wrap gap-6 items-start">
        <div className="rounded-b-lg card card-bordered grow shrink-0">
          <div className="p-4 rounded-t-lg border-b border-gray-300 bg-slate-200">
            Basis
          </div>
          <div className="gap-2 p-4 form-control calculator-group">
            <label className="input-group">
              <span>
                Syntetisk timepris
                <ReadMoreIcon text="Benyttes som timepris for kompetanse (innenfor årlig budsjett)" />
              </span>
              <input
                type="number"
                disabled
                value={timeprisKompetanse}
                className="input input-disabled"
              />
            </label>
            <label className="input-group">
              <span>Garantilønn</span>
              <input
                className="input"
                type="number"
                disabled
                value={garantilonn}
              />
            </label>
            <label className="input-group">
              <span>Grunnbeløp</span>
              <input
                className="input"
                type="number"
                disabled
                value={grunnbelop}
              />
            </label>
            <label className="input-group">
              <span>
                Timer i måned
                <ReadMoreIcon text="Antall arbeidstimer i den aktuelle måneden" />
              </span>
              <input
                type="number"
                className="input input-bordered"
                value={antallTimerMnd}
                onChange={handleAntallTimerMndChange}
              />
            </label>
            <label className="input-group">
              <span>
                Rest kompetansetimer
                <ReadMoreIcon text="Antall timer du har igjen på årlig kompetansebudjett før eventuelt uttak" />
              </span>
              <input
                type="number"
                value={restKompetanseBudsjett}
                onChange={handleRestKompetanseBudsjettChange}
                className="input input-bordered"
              />
            </label>
            <label className="input-group">
              <span>Timepris på prosjekt</span>
              <input
                type="number"
                value={timeprisProsjekt}
                onChange={handleTimeprisProsjektChange}
                className="input input-bordered"
              />
            </label>
            <label className="input-group">
              <span>
                Bonus
                <ReadMoreIcon text="Bonus denne måneden. Eksempelvis presentasjonsbonus og rekrutteringsbonus, mer info på intranettet." />
              </span>
              <input
                type="number"
                value={bonus}
                onChange={handleBonusChange}
                className="input input-bordered"
              />
            </label>
          </div>
        </div>
        <div className="rounded-lg border border-gray-300 border-solid grow shrink-0">
          <div className="p-4 border-b border-gray-300 bg-slate-200">Timer</div>
          <div className="gap-2 p-4 form-control calculator-group">
            <label className="input-group">
              <span>Fakturert</span>
              <input
                type="number"
                value={antallTimerFakturert}
                onChange={handleAntallTimerFakturertChange}
                className="input input-bordered"
              />
            </label>
            <label className="input-group">
              <span>Kompetanseheving</span>
              <input
                type="number"
                className="input input-bordered"
                value={antallTimerKompetanse}
                onChange={handleAntallTimerKompetanseChange}
              />
            </label>
            <label className="input-group">
              <span>Interntid</span>
              <input
                type="number"
                className="input input-bordered"
                value={antallTimerInterntid}
                onChange={handleAntallTimerInterntidChange}
              />
            </label>
            <label className="input-group">
              <span>
                Interntid m/komp
                <ReadMoreIcon text="Interntid som kompanseres som fakturert tid, se intranett for retningslinjer" />
              </span>
              <input
                type="number"
                value={antallTimerInterntidMedKomp}
                className="input input-bordered"
                onChange={handleAntallTimerInterntidMedKomChange}
              />
            </label>
            <label className="input-group">
              <span>Ferie</span>
              <input
                type="number"
                className="input input-bordered"
                value={antallTimerFerie}
                onChange={handleAntallTimerFerieChange}
              />
            </label>
            <label className="input-group">
              <span>
                Sykdom
                <ReadMoreIcon text="Egenmelding, sykemelding, sykt barn og foreldre permisjon" />
              </span>
              <input
                type="number"
                value={antallTimerSyk}
                onChange={handleAntallTimerSykChange}
                className="input input-bordered"
              />
            </label>
          </div>
        </div>
        <div className="rounded-lg border border-gray-300 border-solid grow shrink-0 min-w-[310px]">
          <div className="flex justify-between p-4 text-white bg-green-brand">
            Resultat
            <ReadMoreIcon text="Viser resultat av beregningen og hvilke faktorer som blir med i beregnet bruttolønn" />
          </div>
          <ul className="flex flex-col gap-2 justify-between p-4">
            <li className="flex justify-between">
              9G timelønn:
              <span>{getInNok(Timelonn9G())}</span>
            </li>
            <li className="flex justify-between">
              Sum sykelønn: <span>{getInNok(SumSykeLonn())}</span>
            </li>
            <li className="flex justify-between">
              Sum fakturert tid: <span>{getInNok(SumFakturertTid())}</span>
            </li>
            <li className="flex justify-between">
              Sum interntid m/komp:{' '}
              <span>{getInNok(SumIntertidMedKomp())}</span>
            </li>
            <li className="flex justify-between">
              Sum kompetanse: <span>{getInNok(SumKompetanse())}</span>
            </li>
            <li className="flex justify-between border-b-2 border-solid border-b-black-nav">
              Sum betalt tid: <span>{getInNok(SumBetaltTid())}</span>
            </li>
            <li className="flex justify-between text-gray-400">
              Tilgjengelig tid:
              <span>
                {SumTilgjengeligTid()} av {antallTimerMnd}
              </span>
            </li>
            <li className="flex justify-between text-gray-400 border-b-2 border-solid border-b-black-nav">
              Beregnet garantilønn:{' '}
              <span>{getInNok(BeregnetGarantilonn())}</span>
            </li>
            <li className="flex justify-between border-b-2 border-solid border-b-black-nav">
              Bonus: <span>{bonus}</span>
            </li>
            <li className="flex justify-between border-b-2 border-solid border-b-black-nav">
              Bruttolønn: <span>{getInNok(Bruttolonn())}</span>
            </li>
            <li className="flex gap-4 justify-between">
              <span className="flex justify-between w-full">
                Ca årslønn:
                {/*<ReadMoreIcon*/}
                {/*  text={`Utregning: Antall fakturerbare timer i ${selectedYear} er ${*/}
                {/*    billableHoursThisYear + 25 * 7.5*/}
                {/*  }. Trekker fra 25 feriedager og legger på feriepenger (12%). Regnestykket blir: \n\n${billableHoursThisYear}t * ${timeprisProsjekt}kr/t * 0.52 * 1.12`}*/}
                {/*/>*/}
              </span>
              <span>{getInNok(BruttoArsLonn())}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const ReadMoreIcon = ({ text }: { text: string }) => (
  <div className="tooltip tooltip-left" data-tip={text}>
    <FontAwesomeIcon icon={faQuestionCircle} />
  </div>
)

// const months = [
//   { name: 'Januar', value: '01' },
//   { name: 'Februar', value: '02' },
//   { name: 'Mars', value: '03' },
//   { name: 'April', value: '04' },
//   { name: 'Mai', value: '05' },
//   { name: 'Juni', value: '06' },
//   { name: 'Juli', value: '07' },
//   { name: 'August', value: '08' },
//   { name: 'September', value: '09' },
//   { name: 'Oktober', value: '10' },
//   { name: 'November', value: '11' },
//   { name: 'Desember', value: '12' },
// ]

// const years = Array.from({ length: 25 }).map((_x, i) =>
//   String(new Date().getFullYear() + i - 10),
// )

export default Kalkulator_gammel
