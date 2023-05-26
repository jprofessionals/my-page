import com.google.cloud.functions.CloudEventsFunction;
import com.google.gson.Gson;
import event.PubSubBody;
import io.cloudevents.CloudEvent;
import no.jpro.mypage.RawEmail;
import org.apache.avro.io.Decoder;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.specific.SpecificDatumReader;
import validation.DKIMValidator;
import validation.Validator;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class EmailValidatorFunction implements CloudEventsFunction {
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

    @Override
    public void accept(CloudEvent event) {
        // The Pub/Sub message is passed as the CloudEvent's data payload.
        if (event.getData() != null) {
            // Extract Cloud Event data and convert to PubSubBody
            String cloudEventData = new String(event.getData().toBytes(), StandardCharsets.UTF_8);
            logger.info("Raw event data: " + cloudEventData);
            Gson gson = new Gson();
            PubSubBody body = gson.fromJson(cloudEventData, PubSubBody.class);
            // Retrieve and decode PubSub message data
            String encodedData = body.getMessage().getData();
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
}
