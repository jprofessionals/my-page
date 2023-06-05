FROM ghcr.io/graalvm/native-image:muslib-ol9-java17-22.3.2 AS graal
WORKDIR /app
COPY target/smtp-to-pubsub-1.0-SNAPSHOT-jar-with-dependencies.jar /app
RUN ls -al /app
RUN native-image \
    --no-fallback \
    -jar smtp-to-pubsub-1.0-SNAPSHOT-jar-with-dependencies.jar \
    --static \
    --libc=musl \
    -H:+ReportExceptionStackTraces \
    -H:Name=smtp-to-pubsub


FROM scratch
WORKDIR /app
COPY --from=graal /app/smtp-to-pubsub .
CMD ["./smtp-to-pubsub"]
EXPOSE 25
