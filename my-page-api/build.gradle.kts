import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.0.6"
    id("io.spring.dependency-management") version "1.1.0"
    id("org.liquibase.gradle") version "2.2.0"
    id("com.google.cloud.tools.appengine") version "2.4.4"
    kotlin("jvm") version "1.8.21"
    kotlin("plugin.spring") version "1.8.21"
    kotlin("plugin.jpa") version "1.8.21"
}

group = "no.jpro"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
}

dependencyManagement {
    imports {
        mavenBom("com.google.cloud:spring-cloud-gcp-dependencies:4.3.0")
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("com.google.cloud:spring-cloud-gcp-starter-sql-mysql")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.1.0")

    runtimeOnly("com.h2database:h2")

    liquibaseRuntime("org.liquibase:liquibase-core:4.21.1")
    liquibaseRuntime("info.picocli:picocli:4.7.3")
    liquibaseRuntime("com.mysql:mysql-connector-j:8.0.33")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

liquibase {
    activities {
        register("main") {
            val url = project.properties["liquibaseUrl"] as String? ?: ""
            val username = project.properties["liquibaseUsername"] as String? ?: ""
            val password = project.properties["liquibasePassword"] as String? ?: ""

            this.arguments = mapOf(
                "url" to url,
                "username" to username,
                "password" to password,
                "changelogFile" to "db-migration/changelog/db.changelog-root.yaml",
                "driver" to "com.mysql.cj.jdbc.Driver"
            )
        }
    }
}

appengine {
    deploy { // deploy configuration
        projectId = "my-page-jpro-test"
        version = "GCLOUD_CONFIG"
    }
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
