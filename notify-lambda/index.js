import { ApiGatewayManagementApiClient, PostToConnectionCommand }
  from "@aws-sdk/client-apigatewaymanagementapi";
import Redis from "ioredis";

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  tls: {}
});

export const handler = async (event) => {
  console.log("EVENT RAW ---->", event);

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    console.error("❌ JSON PARSE ERROR:", e.message);
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { userId, videoId, status } = body;
  console.log("Parsed input:", body);

  if (!userId || !videoId || !status) {
    console.log("❌ Missing parameters");
    return { statusCode: 400, body: "Missing parameters" };
  }

  // STEP 1 — Redis
  let connections;
  try {
    console.log("Fetching redis connections…");
    connections = await redis.smembers(`user:${userId}`);
    console.log("Redis connections:", connections);
  } catch (e) {
    console.error("❌ REDIS ERROR:", e);
    return { statusCode: 500, body: "Redis error" };
  }

  if (!connections.length) {
    console.log("No active ws connections");
    return { statusCode: 200, body: "no-active" };
  }

  // STEP 2 — WebSocket client (SDK v3)
  let api;
  try {
    api = new ApiGatewayManagementApiClient({
      endpoint: "https://36rs9z9ar8.execute-api.ap-south-1.amazonaws.com/dev",
      region: "ap-south-1"   // ⭐ added exactly as you asked
    });
    console.log("---------------api client---------", api);
    console.log("WS client initialized");
  } catch (e) {
    console.error("❌ WS CLIENT INIT ERROR:", e);
    return { statusCode: 500, body: "WS client init failed" };
  }

  const payload = Buffer.from(JSON.stringify({
    event: "video-transcoded",
    userId,
    videoId,
    status
  }));

  // STEP 3 — Post to all connections
  for (const connId of connections) {
    try {
      console.log("Sending to:", connId);

      const command = new PostToConnectionCommand({
        ConnectionId: connId,
        Data: Buffer.from("hello")  // ⭐ EXACT same structure as your test
      });

      await api.send(command);

      console.log("✅ Sent to", connId);

    } catch (err) {
      console.error("❌ SEND ERROR for", connId, err);

      if (err.$metadata?.httpStatusCode === 410) {
        await redis.srem(`user:${userId}`, connId);
        await redis.del(`conn:${connId}`);
      }
    }
  }

  return { statusCode: 200, body: "sent" };
};
