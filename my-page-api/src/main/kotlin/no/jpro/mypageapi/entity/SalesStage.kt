package no.jpro.mypageapi.entity

enum class SalesStage {
    INTERESTED,         // Interessert - konsulenten er interessert i oppdraget
    SENT_TO_SUPPLIER,   // Sendt til leverandør - CV sendt til mellomledd
    SENT_TO_CUSTOMER,   // Sendt til kunde - CV sendt til sluttkunde
    INTERVIEW,          // Intervju - konsulenten er på intervju
    LOST                // Tapt - mistet oppdraget
}
