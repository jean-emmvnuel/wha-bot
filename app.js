const express = require("express");
const WhatsAppService = require('./services/whatsappService');

const app = express();
const PORT = 3005;

// Page unique
app.get('/', (req, res) => {
    const qrCode = WhatsAppService.getQRCode();
    const isConnected = WhatsAppService.isBotConnected();
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Nobody's Bot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                margin: 0;
                padding: 0;
                background: black;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: Arial, sans-serif;
            }
            .container {
                text-align: center;
            }
            .qr-code img {
                max-width: 90vw;
                max-height: 90vh;
                border: 2px solid white;
                border-radius: 10px;
            }
            .connected {
                color: white;
                font-size: 24px;
                padding: 20px;
            }
            .loading {
                color: white;
                font-size: 18px;
                padding: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
    `;

    if (isConnected) {
        html += `
            <div class="connected">
                ✅ Nobody's Bot connecté
            </div>
        `;
    } else if (qrCode) {
        
        html += `
            <div class="qr-code">
                <img src="${qrCode}" alt="QR Code">
            </div>
            <div class="loading">
                📱 Scannez le QR code avec WhatsApp
            </div>
        `;
    } else {
        html += `
            <div class="loading">
                ⏳ Démarrage du bot...
            </div>
        `;
    }

    html += `
        </div>
        <script>
            let checkInterval;
            
            function checkConnection() {
                fetch('/api/status')
                    .then(response => response.json())
                    .then(data => {
                        if (data.connected) {
                            clearInterval(checkInterval);
                            location.reload();
                        }
                    });
            }
            
            if (!${isConnected}) {
                checkInterval = setInterval(checkConnection, 500);
            }
        </script>
    </body>
    </html>`;
    res.send(html);
});

// API pour la vérification
app.get('/api/status', (req, res) => {
    res.json({
        connected: WhatsAppService.isBotConnected(),
        hasQR: WhatsAppService.getQRCode() !== null
    });
});

// Démarrer le bot
console.log('🚀 Lancement de Nobody\'s Bot...');
WhatsAppService.connect();

app.listen(PORT, () => {
    console.log(`📍 Interface: http://localhost:${PORT}`);
});