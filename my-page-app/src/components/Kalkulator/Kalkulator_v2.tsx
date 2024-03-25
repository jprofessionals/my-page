import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import getInNok from '@/utils/getInNok'
import getAsNo from '@/utils/getAsNo'
import getSetting from '@/utils/getSetting'
import { Settings } from '@/types'
import { useAuthContext } from '@/providers/AuthProvider'


function Kalkulator() {
    const [garantilonn, setGarantilonn] = useState(0)
    const [utbetaltForskudd, setUtbetaltForskudd] = useState(0)
    const [grunnbelop, setGrunnbelop] = useState(0)
    const [timeprisKompetanse, setTimeprisKompetanse] = useState(0)
    const [stillingsprosent, setStillingsprosent] = useState(100)
    const [bonus, setBonus] = useState(0)
    const [bruttotrekk, setBruttotrekk] = useState(0)
    const [restKompetanseBudsjett, setRestKompetanseBudsjett] = useState(0)
    const [timeprisProsjekt, setTimeprisProsjekt] = useState(0)

    const billableHoursPerYear = 1695;

    const [antallArbeidsdager, setAntallArbeidsdager] = useState(21.67)
    const [antallTimerFakturert, setAntallTimerFakturert] = useState((antallArbeidsdager * 7.5))

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
        setUtbetaltForskudd(parseInt(getSetting(settings, 'CALC_GARANTILONN') ?? '0'))
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

    function NormertTid() {
        return antallArbeidsdager * 7.5
    }

    function DinNormerteTid() {
        return (NormertTid() * stillingsprosent / 100) - antallTimerFerie
    }

    function Forskudd() {
        return garantilonn * stillingsprosent / 100
    }

    function TilgjengeligTid() {
        return Math.max(Math.min((DinNormerteTid() - AntallTimerBetaltTid()), (antallTimerInterntid + AntallTimerUbetaltKompetanse())), 0)
    }

    function SumFakturertTid() {
        return timeprisProsjekt * 0.52 * +antallTimerFakturert
    }

    function SumIntertidMedKomp() {
        return timeprisProsjekt * 0.52 * antallTimerInterntidMedKomp
    }

    function AntallTimerBetaltTid() {
        return +antallTimerFakturert + AntallTimerBetaltKompetanse() + +antallTimerSyk + +antallTimerInterntidMedKomp
    }

    function SumBetaltTid() {
        return (
            +SumSykeLonn() +
            +SumFakturertTid() +
            +SumBetaltKompetanse() +
            +SumIntertidMedKomp()
        )
    }

    function MinimumsLonn() {
        return TilgjengeligTid() / NormertTid() * garantilonn
    }

    function Lonnsgrunnlag() {
        return MinimumsLonn() + SumBetaltTid()
    }

    function SumBetaltKompetanse() {
        return (
            timeprisKompetanse *
            0.52 *
            AntallTimerBetaltKompetanse()
        )
    }

    function AntallTimerBetaltKompetanse() {
        return (
            Math.min(+antallTimerKompetanse, +restKompetanseBudsjett)
        )
    }

    function AntallTimerUbetaltKompetanse() {
        return (
            Math.max(antallTimerKompetanse - AntallTimerBetaltKompetanse(), 0)
        )
    }

    function BruttoMaanedslonn() {
        return Forskudd() - utbetaltForskudd + SumBetaltTid() + MinimumsLonn() + bonus - bruttotrekk;
    }

    function BruttoArsLonn() {
        return BruttoMaanedslonn() * 12
    }

    function BruttoAarsLonnFakturert() {
        return billableHoursPerYear * timeprisProsjekt * 0.52
    }

    const handleUtbetaltForskuddChange = (e: any) => {
        setUtbetaltForskudd(e.target.value)
    }

    const handleAntallArbeidsdagerChange = (e: any) => {
        setAntallArbeidsdager(e.target.value)
    }

    const handleRestKompetanseBudsjettChange = (e: any) => {
        setRestKompetanseBudsjett(e.target.value)
    }

    const handleStillingsprosentChange = (e: any) => {
        setStillingsprosent(Math.min(Math.floor(e.target.value), 100))
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

    const handleAntallTimerInterntidChange = (e: any) => {
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
        setBonus(parseInt(e.target.value))
    }

    const handleBruttotrekkChange = (e: any) => {
        setBruttotrekk(parseInt(e.target.value))
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="prose max-w-fit">
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
            </div>
            <div className="flex flex-wrap gap-6 items-start">
                <div className="rounded-b-lg card card-bordered grow shrink-0">
                    <div className="p-4 rounded-t-lg border-b border-gray-300 bg-slate-200">
                        Basis
                    </div>
                    <div className="gap-2 p-4 form-control calculator-group">
                        <li className="flex gap-4 justify-between">
                            <span className="flex justify-between gap-1">
                                Syntetisk timepris
                                <ReadMoreIcon
                                    text="Benyttes som timepris for kompetanse (innenfor årlig budsjett). 80% av fjorårets snittpris" />
                            </span>
                            <span>{getInNok(timeprisKompetanse)}</span>
                        </li>
                        <li className="flex justify-between">
                            Grunnbeløp
                            <span>{getInNok(grunnbelop)}</span>
                        </li>
                        <li className="flex justify-between">
                            9G timelønn
                            <span>{getInNok(Timelonn9G())}</span>
                        </li>

                        <li className="flex justify-between">
                            <span className="flex justify-between gap-1">
                                Minimumslønn
                                <ReadMoreIcon text="Minimumslønn for 100% stilling" />
                            </span>
                            <span>{getInNok(garantilonn)}</span>
                        </li>
                    </div>
                </div>
                <div className="rounded-lg border border-gray-300 border-solid grow shrink-0">
                    <div className="p-4 border-b border-gray-300 bg-slate-200">Dine timer</div>
                    <div className="gap-2 p-4 form-control calculator-group">
                        <label className="input-group gap-1">
                            <span>Fakturert
                                <ReadMoreIcon text="Antall timer fakturert kunde. I snitt er det 21,67 arbeidsdager i én måned." />
                            </span>
                            <input
                                type="number"
                                value={antallTimerFakturert}
                                onChange={handleAntallTimerFakturertChange}
                                className="input input-bordered"
                            />
                        </label>
                        <label className="input-group gap-1">
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
                        <label className="input-group gap-1">
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
                        <label className="input-group gap-1">
                            <span>
                                Rest kompetansetimer
                                <ReadMoreIcon text="Antall timer du har igjen på årlig kompetansebudsjett før eventuelt uttak" />
                            </span>
                            <input
                                type="number"
                                value={restKompetanseBudsjett}
                                onChange={handleRestKompetanseBudsjettChange}
                                className="input input-bordered"
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>Kompetanseheving
                            </span>
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
                            <span>Ferie</span>
                            <input
                                type="number"
                                className="input input-bordered"
                                value={antallTimerFerie}
                                onChange={handleAntallTimerFerieChange}
                            />
                        </label>

                    </div>
                </div>
                <div className="rounded-lg border border-gray-300 border-solid grow shrink-0">
                    <div className="p-4 border-b border-gray-300 bg-slate-200">Annet</div>
                    <div className="gap-2 p-4 form-control calculator-group">
                        <label className="input-group">
                            <span>Timepris på prosjekt</span>
                            <input
                                type="number"
                                value={timeprisProsjekt}
                                onChange={handleTimeprisProsjektChange}
                                className="input input-bordered"
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Bonus
                                <ReadMoreIcon
                                    text="Bonus denne måneden. Eksempelvis presentasjonsbonus og rekrutteringsbonus, mer info på intranett" />
                            </span>
                            <input
                                type="number"
                                value={bonus}
                                onChange={handleBonusChange}
                                className="input input-bordered"
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Bruttotrekk
                            </span>
                            <input
                                type="number"
                                value={bruttotrekk}
                                onChange={handleBruttotrekkChange}
                                className="input input-bordered"
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Antall arbeidsdager
                                <ReadMoreIcon
                                    text="Antall arbeidsdager i den aktuelle måneden. I snitt er det 21,67 arbeidsdager i én måned om man ikke tar hensyn til ferie og helligdager." />
                            </span>
                            <input
                                type="number"
                                className="input input-bordered"
                                value={antallArbeidsdager}
                                onChange={handleAntallArbeidsdagerChange}
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span className="flex justify-between">
                                Stillingsprosent
                            </span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                className="input input-bordered"
                                value={stillingsprosent}
                                onChange={handleStillingsprosentChange}
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Utbetalt forskudd
                                <ReadMoreIcon
                                    text="Forskudd utbetalt foregående måned, vil normalt være Minimumslønn * Stillingsprosent" />
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                className="input input-bordered"
                                value={utbetaltForskudd}
                                onChange={handleUtbetaltForskuddChange}
                            />
                        </label>
                    </div>
                </div>
                <div className="rounded-lg border border-gray-300 border-solid grow shrink-0 min-w-[310px]">
                    <div className="flex justify-between p-4 text-white bg-green-brand">
                        Lønnsgrunnlag
                        <ReadMoreIconRight text="Viser beregning av lønnsgrunnlaget og hvilke faktorer som er med" />
                    </div>
                    <ul className="flex flex-col gap-2 justify-between p-4">
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Fakturert tid
                                <ReadMoreIcon
                                    text={`Antall timer fakturert * Timepris * 0,52 => ${getAsNo(antallTimerFakturert)} * ${getInNok(timeprisProsjekt)} * 0,52`}
                                />
                            </span>
                            <span>{getInNok(SumFakturertTid())}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Interntid m/komp
                                <ReadMoreIcon
                                    text={`Antall timer * Timepris * 0,52 => ${getAsNo(antallTimerInterntidMedKomp)} * ${getInNok(timeprisProsjekt)} * 0,52`}
                                />
                            </span>
                            <span>{getInNok(SumIntertidMedKomp())}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Kompetanseheving
                                <ReadMoreIcon
                                    text={`Antall timer betalt kompetansheving * Syntetisk timepris * 0,52 => ${getAsNo(AntallTimerBetaltKompetanse())} * ${getInNok(timeprisKompetanse)} * 0,52`}
                                />
                            </span>
                            <span>{getInNok(SumBetaltKompetanse())}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Sykelønn
                                <ReadMoreIcon
                                    text={`Antall timer Sykdom * 9G timelønn => ${getAsNo(AntallTimerSyk())} * ${getInNok(Timelonn9G())}`}
                                />
                            </span>
                            <span>{getInNok(SumSykeLonn())}</span>
                        </li>
                        <li className="flex justify-between border-b-2 border-solid border-b-black-nav font-semibold mb-2">
                            Sum betalt tid: <span>{getInNok(SumBetaltTid())}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Normert tid
                                <ReadMoreIcon
                                    text={`Antall arbeidsdager i gitt måned * 7,5 => ${getAsNo(antallArbeidsdager)} * 7,5`}
                                />
                            </span>
                            <span>{NormertTid().toFixed(2)}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Din normerte tid
                                <ReadMoreIcon
                                    text={`(Normert tid * Stillingsprosent) - Ferie => (${getAsNo(NormertTid())} * ${getAsNo(stillingsprosent / 100)}) - ${getAsNo(antallTimerFerie)}`}
                                />
                            </span>
                            <span>{DinNormerteTid().toFixed(2)}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Antall timer betalt tid
                                <ReadMoreIcon
                                    text={`Fakturert tid + Kompetanseheving (innenfor budsjett) + Sykdom + Interntid m/kompensasjon => (${getAsNo(antallTimerFakturert)} + ${getAsNo(AntallTimerBetaltKompetanse())} + ${getAsNo(antallTimerSyk)} + ${getAsNo(antallTimerInterntidMedKomp)}`}
                                />
                            </span>
                            <span>{AntallTimerBetaltTid().toFixed(2)}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Tilgjengelig tid
                                <ReadMoreIcon
                                    text={`MINIMUM(((din normerte tid - betalt tid),(interntid + kompetanseheving(over budsjett)) => (MIN((${getAsNo(DinNormerteTid())} - ${getAsNo(AntallTimerBetaltTid())}),(${getAsNo(antallTimerInterntid)} + ${getAsNo(AntallTimerUbetaltKompetanse())}))`}
                                />
                            </span>
                            <span>{TilgjengeligTid().toFixed(2)}</span>
                        </li>
                        <li className="flex justify-between border-b-2 border-solid border-b-black-nav font-semibold mb-2">
                            <span className="flex justify-between gap-1">
                                Beregnet minimumslønn
                                <ReadMoreIcon
                                    text={`Tilgjengelig tid / normert tid * ${getInNok(garantilonn)} => ${getAsNo(TilgjengeligTid())} / ${getAsNo(NormertTid())} * ${getInNok(garantilonn)}`}
                                />
                            </span>
                            <span>{getInNok(MinimumsLonn())}</span>
                        </li>

                        <li className="flex justify-between border-b-2 border-solid border-b-black-nav font-semibold mb-2">
                            <span className="flex justify-between gap-1">
                                Lønnsgrunnlag
                                <ReadMoreIcon
                                    text={`Beregnet lønnsgrunnlag er summen av beregnet minimumslønn og betalt tid => ${getInNok(MinimumsLonn())} + ${getInNok(SumBetaltTid())}}`}
                                />
                            </span>
                            <span>{getInNok(Lonnsgrunnlag())}</span>
                        </li>
                    </ul>
                </div>


                <div className="rounded-lg border border-gray-300 border-solid grow shrink-0 min-w-[310px]">
                    <div className="flex justify-between p-4 text-white bg-green-brand">
                        Lønnsberegning
                        <ReadMoreIconRight
                            text="Viser resultat av beregningen og hvilke faktorer som er med i beregnet bruttolønn" />
                    </div>
                    <ul className="flex flex-col gap-2 justify-between p-4">

                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Forskudd
                                <ReadMoreIconRight
                                    text={`Forskudd for inneværende måned, beregnes som Minimumslønn * Stillingsprosent => ${getInNok(garantilonn)} * ${getAsNo(stillingsprosent / 100)} `} />
                            </span>
                            <span>{getInNok(Forskudd())}</span>
                        </li>

                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Forskudd utbetalt foregående mnd
                                <ReadMoreIconRight text="Trekk for forskudd utbetalt foregående måned" />
                            </span>
                            <span className="text-red-500">{getInNok(+utbetaltForskudd)}</span>
                        </li>

                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Lønnsgrunnlag
                                <ReadMoreIconRight text="Lønnsgrunnlag beregnet på bakgrunn av timer ført for foregående måned" />
                            </span>
                            <span>{getInNok(Lonnsgrunnlag())}</span>
                        </li>

                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Bonus
                            </span>
                            <span>{getInNok(bonus)}</span>
                        </li>
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Bruttotrekk
                            </span>
                            <span className="text-red-500">{getInNok(bruttotrekk)}</span>
                        </li>

                        <li className="flex justify-between border-b-2 border-solid border-b-black-nav font-semibold mb-2">
                            <span className="flex justify-between gap-1">
                                Brutto månedslønn
                                <ReadMoreIcon
                                    text={`Forskudd - Forskudd foregående mnd + Lønnsgrunnlag + Bonus - Bruttotrekk => ${getInNok(Forskudd())} - ${getInNok(+utbetaltForskudd)} + ${getInNok(Lonnsgrunnlag())} + ${getInNok(bonus)} - ${getInNok(bruttotrekk)}`}
                                />
                            </span>
                            <span>{getInNok(BruttoMaanedslonn())}</span>
                        </li>

                        <li className="flex justify-between border-b-2 border-solid border-b-black-nav font-semibold mb-2">
                            <span className="flex justify-between gap-1">
                                Anslått brutto årslønn
                                <ReadMoreIcon
                                    text={`Anslår årslønn ved å ta månedslønn * 12 (uttak av ferie og opptjente feriepenger går omtrent opp i opp). Alternativt kan vi bruke snitt antall arbeidstimer i året (1695 timer når fem uker ferie og lovfestede helligdager er trukket fra) * timepris * 0,52 => ${billableHoursPerYear} * ${getInNok(timeprisProsjekt)} * 0,52 = ${getInNok(BruttoAarsLonnFakturert())} (NB! her vil 12% feriepenger opptjent foregåend år komme i tillegg)`}
                                />
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
    <div className="tooltip tooltip-top" data-tip={text}>
        <FontAwesomeIcon icon={faQuestionCircle} />
    </div>
)

const ReadMoreIconRight = ({ text }: { text: string }) => (
    <div className="tooltip tooltip-left" data-tip={text}>
        <FontAwesomeIcon icon={faQuestionCircle} />
    </div>
)

export default Kalkulator
