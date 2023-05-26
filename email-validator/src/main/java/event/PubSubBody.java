package event;

import java.util.Map;

public class PubSubBody {
  private PubsubMessage message;

  public PubsubMessage getMessage() {
    return message;
  }

  public class PubsubMessage {
    private String data;
    private Map<String, String> attributes;
    private String messageId;
    private String publishTime;

    public String getData() {
      return data;
    }

    public void setData(String data) {
      this.data = data;
    }

    public Map<String, String> getAttributes() {
      return attributes;
    }

    public void setAttributes(Map<String, String> attributes) {
      this.attributes = attributes;
    }

    public String getMessageId() {
      return messageId;
    }

    public void setMessageId(String messageId) {
      this.messageId = messageId;
    }

    public String getPublishTime() {
      return publishTime;
    }

    public void setPublishTime(String publishTime) {
      this.publishTime = publishTime;
    }
  }
}
