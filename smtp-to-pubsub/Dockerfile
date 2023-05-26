FROM ghcr.io/graalvm/native-image:muslib-ol9-java17-22.3.2 AS graal
WORKDIR /app
COPY mvnw /app/
COPY .mvn/ /app/.mvn
COPY pom.xml /app/
COPY email-validator/ /app/email-validator/
COPY my-page-api/ /app/my-page-api/
COPY schemas/ /app/schemas/
COPY smtp-to-pubsub/ /app/smtp-to-pubsub/
RUN ls -al /app/.mvn/wrapper
RUN ./mvnw -pl smtp-to-pubsub -am -Pnative clean package

FROM scratch
COPY --from=graal /app/smtp-to-pubsub/target/smtp-to-pubsub /
CMD ["./smtp-to-pubsub"]
EXPOSE 25
