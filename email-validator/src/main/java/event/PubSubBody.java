package event;

import java.util.Map;

public record PubSubBody (PubsubMessage message) {

  public record PubsubMessage (String data, Map<String, String> attributes, String messageId, String publishTime) {}
}
