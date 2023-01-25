import React, { useState } from "react";
import "./Kalkulator.scss";

function Kalkulator() {
  const [garantilonn, setGarantilønn] = useState(50000);
  const [bonus, setBonus] = useState(0);
  const [grunnbelop, setGrunnbelop] = useState(111477);
  const [antallTimerMnd, setAntallTimerMnd] = useState(157.5);
  const [restKompetanseBudsjett, setRestKompetanseBudsjett] = useState(50);
  const [timeprisProsjekt, setTimeprisProsjekt] = useState(1650);
  const [timeprisKompetanse, setTimeprisKompetanse] = useState(1259);
  const [antallTimerFakturert, setAntallTimerFakturert] = useState(150);
  const [antallTimerKompetanse, setAntallTimerKompetanse] = useState(0);
  const [antallTimerInterntid, setAntallTimerInterntid] = useState(0);
  const [antallTimerInterntidMedKomp, setAntallTimerInterntidMedKom] = useState(0);
  const [antallTimerFerie, setAntallTimerFerie] = useState(0);
  const [antallTimerEgenmelding, setAntallTimerEgenmelding] = useState(0);
  // const [antallTimerSyktBarn, setAntallTimerSyktBarn] = useState(0);
  // const [antallTimerSykemelding, setAntallTimerSykemelding] = useState(0);
  // const [antallTimerForeldrePerm, setAntallTimerForeldrePerm] = useState(0);

  function Timelonn9G() {
    return ((grunnbelop * 9) / 1880);
  }

  function SumSykeLonn() {
    return (Timelonn9G() * AntallTimerSyk())
  }

  function AntallTimerSyk() {
    return antallTimerEgenmelding
    // return+antallTimerEgenmelding + +antallTimerSyktBarn + +antallTimerForeldrePerm + +antallTimerSykemelding;

  }

  function SumFakturertTid() {
    return (timeprisProsjekt * 0.52 * antallTimerFakturert)
  }

  function SumBetaltTid() {
    return +SumSykeLonn() + +SumFakturertTid() + +SumKompetanse()
  }

  function SumKompetanse() {
    return (timeprisKompetanse * 0.52 * Math.min(antallTimerKompetanse, restKompetanseBudsjett))
  }

  function SumTilgjengeligTid() {
    return (+antallTimerFakturert + +antallTimerKompetanse + +antallTimerInterntid + +antallTimerInterntidMedKomp + +AntallTimerSyk())
  }

  function BeregnetGarantilonn() {
    return (Math.min(1, +SumTilgjengeligTid() / antallTimerMnd) * garantilonn)
  }

  function Bruttolonn() {
    return +Math.max(BeregnetGarantilonn(), SumBetaltTid()) + +bonus
  }

  const handleGarantilonnChange = (e) => {
    setGarantilønn(e.target.value);
  };

  const handleGrunnbelopChange = (e) => {
    setGrunnbelop(e.target.value);
  };

  const handleAntallTimerMndChange = (e) => {
    setAntallTimerMnd(e.target.value);
  };

  const handleRestKompetanseBudsjettChange = (e) => {
    setRestKompetanseBudsjett(e.target.value);
  };

  const handleTimeprisProsjektChange = (e) => {
    setTimeprisProsjekt(e.target.value);
  };

  const handleTimeprisKompetanseChange = (e) => {
    setTimeprisKompetanse(e.target.value);
  };

  const handleAntallTimerFakturertChange = (e) => {
    setAntallTimerFakturert(e.target.value);
  };

  const handleAntallTimerKompetanseChange = (e) => {
    setAntallTimerKompetanse(e.target.value);
  };

  const handleAntallTimerInerntidChange = (e) => {
    setAntallTimerInterntid(e.target.value);
  };

  const handleAntallTimerInterntidMedKomChange = (e) => {
    setAntallTimerInterntidMedKom(e.target.value);
  };

  const handleAntallTimerFerieChange = (e) => {
    setAntallTimerFerie(e.target.value);
  };

  const handleAntallTimerEgenmeldingChange = (e) => {
    setAntallTimerEgenmelding(e.target.value);
  };

  // const handleAntallTimerSyktBarnChange = (e) => {
  //   setAntallTimerSyktBarn(e.target.value);
  // };

  // const handleAntallTimerSykemeldingChange = (e) => {
  //   setAntallTimerSykemelding(e.target.value);
  // };

  // const handleAntallTimerForeldrePermChange = (e) => {
  //   setAntallTimerForeldrePerm(e.target.value);
  // };

  const handleBonusChange = (e) => {
    setBonus(e.target.value);
  };

  return (
    <>
      <div className="topp">
        <h3>Lønnskalulator</h3>
      </div>
      <div className="kalkulator">
        <div className="input">
          <div className="column">
            <h4>Basis</h4>
            <ul>
              <li>Syntetisk timepris<input type="number" disabled={true} value={timeprisKompetanse} onChange={handleTimeprisKompetanseChange} /></li>
              <li>Garantilønn<input type="number" disabled={true} value={garantilonn} onChange={handleGarantilonnChange} /></li>
              <li>Grunnbeløp<input type="number" disabled={true} value={grunnbelop} onChange={handleGrunnbelopChange} /></li>
              <li>Timer i måned<input type="number" value={antallTimerMnd} onChange={handleAntallTimerMndChange} /></li>
              <li>Rest komperansetimer<input type="number" value={restKompetanseBudsjett} onChange={handleRestKompetanseBudsjettChange} /></li>
              {/* <li><input type="range" value={restKompetanseBudsjett} onChange={handleRestKompetanseBudsjettChange} /></li> */}
              <li>Timepris på prosjekt<input type="number" value={timeprisProsjekt} onChange={handleTimeprisProsjektChange} /></li>
              {/* <li><input type="range" value={timeprisProsjekt} min={1000} max={2500} onChange={handleTimeprisProsjektChange} /></li> */}
              <li>Bonus<input type="number" value={bonus} onChange={handleBonusChange} /></li>
            </ul>

          </div>
          <div className="column">
            <h4>Timer</h4>
            <ul>
              <li>Fakturerte timer<input type="number" value={antallTimerFakturert} onChange={handleAntallTimerFakturertChange} /></li>
              <li>Kompetanseheving<input type="number" value={antallTimerKompetanse} onChange={handleAntallTimerKompetanseChange} /></li>
              <li>Interntid<input type="number" value={antallTimerInterntid} onChange={handleAntallTimerInerntidChange} /></li>
              <li>Interntid m/komp<input type="number" value={antallTimerInterntidMedKomp} onChange={handleAntallTimerInterntidMedKomChange} /></li>
              <li>Ferie<input type="number" value={antallTimerFerie} onChange={handleAntallTimerFerieChange} /></li>
              <li>Sykdom<input type="number" value={antallTimerEgenmelding} onChange={handleAntallTimerEgenmeldingChange} /></li>
              {/* <li>Sykt barn<input type="number" value={antallTimerSyktBarn} onChange={handleAntallTimerSyktBarnChange} /></li>
              <li>Sykemelding<input type="number" value={antallTimerSykemelding} onChange={handleAntallTimerSykemeldingChange} /></li>
              <li>foreldrepermisjon<input type="number" value={antallTimerForeldrePerm} onChange={handleAntallTimerForeldrePermChange} /></li> */}
            </ul>
          </div>
          <div className="column">
            <h4>Resultat</h4>
            <ul>
              <li>9G timelønn: <span>{Timelonn9G().toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}</span></li>
              <li>Sum sykelønn: <span>{SumSykeLonn().toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}</span></li>
              <li>Sum fakturert tid: <span>{SumFakturertTid().toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}</span></li>
              <li>Sum kompetanse: <span>{SumKompetanse().toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}</span></li>
              <li>Sum betalt tid: <span>{SumBetaltTid().toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}</span></li>
              <li>Tilgjengelig tid: <span>{SumTilgjengeligTid()} av {antallTimerMnd}</span></li>
              <li>Beregnet garantilønn: <span>{BeregnetGarantilonn().toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}</span></li>
              <li>Bruttolønn: <span>{Bruttolonn().toLocaleString('no-NO', { maximumFractionDigits: 2, style: 'currency', currency: 'NOK' })}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}


export default Kalkulator;