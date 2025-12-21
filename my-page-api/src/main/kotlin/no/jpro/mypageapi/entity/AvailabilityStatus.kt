package no.jpro.mypageapi.entity

enum class AvailabilityStatus {
    AVAILABLE,        // Ledig nå
    AVAILABLE_SOON,   // Blir ledig på en gitt dato
    ASSIGNED,         // Har vunnet oppdrag, venter på oppstart
    OCCUPIED          // Opptatt
}
