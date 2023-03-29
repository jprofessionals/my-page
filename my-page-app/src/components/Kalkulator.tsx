import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

function Kalkulator() {
  const [garantilonn, setGarantilønn] = useState(50000)
  const [bonus, setBonus] = useState(0)
  const [grunnbelop, setGrunnbelop] = useState(111477)
  const [antallTimerMnd, setAntallTimerMnd] = useState(157.5)
  const [restKompetanseBudsjett, setRestKompetanseBudsjett] = useState(50)
  const [timeprisProsjekt, setTimeprisProsjekt] = useState(1650)
  const [timeprisKompetanse, setTimeprisKompetanse] = useState(1259)
  const [antallTimerFakturert, setAntallTimerFakturert] = useState(150)
  const [antallTimerKompetanse, setAntallTimerKompetanse] = useState(0)
  const [antallTimerInterntid, setAntallTimerInterntid] = useState(0)
  const [antallTimerInterntidMedKomp, setAntallTimerInterntidMedKom] =
    useState(0)
  const [antallTimerFerie, setAntallTimerFerie] = useState(0)
  const [antallTimerSyk, setAntallTimerSyk] = useState(0)

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

  function GarantilonnBenytet() {
    return BeregnetGarantilonn() > SumBetaltTid()
  }

  const handleGarantilonnChange = (e: any) => {
    setGarantilønn(e.target.value)
  }

  const handleGrunnbelopChange = (e: any) => {
    setGrunnbelop(e.target.value)
  }

  const handleAntallTimerMndChange = (e: any) => {
    setAntallTimerMnd(e.target.value)
  }

  const handleRestKompetanseBudsjettChange = (e: any) => {
    setRestKompetanseBudsjett(e.target.value)
  }

  const handleTimeprisProsjektChange = (e: any) => {
    setTimeprisProsjekt(e.target.value)
  }

  const handleTimeprisKompetanseChange = (e: any) => {
    setTimeprisKompetanse(e.target.value)
  }

  const handleAntallTimerFakturertChange = (e: any) => {
    setAntallTimerFakturert(e.target.value)
  }

  const handleAntallTimerKompetanseChange = (e: any) => {
    setAntallTimerKompetanse(e.target.value)
  }

  const handleAntallTimerInerntidChange = (e: any) => {
    setAntallTimerInterntid(e.target.value)
  }

  const handleAntallTimerInterntidMedKomChange = (e: any) => {
    setAntallTimerInterntidMedKom(e.target.value)
  }

  const handleAntallTimerFerieChange = (e: any) => {
    setAntallTimerFerie(e.target.value)
  }

  const handleAntallTimerSykChange = (e: any) => {
    setAntallTimerSyk(e.target.value)
  }

  const handleBonusChange = (e: any) => {
    setBonus(e.target.value)
  }

  return (
    <>
      <div className="innhold">
        <div className="topp">
          <h3>Lønnskalulator</h3>
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
        </div>
        <div className="kalkulator">
          <div className="input">
            <div className="column">
              <h4>Basis</h4>
              <ul>
                <li>
                  Syntetisk timepris
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    id="tooltip-1"
                    data-tooltip-content="Benyttes som timepris for kompetanse (innenfor årlig budsjett)"
                  />
                  <input
                    type="number"
                    disabled={true}
                    value={timeprisKompetanse}
                    onChange={handleTimeprisKompetanseChange}
                  />
                </li>
                <li>
                  Garantilønn
                  <input
                    type="number"
                    disabled={true}
                    value={garantilonn}
                    onChange={handleGarantilonnChange}
                  />
                </li>
                <li>
                  Grunnbeløp
                  <input
                    type="number"
                    disabled={true}
                    value={grunnbelop}
                    onChange={handleGrunnbelopChange}
                  />
                </li>
                <li>
                  Timer i måned
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    id="tooltip-2"
                    data-tooltip-content="Antall arbeidstimer i den aktuelle måneden"
                  />
                  <input
                    type="number"
                    value={antallTimerMnd}
                    onChange={handleAntallTimerMndChange}
                  />
                </li>
                <li>
                  Rest komperansetimer
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    id="tooltip-3"
                    data-tooltip-content="Antall timer du har igjen på årlig kompetansebudjett før eventuelt utak"
                  />
                  <input
                    type="number"
                    value={restKompetanseBudsjett}
                    onChange={handleRestKompetanseBudsjettChange}
                  />
                </li>
                <li>
                  Timepris på prosjekt
                  <input
                    type="number"
                    value={timeprisProsjekt}
                    onChange={handleTimeprisProsjektChange}
                  />
                </li>
                <li>
                  Bonus
                  <input
                    type="number"
                    value={bonus}
                    onChange={handleBonusChange}
                  />
                </li>
              </ul>
            </div>
            <div className="column">
              <h4>Timer</h4>
              <ul>
                <li>
                  Fakturerte timer
                  <input
                    type="number"
                    value={antallTimerFakturert}
                    onChange={handleAntallTimerFakturertChange}
                  />
                </li>
                <li>
                  Kompetanseheving
                  <input
                    type="number"
                    value={antallTimerKompetanse}
                    onChange={handleAntallTimerKompetanseChange}
                  />
                </li>
                <li>
                  Interntid
                  <input
                    type="number"
                    value={antallTimerInterntid}
                    onChange={handleAntallTimerInerntidChange}
                  />
                </li>
                <li>
                  Interntid m/komp
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    id="tooltip-6"
                    data-tooltip-content="Interntid som kompanseres som fakturert tid, se intranett for retningslinjer"
                  />
                  <input
                    type="number"
                    value={antallTimerInterntidMedKomp}
                    onChange={handleAntallTimerInterntidMedKomChange}
                  />
                </li>
                <li>
                  Ferie
                  <input
                    type="number"
                    value={antallTimerFerie}
                    onChange={handleAntallTimerFerieChange}
                  />
                </li>
                <li>
                  Sykdom
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    id="tooltip-4"
                    data-tooltip-content="Egenmelding, sykemelding, sykt barn og foreldre permisjon"
                  />
                  <input
                    type="number"
                    value={antallTimerSyk}
                    onChange={handleAntallTimerSykChange}
                  />
                </li>
              </ul>
            </div>
            <div className="column">
              <h4>
                Resultat{' '}
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  id="tooltip-5"
                  data-tooltip-content="Viser resultat av beregningen og hvilke faktorer som blir med i beregnet bruttolønn"
                />
              </h4>
              <ul>
                <li className={GarantilonnBenytet() ? 'notSelected' : ''}>
                  9G timelønn:{' '}
                  <span>
                    {Timelonn9G().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li className={GarantilonnBenytet() ? 'notSelected' : ''}>
                  Sum sykelønn:{' '}
                  <span>
                    {SumSykeLonn().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li className={GarantilonnBenytet() ? 'notSelected' : ''}>
                  Sum fakturert tid:{' '}
                  <span>
                    {SumFakturertTid().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li className={GarantilonnBenytet() ? 'notSelected' : ''}>
                  Sum interntid m/komp:{' '}
                  <span>
                    {SumIntertidMedKomp().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li className={GarantilonnBenytet() ? 'notSelected' : ''}>
                  Sum kompetanse:{' '}
                  <span>
                    {SumKompetanse().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li
                  className={
                    GarantilonnBenytet() ? 'line notSelected' : 'line '
                  }
                >
                  Sum betalt tid:{' '}
                  <span>
                    {SumBetaltTid().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li className={GarantilonnBenytet() ? '' : 'notSelected'}>
                  Tilgjengelig tid:{' '}
                  <span>
                    {SumTilgjengeligTid()} av {antallTimerMnd}
                  </span>
                </li>
                <li
                  className={
                    GarantilonnBenytet() ? 'line ' : 'line notSelected'
                  }
                >
                  Beregnet garantilønn:{' '}
                  <span>
                    {BeregnetGarantilonn().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li className="line">
                  Bonus: <span>{bonus}</span>
                </li>
                <li className="bold">
                  Bruttolønn:{' '}
                  <span>
                    {Bruttolonn().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Tooltip data-tooltip-id="tooltip-1" />
      <Tooltip data-tooltip-id="tooltip-2" />
      <Tooltip data-tooltip-id="tooltip-3" />
      <Tooltip data-tooltip-id="tooltip-4" />
      <Tooltip data-tooltip-id="tooltip-5" />
      <Tooltip data-tooltip-id="tooltip-6" />
    </>
  )
}

export default Kalkulator
