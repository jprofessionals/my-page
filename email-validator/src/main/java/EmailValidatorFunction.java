import com.google.cloud.pubsub.v1.Publisher;
import com.google.cloud.pubsub.v1.PublisherInterface;
import com.google.gson.Gson;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;
import com.sun.net.httpserver.HttpServer;
import event.PubSubBody;
import no.jpro.mypage.RawEmail;
import org.apache.avro.io.Decoder;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.io.Encoder;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.specific.SpecificDatumReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import validation.DKIMValidator;
import validation.Validator;

import java.io.*;
import java.net.InetSocketAddress;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class EmailValidatorFunction {
    private static final Logger logger = LoggerFactory.getLogger(EmailValidatorFunction.class);
    private static final SpecificDatumReader<RawEmail> reader = new SpecificDatumReader<>(RawEmail.getClassSchema());

    private static final Gson gson = new Gson();

    private final PublisherInterface publisher;

    private final List<Validator<RawEmail>> validators;

    public EmailValidatorFunction(
            List<Validator<RawEmail>> validators,
            PublisherInterface publisher
    ) {
        this.validators = validators;
        this.publisher = publisher;
    }

    public EmailValidatorFunction() {
        this(
                List.of(
                        new DKIMValidator()
                ),
                tryCreatePublisher()
        );
    }

    public void accept(PubSubBody message) {
        if (message != null) {
            String encodedData = message.getMessage().getData();
            byte[] data = Base64.getDecoder().decode(encodedData);
            InputStream inputStream = new ByteArrayInputStream(data);

            Decoder decoder = DecoderFactory.get().directBinaryDecoder(inputStream, /*reuse=*/ null);

            final RawEmail email;
            try {
                email = reader.read(null, decoder);
            } catch (IOException e) {
                logger.warn("Error decoding Avro", e);
                return;
            }
            logger.info("Validating email from: " + email.getFrom());
            Map<Boolean, List<Validator<RawEmail>>> partitionedValidators = validators.stream()
                    .collect(Collectors.partitioningBy(validator -> validator.isValid(email)));
            log(partitionedValidators.get(Boolean.FALSE), "Failed validators: ");
            log(partitionedValidators.get(Boolean.TRUE), "Successful validators: ");

            if (partitionedValidators.get(Boolean.FALSE).isEmpty()) {
                logger.info("ALL VALIDATIONS SUCCESSFUL");
                onAllPass(email);
            }

            logger.info("Validation complete");
        }
    }

    private void log(List<Validator<RawEmail>> validators, String messagePrefix) {
        logger.info(messagePrefix + validators.stream()
                .map(validator -> validator.getClass().getName())
                .collect(Collectors.joining(", ")));
    }

    private void onAllPass(RawEmail email) {
        try {
            PubsubMessage message = PubsubMessage.newBuilder()
                    .setData(ByteString.copyFrom(encodeToAvro(email)))
                    .build();
            publisher.publish(message);
        } catch (IOException e) {
            logger.warn("Error encoding Avro", e);
        }
    }

    private byte[] encodeToAvro(RawEmail email) throws IOException {
        ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
        Encoder encoder = EncoderFactory.get().directBinaryEncoder(byteStream, /*reuse=*/ null);
        email.customEncode(encoder);
        encoder.flush();
        return byteStream.toByteArray();
    }

    public static void main(String[] args) throws IOException {
        logger.info("Starting email-validator");
        HttpServer httpServer = HttpServer.create(new InetSocketAddress(8080), 16);
        EmailValidatorFunction emailValidatorFunction = new EmailValidatorFunction();
        httpServer.createContext("/", exchange -> {
            logger.info("Handling request, method=" + exchange.getRequestMethod() + ", path="+exchange.getHttpContext().getPath());
            try {
                InputStreamReader inputStreamReader = new InputStreamReader(exchange.getRequestBody());
                BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
                String bodyAsString = bufferedReader.lines().collect(Collectors.joining("\n"));
                logger.info("Body: '" + bodyAsString + "'");
                PubSubBody message = gson.fromJson(bodyAsString, PubSubBody.class);
                emailValidatorFunction.accept(message);
            } catch (Exception e) {
                logger.warn("Error processing request", e);
            }
            exchange.sendResponseHeaders(200, 0);
            exchange.getResponseBody().close();
            logger.info("Request complete");
        });
        httpServer.start();
    }

    private static String getEnvVariableOrThrow(String variableName) {
        return Optional.ofNullable(System.getenv().get(variableName))
                .orElseThrow(() -> new RuntimeException(variableName + " not defined in environment variables"));
    }

    private static PublisherInterface tryCreatePublisher() {
        final String projectId = getEnvVariableOrThrow("GOOGLE_CLOUD_PROJECT_NAME");
        final String topicId = "validated-emails";
        final TopicName topicName = TopicName.of(projectId, topicId);
        try {
            return Publisher.newBuilder(topicName)
                    .setEndpoint("europe-west1-pubsub.googleapis.com:443")
                    .setEnableMessageOrdering(true)
                    .build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
