# Microservice-Based Adaptive Bitrate Video Streaming Platform


This project is a full microservice-based adaptive bitrate video streaming platform, designed to handle large-scale video uploads, automatic transcoding, and high-performance global delivery using Kubernetes and AWS services.

The system enables users to upload videos, processes them asynchronously, and streams them through an adaptive player that switches video quality based on real-time network conditions.

🚀 Architecture & Features
1. Microservice Architecture

Independent services for:

Auth Service – Sign up, login, verification with secure token handling

Upload Service – Handles video uploads, multipart S3 uploads

Transcoding Service – Converts videos into multiple resolutions (240p, 360p, 480p) using FFmpeg

Streaming Service – Serves video segments (HLS .m3u8)

Notification/Callback Service – Updates user and database after processing

2. Event-Driven Processing (SQS + S3)

Upload triggers an S3 event

The event pushes a message into SQS

A worker pod pulls the message → starts transcoding

Decoupled architecture = scalable + fault tolerant

3. Kubernetes (EKS) Deployment

Pods autoscale based on CPU/queue depth

Each transcoding job runs one file per pod

NGINX Ingress Controller for public endpoints

Service Mesh-like routing between pods

4. Adaptive Bitrate Streaming (HLS)

Player selects best quality based on bandwidth

.m3u8 master playlist automatically switches resolutions

CDN ready for global low-latency delivery

5. Authentication (AWS Cognito)

Secure token-based session management

Role-based access

Email verification flow

6. Storage

Raw video → S3 bucket

Transcoded segments → HLS folder in S3

Database (MySql) tracks:

Video metadata

Processing status

Playback links



📸 Screenshots

Verification & Login
## verification and login
<img src="images/login.png" width="650">

<img src="images/signup.png" width="650">

<img src="images/verification.png" width="650">


## Upload Flow
Upload Flow
<img src="images/ss.png" width="650">

<img src="images/ss1.png" width="650">


## Player UI
Player UI
<img src="images/ss3.png" width="650">

<img src="images/ss2.png" width="650">

