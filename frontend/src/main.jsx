import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
import App from "./App";
import "./index.css";

// ✅ Correct Amplify configuration for custom bucket in Amplify v6+
// Amplify.configure({
//   ...awsconfig,
//   Storage: {
//     S3: {                            // 👈 not AWSS3 — must be S3
//       bucket: "private-input-bucket", // 👈 your existing bucket name
//       region: "ap-south-1",          // 👈 your bucket’s region
//     },
//   },
// });

Amplify.configure(awsconfig);

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
