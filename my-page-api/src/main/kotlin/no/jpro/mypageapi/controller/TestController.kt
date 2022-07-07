package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController()
@RequestMapping("test")
@SecurityRequirement(name = "Bearer Authentication")
class TestController() {
    @GetMapping("")
    fun sayHelloSecure(): String? {
        return String.format("Hello from the secure API.")
    }
}
