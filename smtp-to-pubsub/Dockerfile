FROM bellsoft/liberica-openjre-alpine:17
WORKDIR /app
COPY target/smtp-to-pubsub-1.0-SNAPSHOT.jar /app/
CMD ["java", "-jar", "smtp-to-pubsub-1.0-SNAPSHOT.jar"]
EXPOSE 8080
