import com.google.gson.Gson;
import com.sun.net.httpserver.HttpServer;
import event.PubSubBody;
import no.jpro.mypage.RawEmail;
import org.apache.avro.io.Decoder;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.specific.SpecificDatumReader;
import validation.DKIMValidator;
import validation.Validator;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class EmailValidatorFunction {
    private static final Logger logger = Logger.getLogger(EmailValidatorFunction.class.getName());
    private static final SpecificDatumReader<RawEmail> reader = new SpecificDatumReader<>(RawEmail.getClassSchema());

    private final List<Validator<RawEmail>> validators;

    public EmailValidatorFunction(List<Validator<RawEmail>> validators) {
        this.validators = validators;
    }

    public EmailValidatorFunction() {
        this(List.of(
                new DKIMValidator()
        ));
    }

    public void accept(PubSubBody message) {
        if (message != null) {
            String encodedData = message.getMessage().getData();
            byte[] data = Base64.getDecoder().decode(encodedData);
            InputStream inputStream = new ByteArrayInputStream(data);

            Decoder decoder = DecoderFactory.get().directBinaryDecoder(inputStream, /*reuse=*/ null);

            try {
                RawEmail email = reader.read(null, decoder);
                logger.info("Validating email from: " + email.getFrom());
                Map<Boolean, List<Validator<RawEmail>>> partitionedValidators = validators.stream()
                        .collect(Collectors.partitioningBy(validator -> validator.isValid(email)));
                log(partitionedValidators.get(Boolean.FALSE), "Failed validators: ");
                log(partitionedValidators.get(Boolean.TRUE), "Successful validators: ");

                if (partitionedValidators.get(Boolean.FALSE).isEmpty()) {
                    logger.info("ALL VALIDATIONS SUCCESSFUL");
                }
            } catch (IOException e) {
                logger.log(Level.WARNING, "Error decoding Avro", e);
            }

            logger.info("Validation complete");
        }
    }

    private void log(List<Validator<RawEmail>> validators, String messagePrefix) {
        logger.info(messagePrefix + validators.stream()
                .map(validator -> validator.getClass().getName())
                .collect(Collectors.joining(", ")));
    }

    public static void main(String[] args) throws IOException {
        logger.info("Starting email-validator");
        HttpServer httpServer = HttpServer.create(new InetSocketAddress(8080), 16);
        EmailValidatorFunction emailValidatorFunction = new EmailValidatorFunction();
        Gson gson = new Gson();
        httpServer.createContext("/", exchange -> {
            logger.info("Handling request, method=" + exchange.getRequestMethod() + ", path="+exchange.getHttpContext().getPath());
            try {
                InputStreamReader inputStreamReader = new InputStreamReader(exchange.getRequestBody());
                PubSubBody message = gson.fromJson(inputStreamReader, PubSubBody.class);
                emailValidatorFunction.accept(message);
            } catch (Exception e) {
                logger.log(Level.WARNING, "Error processing request", e);
            }
            exchange.sendResponseHeaders(200, 0);
            exchange.getResponseBody().close();
            logger.info("Request complete");
        });
        httpServer.start();
    }
}
