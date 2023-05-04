import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import {
  Tooltip,
  OverlayTrigger,
  Card,
  InputGroup,
  Form,
  Container,
  Col,
  Row,
  Button,
} from 'react-bootstrap'
import styles from './Kalkulator.module.scss'
import getBillableHours, { getBillabeHoursEntireYear } from './getBillableHours'
import moment from 'moment'

const defaultValues: Record<string, number> = {
  garantilonn: 50000,
  bonus: 0,
  grunnbelop: 111477,
  restKompetanse: 50,
  timepris: 1650,
  timeprisKompetanse: 1259,
}

function Kalkulator() {
  const [selectedMonth, setSelectedMonth] = useState(moment().format('MM'))
  const [selectedYear, setSelectedYear] = useState(moment().format('yyyy'))
  const { garantilonn, grunnbelop, timeprisKompetanse } = defaultValues
  const [bonus, setBonus] = useState(defaultValues.bonus)
  const [billableHoursThisYear, setBillableHoursThisYear] = useState(
    getBillabeHoursEntireYear(selectedYear),
  )
  const [restKompetanseBudsjett, setRestKompetanseBudsjett] = useState(
    defaultValues.restKompetanse,
  )
  const [timeprisProsjekt, setTimeprisProsjekt] = useState(
    defaultValues.timepris,
  )
  const [antallTimerMnd, setAntallTimerMnd] = useState(
    getBillableHours(selectedYear, selectedMonth),
  )
  const [antallTimerFakturert, setAntallTimerFakturert] =
    useState(antallTimerMnd)

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

  function BruttoArsLonn() {
    return billableHoursThisYear * timeprisProsjekt * 0.52 * 1.12 + +bonus
  }

  function GarantilonnBenytet() {
    return BeregnetGarantilonn() > SumBetaltTid()
  }

  const handleMonthAndYearChange = () => {
    const billableHoursForMonth = getBillableHours(selectedYear, selectedMonth)
    setBillableHoursThisYear(getBillabeHoursEntireYear(selectedYear))
    setAntallTimerMnd(billableHoursForMonth)
    setAntallTimerFakturert(billableHoursForMonth)
  }

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

  const handleAntallTimerMndChange = (e: any) => {
    setAntallTimerMnd(e.target.value)
  }

  const handleRestKompetanseBudsjettChange = (e: any) => {
    setRestKompetanseBudsjett(e.target.value)
  }

  const handleTimeprisProsjektChange = (e: any) => {
    setTimeprisProsjekt(e.target.value)
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
    <Container fluid>
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
      <Row>
        <p>Se utregning basert på år og måned:</p>
        <Col xs={12} sm={4} md={2}>
          <InputGroup>
            <InputGroup.Text>År</InputGroup.Text>
            <Form.Select
              style={{ textAlign: 'right' }}
              onChange={(e) => setSelectedYear(e.target.value)}
              value={selectedYear}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Form.Select>
          </InputGroup>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <InputGroup>
            <InputGroup.Text>Måned</InputGroup.Text>
            <Form.Select
              style={{ textAlign: 'right' }}
              onChange={(e) => setSelectedMonth(e.target.value)}
              value={selectedMonth}
            >
              {months.map((month) => (
                <option key={month.name} value={month.value}>
                  {month.name}
                </option>
              ))}
            </Form.Select>
          </InputGroup>
        </Col>
        <Col xs={2} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleMonthAndYearChange}>Sett</Button>
        </Col>
      </Row>
      <Row>
        <Col className={styles.form}>
          <Card>
            <Card.Header>Basis</Card.Header>
            <Card.Body>
              <InputGroup>
                <InputGroup.Text>
                  Syntetisk timepris
                  <ReadMoreIcon
                    id="tooltip-1"
                    text="Benyttes som timepris for kompetanse (innenfor årlig budsjett)"
                  />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  disabled
                  value={timeprisKompetanse}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Garantilønn</InputGroup.Text>
                <Form.Control type="number" disabled value={garantilonn} />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Grunnbeløp</InputGroup.Text>
                <Form.Control type="number" disabled value={grunnbelop} />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>
                  Timer i måned
                  <ReadMoreIcon
                    id="tooltip-2"
                    text="Antall arbeidstimer i den aktuelle måneden"
                  />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  value={antallTimerMnd}
                  onChange={handleAntallTimerMndChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>
                  Rest komperansetimer
                  <ReadMoreIcon
                    id="tooltip-3"
                    text="Antall timer du har igjen på årlig kompetansebudjett før eventuelt utak"
                  />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  value={restKompetanseBudsjett}
                  onChange={handleRestKompetanseBudsjettChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Timepris på prosjekt</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={timeprisProsjekt}
                  onChange={handleTimeprisProsjektChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>
                  Bonus
                  <ReadMoreIcon
                    id="tooltip-bonus"
                    text="Bonus denne måneden. Eksempelvis presentasjonsbonus og rekrutteringsbonus, mer info på intranettet."
                  />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  value={bonus}
                  onChange={handleBonusChange}
                />
              </InputGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col className={styles.form}>
          <Card>
            <Card.Header>Timer</Card.Header>
            <Card.Body>
              <InputGroup>
                <InputGroup.Text>Fakturert</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={antallTimerFakturert}
                  onChange={handleAntallTimerFakturertChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Kompetanseheving</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={antallTimerKompetanse}
                  onChange={handleAntallTimerKompetanseChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Interntid</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={antallTimerInterntid}
                  onChange={handleAntallTimerInerntidChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>
                  Interntid m/komp
                  <ReadMoreIcon
                    id="tooltip-4"
                    text="Interntid som kompanseres som fakturert tid, se intranett for retningslinjer"
                  />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  value={antallTimerInterntidMedKomp}
                  onChange={handleAntallTimerInterntidMedKomChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>Ferie</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={antallTimerFerie}
                  onChange={handleAntallTimerFerieChange}
                />
              </InputGroup>
              <InputGroup>
                <InputGroup.Text>
                  Sykdom
                  <ReadMoreIcon
                    id="tooltip-5"
                    text="Egenmelding, sykemelding, sykt barn og foreldre permisjon"
                  />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  value={antallTimerSyk}
                  onChange={handleAntallTimerSykChange}
                />
              </InputGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col className={styles.calculator}>
          <Card>
            <Card.Header>
              Resultat
              <ReadMoreIcon
                id="tooltip-6"
                text="Viser resultat av beregningen og hvilke faktorer som blir med i beregnet bruttolønn"
              />
            </Card.Header>
            <Card.Body>
              <ul className="result">
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
                <li className="bold line">
                  Bruttolønn:{' '}
                  <span>
                    {Bruttolonn().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
                <li>
                  Ca arslonn:
                  <ReadMoreIcon
                    id="arslonn"
                    text={`Utregning: Antall fakturerbare timer i ${selectedYear} er ${
                      billableHoursThisYear + 25 * 7.5
                    }. Trekker fra 25 feriedager og legger på feriepenger (12%). `}
                  />
                  <span>
                    {BruttoArsLonn().toLocaleString('no-NO', {
                      maximumFractionDigits: 2,
                      style: 'currency',
                      currency: 'NOK',
                    })}
                  </span>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

const ReadMoreIcon = ({ text, id }: { text: string; id: string }) => (
  <OverlayTrigger overlay={<Tooltip id={id}>{text}</Tooltip>}>
    <FontAwesomeIcon icon={faQuestionCircle} />
  </OverlayTrigger>
)

const months = [
  { name: 'Januar', value: '01' },
  { name: 'Februar', value: '02' },
  { name: 'Mars', value: '03' },
  { name: 'April', value: '04' },
  { name: 'Mai', value: '05' },
  { name: 'Juni', value: '06' },
  { name: 'Juli', value: '07' },
  { name: 'August', value: '08' },
  { name: 'September', value: '09' },
  { name: 'Oktober', value: '10' },
  { name: 'November', value: '11' },
  { name: 'Desember', value: '12' },
]
const years = Array.from({ length: 25 }).map((_x, i) =>
  String(new Date().getFullYear() + i - 10),
)
console.log(years)
export default Kalkulator
