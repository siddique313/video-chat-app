const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: 'turn:turn.example.org',
      username: 'yourUsername',
      credential: 'yourPassword'
    }
  ]
};

export default configuration;