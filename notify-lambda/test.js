import { ApiGatewayManagementApiClient, PostToConnectionCommand } 
  from "@aws-sdk/client-apigatewaymanagementapi";

// ---- TEST VALUES ----
const testConnectionId = "U5edjdCghcwCHOQ="; // replace with your real connection ID
const endpoint = "https://36rs9z9ar8.execute-api.ap-south-1.amazonaws.com/dev";

async function test() {
  console.log("Initializing WS API client...");

  const api = new ApiGatewayManagementApiClient({
    endpoint,
    region: "ap-south-1"
  });

  console.log("Client initialized.");

  const payload = {
    event: "test-event",
    message: "Hello from local test!"
  };

  const command = new PostToConnectionCommand({
    ConnectionId: testConnectionId,
    Data: Buffer.from(JSON.stringify(payload))
  });

  try {
    const res = await api.send(command);
    console.log("Message sent successfully:", res);
  } catch (err) {
    console.error("❌ ERROR sending message:", err);
  }
}

test();
