package no.jpro.mypageapi.repository

import no.jpro.mypageapi.entity.JobPosting
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionSynchronizationManager


@Component
class DbUtils {

    fun failOutsideTransaction(jobPostingRepository: JobPostingRepository) {
        jobPostingRepository.saveAll(listOf(JobPosting(title="title", customer="customer")))
        val active = TransactionSynchronizationManager.isActualTransactionActive()
        throw RuntimeException("Transaction is $active")
    }

    @Transactional
    fun failInsideTransaction(jobPostingRepository: JobPostingRepository) {
        jobPostingRepository.saveAll(listOf(JobPosting(title="title", customer="customer")))
        val active = TransactionSynchronizationManager.isActualTransactionActive()
        throw RuntimeException("Transaction is $active")
    }

}
