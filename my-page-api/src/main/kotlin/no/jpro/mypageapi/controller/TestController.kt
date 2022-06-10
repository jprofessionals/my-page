package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.web.bind.annotation.*

@RestController()
@RequestMapping("test")
@SecurityRequirement(name = "Bearer Authentication")
class TestController() {
    @GetMapping("")
    fun sayHelloSecure(): String? {
        return String.format("Hello from the secure API.")
    }
}
