import express from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// 🟦 Load from environment
const region = process.env.AWS_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const webClientId = process.env.COGNITO_WEB_CLIENT_ID;
const mobileClientId = process.env.COGNITO_MOBILE_CLIENT_ID;

// JWKS endpoint (Cognito public keys)
const client = jwksClient({
  jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
});

// Function to fetch the signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// ✅ Token validation endpoint
app.get("/validate", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Missing Authorization header");

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    getKey,
    {
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      audience: [webClientId, mobileClientId], // Accept multiple audiences
    },
    (err, decoded) => {
      console.log(err);
      if (err) return res.status(401).send("Invalid or expired token");

      // ✅ Return headers for ingress
      res.setHeader("X-User-Sub", decoded.sub);
      res.setHeader("X-User-Email", decoded.email);

      return res.status(200).send("OK");
    }
  );
});

app.listen(process.env.PORT || 8000, () =>
  console.log(`✅ Auth service running on port ${process.env.PORT || 8080}`)
);
