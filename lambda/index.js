// ======================= IMPORTS ============================
const { ApiGatewayManagementApiClient, PostToConnectionCommand } =
  require("@aws-sdk/client-apigatewaymanagementapi");
const Redis = require("ioredis");

// ---------------------- REDIS CLIENT ----------------------
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});

// ---------------------- MAIN HANDLER ----------------------
exports.handler = async (event) => {
  const route = event.requestContext.routeKey;
  const connId = event.requestContext.connectionId;

  console.log("WS EVENT:", route, connId);

  try {
    if (route === "$connect") {
      return await onConnect(event, connId);
    }

    if (route === "$disconnect") {
      return await onDisconnect(connId);
    }

    if (route === "register") {
      const body = JSON.parse(event.body || "{}");
      return await onRegister(body, connId);
    }

    if (route === "notify") {
      const body = JSON.parse(event.body || "{}");
      return await onNotify(body);
    }

    return { statusCode: 200, body: "default" };

  } catch (err) {
    console.error("ERROR:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};



// =======================================================
//               $CONNECT HANDLER
// =======================================================
async function onConnect(event, connectionId) {
  console.log("Client connected:", connectionId);
  return { statusCode: 200 };
}



// =======================================================
//               $DISCONNECT HANDLER
// =======================================================
async function onDisconnect(connectionId) {
  console.log("DISCONNECT:", connectionId);

  const userId = await redis.get(`conn:${connectionId}`);

  if (!userId) {
    console.log("No user mapped to this connection");
    return { statusCode: 200 };
  }

  await redis.srem(`user:${userId}`, connectionId);
  await redis.del(`conn:${connectionId}`);

  console.log(`Removed ${connectionId} from user:${userId}`);

  return { statusCode: 200 };
}



// =======================================================
//               REGISTER HANDLER
// =======================================================
async function onRegister(body, connectionId) {
  const userId = body.userId;

  if (!userId) {
    return { statusCode: 400, body: "userId required" };
  }

  // Add connection ID to user's set
  await redis.sadd(`user:${userId}`, connectionId);

  // Reverse lookup
  await redis.set(`conn:${connectionId}`, userId);

  console.log(`REGISTER: user:${userId} += ${connectionId}`);

  return { statusCode: 200, body: "registered" };
}



// =======================================================
//               NOTIFY HANDLER
// =======================================================
async function onNotify(body) {
  const { userId, videoId, status } = body;

  if (!userId || !videoId || !status) {
    return { statusCode: 400, body: "Missing fields" };
  }

  const connections = await redis.smembers(`user:${userId}`);

  if (!connections.length) {
    console.log("No active connections for", userId);
    return { statusCode: 200, body: "no-active-connections" };
  }

  console.log(`NOTIFY user:${userId}`, connections);

  const apiClient = new ApiGatewayManagementApiClient({
    endpoint: process.env.WS_ENDPOINT   // <<— IMPORTANT: no https://
  });

  const payload = JSON.stringify({
    event: "video-transcoded",
    userId,
    videoId,
    status
  });

  for (const connId of connections) {
    try {
      await apiClient.send(
        new PostToConnectionCommand({
          ConnectionId: connId,
          Data: Buffer.from(payload)
        })
      );

      console.log("Sent to", connId);

    } catch (err) {
      if (err.statusCode === 410) {
        console.log("Stale connection:", connId);
        await redis.srem(`user:${userId}`, connId);
        await redis.del(`conn:${connId}`);
      } else {
        console.error("Send error:", err);
      }
    }
  }

  return { statusCode: 200, body: "notified" };
}
