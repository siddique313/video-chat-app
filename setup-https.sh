#!/bin/bash

echo "🚀 Setting up HTTPS for video chat app..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac
        if command -v brew &> /dev/null; then
            brew install mkcert
        else
            echo "Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update
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
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' 2>/dev/null)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null)
fi

echo "🌐 Local IP: $LOCAL_IP"

# Create certificates
echo "🔐 Creating certificates..."
mkcert localhost 127.0.0.1 ::1 $LOCAL_IP

# Rename certificates
if [ -f "localhost+3.pem" ]; then
    mv localhost+3.pem localhost.pem
    mv localhost+3-key.pem localhost-key.pem
elif [ -f "localhost+4.pem" ]; then
    mv localhost+4.pem localhost.pem
    mv localhost+4-key.pem localhost-key.pem
fi

echo "✅ HTTPS setup complete!"
echo ""
echo "🚀 Start your app with HTTPS:"
echo "npm run dev -- --experimental-https --experimental-https-key ./localhost-key.pem --experimental-https-cert ./localhost.pem"
echo ""
echo "🌐 Access your app at:"
echo "https://localhost:3000"
if [ ! -z "$LOCAL_IP" ]; then
    echo "https://$LOCAL_IP:3000"
fi
echo ""
echo "📱 For mobile testing, use ngrok:"
echo "npx ngrok http 3000"
