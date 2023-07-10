FROM ghcr.io/graalvm/native-image:muslib-ol9-java17-22.3.2 AS graal
WORKDIR /app
COPY target/email-validator-1.0-SNAPSHOT.jar /app/
COPY reflect-config.json resource-config.json /app/
RUN ls -al /app
RUN native-image \
    --no-fallback \
    -jar email-validator-1.0-SNAPSHOT.jar \
    --static \
    --libc=musl \
    -H:+ReportExceptionStackTraces \
    -H:ResourceConfigurationFiles=resource-config.json \
    -H:ReflectionConfigurationFiles=reflect-config.json \
    -H:Name=email-validator


FROM scratch
WORKDIR /app
COPY --from=graal /app/email-validator .
CMD ["./email-validator"]
EXPOSE 8080
