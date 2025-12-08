package no.jpro.mypageapi.entity

enum class ClosedReason {
    REJECTED_BY_SUPPLIER,     // Ble ikke valgt å sendes inn av leverandør
    REJECTED_BY_CUSTOMER,     // Ble ikke valgt av kunde
    MISSING_REQUIREMENTS,     // Avvist pga. manglende må-krav
    OTHER_CANDIDATE_CHOSEN,   // En annen kandidat ble valgt
    ASSIGNMENT_CANCELLED,     // Oppdraget ble kansellert
    CONSULTANT_UNAVAILABLE,   // Konsulenten ble utilgjengelig
    CONSULTANT_WON_OTHER,     // Konsulenten vant et annet oppdrag (auto)
    OTHER                     // Annen grunn (se notater)
}
