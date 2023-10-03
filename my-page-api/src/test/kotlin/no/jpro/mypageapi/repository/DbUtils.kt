package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.Apartment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionSynchronizationManager


@Component
class DbUtils {

    fun failOutsideTransaction(apartmentRepository: ApartmentRepository) {
        apartmentRepository.saveAll(listOf(Apartment(cabin_name="cabin_name", id=999)))
        val active = TransactionSynchronizationManager.isActualTransactionActive()
        throw RuntimeException("Transaction is $active")
    }

    @Transactional
    fun failInsideTransaction(apartmentRepository: ApartmentRepository) {
        apartmentRepository.saveAll(listOf(Apartment(cabin_name="cabin_name", id=999)))
        val active = TransactionSynchronizationManager.isActualTransactionActive()
        throw RuntimeException("Transaction is $active")
    }

}
