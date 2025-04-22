# SmartInventory with Kafka and WebSocket Notification System

This project consists of two Spring Boot applications:
1. **SmartInventory** - Main inventory management system
2. **Notification** - Notification service that receives messages from the main application

## System Architecture

The system uses a combination of Kafka messaging and WebSockets for real-time notifications:

```
┌─────────────────┐     Kafka      ┌─────────────────┐     WebSocket     ┌─────────────┐
│  SmartInventory │ ─────────────► │   Notification  │ ──────────────►  │   Browser   │
│    (Producer)   │  notification  │    (Consumer)   │      /ws          │   Client    │
└─────────────────┘     topic      └─────────────────┘                   └─────────────┘
```

- **SmartInventory** sends notification messages to Kafka when specific events occur (like low inventory volume)
- **Notification** service consumes these messages from Kafka and:
  1. Stores them in the database
  2. Broadcasts them to connected clients via WebSocket

## Kafka Configuration

### Setup Requirements

1. Install and run Kafka and Zookeeper:
   - Download Kafka from https://kafka.apache.org/downloads
   - Start Zookeeper: `bin/zookeeper-server-start.sh config/zookeeper.properties`
   - Start Kafka: `bin/kafka-server-start.sh config/server.properties` 

2. Create the notification topic:
   ```
   bin/kafka-topics.sh --create --topic notification-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
   ```

## WebSocket Configuration

The notification service uses Spring's STOMP WebSocket support for real-time communication:

- Endpoint: `/ws` with SockJS support
- Message broker destinations:
  - `/topic/notifications` - Broadcast notifications
  - `/topic/admin/notifications` - Admin-specific notifications
  - `/queue/notifications/{userId}` - User-specific notifications

## Running the System

1. Start the applications:
   - Start SmartInventory: `cd smartinventory && ./mvnw spring-boot:run`
   - Start Notification: `cd notification && ./mvnw spring-boot:run`

2. Open the WebSocket client:
   - Navigate to http://localhost:8081/ in your browser
   - Enter user ID (use "admin" to see admin notifications)
   - Click "Connect" to establish WebSocket connection

## Testing the System

1. Send a test notification with curl:
   ```
   curl -X POST "http://localhost:8080/api/test/send-notification?userId=user123&message=Hello%20World"
   ```
   
2. To test the low inventory notification:
   - Export multiple products using the API
   - When inventory volume drops below threshold, admin notification is sent

3. REST API endpoints:
   ```
   # Get all notifications for a user
   GET http://localhost:8081/api/notifications/user/{userId}
   
   # Get unread notifications for a user
   GET http://localhost:8081/api/notifications/user/{userId}/unread
   
   # Mark notification as read
   PUT http://localhost:8081/api/notifications/{notificationId}/read
   ```

## Implementation Details

1. **SmartInventory**:
   - Uses `NotificationProducerService` to send Kafka messages
   - Performs volume calculation for products after export
   - Sends admin notifications when volume threshold is crossed

2. **Notification**:
   - Consumes Kafka messages via `@KafkaListener`
   - Stores notifications in database
   - Broadcasts notifications via WebSocket using `WebSocketService`
ory with Kafka Notification System

This project consists of two Spring Boot applications:
1. **SmartInventory** - Main inventory management system
2. **Notification** - Notification service that receives messages from the main application

## Kafka Configuration

The two applications communicate through Kafka messaging system:

- **SmartInventory** acts as a producer, sending notification messages when specific events occur
- **Notification** acts as a consumer, receiving and processing these messages

### Setup Requirements

1. Install and run Kafka and Zookeeper:
   - Download Kafka from https://kafka.apache.org/downloads
   - Start Zookeeper: `bin/zookeeper-server-start.sh config/zookeeper.properties`
   - Start Kafka: `bin/kafka-server-start.sh config/server.properties` 

2. Create the notification topic:
   ```
   bin/kafka-topics.sh --create --topic notification-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
   ```

3. Start the applications:
   - Start SmartInventory: `cd smartinventory && ./mvnw spring-boot:run`
   - Start Notification: `cd notification && ./mvnw spring-boot:run`

## Testing Kafka Communication

To test the notification system:

1. Send a test notification with curl:
   ```
   curl -X POST "http://localhost:8080/api/test/send-notification?userId=user123&message=Hello%20World"
   ```

2. Check the logs of the Notification application to see if it received the message

3. Retrieve notifications for a user:
   ```
   curl -X GET "http://localhost:8081/api/notifications/user/user123"
   ```

## Architecture

```
┌─────────────────┐     Kafka      ┌─────────────────┐
│  SmartInventory │ ─────────────► │   Notification  │
│    (Producer)   │  notification  │    (Consumer)   │
└─────────────────┘     topic      └─────────────────┘
```
