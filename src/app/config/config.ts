// iceConfig.js
// This file exports a complete ICE server configuration for WebRTC

const configuration = {
  iceServers: [
    // Google STUN server
    { urls: "stun:stun.l.google.com:19302" },

    // Cloudflare STUN server
    { urls: "stun:stun.cloudflare.com:3478" },

    // Custom TURN server (replace with your credentials)
    {
      urls: "turn:turn.vidie-chat.org:3478",
      username: "yourUsername",
      credential: "yourPassword",
    },

    // Optional: Another public TURN server as a fallback
    {
      urls: "turn:turn.anyfirewall.com:443?transport=tcp",
      username: "webrtc",
      credential: "webrtc",
    },
  ],

  // Optional settings
  iceCandidatePoolSize: 10, // Preallocate ICE candidates for faster connection
};

export default configuration;

// Usage Example:

/*
import configuration from './iceConfig.js';

const pc = new RTCPeerConnection(configuration);

// Add tracks, data channels, etc.
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  })
  .catch(err => console.error("Error accessing media devices:", err));

pc.onicecandidate = event => {
  if (event.candidate) {
    console.log("New ICE candidate:", event.candidate);
    // Send candidate to remote peer via signaling server
  }
};

pc.ontrack = event => {
  const remoteVideo = document.getElementById("remoteVideo");
  remoteVideo.srcObject = event.streams[0];
};
*/
