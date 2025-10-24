package no.jpro.mypageapi.entity

import jakarta.persistence.*
import no.jpro.mypageapi.entity.Apartment

/**
 * Merk: Vi gjenbruker den eksisterende Apartment-tabellen.
 * 
 * De tre enhetene som allerede finnes i databasen:
 * - Stor leilighet
 * - Liten leilighet
 * - Anneks
 */
object CabinUnits {
    const val STOR_LEILIGHET = "Stor leilighet"
    const val LITEN_LEILIGHET = "Liten leilighet"
    const val ANNEKS = "Anneks"
    
    fun getAllUnitNames(): List<String> = listOf(STOR_LEILIGHET, LITEN_LEILIGHET, ANNEKS)
}
