const express = require("express");
const WhatsAppService = require('./services/WhatsappService');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware ESSENTIEL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging pour debug
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// Route principale SIMPLIFIÉE
app.get('/', (req, res) => {
    try {
        const qrCode = WhatsAppService.getQRCode();
        const isConnected = WhatsAppService.isBotConnected();
        
        console.log(`🏠 Requête / - Connecté: ${isConnected}, QR: ${!!qrCode}`);
        
        let statusHtml = '';
        if (isConnected) {
            statusHtml = `
                <div style="background: #0a5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    ✅ <strong>BOT CONNECTÉ</strong>
                    <p>Envoyez #help sur WhatsApp</p>
                </div>
            `;
        } else if (qrCode) {
            statusHtml = `
                <div style="background: #fa0; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    📱 <strong>SCANNEZ LE QR CODE</strong>
                </div>
                <div>
                    <img src="${qrCode}" alt="QR Code" style="max-width: 300px; border: 2px solid white; padding: 10px; background: white;">
                </div>
            `;
        } else {
            statusHtml = `
                <div style="background: #06a; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    ⏳ <strong>DÉMARRAGE...</strong>
                </div>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🤖 Nobody's Bot</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    margin: 0; 
                    padding: 20px; 
                    background: #000; 
                    color: white; 
                    font-family: Arial; 
                    text-align: center;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .container { 
                    max-width: 500px; 
                    width: 100%;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Nobody's Bot</h1>
                <p>Déployé sur Railway 🚄</p>
                ${statusHtml}
                <div style="margin-top: 20px;">
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #00ff88; border: none; border-radius: 20px; cursor: pointer;">
                        🔄 Actualiser
                    </button>
                </div>
                <div style="margin-top: 20px; font-size: 0.8em; opacity: 0.7;">
                    Port: ${PORT} • ${new Date().toLocaleTimeString()}
                </div>
            </div>
            <script>
                if (!${isConnected}) {
                    setTimeout(() => location.reload(), 5000);
                }
            </script>
        </body>
        </html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('❌ Erreur route /:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Route santé CRITIQUE pour Railway
app.get('/health', (req, res) => {
    console.log('💚 Health check appelé');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        bot_connected: WhatsAppService.isBotConnected(),
        server: 'Railway',
        port: PORT
    });
});

// API statut
app.get('/api/status', (req, res) => {
    res.json({
        connected: WhatsAppService.isBotConnected(),
        hasQR: WhatsAppService.getQRCode() !== null,
        server: 'Railway'
    });
});

// Gestion des routes inexistantes
app.use((req, res) => {
    res.redirect('/');
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('💥 Erreur globale:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

// DÉMARRAGE SÉQUENTIEL pour éviter les conflits
async function startServer() {
    try {
        console.log('🔧 Initialisation du serveur...');
        
        // D'abord démarrer Express
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Serveur Express démarré sur le port ${PORT}`);
            console.log(`🌐 Application web accessible`);
        });

        // Ensuite démarrer le bot WhatsApp (avec délai)
        setTimeout(() => {
            console.log('🔧 Démarrage du bot WhatsApp...');
            WhatsAppService.connect();
        }, 3000);

        // Gestion des erreurs du serveur
        server.on('error', (error) => {
            console.error('❌ Erreur serveur HTTP:', error);
        });

    } catch (error) {
        console.error('💥 Erreur critique au démarrage:', error);
        process.exit(1);
    }
}

// Démarrer l'application
startServer();

// Gestion des signaux
process.on('SIGTERM', () => {
    console.log('🛑 Arrêt demandé');
    process.exit(0);
});
