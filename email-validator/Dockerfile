FROM bellsoft/liberica-openjre-alpine:17
WORKDIR /app
COPY target/email-validator-1.0-SNAPSHOT.jar /app/
CMD ["java", "-jar", "email-validator-1.0-SNAPSHOT.jar"]
EXPOSE 8080
