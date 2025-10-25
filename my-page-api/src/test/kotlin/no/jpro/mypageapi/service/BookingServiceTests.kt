package no.jpro.mypageapi.service

import no.jpro.mypageapi.config.MockApplicationConfig
import no.jpro.mypageapi.entity.Apartment
import no.jpro.mypageapi.entity.Booking
import no.jpro.mypageapi.entity.User
import no.jpro.mypageapi.repository.BookingRepository
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.time.LocalDate
import java.util.*


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ExtendWith(MockitoExtension::class)
@Import(MockApplicationConfig::class) //Import @Beans used by Spring Boot at application startup
class BookingServiceTests  @Autowired constructor(private val bookingService: BookingService) {

    @MockitoBean
    lateinit var bookingRepository: BookingRepository //Used by BookingService


    private fun createBookings(): List<Booking> {
        return listOf(Booking(id=1L,
                              startDate=LocalDate.now(),
                              endDate=LocalDate.now().plusDays(2),
                              apartment=Apartment(id=1L,
                                                  cabin_name="cabin_name",
                                                  sort_order=1),
                              employee=User(id=1L,
                                            email="email",
                                            name="name",
                                            givenName="givenName",
                                            familyName="familyName",
                                            budgets=Collections.emptyList())
                              ),
                      Booking(id=2L,
                              startDate=LocalDate.now().plusDays(7),
                              endDate=LocalDate.now().plusDays(7+2),
                              apartment=Apartment(id=1L,
                                                  cabin_name="cabin_name",
                                                  sort_order=1),
                              employee=User(id=1L,
                                            email="email",
                                            name="name",
                                            givenName="givenName",
                                            familyName="familyName",
                                            budgets=Collections.emptyList())))
    }

    @Test
    fun testGetUserBookings() {
        //Mock repository calls
        val bookings = createBookings()
        Mockito.`when`(bookingRepository.findBookingsByEmployeeSub(Mockito.anyString())).thenReturn(bookings)

        //Call the actual service method
        val userBookings = bookingService.getUserBookings("mock")

        //Verify result

        Assertions.assertEquals(2, userBookings.size)

        val bookingDTO1 = userBookings.find { booking -> booking.id==1L }
        Assertions.assertEquals(bookings[0].startDate, bookingDTO1?.startDate)
        Assertions.assertEquals(bookings[0].endDate, bookingDTO1?.endDate)
        Assertions.assertEquals(bookings[0].apartment?.id, bookingDTO1?.apartment?.id)
        Assertions.assertEquals(bookings[0].employee?.name, bookingDTO1?.employeeName)

        val bookingDTO2 = userBookings.find { booking -> booking.id==2L }
        Assertions.assertEquals(bookings[1].startDate, bookingDTO2?.startDate)
        Assertions.assertEquals(bookings[1].endDate, bookingDTO2?.endDate)
        Assertions.assertEquals(bookings[1].apartment?.id, bookingDTO2?.apartment?.id)
        Assertions.assertEquals(bookings[1].employee?.name, bookingDTO2?.employeeName)
    }

}
