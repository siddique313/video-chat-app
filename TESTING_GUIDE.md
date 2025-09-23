# 🧪 Uhmegle Connection Testing Guide

## 🚀 Quick Start

1. **Start the servers:**

   ```bash
   npm run dev:full
   ```

2. **Open the test page:**
   - Open `test-connections.html` in your browser
   - Or visit: `http://localhost:3000` for the admin dashboard

## 📊 Testing User Connections

### Method 1: Using the Test Page

1. Open `test-connections.html` in your browser
2. Click "Connect to Server"
3. Watch the connection status and online count
4. Click "Test Match Finding" to simulate looking for a match
5. Open multiple tabs of the same page to test multiple users

### Method 2: Using Multiple Browser Windows

1. Open `http://localhost:3000/chat?type=video` in multiple browser windows
2. Click "Start" in each window
3. Watch users get matched in real-time
4. Monitor the admin dashboard at `http://localhost:3000/admin`

### Method 3: Using Incognito/Private Windows

1. Open the chat page in regular browser window
2. Open incognito/private window with the same URL
3. This simulates two different users
4. Both should be able to connect and get matched

## 🔍 What to Look For

### ✅ Successful Connection Indicators

- **Green status indicator** in test page
- **Online count increases** when users connect
- **"Match found" messages** when users get paired
- **Real-time updates** in admin dashboard

### ❌ Connection Issues

- **Red status indicator** - server not running
- **"Connection error" messages** - check server logs
- **Online count not updating** - WebSocket connection issues

## 🛠️ Troubleshooting

### Server Not Starting

```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill the process if needed
taskkill /PID <PID_NUMBER> /F

# Restart servers
npm run dev:full
```

### Connection Errors

1. **Check server is running:** Look for "Socket.IO server running on port 3001"
2. **Check browser console:** Look for WebSocket connection errors
3. **Try different browser:** Some browsers block localhost connections
4. **Check firewall:** Ensure ports 3000 and 3001 are not blocked

### No Users Matching

1. **Open multiple tabs/windows** of the chat page
2. **Click "Start" in each tab** within a few seconds
3. **Check admin dashboard** to see waiting users count
4. **Wait for match notification** in chat interface

## 📈 Monitoring Real-Time Activity

### Admin Dashboard Features

- **Live online user count**
- **Real-time connection logs**
- **Active rooms tracking**
- **Connection/disconnection events**

### Test Page Features

- **Connection status indicator**
- **Live statistics display**
- **Detailed connection logs**
- **Match finding simulation**

## 🎯 Testing Scenarios

### Scenario 1: Single User Connection

1. Open one chat page
2. Click "Start"
3. Should see "Waiting for connection..." message
4. Online count should increase by 1

### Scenario 2: Two Users Matching

1. Open two chat pages (different tabs/windows)
2. Click "Start" in both within 10 seconds
3. Should see "Match found" in both
4. Should see video streams (if camera permissions granted)

### Scenario 3: Multiple Users Queue

1. Open 3+ chat pages
2. Click "Start" in all of them
3. First two should match immediately
4. Third should wait for another user
5. Online count should show all connected users

### Scenario 4: User Disconnection

1. Connect multiple users
2. Close one browser tab/window
3. Should see "User disconnected" message in other tabs
4. Online count should decrease

## 🔧 Advanced Testing

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create a simple load test
artillery quick --count 10 --num 5 http://localhost:3000/chat
```

### Network Testing

- **Test on different devices:** Phone, tablet, laptop
- **Test on different networks:** WiFi, mobile data
- **Test with VPN:** Ensure WebRTC works through VPN

## 📱 Mobile Testing

1. **Find your computer's IP address:**

   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Access from mobile device:**

   - Use `http://YOUR_IP:3000/chat?type=video`
   - Ensure both devices are on same network

3. **Test responsive design:**
   - Check layout on different screen sizes
   - Test touch interactions
   - Verify video controls work

## 🐛 Common Issues & Solutions

| Issue                       | Solution                               |
| --------------------------- | -------------------------------------- |
| Port 3001 in use            | Kill existing process or change port   |
| WebSocket connection failed | Check server is running and accessible |
| No video stream             | Grant camera/microphone permissions    |
| Users not matching          | Ensure multiple users click "Start"    |
| Mobile not connecting       | Check IP address and network settings  |

## 📊 Expected Behavior

### Normal Flow

1. User opens chat page → **Online count +1**
2. User clicks "Start" → **Waiting for match**
3. Second user connects → **Match found**
4. Video/chat connection established → **Active room created**
5. User disconnects → **Online count -1, room cleaned up**

### Performance Metrics

- **Connection time:** < 2 seconds
- **Match time:** < 5 seconds (with 2+ users)
- **Video quality:** Depends on network and device
- **Message delivery:** < 100ms latency

## 🎉 Success Criteria

✅ **Connection Test Passes When:**

- Users can connect to server
- Online count updates in real-time
- Users can find matches
- Video/audio streams work
- Chat messages are delivered
- Disconnections are handled properly
- Mobile devices work correctly

---

**Happy Testing! 🚀**

For more help, check the browser console for detailed logs or visit the admin dashboard for real-time monitoring.
