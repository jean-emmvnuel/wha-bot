const express = require("express");
const WhatsAppService = require('./services/WhatsappService');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging détaillé
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📨 [${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Route principale avec gestion améliorée
app.get('/', (req, res) => {
    try {
        console.log('🏠 Accès à la page principale');
        
        const qrCode = WhatsAppService.getQRCode();
        const isConnected = WhatsAppService.isBotConnected();
        const sessionStatus = WhatsAppService.getSessionStatus ? WhatsAppService.getSessionStatus() : { hasSession: false };
        
        console.log(`📊 État bot - Connecté: ${isConnected}, QR présent: ${!!qrCode}, Session: ${sessionStatus.hasSession}`);
        
        let statusHtml = '';
        let refreshTime = 10000; // 10 secondes par défaut
        
        if (isConnected) {
            statusHtml = `
                <div style="background: #0a5; color: white; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center;">
                    <div style="font-size: 2em;">✅</div>
                    <h2 style="margin: 10px 0;">BOT CONNECTÉ</h2>
                    <p style="margin: 0; font-size: 1.1em;">Le bot est actif et prêt à recevoir vos commandes !</p>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>📱 Comment utiliser :</h3>
                    <ol style="text-align: left; margin: 15px 0;">
                        <li>Ouvrez WhatsApp sur votre téléphone</li>
                        <li>Envoyez <code style="background: #333; padding: 2px 6px; border-radius: 4px;">#help</code> à votre conversation</li>
                        <li>Le bot répondra instantanément !</li>
                    </ol>
                </div>
            `;
            refreshTime = 30000; // 30 secondes si connecté
        } else if (qrCode) {
            statusHtml = `
                <div style="background: #fa0; color: black; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center;">
                    <div style="font-size: 2em;">📱</div>
                    <h2 style="margin: 10px 0;">SCANNEZ LE QR CODE</h2>
                    <p style="margin: 0; font-size: 1.1em;">Connectez le bot à votre WhatsApp</p>
                </div>
                
                <div style="margin: 25px 0;">
                    <img src="${qrCode}" alt="QR Code" style="max-width: 350px; width: 100%; border: 4px solid white; border-radius: 20px; padding: 15px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>📲 Instructions :</h3>
                    <ol style="text-align: left; margin: 15px 0;">
                        <li>Ouvrez WhatsApp → Paramètres</li>
                        <li>Allez dans "Appareils connectés"</li>
                        <li>Cliquez sur "Connecter un appareil"</li>
                        <li>Scannez le code QR ci-dessus</li>
                    </ol>
                    <p style="color: #ffcc00; margin: 10px 0;"><strong>⚠️ Important :</strong> Scannez rapidement après l'apparition du QR code</p>
                </div>
            `;
            refreshTime = 15000; // 15 secondes si QR code présent
        } else {
            statusHtml = `
                <div style="background: #06a; color: white; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center;">
                    <div style="font-size: 2em;">⏳</div>
                    <h2 style="margin: 10px 0;">DÉMARRAGE EN COURS</h2>
                    <p style="margin: 0; font-size: 1.1em;">Initialisation du bot WhatsApp...</p>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>🔄 Chargement en cours :</h3>
                    <ul style="text-align: left; margin: 15px 0;">
                        <li>✅ Serveur Express</li>
                        <li>🔄 Client WhatsApp...</li>
                        <li>🔄 Session Chromium...</li>
                        <li>⏳ Génération QR Code...</li>
                    </ul>
                </div>
            `;
            refreshTime = 8000; // 8 secondes si chargement
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🤖 Nobody's Bot - Koyeb</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta charset="UTF-8">
            <style>
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                
                body { 
                    background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
                    color: white; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    min-height: 100vh;
                    padding: 20px;
                    line-height: 1.6;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px 20px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .logo {
                    font-size: 3em;
                    margin-bottom: 10px;
                }
                
                .title {
                    font-size: 2.5em;
                    font-weight: bold;
                    background: linear-gradient(45deg, #00ff88, #00ccff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 10px;
                }
                
                .subtitle {
                    font-size: 1.2em;
                    opacity: 0.8;
                    margin-bottom: 20px;
                }
                
                .server-info {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    font-size: 0.9em;
                    border-left: 4px solid #00ff88;
                }
                
                .actions {
                    text-align: center;
                    margin: 30px 0;
                }
                
                .btn {
                    background: linear-gradient(45deg, #00ff88, #00ccff);
                    color: black;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 30px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 0 10px;
                    transition: all 0.3s ease;
                    font-size: 1.1em;
                    text-decoration: none;
                    display: inline-block;
                }
                
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(0, 255, 136, 0.3);
                }
                
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 0.9em;
                    opacity: 0.7;
                }
                
                .status-info {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    font-size: 0.85em;
                    text-align: center;
                }
                
                code {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }
                
                @media (max-width: 600px) {
                    .container {
                        padding: 20px 15px;
                    }
                    
                    .title {
                        font-size: 2em;
                    }
                    
                    .btn {
                        display: block;
                        margin: 10px auto;
                        width: 80%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🤖</div>
                    <div class="title">Nobody's Bot</div>
                    <div class="subtitle">Déployé sur Koyeb ☁️</div>
                </div>
                
                <div class="server-info">
                    <strong>🛠️ Environnement:</strong> Production Koyeb<br>
                    <strong>🔧 Port:</strong> ${PORT}<br>
                    <strong>📊 Statut:</strong> ${isConnected ? '🟢 Connecté' : qrCode ? '🟡 En attente' : '🔴 Démarrage'}
                </div>
                
                ${statusHtml}
                
                <div class="actions">
                    <button class="btn" onclick="location.reload()">🔄 Actualiser Maintenant</button>
                    <button class="btn btn-secondary" onclick="checkStatus()">📊 Vérifier Statut</button>
                </div>
                
                <div class="status-info">
                    <strong>⏰ Prochain rafraîchissement:</strong> ${refreshTime/1000} secondes<br>
                    <strong>🕐 Heure serveur:</strong> <span id="serverTime">${new Date().toLocaleTimeString()}</span>
                </div>
                
                <div class="footer">
                    🚀 Propulsé par Koyeb • Session persistante • Bot WhatsApp
                </div>
            </div>
            
            <script>
                let autoRefreshEnabled = true;
                let refreshCount = 0;
                const maxRefreshes = 50; // Limite de sécurité
                
                function updateServerTime() {
                    document.getElementById('serverTime').textContent = new Date().toLocaleTimeString();
                }
                
                function checkStatus() {
                    console.log('🔍 Vérification manuelle du statut...');
                    fetch('/api/status')
                        .then(response => response.json())
                        .then(data => {
                            console.log('📊 Statut API:', data);
                            if (data.connected) {
                                showNotification('✅ Bot connecté!', 'success');
                            } else if (data.hasQR) {
                                showNotification('📱 QR Code disponible', 'warning');
                            } else {
                                showNotification('⏳ En cours de démarrage...', 'info');
                            }
                        })
                        .catch(error => {
                            console.error('❌ Erreur vérification:', error);
                            showNotification('❌ Erreur de connexion', 'error');
                        });
                }
                
                function showNotification(message, type) {
                    // Notification simple
                    alert(message);
                }
                
                function stopAutoRefresh() {
                    autoRefreshEnabled = false;
                    console.log('⏹️ Auto-rafraîchissement désactivé');
                    showNotification('🛑 Rafraîchissement automatique désactivé', 'info');
                }
                
                // Mettre à jour l'heure toutes les secondes
                setInterval(updateServerTime, 1000);
                
                // Auto-refresh intelligent
                if (autoRefreshEnabled && refreshCount < maxRefreshes) {
                    setTimeout(() => {
                        if (autoRefreshEnabled) {
                            refreshCount++;
                            console.log('🔄 Rafraîchissement automatique #' + refreshCount);
                            location.reload();
                        }
                    }, ${refreshTime});
                }
                
                // Désactiver le rafraîchissement si l'utilisateur interagit
                document.addEventListener('click', () => {
                    if (refreshCount > 5) { // Après 5 rafraîchissements auto
                        stopAutoRefresh();
                    }
                });
                
                // Info de débogage
                console.log('🤖 Nobody\'s Bot Interface chargée');
                console.log('🔄 Prochain rafraîchissement dans: ${refreshTime/1000}s');
            </script>
        </body>
        </html>`;
        
        console.log(`✅ Page envoyée - Rafraîchissement dans ${refreshTime/1000}s`);
        res.send(html);
        
    } catch (error) {
        console.error('💥 Erreur critique route /:', error);
        res.status(500).send(`
            <html>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #ff6b6b; color: white;">
                <h1>❌ Erreur Serveur</h1>
                <p>Une erreur critique est survenue :</p>
                <code>${error.message}</code>
                <p><button onclick="location.reload()" style="padding: 10px 20px; margin: 20px;">🔄 Réessayer</button></p>
            </body>
            </html>
        `);
    }
});

// API pour le statut avec logging détaillé
app.get('/api/status', (req, res) => {
    console.log('📊 API Status appelée');
    try {
        const status = {
            connected: WhatsAppService.isBotConnected(),
            hasQR: WhatsAppService.getQRCode() !== null,
            timestamp: new Date().toISOString(),
            server: 'Koyeb',
            port: PORT,
            environment: process.env.NODE_ENV || 'production'
        };
        console.log('📈 Statut envoyé:', status);
        res.json(status);
    } catch (error) {
        console.error('❌ Erreur API Status:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// API info session détaillée
app.get('/api/debug', async (req, res) => {
    console.log('🐛 Debug endpoint appelé');
    try {
        const debugInfo = {
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                platform: process.platform
            },
            bot: {
                connected: WhatsAppService.isBotConnected(),
                hasQR: WhatsAppService.getQRCode() !== null,
                startTime: WhatsAppService.startTime,
                sessionPath: WhatsAppService.sessionPath
            },
            timestamp: new Date().toISOString()
        };
        console.log('🐛 Info debug:', debugInfo);
        res.json(debugInfo);
    } catch (error) {
        console.error('❌ Erreur debug:', error);
        res.json({ error: error.message });
    }
});

// Route de santé pour Koyeb
app.get('/health', (req, res) => {
    console.log('💚 Health check appelé par Koyeb');
    const botConnected = WhatsAppService.isBotConnected();
    
    // Koyeb veut un code 200 pour healthy, 503 pour unhealthy
    if (botConnected) {
        res.json({ 
            status: 'healthy', 
            service: "Nobody's Bot",
            bot_connected: true,
            timestamp: new Date().toISOString()
        });
    } else {
        // Même si le bot n'est pas connecté, le serveur fonctionne
        res.status(200).json({
            status: 'degraded',
            service: "Nobody's Bot", 
            bot_connected: false,
            message: 'Bot non connecté mais serveur actif',
            timestamp: new Date().toISOString()
        });
    }
});

// Redirection pour toutes les autres routes
app.use('*', (req, res) => {
    console.log(`🔄 Redirection de ${req.originalUrl} vers /`);
    res.redirect('/');
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('💥 Erreur globale interceptée:', error);
    res.status(500).json({ 
        error: 'Erreur interne du serveur',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// DÉMARRAGE SÉQUENTIEL AMÉLIORÉ
async function startServer() {
    try {
        console.log('🚀 Démarrage de Nobody\'s Bot sur Koyeb...');
        console.log('📋 Configuration:');
        console.log(`   - Port: ${PORT}`);
        console.log(`   - Environnement: ${process.env.NODE_ENV || 'production'}`);
        console.log(`   - Node.js: ${process.version}`);
        
        // D'abord démarrer Express
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Serveur Express démarré sur le port ${PORT}`);
            console.log(`🌐 Interface web accessible`);
            console.log(`💚 Health check: /health`);
            console.log(`📊 API Status: /api/status`);
            console.log(`🐛 Debug: /api/debug`);
        });

        // Gestion des erreurs du serveur
        server.on('error', (error) => {
            console.error('❌ Erreur serveur HTTP:', error);
            if (error.code === 'EADDRINUSE') {
                console.log(`⚠️  Le port ${PORT} est déjà utilisé`);
            }
        });

        // Ensuite démarrer le bot WhatsApp (avec délai plus long)
        console.log('⏳ Démarrage du bot WhatsApp dans 5 secondes...');
        setTimeout(() => {
            console.log('🔧 Initialisation du bot WhatsApp...');
            WhatsAppService.connect().then(result => {
                if (result.success) {
                    console.log('✅ Bot WhatsApp en cours d\'initialisation');
                } else {
                    console.error('❌ Échec démarrage bot:', result.error);
                }
            });
        }, 5000);

    } catch (error) {
        console.error('💥 Erreur critique au démarrage:', error);
        process.exit(1);
    }
}

// Gestion propre des arrêts
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt demandé (SIGINT)');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt demandé par Koyeb (SIGTERM)');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Exception non capturée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Rejet non géré:', reason);
});

// Démarrer l'application
startServer();

// Log de présence périodique
setInterval(() => {
    console.log('❤️  Serveur actif - ' + new Date().toISOString());
}, 60000); // Toutes les minutes
