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
        this.sessionPath = './session/.wwebjs_auth'; // Dossier contenant la session de l'utilisateur
    }

    async connect() {
        if (this.client) {
            return { success: true, message: 'Déjà connecté' };
        }

        try {
            console.log('🚀 Démarrage du bot WhatsApp ultra-rapide...');
            console.log('📁 Dossier session:', this.sessionPath);
            
            // Assurer que le dossier session existe
            await this.ensureSessionDir();
            
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: "nobodys-bot-render",
                    dataPath: this.sessionPath // Session dans ./session/
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--single-process',
                        '--no-zygote',
                        '--disable-gpu',
                        '--disable-extensions',
                        '--disable-background-timer-throttling'
                    ]
                },
                webVersionCache: {
                    type: 'remote',
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
                }
            });

            this.setupClientEvents();
            this.client.initialize().catch(error => {
                console.error('❌ Erreur initialisation:', error.message);
            });

            return { success: true };

        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            return { success: false, error: error.message };
        }
    }

    async ensureSessionDir() {
        try {
            await fs.mkdir(this.sessionPath, { recursive: true });
            console.log('✅ Dossier session créé:', this.sessionPath);
        } catch (error) {
            // Le dossier existe déjà
        }
    }

    setupClientEvents() {
        this.client.on('qr', async (qr) => {
            console.log('📱 QR Code généré - Scannez avec WhatsApp');
            this.qrCode = await qrcode.toDataURL(qr);
        });

        this.client.on('ready', () => {
            console.log('✅ BOT CONNECTÉ - Prêt à recevoir les commandes');
            this.isConnected = true;
            this.qrCode = null;
            this.startTime = Date.now();
            this.logSessionStatus();
        });

        this.client.on('authenticated', () => {
            console.log('🔐 Authentification réussie - Session sauvegardée');
        });

        this.client.on('auth_failure', (msg) => {
            console.log('❌ Échec authentification:', msg);
            this.cleanSession();
        });

        this.client.on('disconnected', (reason) => {
            console.log('🔌 Déconnecté:', reason);
            this.handleDisconnection();
        });

        // Gestion ultra-rapide des messages
        this.client.on('message_create', async (message) => {
            await this.handleOutgoingMessage(message);
        });
    }

    async logSessionStatus() {
        try {
            const files = await fs.readdir(this.sessionPath);
            console.log(`📁 Session active - ${files.length} fichiers`);
        } catch (error) {
            console.log('📁 Nouvelle session');
        }
    }

    async handleOutgoingMessage(message) {
        // Vérifications minimales pour la rapidité
        if (!message.fromMe || message.to === 'status@broadcast') return;

        const text = message.body?.trim();
        if (!text || !text.startsWith('#')) return;

        this.lastCommandTime = Date.now();
        console.log(`⚡ Commande reçue: "${text}"`);
        
        // Traitement IMMÉDIAT
        await this.handleCommand(message, text);
    }

    async handleCommand(message, text) {
        const args = text.slice(1).split(' ');
        const command = args[0].toLowerCase();

        try {
            switch (command) {
                case 'start':
                    message.reply("Salut ! Je suis *Nobody*, ton bot WhatsApp ultra-rapide 🤖\nTape #help pour voir toutes les commandes disponibles");
                    break;
                    
                case 'ping':
                    const responseTime = this.lastCommandTime ? Date.now() - this.lastCommandTime + 'ms' : 'N/A';
                    message.reply(`nobody's bot🤖\n\n🤖 Pong 🚀!\n⚡ Rapidité: ${responseTime}`);
                    break;

                case 'owner':
                    message.reply(`*Propriétaires officiels de nobody's bot🤖*\n\n⭐ *👑 Jean Emmanuel Ahossi*\n🎯 Fondateur & Développeur principal\n📞 https://wa.me/2250704526437\n\n⭐ *🔥 Emmanuel Bilson*\n🎯 Co-développeur & Designer\n📞 https://wa.me/2250799637242\n\n👥 Nous sommes 2 étudiants de l'IUA 💙`);
                    break;

                case 'help':
                    message.reply(`🤖 *NOBODY'S BOT* - Commandes Ultra-Rapides\n\n
#start - Introduction du bot
#ping - Test de rapidité
#owner - Contacter les propriétaires  
#help - Menu des commandes
#tagall - Mentionner tous les membres (groupes)
#pp - Photo de profil d'un contact
#info - Informations du groupe
#status - Statut du bot`);
                    break;
                    
                case 'tagall':
                    this.handleTagAllCommand(message);
                    break;
                    
                case 'pp':
                    this.handlePpCommand(message, args.slice(1));
                    break;
                    
                case 'info':
                    this.handleInfoCommand(message);
                    break;

                case 'status':
                    this.handleStatutCommand(message);
                    break;

                default:
                    message.reply("nobody's bot🤖\n\n❌ Commande inconnue. Tapez #help pour voir le menu complet");
            }
        } catch (error) {
            console.error(`💥 Erreur commande ${command}:`, error.message);
            message.reply("nobody's bot🤖\n\n❌ Erreur lors de l'exécution de la commande");
        }
    }


    async handleTagAllCommand(message) {
        try {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                message.reply("❌ Cette commande fonctionne uniquement dans les groupes");
                return;
            }

            const participants = chat.participants;
            if (participants.length === 0) {
                message.reply("❌ Aucun participant dans le groupe");
                return;
            }
            
            let mentionText = `Nobody's Whatsapp Bot🤖\n\n📢 **Mention des 👥 ${participants.length} membres:**\n\n`;
            const mentions = [];
        
            participants.forEach(participant => {
                const participantId = participant.id._serialized;
                mentionText += `@${participantId.split('@')[0]} `;
                mentions.push(participantId);
            });

            await chat.sendMessage(mentionText, { mentions });
            console.log(`✅ Tagall envoyé à ${participants.length} membres`);

        } catch (error) {
            console.error('❌ Erreur tagall:', error.message);
            message.reply('❌ Erreur lors de la mention des membres');
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
                    message.reply("❌ Dans un groupe, spécifiez un numéro ou répondez à un message avec #pp");
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
                console.log('✅ Photo de profil envoyée');
            } else {
                await message.reply("nobody's bot🤖\n\n❌ cet utilisateur n'a pas de photo de profil");
            }

        } catch (error) {
            console.error('❌ Erreur photo profil:', error.message);
            message.reply('❌ Erreur lors de la récupération de la photo');
        }
    }

    async handleInfoCommand(message) {
        try {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                message.reply('❌ Cette commande fonctionne uniquement dans les groupes');
                return;
            }

            const participants = chat.participants;
            const adminCount = participants.filter(p => p.isAdmin || p.isSuperAdmin).length;
        
            const infoText = `nobody's bot🤖\n\n📊 *INFORMATIONS DU GROUPE*\n\n*Nom* : ${chat.name}\n*Membres* : ${participants.length}\n*Administrateurs* : ${adminCount}\n*Description* : ${chat.description || 'Aucune description'}`;
        
            await message.reply(infoText);
            console.log('✅ Info groupe envoyée');

        } catch (error) {
            console.error('❌ Erreur info groupe:', error.message);
            message.reply("nobody's bot🤖\n\n❌ Erreur lors de la récupération des informations");
        }
    }

    async handleStatutCommand(message) {
        if (!this.startTime) {
            message.reply("nobody's bot🤖\n\n🤖 Bot non connecté");
            return;
        }

        const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        let uptimeString = "";
        if (days > 0) uptimeString += `${days}j `;
        if (hours > 0) uptimeString += `${hours}h `;
        if (minutes > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;

        const responseTime = this.lastCommandTime ? Date.now() - this.lastCommandTime + 'ms' : 'N/A';

        await message.reply(`nobody's bot🤖\n\n🤖 *STATUT DU BOT*\n\n🟢 En ligne: ${uptimeString}\n⚡ Rapidité: ${responseTime}\n💾 Session: ../session ✅\n🚀 Mode: Ultra-rapide`);
    }

    async cleanSession() {
        console.log('🧼 Nettoyage de la session...');
        await this.safeRemoveSession();
    }

    async handleDisconnection() {
        this.isConnected = false;
        console.log('✂️Déconnecté du serveur whatsapp.');
        
        // Attendre 4 secondes pour s'assurer que Chromium a bien libéré ses fichiers
        await new Promise(r => setTimeout(r, 4000));

        await this.safeRemoveSession();

        console.log('🔄 Tentative de reconnexion dans 5 secondes...');
        setTimeout(() => this.reconnect(), 5000);
    }

    async safeRemoveSession(retryCount = 2) {
        try {
            await fs.rm(this.sessionPath, { recursive: true, force: true });
            console.log('🧹 Dossier de session supprimé avec succès');
        } catch (error) {
            // Cas typique : EBUSY (fichier verrouillé)
            if (error.code === 'EBUSY' && retryCount > 0) {
                console.warn(`⚠️ Ressource verrouillée (${error.path}), nouvelle tentative dans 2s...`);
                await new Promise(r => setTimeout(r, 2000));
                return this.safeRemoveSession(retryCount - 1);
            } else {
                console.error('❌ Échec suppression dossier session:', error.message);
            }
    }
}
    async reconnect() {
        console.log('🔄 Reconnexion automatique...');
        this.client = null;
        await this.connect();
    }

    async getSessionStatus() {
        try {
            const files = await fs.readdir(this.sessionPath);
            return {
                hasSession: files.length > 0,
                fileCount: files.length,
                isConnected: this.isConnected
            };
        } catch (error) {
            return {
                hasSession: false,
                fileCount: 0,
                isConnected: false
            };
        }
    }

    getQRCode() {
        return this.qrCode;
    }

    isBotConnected() {
        return this.isConnected;
    }
    
}

module.exports = new WhatsappService();
