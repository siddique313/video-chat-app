# 🌐 Network Testing Guide for Video Chat App

## 🚨 The Problem

When accessing your video chat app through a network IP address (like `http://192.168.1.100:3000`), browsers block camera/microphone access for security reasons. This is why you're getting the "Camera/Microphone permission denied" error.

## ✅ Solutions

### Solution 1: Use HTTPS (Recommended)

#### Option A: Using mkcert (Easiest)

1. **Install mkcert:**

   ```bash
   # On Mac with Homebrew
   brew install mkcert

   # On Windows with Chocolatey
   choco install mkcert

   # On Linux
   sudo apt install mkcert
   ```

2. **Create local CA and certificates:**

   ```bash
   # Install the local CA
   mkcert -install

   # Create certificates for your local network
   mkcert localhost 127.0.0.1 ::1 192.168.1.100 192.168.1.101
   # Replace 192.168.1.100 with your actual IP address
   ```

3. **Update your Next.js config:**

   ```javascript
   // next.config.ts
   const nextConfig = {
     async headers() {
       return [
         {
           source: "/(.*)",
           headers: [
             {
               key: "Strict-Transport-Security",
               value: "max-age=31536000; includeSubDomains",
             },
           ],
         },
       ];
     },
   };
   ```

4. **Start with HTTPS:**
   ```bash
   # Start Next.js with HTTPS
   npm run dev -- --experimental-https --experimental-https-key ./localhost-key.pem --experimental-https-cert ./localhost.pem
   ```

#### Option B: Using ngrok (Quick & Easy)

1. **Install ngrok:**

   ```bash
   # Download from https://ngrok.com/download
   # Or with Homebrew on Mac
   brew install ngrok
   ```

2. **Start your app normally:**

   ```bash
   npm run dev:full
   ```

3. **In another terminal, expose with HTTPS:**

   ```bash
   ngrok http 3000
   ```

4. **Use the HTTPS URL provided by ngrok** (e.g., `https://abc123.ngrok.io`)

### Solution 2: Browser Flags (Development Only)

⚠️ **Warning: Only use this for development, not production!**

#### Chrome/Edge:

```bash
# Start Chrome with insecure origins allowed
chrome --unsafely-treat-insecure-origin-as-secure=http://192.168.1.100:3000 --user-data-dir=/tmp/chrome_dev_test
```

#### Firefox:

1. Go to `about:config`
2. Set `media.navigator.permission.disabled` to `true`
3. Set `media.navigator.streams.fake` to `true`

### Solution 3: Use localhost with Port Forwarding

1. **Access via localhost only:**

   - Use `http://localhost:3000` on the same machine
   - Use `http://127.0.0.1:3000` as alternative

2. **For mobile testing:**
   - Use ngrok (Solution 1B) for HTTPS access
   - Or use Chrome's remote debugging

## 🧪 Testing Steps

### Step 1: Test with HTTPS

1. **Set up HTTPS using one of the solutions above**
2. **Access the app via HTTPS URL**
3. **Open the test page:** `https://your-domain/test-webrtc`
4. **Run the full test suite**
5. **Check if camera/microphone permissions work**

### Step 2: Test WebRTC Connection

1. **Open two browser tabs/windows with the HTTPS URL**
2. **Go to the chat page:** `https://your-domain/chat?type=video`
3. **Click "Start" in both tabs**
4. **Verify users get matched and video streams work**

### Step 3: Test on Mobile Devices

1. **Get your computer's IP address:**

   ```bash
   # On Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # On Windows
   ipconfig | findstr "IPv4"
   ```

2. **Use ngrok for HTTPS access:**

   ```bash
   ngrok http 3000
   ```

3. **Access from mobile:** `https://your-ngrok-url.ngrok.io`

## 🔧 Quick Fix Script

Create this script to automatically set up HTTPS:

```bash
#!/bin/bash
# setup-https.sh

echo "🚀 Setting up HTTPS for video chat app..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install mkcert
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt install mkcert
    else
        echo "Please install mkcert manually: https://github.com/FiloSottile/mkcert"
        exit 1
    fi
fi

# Install local CA
echo "📜 Installing local CA..."
mkcert -install

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "🌐 Local IP: $LOCAL_IP"

# Create certificates
echo "🔐 Creating certificates..."
mkcert localhost 127.0.0.1 ::1 $LOCAL_IP

# Rename certificates
mv localhost+3.pem localhost.pem
mv localhost+3-key.pem localhost-key.pem

echo "✅ HTTPS setup complete!"
echo "🚀 Start your app with:"
echo "npm run dev -- --experimental-https --experimental-https-key ./localhost-key.pem --experimental-https-cert ./localhost.pem"
echo ""
echo "🌐 Access your app at:"
echo "https://localhost:3000"
echo "https://$LOCAL_IP:3000"
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Camera/Microphone permission denied"**

   - ✅ Use HTTPS instead of HTTP
   - ✅ Check browser permissions
   - ✅ Ensure no other apps are using camera/mic

2. **"getUserMedia is not supported"**

   - ✅ Use a modern browser (Chrome, Firefox, Safari, Edge)
   - ✅ Check if you're on HTTPS

3. **"WebRTC connection failed"**

   - ✅ Check if both users are on HTTPS
   - ✅ Verify server is running on port 3001
   - ✅ Check firewall settings

4. **Mobile devices not working**
   - ✅ Use ngrok for HTTPS access
   - ✅ Check mobile browser permissions
   - ✅ Ensure stable network connection

### Debug Steps:

1. **Open browser developer tools (F12)**
2. **Check Console tab for errors**
3. **Go to Application tab → Permissions**
4. **Verify camera/microphone permissions**
5. **Use the test page at `/test-webrtc` for detailed diagnostics**

## 📱 Mobile Testing

### iOS Safari:

1. Go to Settings → Safari → Camera
2. Allow camera access
3. Go to Settings → Safari → Microphone
4. Allow microphone access

### Android Chrome:

1. Open Chrome settings
2. Go to Site Settings
3. Find your domain
4. Allow camera and microphone

## 🎯 Success Criteria

✅ **App works when:**

- Accessed via HTTPS URL
- Camera/microphone permissions granted
- Two users can connect and see each other
- Chat messages work
- Works on both desktop and mobile

## 🚀 Production Deployment

For production, you'll need:

1. **Real SSL certificate** (Let's Encrypt, Cloudflare, etc.)
2. **Domain name** pointing to your server
3. **HTTPS configuration** in your web server
4. **STUN/TURN servers** for better connectivity

---

**Need help?** Check the browser console for detailed error messages or use the test page at `/test-webrtc` for diagnostics.
