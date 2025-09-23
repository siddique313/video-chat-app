# 🚨 Quick Fix for "Camera/Microphone permission denied" Error

## The Problem

You're getting this error because browsers require HTTPS for camera/microphone access when accessing via network IP addresses.

## 🚀 Quick Solutions (Choose One)

### Option 1: Use ngrok (Fastest - 2 minutes)

1. **Install ngrok:**

   ```bash
   # Download from https://ngrok.com/download
   # Or install with npm
   npm install -g ngrok
   ```

2. **Start your app normally:**

   ```bash
   npm run dev:full
   ```

3. **In another terminal, expose with HTTPS:**

   ```bash
   ngrok http 3000
   ```

4. **Use the HTTPS URL** that ngrok provides (e.g., `https://abc123.ngrok.io`)

### Option 2: Set up HTTPS with mkcert (5 minutes)

1. **Install mkcert:**

   - Download from: https://github.com/FiloSottile/mkcert/releases
   - Or with Chocolatey: `choco install mkcert`
   - Or with Scoop: `scoop install mkcert`

2. **Run the setup script:**

   ```bash
   setup-https.bat
   ```

3. **Start with HTTPS:**

   ```bash
   npm run dev:full:https
   ```

4. **Access via:** `https://localhost:3000` or `https://YOUR_IP:3000`

### Option 3: Use localhost only (Immediate)

1. **Access via localhost:**

   - Use `http://localhost:3000` on the same machine
   - Use `http://127.0.0.1:3000` as alternative

2. **For mobile testing:**
   - Use ngrok (Option 1) for HTTPS access

## 🧪 Test Your Fix

1. **Open the test page:**

   - `https://your-domain/test-webrtc` (if using HTTPS)
   - `http://localhost:3000/test-webrtc` (if using localhost)

2. **Click "Run Full Test"**
3. **Check if camera/microphone permissions work**
4. **Try the chat page with two browser tabs**

## 📱 Mobile Testing

If you need to test on mobile devices:

1. **Use ngrok (Option 1 above)**
2. **Access the HTTPS URL on your mobile device**
3. **Grant camera/microphone permissions when prompted**

## 🔍 Troubleshooting

### Still getting permission denied?

1. **Check browser permissions:**

   - Look for camera/microphone icon in address bar
   - Click it and allow access
   - Refresh the page

2. **Check if other apps are using camera:**

   - Close Zoom, Skype, Teams, etc.
   - Try again

3. **Check browser console (F12):**
   - Look for specific error messages
   - Use the test page for detailed diagnostics

### Mac-specific issues:

1. **Go to System Preferences → Security & Privacy → Privacy**
2. **Select Camera and allow your browser**
3. **Select Microphone and allow your browser**
4. **Restart your browser**

## ✅ Success Indicators

You'll know it's working when:

- ✅ No "permission denied" errors
- ✅ Camera preview shows in the test page
- ✅ Two browser tabs can connect and see each other
- ✅ Chat messages work between users

## 🎯 Recommended Approach

**For quick testing:** Use ngrok (Option 1)
**For development:** Set up mkcert (Option 2)
**For local testing only:** Use localhost (Option 3)

---

**Need help?** Check the browser console for detailed error messages or use the test page at `/test-webrtc` for diagnostics.
