const express = require("express");
const WhatsAppService = require('./services/WhatsappService');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware minimal
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Route pour récupérer le QR code
app.get('/api/qrcode', (req, res) => {
    const qrCode = WhatsAppService.getQRCode();
    if (qrCode) {
        res.json({
            success: true,
            qrCode: qrCode,
            message: 'QR code disponible',
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({
            success: false,
            qrCode: null,
            message: 'Aucun QR code disponible (bot déjà connecté ou en cours de démarrage)',
            timestamp: new Date().toISOString()
        });
    }
});

// Route pour vérifier l'état de connexion du bot
app.get('/api/connection', (req, res) => {
    const isConnected = WhatsAppService.isBotConnected();
    res.json({
        success: true,
        connected: isConnected,
        message: isConnected ? 'Bot connecté' : 'Bot non connecté',
        timestamp: new Date().toISOString()
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
            uptime: WhatsAppService.startTime ? Date.now() - WhatsAppService.startTime : 0
        });
    } catch (error) {
        res.json({ error: 'Impossible de récupérer les infos session' });
    }
});

// Redirection pour toutes les autres routes
app.use((req, res) => {
    res.redirect('/api/qrcode');
});



// Démarrer le bot
console.log('🚀 Lancement de Nobody\'s Bot en production...');
WhatsAppService.connect();

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📍 Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Interface: https://nobody-bot1-front.netlify.app/`);
    console.log(`📊 API Statut: /api/connection`);
    console.log(`API qrCode: /api/qrcode`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
    console.log('\n🧹 Nettoyage du dossier de session (arrêt manuel)...');
    const fsPromises = require('fs').promises;
    try {
        await fsPromises.rm(path.join(__dirname, './session/.wwebjs_auth'), {
            recursive: true,
            force: true
        });
        console.log('✅ Dossier de session supprimé avec succès');
    } catch (error) {
        if (error.code === 'EBUSY') {
            console.warn('⚠️ Fichier encore verrouillé, suppression différée.');
        } else {
            console.error('⚠️ Erreur suppression à l\'arrêt:', error.message);
        }
    }
    process.exit(0);
});


process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt demandé par Render...');
    process.exit(0);
});
