package no.jpro.mypageapi.entity

enum class ActivityStatus {
    ACTIVE,           // Pågående salgsprosess
    WON,              // Konsulenten fikk oppdraget
    CLOSED_OTHER_WON  // Auto-lukket - konsulenten vant et annet oppdrag
}
