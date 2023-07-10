package logging;

import ch.qos.logback.classic.spi.LoggingEvent;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;
import org.slf4j.event.KeyValuePair;

import java.util.List;

public class SeverityAddingFilter extends Filter<LoggingEvent> {

    @Override
    public FilterReply decide(LoggingEvent event) {
        try {
            KeyValuePair severity = new KeyValuePair("severity", event.getLevel().levelStr);
            if (event.getKeyValuePairs() != null) {
                event.getKeyValuePairs().add(severity);
            } else {
                event.setKeyValuePairs(List.of(severity));
            }
        } catch (Exception e) {
            System.out.printf("Error in SeverityAddingFilter, %s %s%n", e.getClass(), e.getMessage());
        }
        return FilterReply.NEUTRAL;
    }
}
