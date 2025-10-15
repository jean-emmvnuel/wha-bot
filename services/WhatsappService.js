const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

class WhatsappService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.qrCode = null;
        this.startTime = null;
        this.lastCommandTime = null;
        this.sessionPath = '/tmp/.wwebjs_auth';
        this.connectionAttempts = 0;
        this.maxAttempts = 5;
        this.isInitializing = false;
        
        console.log('🔧 Initialisation WhatsAppService');
        console.log('📁 Session path:', this.sessionPath);
    }

    async connect() {
        if (this.isInitializing) {
            console.log('⏳ Déjà en cours d\'initialisation...');
            return { success: false, error: 'Déjà en cours d\'initialisation' };
        }

        this.isInitializing = true;
        this.connectionAttempts++;

        if (this.connectionAttempts > this.maxAttempts) {
            console.log('🛑 Trop de tentatives de connexion, pause...');
            this.isInitializing = false;
            return { success: false, error: 'Trop de tentatives' };
        }

        console.log(`🔄 Tentative de connexion ${this.connectionAttempts}/${this.maxAttempts}...`);

        try {
            // Nettoyer l'ancien client si existe
            if (this.client) {
                console.log('🧹 Nettoyage ancien client...');
                try {
                    this.client.removeAllListeners();
                    await this.client.destroy();
                } catch (e) {
                    console.log('⚠️ Erreur nettoyage client:', e.message);
                }
                this.client = null;
            }

            await this.ensureSessionDir();
            await this.checkSessionFiles();

            // Configuration PUPPETEER pour Koyeb
            const puppeteerOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--single-process',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--memory-pressure-off',
                    '--window-size=1920,1080',
                    '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ],
                ignoreDefaultArgs: ['--disable-extensions'],
                timeout: 60000
            };

            // Utiliser Chromium système
            if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
                console.log('🔧 Chromium système:', puppeteerOptions.executablePath);
            } else {
                // Essayer différents chemins
                const possiblePaths = [
                    '/usr/bin/chromium',
                    '/usr/bin/chromium-browser',
                    '/usr/bin/google-chrome',
                    '/usr/bin/chrome'
                ];
                
                for (const chromePath of possiblePaths) {
                    try {
                        await fs.access(chromePath);
                        puppeteerOptions.executablePath = chromePath;
                        console.log('✅ Chromium trouvé:', chromePath);
                        break;
                    } catch (e) {
                        console.log('❌ Chromium non trouvé:', chromePath);
                    }
                }
                
                if (!puppeteerOptions.executablePath) {
                    console.log('⚠️ Utilisation Chromium intégré');
                }
            }

            console.log('🎯 Création du client WhatsApp...');
            
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: "nobodys-bot-koyeb",
                    dataPath: this.sessionPath
                }),
                puppeteer: puppeteerOptions,
                webVersionCache: {
                    type: 'remote',
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
                },
                // Configuration pour stabilité
                takeoverOnConflict: false,
                restartOnAuthFail: false,
                qrMaxRetries: 3,
                authTimeoutMs: 45000,
                qrRefreshIntervalMs: 30000,
                puppeteerOptions: {
                    slowMo: 0,
                    headless: true
                }
            });

            console.log('🔧 Configuration des événements...');
            this.setupClientEvents();

            console.log('🚀 Initialisation du client...');
            await this.client.initialize();
            
            console.log('✅ Client WhatsApp initialisé avec succès');
            this.isInitializing = false;
            return { success: true };

        } catch (error) {
            console.error('💥 Erreur critique connexion:', error.message);
            console.error('Stack:', error.stack);
            
            this.isInitializing = false;
            
            // Nettoyer en cas d'erreur
            if (this.client) {
                try {
                    await this.client.destroy();
                } catch (e) {
                    // Ignorer les erreurs de nettoyage
                }
                this.client = null;
            }
            
            return { success: false, error: error.message };
        }
    }

    async ensureSessionDir() {
        try {
            await fs.mkdir(this.sessionPath, { recursive: true });
            console.log('✅ Dossier session créé:', this.sessionPath);
        } catch (error) {
            console.log('📁 Dossier session existe déjà');
        }
    }

    async checkSessionFiles() {
        try {
            const files = await fs.readdir(this.sessionPath);
            console.log(`📁 Fichiers session (${files.length}):`, files);
            
            if (files.length > 0) {
                console.log('🎯 Session existante détectée');
                for (const file of files) {
                    const filePath = path.join(this.sessionPath, file);
                    const stats = await fs.stat(filePath);
                    console.log(`   📄 ${file} (${stats.size} bytes)`);
                }
            } else {
                console.log('🆕 Aucune session existante');
            }
        } catch (error) {
            console.log('❌ Impossible de lire le dossier session:', error.message);
        }
    }

    setupClientEvents() {
        console.log('🔧 Configuration des événements client...');
        
        let qrGenerated = false;
        let readyFired = false;

        this.client.on('qr', async (qr) => {
            if (!qrGenerated) {
                console.log('📱 QR Code généré - Prêt pour scan');
                this.qrCode = await qrcode.toDataURL(qr);
                qrGenerated = true;
                
                // Sauvegarder le QR code pour debug
                try {
                    const qrBackupPath = '/tmp/qr_code.txt';
                    await fs.writeFile(qrBackupPath, qr);
                    console.log('💾 QR code sauvegardé:', qrBackupPath);
                } catch (e) {
                    console.log('⚠️ Impossible de sauvegarder QR code');
                }
                
                // Réinitialiser après 60 secondes
                setTimeout(() => {
                    qrGenerated = false;
                    console.log('🔄 QR code peut être regénéré');
                }, 60000);
            } else {
                console.log('📱 QR code déjà généré - En attente de scan');
            }
        });

        this.client.on('ready', () => {
            if (!readyFired) {
                console.log('🎉 ✅ BOT CONNECTÉ AVEC SUCCÈS!');
                console.log('🚀 Prêt à recevoir les commandes');
                this.isConnected = true;
                this.qrCode = null;
                this.startTime = Date.now();
                readyFired = true;
                this.connectionAttempts = 0; // Reset counter
                
                // Log session status
                this.logSessionStatus();
            }
        });

        this.client.on('authenticated', () => {
            console.log('🔐 ✅ Authentification réussie - Session valide');
        });

        this.client.on('auth_failure', (msg) => {
            console.log('❌ Échec authentification:', msg);
            this.cleanSession();
        });

        this.client.on('disconnected', (reason) => {
            console.log('🔌 ❌ DÉCONNECTÉ - Raison:', reason);
            this.isConnected = false;
            this.qrCode = null;
            readyFired = false;
            
            if (reason === 'LOG_OUT') {
                console.log('🚪 Logout manuel détecté - Nettoyage complet');
                this.cleanSession();
            } else if (reason === 'NAVIGATION') {
                console.log('🧭 Navigation détectée - Reconnexion...');
            } else {
                console.log('🔌 Déconnexion réseau ou timeout');
            }
            
            // Reconnexion intelligente avec backoff
            const delay = Math.min(this.connectionAttempts * 10000, 60000); // Max 60s
            console.log(`🔄 Reconnexion dans ${delay/1000} secondes...`);
            
            setTimeout(() => {
                console.log('🔄 Lancement reconnexion...');
                this.reconnect();
            }, delay);
        });

        this.client.on('change_state', (state) => {
            console.log('📱 Changement état:', state);
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log(`📱 Chargement WhatsApp: ${percent}% - ${message}`);
            
            if (percent === 100) {
                console.log('🎯 WhatsApp chargé à 100% - En attente de connexion...');
                // Après 30 secondes, vérifier si connecté
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.log('⚠️ WhatsApp chargé mais pas connecté après 30s');
                    }
                }, 30000);
            }
        });

        this.client.on('message_create', async (message) => {
            await this.handleOutgoingMessage(message);
        });

        console.log('✅ Événements configurés');
    }

    async logSessionStatus() {
        try {
            const files = await fs.readdir(this.sessionPath);
            console.log(`📁 Session active - ${files.length} fichiers`);
            
            let totalSize = 0;
            for (const file of files) {
                const filePath = path.join(this.sessionPath, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
                console.log(`   📄 ${file} - ${stats.size} bytes`);
            }
            console.log(`💾 Taille totale session: ${totalSize} bytes`);
        } catch (error) {
            console.log('❌ Impossible de lire le statut session');
        }
    }

    async handleOutgoingMessage(message) {
        try {
            // Ignorer les messages de statut et les messages entrants
            if (message.to === 'status@broadcast' || !message.fromMe) {
                return;
            }

            const text = message.body?.trim();
            if (!text || !text.startsWith('#')) return;

            this.lastCommandTime = Date.now();
            console.log(`⚡ Commande détectée: "${text}" de ${message.to}`);
            
            await this.handleCommand(message, text);

        } catch (error) {
            console.error('❌ Erreur traitement message:', error.message);
        }
    }

    async handleCommand(message, text) {
        const args = text.slice(1).split(' ');
        const command = args[0].toLowerCase();

        console.log(`🎯 Exécution commande: ${command}`);

        try {
            switch (command) {
                case 'start':
                    await message.reply("Salut ! Je suis *Nobody*, ton bot WhatsApp 🤖\nTape #help pour voir les commandes");
                    break;
                    
                case 'ping':
                    const responseTime = this.lastCommandTime ? Date.now() - this.lastCommandTime + 'ms' : 'N/A';
                    await message.reply(`nobody's bot🤖\n\n🤖 Pong 🚀!\n⚡ Rapidité: ${responseTime}\n☁️ Hébergement: Koyeb`);
                    break;

                case 'owner':
                    await message.reply(`*Propriétaires de nobody's bot🤖*\n\n⭐ *👑 Jean Emmanuel Ahossi*\n📞 https://wa.me/2250704526437\n\n⭐ *🔥 Emmanuel Bilson*\n📞 https://wa.me/2250799637242\n\n👥 Étudiants IUA 💙`);
                    break;

                case 'help':
                    await message.reply(`🤖 *NOBODY'S BOT* - Commandes\n\n#start - Intro\n#ping - Test\n#owner - Contacts\n#help - Menu\n#tagall - Mention groupe\n#pp - Photo profil\n#info - Infos groupe\n#status - Statut bot`);
                    break;
                    
                case 'tagall':
                    await this.handleTagAllCommand(message);
                    break;
                    
                case 'pp':
                    await this.handlePpCommand(message, args.slice(1));
                    break;
                    
                case 'info':
                    await this.handleInfoCommand(message);
                    break;

                case 'status':
                    await this.handleStatutCommand(message);
                    break;

                default:
                    await message.reply("nobody's bot🤖\n\n❌ Commande inconnue. #help");
            }
            
            console.log(`✅ Commande ${command} exécutée`);
        } catch (error) {
            console.error(`💥 Erreur commande ${command}:`, error.message);
            await message.reply("nobody's bot🤖\n\n❌ Erreur commande");
        }
    }

    async handleTagAllCommand(message) {
        try {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                await message.reply("❌ Groupes uniquement");
                return;
            }

            const participants = chat.participants;
            if (participants.length === 0) {
                await message.reply("❌ Aucun participant");
                return;
            }
            
            let mentionText = `Nobody's Bot🤖\n\n📢 Mention ${participants.length} membres:\n\n`;
            const mentions = [];
        
            participants.forEach(participant => {
                const participantId = participant.id._serialized;
                mentionText += `@${participantId.split('@')[0]} `;
                mentions.push(participantId);
            });

            await chat.sendMessage(mentionText, { mentions });
            console.log(`✅ Tagall: ${participants.length} membres`);

        } catch (error) {
            console.error('❌ Erreur tagall:', error.message);
            await message.reply('❌ Erreur tagall');
        }
    }

    async handlePpCommand(message, params) {
        try {
            let contactId;
        
            if (params.length > 0 && params[0].match(/\d+/)) {
                contactId = params[0].replace(/\D/g, '') + '@c.us';
            } else if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                contactId = quotedMsg.author || quotedMsg.from;
            } else {
                const chat = await message.getChat();
                contactId = chat.isGroup ? null : message.to;
                if (!contactId) {
                    await message.reply("❌ Spécifiez un numéro");
                    return;
                }
            }

            const contact = await this.client.getContactById(contactId);
            const profilePicUrl = await contact.getProfilePicUrl();
        
            if (profilePicUrl) {
                const media = await MessageMedia.fromUrl(profilePicUrl);
                await message.reply(media, null, { 
                    caption: `nobody's bot🤖\n\n📸 Photo de profil` 
                });
            } else {
                await message.reply("nobody's bot🤖\n\n❌ Aucune photo");
            }

        } catch (error) {
            console.error('❌ Erreur photo:', error.message);
            await message.reply('❌ Erreur photo');
        }
    }

    async handleInfoCommand(message) {
        try {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                await message.reply('❌ Groupes uniquement');
                return;
            }

            const participants = chat.participants;
            const adminCount = participants.filter(p => p.isAdmin || p.isSuperAdmin).length;
        
            const infoText = `nobody's bot🤖\n\n📊 *INFOS GROUPE*\n\nNom: ${chat.name}\nMembres: ${participants.length}\nAdmins: ${adminCount}\nDescription: ${chat.description || 'Aucune'}`;
        
            await message.reply(infoText);

        } catch (error) {
            console.error('❌ Erreur info:', error.message);
            await message.reply("nobody's bot🤖\n\n❌ Erreur infos");
        }
    }

    async handleStatutCommand(message) {
        if (!this.startTime) {
            await message.reply("nobody's bot🤖\n\n🤖 Bot non connecté");
            return;
        }

        const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        let uptimeString = "";
        if (hours > 0) uptimeString += `${hours}h `;
        if (minutes > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;

        const responseTime = this.lastCommandTime ? Date.now() - this.lastCommandTime + 'ms' : 'N/A';
        
        await message.reply(`nobody's bot🤖\n\n🤖 *STATUT*\n\n🟢 En ligne: ${uptimeString}\n⚡ Rapidité: ${responseTime}\n☁️ Hébergement: Koyeb\n💾 Session: ${this.sessionPath}`);
    }

    async cleanSession() {
        try {
            console.log('🧹 Nettoyage session...');
            await fs.rm(this.sessionPath, { recursive: true, force: true });
            console.log('✅ Session nettoyée');
            
            // Recréer le dossier
            await this.ensureSessionDir();
        } catch (error) {
            console.log('⚠️ Nettoyage session échoué:', error.message);
        }
    }

    async reconnect() {
        console.log('🔄 Reconnexion automatique...');
        if (this.client) {
            try {
                await this.client.destroy();
            } catch (e) {
                console.log('⚠️ Erreur destruction client:', e.message);
            }
            this.client = null;
        }
        await this.connect();
    }

    getQRCode() {
        return this.qrCode;
    }

    isBotConnected() {
        return this.isConnected;
    }

    getSessionStatus() {
        return {
            hasSession: this.isConnected,
            sessionPath: this.sessionPath,
            connectionAttempts: this.connectionAttempts,
            isInitializing: this.isInitializing
        };
    }
}

module.exports = new WhatsappService();
