package no.jpro.mypageapi.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController


@RestController()
class TestController {
    @GetMapping()
    fun sayHello(): String? {
        return String.format("Hello from the API.")
    }
}