import React, {useEffect, useState} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import getInNok from '@/utils/getInNok'
import getAsNo from '@/utils/getAsNo'
import getSetting from '@/utils/getSetting'
// import { Settings } from '@/types'
import { useAuthContext } from '@/providers/AuthProvider'
import {AccordionContent, AccordionItem, Accordions, AccordionTrigger} from "@/components/ui/bookingAccordion";
import {round} from "@floating-ui/utils";
// import {useSearchParams} from "next/navigation";


function Kalkulator() {
    // const [searchParams, setSearchParams] = useSearchParams();

    const [garantilonn, setGarantilonn] = useState(0)
    const [grunnbelop, setGrunnbelop] = useState(0)
    const [timeprisKompetanse, setTimeprisKompetanse] = useState(0)
    const [stillingsprosent, setStillingsprosent] = useState(100)
    const [forrigeStillingsprosent, setForrigeStillingsprosent] = useState(100)
    const [foredragsbonus, setForedragsbonus] = useState(0)
    const [salgsbonus, setSalgsbonus] = useState<boolean>(false)
    const [salgsbonusBelop] = useState(60000)
    const [rekrutteringsbonus, setRekrutteringsbonus] = useState<boolean>(false)
    const [rekrutteringsbonusBelop] = useState(20000)
    const [bruttotrekk, setBruttotrekk] = useState(0)
    const [restKompetanseBudsjett, setRestKompetanseBudsjett] = useState(0)
    const [timeprisProsjekt, setTimeprisProsjekt] = useState(0)

    const billableHoursPerYear = 1695;

    const [antallArbeidsdager, setAntallArbeidsdager] = useState(21.67)
    const [antallTimerFakturert, setAntallTimerFakturert] = useState(+((antallArbeidsdager * 7.5).toFixed(2)))

    const [antallTimerKompetanse, setAntallTimerKompetanse] = useState(0)
    const [antallTimerInterntid, setAntallTimerInterntid] = useState(0)
    const [antallTimerInterntidMedKomp, setAntallTimerInterntidMedKom] =
        useState(0)
    const [antallTimerFerie, setAntallTimerFerie] = useState(0)
    const [antallTimerSyk, setAntallTimerSyk] = useState(0)

    const { settings } = useAuthContext()

    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        setLoading(true)
        setGarantilonn(parseInt(getSetting(settings, 'CALC_GARANTILONN') ?? '0'))
        setGrunnbelop(parseInt(getSetting(settings, 'CALC_GRUNNBELOP') ?? '0'))
        setTimeprisKompetanse(parseInt(getSetting(settings, 'CALC_TIMEPRIS_KOMPETANSE') ?? '0'))
        setRestKompetanseBudsjett(parseInt(getSetting(settings, 'CALC_RESTKOMPETANSE') ?? '0'))
        setTimeprisProsjekt(parseInt(getSetting(settings, 'CALC_TIMEPRIS') ?? '0'))
        setLoading(false)
    }, [settings]);


    // useEffect(() => {
    //     console.log(searchParams)
    //     if(searchParams){
    //         switch (searchParams[0]){
    //             case 'høy':
    //                 loadScenarioHigh()
    //                 break
    //             case 'lav':
    //                 loadScenarioLow()
    //                 break
    //             case 'snitt':
    //                 loadScenarioAvg()
    //                 break
    //         }
    //     }
    //     setLoading(false)
    // }, [settings, searchParams]);

    function loadScenarioAvg(){
        setTimeprisProsjekt(parseInt(getSetting(settings, 'CALC_TIMEPRIS') ?? '0'))
        setAntallArbeidsdager(21.67)
        setStillingsprosent(100)
        setForrigeStillingsprosent(100)
        setAntallTimerFakturert(+((21.67 * 7.5).toFixed(2)))
        setAntallTimerInterntidMedKom(0)
        setAntallTimerSyk(0)
        setRestKompetanseBudsjett(parseInt(getSetting(settings, 'CALC_RESTKOMPETANSE') ?? '0'))
        setAntallTimerKompetanse(0)
        setAntallTimerInterntid(0)
        setAntallTimerFerie(0)
        setSalgsbonus(false)
        setRekrutteringsbonus(false)
        setForedragsbonus(0)
        setBruttotrekk(0)
    }

    function loadScenarioHigh(){
        loadScenarioAvg()
        setTimeprisProsjekt(round(parseInt(getSetting(settings, 'CALC_TIMEPRIS') ?? '0')*1.2))
    }

    function loadScenarioLow(){
        loadScenarioAvg()
        setTimeprisProsjekt(round(parseInt(getSetting(settings, 'CALC_TIMEPRIS') ?? '0')*0.8))
    }

    function loadScenarioBench(){
        loadScenarioAvg()
        setAntallTimerFakturert(0)
        setAntallTimerInterntid(+((21.67 * 7.5).toFixed(2)))
    }

    function loadScenarioFirstMonth(){
        loadScenarioAvg()
        setAntallTimerFakturert(0)
        setAntallTimerInterntid(+((21.67 * 7.5).toFixed(2)))
        setForrigeStillingsprosent(0)
        setForedragsbonus(30000)
    }

    function loadScenarioLastMonthPlusOne(){
        loadScenarioAvg()
        setStillingsprosent(0)
    }

    function loadScenario100to50(){
        loadScenarioAvg()
        setForrigeStillingsprosent(100)
        setStillingsprosent(50)
    }

    function loadScenario50(){
        loadScenarioAvg()
        setForrigeStillingsprosent(50)
        setStillingsprosent(50)
        setAntallTimerFakturert(+((21.67 * 7.5 / 2).toFixed(2)))
    }

    function loadScenario50to100(){
        loadScenarioAvg()
        setAntallTimerFakturert(+((21.67 * 7.5 / 2).toFixed(2)))
        setForrigeStillingsprosent(50)
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
        return (NormertTid() * forrigeStillingsprosent / 100) - antallTimerFerie
    }

    function Forskudd() {
        return (garantilonn * stillingsprosent / 100)
    }

    function UtbetaltForskudd() {
        return (garantilonn * forrigeStillingsprosent / 100)
    }

    function TilgjengeligTid() {
        return Math.max(Math.min((DinNormerteTid() - AntallTimerBetaltTid()), (+antallTimerInterntid + AntallTimerUbetaltKompetanse())), 0)
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

    function SumBonus(){
        return +foredragsbonus + (salgsbonus===true?salgsbonusBelop:0) + (rekrutteringsbonus===true?rekrutteringsbonusBelop:0)
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
        return Forskudd() - UtbetaltForskudd() + SumBetaltTid() + MinimumsLonn() + SumBonus() - bruttotrekk;
    }

    function BruttoArsLonn() {
        return BruttoMaanedslonn() * 12
    }

    function BruttoAarsLonnFakturert() {
        return billableHoursPerYear * timeprisProsjekt * stillingsprosent / 100 * 0.52
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

    const handleForrigeStillingsprosentChange = (e: any) => {
        setForrigeStillingsprosent(Math.min(Math.floor(e.target.value), 100))
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

    const handleForedragsbonusChange = (e: any) => {
        setForedragsbonus(parseInt(e.target.value))
    }

    const handleSalgsbonusChange = (e: any) => {
        setSalgsbonus(!salgsbonus)
    }

    const handleRekrutteringsbonusChange = (e: any) => {
        setRekrutteringsbonus(!rekrutteringsbonus)
    }

    const handleBruttotrekkChange = (e: any) => {
        setBruttotrekk(parseInt(e.target.value))
    }

    return (
        loading?<><span>loading</span></>:<>
        <div className="flex flex-col gap-4 p-4">
            <div className="prose max-w-fit">
                <h2>Lønnskalkulator</h2>
                <p>
                    Her kan du se hvordan vi beregner lønn hver måned. Du kan
                    selv leke med tallene for å se hvordan dette påvirker beregningen av
                    bruttolønn. Du kan også klikke på de predefinerte
                    <strong> eksemplene</strong> under for å se hvordan beregningen blir i
                    forskjellige situasjoner.
                </p>
                <p>
                    Mer info om timeføring og lønnsberegning finner du på{' '}
                    <a href="https://sites.google.com/a/jpro.no/jpro-intranet/personalh%C3%A5ndbok/l%C3%B8nn-og-timef%C3%B8ring">
                        intranett
                    </a>.
                </p>
            </div>
            <Accordions type="multiple" className="mb-3 w-full">
                <AccordionItem value="bookings" className="border-none">
                    <AccordionTrigger
                        className="text-sm rounded-lg items-center px-3 gap-2 self-start hover:brightness-90 focus:brightness-90 data-open:brightness-90 data-open:rounded-b-none bg-yellow-hotel">
                        <div className="flex flex-1 gap-4 justify-between">
                          <span
                              title="Eksempler"
                              className="flex flex-wrap gap-2 justify-center uppercase"
                          >
                              Eksempler
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2 rounded-b-lg data-open:border-2">
                        <div className="flex flex-col gap-2">
                            <div className="space-x-2"><button onClick={loadScenarioAvg} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">Snitt</button><span>- Gjennomsnittlig timepris I JPro</span></div>
                            <div className="space-x-2"><button onClick={loadScenarioHigh} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">Høy</button><span>- 20% høyere timepris enn dagens gjennomsnitt i JPro</span></div>
                            <div className="space-x-2"><button onClick={loadScenarioLow} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">Lav</button><span>- 20% lavere timepris enn dagens gjennomsnitt i JPro</span></div>
                            <div className="space-x-2"><button onClick={loadScenarioBench} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">Ledig</button><span>- Lønn om man ikke har oppdrag</span></div>
                            <div className="space-x-2"><button onClick={loadScenario100to50} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">100% til 50%</button><span>- Lønn om man går fra 100% til 50% stilling</span></div>
                            <div className="space-x-2"><button onClick={loadScenario50} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">50%</button><span>- Lønn om man har en 50% stilling</span></div>
                            <div className="space-x-2"><button onClick={loadScenario50to100} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">50% til 100%</button><span>- Lønn om man går fra 50% til 100% stilling</span></div>
                            <div className="space-x-2"><button onClick={loadScenarioFirstMonth} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">Oppstart</button><span>- Lønn første måned som ansatt i JPro</span></div>
                            <div className="space-x-2"><button onClick={loadScenarioLastMonthPlusOne} className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md">Fratredelse</button><span>- Lønn måneden etter fratredelse</span></div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordions>
            <div className="flex flex-wrap gap-6 items-start">
                <div className="rounded-b-lg card card-bordered grow shrink-0">
                    <div className="p-4 rounded-t-lg border-b border-gray-300 bg-slate-200">
                        Standard verdier
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
                    <div className="p-4 border-b border-gray-300 bg-slate-200">Basis</div>
                    <div className="gap-2 p-4 form-control calculator-group">
                        <label className="input-group">
                            <span>Timepris på prosjekt</span>
                            <input
                                type="number"
                                min="0"
                                value={timeprisProsjekt}
                                onChange={handleTimeprisProsjektChange}
                                className="input input-bordered"
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Antall arbeidsdager
                                <ReadMoreIcon
                                    text="Antall arbeidsdager i foregående måneden. I snitt er det 21,67 arbeidsdager i én måned om man ikke tar hensyn til ferie og helligdager." />
                            </span>
                            <input
                                type="number"
                                min="0"
                                className="input input-bordered"
                                value={antallArbeidsdager}
                                onChange={handleAntallArbeidsdagerChange}
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Stilling (% forrige)
                                <ReadMoreIcon
                                    text="Stillingsprosent i foregående måned, denne påvirker beregningen av minimumslønn og estimat for utbetalt forskudd."/>
                            </span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                className="input input-bordered"
                                value={forrigeStillingsprosent}
                                onChange={handleForrigeStillingsprosentChange}
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Stilling (% nå)
                                <ReadMoreIconPushRight
                                    text="Stillingsprosent i inneværende måned, denne påvirker kun forskuddslønnen."/>
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
                    </div>
                </div>
                <div className="rounded-lg border border-gray-300 border-solid grow shrink-0">
                    <div className="p-4 border-b border-gray-300 bg-slate-200">Dine timer</div>
                    <div className="gap-2 p-4 form-control calculator-group">
                    <label className="input-group gap-1">
                            <span>Fakturert
                                <ReadMoreIconPushRightMore text="Antall timer fakturert kunde. I snitt er det 21,67 arbeidsdager i én måned." />
                            </span>
                            <input
                                type="number"
                                min="0"
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
                                min="0"
                                value={antallTimerInterntidMedKomp}
                                className="input input-bordered"
                                onChange={handleAntallTimerInterntidMedKomChange}
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Sykdom
                                <ReadMoreIconPushRightMore text="Egenmelding, sykemelding, sykt barn og foreldre permisjon" />
                            </span>
                            <input
                                type="number"
                                min="0"
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
                                min="0"
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
                                min="0"
                                className="input input-bordered"
                                value={antallTimerKompetanse}
                                onChange={handleAntallTimerKompetanseChange}
                            />
                        </label>
                        <label className="input-group">
                            <span>Interntid</span>
                            <input
                                type="number"
                                min="0"
                                className="input input-bordered"
                                value={antallTimerInterntid}
                                onChange={handleAntallTimerInterntidChange}
                            />
                        </label>
                        <label className="input-group">
                            <span>Ferie</span>
                            <input
                                type="number"
                                min="0"
                                className="input input-bordered"
                                value={antallTimerFerie}
                                onChange={handleAntallTimerFerieChange}
                            />
                        </label>

                    </div>
                </div>
                <div className="rounded-lg border border-gray-300 border-solid grow shrink-0">
                    <div className="p-4 rounded-t-lg border-b border-gray-300 bg-slate-200">
                        Bonus & bruttotrekk
                    </div>
                    <div className="gap-2 p-4 form-control calculator-group">
                        <label className="input-group" style={{display: "flex", justifyContent: "space-between"}}>
                            <span>
                                Salgsbonus
                                <ReadMoreIconPushRight
                                    text={`Bonus for bidrag til at konsulent i JPro har fått oppdrag, denne er pt ${getInNok(salgsbonusBelop)}`} />
                            </span>
                            <input
                                type="checkbox"
                                checked={salgsbonus}
                                onChange={handleSalgsbonusChange}
                                className="checkbox checkbox-md"
                            />
                        </label>
                        <label className="input-group" style={{display: "flex", justifyContent: "space-between"}}>
                            <span>
                                Rekrutteringsbonus
                                <ReadMoreIcon
                                    text={`Bonus for tips om kandidat som blir ansatt i JPro, denner er pt. ${getInNok(rekrutteringsbonusBelop)}`} />
                            </span>
                            <input
                                type="checkbox"
                                checked={rekrutteringsbonus}
                                onChange={handleRekrutteringsbonusChange}
                                className="checkbox checkbox-md"
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Annen bonus
                                <ReadMoreIconPushRight
                                    text="F.eks. bonus for å holde foredrag internt eller eksternt. Beløp anvhenger av flere faktorer, som lenger hvor foredraget holdes osv. se intranett for mer detaljer" />
                            </span>
                            <input
                                type="number"
                                min="0"
                                value={foredragsbonus}
                                onChange={handleForedragsbonusChange}
                                className="input input-bordered"
                            />
                        </label>
                        <label className="input-group gap-1">
                            <span>
                                Bruttotrekk
                            </span>
                            <input
                                type="number"
                                min="0"
                                value={bruttotrekk}
                                onChange={handleBruttotrekkChange}
                                className="input input-bordered"
                            />
                        </label>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-300 border-solid grow shrink-0 min-w-[310px]">
                    <div className="flex justify-between p-4 text-white bg-green-brand">
                        Etterskudd
                        <ReadMoreIconRight text="Viser beregning av etterskuddslønn og hvilke faktorer som er med" />
                    </div>
                    <ul className="flex flex-col gap-2 justify-between p-4">
                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Fakturert tid
                                <ReadMoreIconPushRight
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
                                <ReadMoreIconPushRight
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
                                <ReadMoreIconPushRight
                                    text={`(Normert tid * Stillingsprosent) - Ferie => (${getAsNo(NormertTid())} * ${getAsNo(forrigeStillingsprosent / 100)}) - ${getAsNo(antallTimerFerie)}`}
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
                                    text={`Hvor mye tid som er tilgjengelig for beregning av minimumslønn, kan ikke være mer enn din normerte tid - betalt tid. => (MINIMUM((${getAsNo(DinNormerteTid())} - ${getAsNo(AntallTimerBetaltTid())}),(${getAsNo(antallTimerInterntid)} + ${getAsNo(AntallTimerUbetaltKompetanse())}))`}
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
                                Etterskudd
                                <ReadMoreIconPushRight
                                    text={`Beregnet etterskudd er summen av beregnet minimumslønn og betalt tid => ${getInNok(MinimumsLonn())} + ${getInNok(SumBetaltTid())}`}
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
                                <ReadMoreIconPushRight
                                    text={`Forskudd for inneværende måned, beregnes som Minimumslønn * Stillingsprosent => ${getInNok(garantilonn)} * ${getAsNo(stillingsprosent / 100)} `} />
                            </span>
                            <span>{getInNok(Forskudd())}</span>
                        </li>

                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Utbetalt forskudd
                                <ReadMoreIcon text={`Trekk for forskudd utbetalt foregående måned, vil normalt være Minimumslønn * Stillingsprosent => ${getInNok(garantilonn)} * ${getAsNo(forrigeStillingsprosent / 100)}`} />
                            </span>
                            <span className="text-red-500">{getInNok(UtbetaltForskudd())}</span>
                        </li>

                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Etterskudd
                                <ReadMoreIconPushRight text="Etterskuddslønn beregnet på bakgrunn av timer ført for foregående måned" />
                            </span>
                            <span>{getInNok(Lonnsgrunnlag())}</span>
                        </li>

                        <li className="flex justify-between gap-4 ml-4">
                            <span className="flex justify-between gap-1">
                                Bonus
                            </span>
                            <span>{getInNok(SumBonus())}</span>
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
                                    text={`Forskudd - Utbetalt forskudd + Etterskudd + Bonus - Bruttotrekk => ${getInNok(Forskudd())} - ${getInNok(UtbetaltForskudd())} + ${getInNok(Lonnsgrunnlag())} + ${getInNok(SumBonus())} - ${getInNok(bruttotrekk)}`}
                                />
                            </span>
                            <span>{getInNok(BruttoMaanedslonn())}</span>
                        </li>

                        <li className="flex justify-between border-b-2 border-solid border-b-black-nav font-semibold mb-2">
                            <span className="flex justify-between gap-1">
                                Anslått brutto årslønn
                                <ReadMoreIcon
                                    text={`Anslår årslønn ved å ta månedslønn * 12 (uttak av ferie og opptjente feriepenger går omtrent opp i opp). Alternativt kan vi bruke snitt antall arbeidstimer i året (1695 timer når fem uker ferie og lovfestede helligdager er trukket fra) * timepris * stillingsprosent * 0,52 => ${billableHoursPerYear} * ${getInNok(timeprisProsjekt)} * ${getAsNo(stillingsprosent/100)} * 0,52 = ${getInNok(BruttoAarsLonnFakturert())} (NB! her vil 12% feriepenger opptjent foregåend år komme i tillegg)`}
                                />
                            </span>
                            <span>{getInNok(BruttoArsLonn())}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        </>
    )
}

const ReadMoreIconPushRight = ({ text }: { text: string }) => (
    <div className="tooltip tooltip push-right" data-tip={text}>
        <FontAwesomeIcon icon={faQuestionCircle} />
    </div>
)

const ReadMoreIconPushRightMore = ({ text }: { text: string }) => (
    <div className="tooltip tooltip push-right-more" data-tip={text}>
        <FontAwesomeIcon icon={faQuestionCircle} />
    </div>
)

const ReadMoreIcon = ({ text }: { text: string }) => (
    <div className="tooltip tooltip" data-tip={text}>
        <FontAwesomeIcon icon={faQuestionCircle} />
    </div>
)

const ReadMoreIconRight = ({ text }: { text: string }) => (
    <div className="tooltip tooltip-left" data-tip={text}>
        <FontAwesomeIcon icon={faQuestionCircle} />
    </div>
)

export default Kalkulator
