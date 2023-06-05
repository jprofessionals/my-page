export default function bidra() {
  return (
    <div className="p-4 prose" data-theme="jpro">
      <h2>Bidra til Min side</h2>
      <p>
        Min Side er en side som utvikles internt i JPro. Alle bidrag til siden
        mottas med takk, og er i tillegg en fin mulighet til å drive med litt
        egenutvikling.
      </p>
      <p>
        Applikasjonen er en Kotlin/Spring+React+MySQL applikasjon som hostes på
        GCP. Koden er å finne på{' '}
        <a
          href="https://github.com/jprofessionals/my-page"
          className="text-warning"
        >
          GitHub.
        </a>
      </p>
      <p>Kontakt Roger for å få rettigheter til å dytte kode til repoet.</p>
    </div>
  )
}
