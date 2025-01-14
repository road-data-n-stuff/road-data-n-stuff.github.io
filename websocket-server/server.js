const fs = require('fs');
const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = https.createServer({
    cert: fs.readFileSync('/path/to/your/cert.pem'),
    key: fs.readFileSync('/path/to/your/key.pem')
}, app);

const wss = new WebSocket.Server({ server });
const messages = []; // メッセージを保存する配列

// 静的ファイルを提供
app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
    console.log('Client connected');

    // 接続したクライアントに過去のメッセージを送信
    messages.forEach(message => {
        ws.send(JSON.stringify(message));
    });

    ws.on('message', (message) => {
        console.log('Received:', message);
        const data = JSON.parse(message);
        if (data.type === 'join') {
            console.log(`${data.name} has joined the chat`);
        } else if (data.type === 'message') {
            console.log(`${data.name}: ${data.text} (${data.timestamp})`);
            messages.push(data); // メッセージを保存
            // 受信したメッセージを全てのクライアントに送信
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// サーバーを起動
server.listen(8080, () => {
    console.log('Server is listening on port 8080');
});

<script>
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    document.getElementById('username').textContent = name;

    const ws = new WebSocket('ws://road-data-n-stuff.github.io:8080');

    ws.onopen = function() {
        console.log('WebSocket connection established');
    };

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        console.log('Received message:', message); // デバッグ用ログ
        const timeline = document.getElementById('timeline');
        const listItem = document.createElement('li');
        listItem.textContent = `${message.name}: ${message.text} (${message.timestamp})`;
        timeline.insertBefore(listItem, timeline.firstChild); // 新しいメッセージを先頭に追加
    };

    ws.onerror = function(error) {
        console.error('WebSocket Error: ', error);
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed');
    };

    document.getElementById('messageForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const message = document.getElementById('message').value;
        console.log('Sending message:', message); // デバッグ用ログ
        if (message) {
            const timestamp = new Date().toLocaleString();
            const payload = JSON.stringify({ type: 'message', name: name, text: message, timestamp: timestamp });
            console.log('Payload:', payload); // デバッグ用ログ
            ws.send(payload);
            document.getElementById('message').value = '';
        }
    });
</script>
