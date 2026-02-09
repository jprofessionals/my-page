package no.jpro.mypageapi.testutil

import no.jpro.mypageapi.model.Customer
import no.jpro.mypageapi.model.JobPosting
import no.jpro.mypageapi.model.Tag
import org.springframework.stereotype.Component
import java.net.URI

@Component
class ModelFactory {

    fun createJobPosting(tags: List<String>): JobPosting {
        return JobPosting(
            title = "title",
            customer = Customer(name = "customer", sector = no.jpro.mypageapi.model.CustomerSector.UNKNOWN),
            description = "description",
            urgent = false,
            hidden = false,
            tags = tags.map { Tag(name = it) },
            links = listOf(URI.create("http://example.com"))
        )
    }


}