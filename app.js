const express = require("express");
const WhatsAppService = require('./services/WhatsappService');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Route principale
app.get('/', (req, res) => {
    const qrCode = WhatsAppService.getQRCode();
    const isConnected = WhatsAppService.isBotConnected();
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 Nobody's Bot - Railway</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <style>
            * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
            }
            
            body { 
                background: linear-gradient(135deg, #000000, #1a1a2e);
                color: white; 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .container {
                text-align: center;
                max-width: 500px;
                width: 100%;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .logo {
                font-size: 2.5em;
                font-weight: bold;
                margin-bottom: 10px;
                background: linear-gradient(45deg, #00ff88, #00ccff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .subtitle {
                font-size: 1.1em;
                margin-bottom: 20px;
                opacity: 0.8;
            }
            
            .status {
                padding: 20px;
                margin: 20px 0;
                border-radius: 15px;
                font-size: 1.1em;
            }
            
            .connected { 
                background: rgba(0, 255, 136, 0.2);
                border: 1px solid #00ff88;
            }
            
            .waiting { 
                background: rgba(255, 193, 7, 0.2);
                border: 1px solid #ffc107;
            }
            
            .loading { 
                background: rgba(0, 204, 255, 0.2);
                border: 1px solid #00ccff;
            }
            
            .qr-code {
                margin: 20px 0;
            }
            
            .qr-code img {
                max-width: 280px;
                width: 100%;
                border: 3px solid white;
                border-radius: 15px;
                padding: 10px;
                background: white;
            }
            
            .instructions {
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                font-size: 0.9em;
                line-height: 1.5;
                text-align: left;
            }
            
            .btn {
                background: linear-gradient(45deg, #00ff88, #00ccff);
                color: black;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: bold;
                cursor: pointer;
                margin: 10px 5px;
                transition: all 0.3s ease;
                font-size: 1em;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin: 20px 0;
                text-align: left;
            }
            
            .info-item {
                background: rgba(255, 255, 255, 0.1);
                padding: 10px;
                border-radius: 8px;
                font-size: 0.9em;
            }
            
            .footer {
                margin-top: 20px;
                font-size: 0.8em;
                opacity: 0.7;
            }
            
            code {
                background: rgba(255, 255, 255, 0.2);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: monospace;
            }
            
            .server-info {
                background: rgba(255, 255, 255, 0.05);
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
                font-size: 0.8em;
            }
            
            @media (max-width: 600px) {
                .container {
                    padding: 20px;
                    margin: 10px;
                }
                
                .logo {
                    font-size: 2em;
                }
                
                .info-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🤖 Nobody's Bot</div>
            <div class="subtitle">Déployé sur Railway 🚄</div>
            
            <div class="server-info">
                <strong>🛠️ Environnement:</strong> Production Railway<br>
                <strong>🔧 Port:</strong> ${PORT}<br>
                <strong>🐳 Container:</strong> Node.js + Chromium
            </div>
    `;

    if (isConnected) {
        html += `
            <div class="status connected">
                ✅ <strong>BOT CONNECTÉ</strong>
                <p style="margin-top: 10px;">Le bot est actif et prêt à recevoir vos commandes !</p>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <strong>📊 Statut:</strong><br>En ligne 🟢
                </div>
                <div class="info-item">
                    <strong>💾 Stockage:</strong><br>Railway /tmp ✅
                </div>
            </div>
            
            <div class="instructions">
                <strong>📱 Comment utiliser :</strong><br><br>
                1. Ouvrez WhatsApp sur votre téléphone<br>
                2. Envoyez <code>#help</code> à votre conversation<br>
                3. Le bot répondra instantanément !<br><br>
                
                <strong>⚡ Commandes rapides:</strong><br>
                <code>#help</code> - Menu • <code>#ping</code> - Test • <code>#owner</code> - Contacts
            </div>
            
            <div class="actions">
                <button class="btn" onclick="location.reload()">🔄 Actualiser</button>
                <button class="btn btn-secondary" onclick="checkStatus()">📊 Vérifier statut</button>
            </div>
        `;
    } else if (qrCode) {
        html += `
            <div class="status waiting">
                📱 <strong>SCANNEZ LE QR CODE</strong>
                <p style="margin-top: 10px;">Connectez le bot à votre WhatsApp (une seule fois)</p>
            </div>
            
            <div class="qr-code">
                <img src="${qrCode}" alt="QR Code">
            </div>
            
            <div class="instructions">
                <strong>📲 Instructions de connexion :</strong><br><br>
                1. Ouvrez WhatsApp sur votre téléphone<br>
                2. Allez dans <strong>Paramètres → Appareils connectés</strong><br>
                3. Cliquez sur <strong>"Connecter un appareil"</strong><br>
                4. Scannez le code QR ci-dessus<br><br>
                
                <strong>💡 Important:</strong> Cette connexion restera active même après redémarrage !
            </div>
            
            <div class="actions">
                <button class="btn" onclick="location.reload()">🔄 Vérifier connexion</button>
            </div>
        `;
    } else {
        html += `
            <div class="status loading">
                ⏳ <strong>DÉMARRAGE EN COURS</strong>
                <p style="margin-top: 10px;">Initialisation du bot WhatsApp...</p>
            </div>
            
            <div class="instructions">
                Le bot est en cours de démarrage sur l'infrastructure Railway.<br><br>
                <strong>Chargement en cours:</strong><br>
                • Serveur Express ✅<br>
                • Client WhatsApp...<br>
                • Session Chromium...
            </div>
            
            <div class="actions">
                <button class="btn" onclick="location.reload()">🔄 Actualiser maintenant</button>
            </div>
        `;
    }

    html += `
            <div class="footer">
                🚄 Propulsé par Railway • Session persistante • Ultra-rapide
            </div>
        </div>
        
        <script>
            let checkInterval;
            let lastStatus = ${isConnected};
            
            function checkStatus() {
                fetch('/api/status')
                    .then(response => response.json())
                    .then(data => {
                        if (data.connected !== lastStatus) {
                            location.reload();
                        }
                        lastStatus = data.connected;
                    })
                    .catch(error => {
                        console.log('Erreur vérification statut');
                    });
            }
            
            // Auto-refresh si pas connecté
            if (!${isConnected}) {
                checkInterval = setInterval(checkStatus, 3000);
                
                // Arrêter après 10 minutes
                setTimeout(() => {
                    if (checkInterval) {
                        clearInterval(checkInterval);
                    }
                }, 600000);
            }
            
            // Vérifier quand la page redevient visible
            document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                    checkStatus();
                }
            });
        </script>
    </body>
    </html>`;
    
    res.send(html);
});

// API pour le statut
app.get('/api/status', (req, res) => {
    res.json({
        connected: WhatsAppService.isBotConnected(),
        hasQR: WhatsAppService.getQRCode() !== null,
        timestamp: new Date().toISOString(),
        server: 'Railway',
        port: PORT
    });
});

// API info session
app.get('/api/session', async (req, res) => {
    try {
        const sessionStatus = await WhatsAppService.getSessionStatus();
        res.json({
            connected: WhatsAppService.isBotConnected(),
            hasSession: sessionStatus.hasSession,
            sessionFiles: sessionStatus.fileCount,
            uptime: WhatsAppService.startTime ? Date.now() - WhatsAppService.startTime : 0,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.json({ error: 'Impossible de récupérer les infos session' });
    }
});

// Route de santé pour Railway
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: "Nobody's Bot",
        bot_connected: WhatsAppService.isBotConnected(),
        timestamp: new Date().toISOString(),
        version: "2.0.0-railway",
        server: "Railway"
    });
});

// Redirection pour toutes les autres routes
app.use('*', (req, res) => {
    res.redirect('/');
});

// Démarrer le bot
console.log('🚀 Lancement de Nobody\'s Bot sur Railway...');
WhatsAppService.connect();

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📍 Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 URL publique: Voir le domaine Railway`);
    console.log(`💚 Route santé: /health`);
    console.log(`📊 API Statut: /api/status`);
    console.log(`🛠️ Environnement: ${process.env.NODE_ENV || 'development'}`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt demandé par Railway...');
    process.exit(0);
});
