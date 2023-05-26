package validation;

import no.jpro.mypage.RawEmail;
import org.apache.james.jdkim.DKIMVerifier;
import org.apache.james.jdkim.api.SignatureRecord;
import org.apache.james.jdkim.exceptions.FailException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class DKIMValidator implements Validator<RawEmail> {

    private final Logger logger = Logger.getLogger(DKIMValidator.class.getName());

    private static final List<String> REQUIRED_HEADERS = List.of("from", "to", "cc", "subject");

    @Override
    public boolean isValid(RawEmail email) {
        try {
            DKIMVerifier dkimVerifier = new DKIMVerifier();
            List<SignatureRecord> signatureRecords = dkimVerifier.verify(new ByteArrayInputStream(email.getContent().array()));
            return signatureRecords != null
                    && !signatureRecords.isEmpty()
                    && anySignatureHasRequiredHeaders(signatureRecords);
        } catch (IOException | FailException e) {
            logger.log(Level.INFO, "DKIM validation failed: ", e);
            return false;
        }
    }

    private static boolean anySignatureHasRequiredHeaders(List<SignatureRecord> signatureRecords) {
        return signatureRecords.stream()
                .anyMatch(signature -> new HashSet<>(signature.getHeaders()).containsAll(REQUIRED_HEADERS));
    }
}
