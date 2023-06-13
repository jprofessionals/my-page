package event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PubSubBody (PubsubMessage message) {

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record PubsubMessage (String data, Map<String, String> attributes, String messageId, String publishTime) {}
}
