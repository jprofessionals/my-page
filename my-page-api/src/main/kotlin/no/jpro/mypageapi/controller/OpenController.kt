package no.jpro.mypageapi.controller

import io.swagger.v3.oas.annotations.tags.Tag
import no.jpro.mypageapi.entity.Employee
import no.jpro.mypageapi.repository.EmployeeRepository
import org.springframework.web.bind.annotation.*

@RestController()
@RequestMapping("open")
@Tag(name = "Open")
class OpenController(private val employeeRepository: EmployeeRepository) {
    @GetMapping("test")
    fun sayHello(): String? {
        return String.format("Hello from the API.")
    }

    @GetMapping("employees")
    fun getEmployees(): List<Employee> = employeeRepository.findAll();

    @PostMapping("employees")
    fun createEmployee(@RequestBody employee: Employee): Employee = employeeRepository.save(employee)
}