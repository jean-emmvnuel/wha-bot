const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

class WhatsappService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.qrCode = null;
        this.startTime = null;
    }

    async connect() {
        if (this.client) {
            await this.cleanup();
        }

        try {
            console.log('🔄 Démarrage du bot WhatsApp...');
            
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: "nobodys-bot"
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            this.setupClientEvents();
            await this.client.initialize();

            return { succes: true };

        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            await this.cleanup();
            return { succes: false, error: error.message };
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
        });

        this.client.on('disconnected', () => {
            console.log('🔌 Bot déconnecté');
            this.isConnected = false;
            this.startTime = null;
        });

        // SEULEMENT LES MESSAGES QUE VOUS ENVOYEZ
        this.client.on('message_create', async (message) => {
            await this.handleOutgoingMessage(message);
        });
    }

    // Traitement des messages QUE VOUS ENVOYEZ
    async handleOutgoingMessage(message) {
    try {
        // Ignorer les messages de statut
        if (message.to === 'status@broadcast') {
            return;
        }

        // VÉRIFICATION PRINCIPALE : Uniquement VOS messages
        if (!message.fromMe) {
            // Optionnel: Log pour debug (à supprimer après test)
            console.log(`🔇 Message ignoré - Expéditeur: ${message.from}, Vous: ${message.fromMe}`);
            return;
        }

        const text = message.body?.trim();
        if (!text || !text.startsWith('#')) {
            return; // Ignorer les messages sans commande
        }

        console.log(`🎯 VOTRE COMMANDE DÉTECTÉE: "${text}"`);
        console.log(`📞 Conversation: ${message.to}`);

        // Traiter la commande
        await this.handleCommand(message, text);

    } catch (error) {
        console.error('❌ Erreur traitement message:', error.message);
    }
}

    async handleCommand(message, text) {
        const args = text.slice(1).split(' ');
        const command = args[0].toLowerCase();

        console.log(`⚡ Exécution commande: ${command}`);

        try {
            switch (command) {
                case 'start':
                    await this.handleStartCommand(message);
                    break;
                    
                case 'ping':
                    await this.handlePingCommand(message);
                    break;

                case 'owner':
                    await this.handleOwnerCommand(message);
                    break;

                case 'help':
                    await this.handleHelpCommand(message);
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
                    await this.handleStatutCommand(message, args.slice(1));
                    break;

                default:
                    await message.reply(`nobody's bot🤖\n\n❌ Commande inconnue. Tapez #help`);
                    console.log(`nobody's bot🤖\n\n❌ Commande inconnue: ${command}`);
            }

        } catch (error) {
            console.error(`nobody's bot🤖\n\n💥 Erreur commande ${command}:`, error.message);
        }
    }
    async handleOwnerCommand(message) {
        const owners = [
            {
                nom: "👑 Jean Emmanuel Ahossi",
                roles: "Fondateur,Développeur principal",
                whatsapp: "https://wa.me/2250704526437",  // 🔹 Remplace par ton vrai lien
                // porfolio: "https://jeanemmanuelahossi.netlify.app/"
            },
            {
                nom: "🔥 Emmanuel Bilson",
                roles: "Co-développeur, Testeur & designer ",
                whatsapp: "https://wa.me/2250799637242",
                // portfolio: "https://emmanuel-bilson.netlify.app/"
            }
        ];

        // 🧾 Création du message de présentation
        let presentation = "*Propriétaires officiels de nobody's bot🤖*\n\n";
        owners.forEach(owner => {
            presentation += `⭐ *${owner.nom}*\n`;
            presentation += `🎯 ${owner.roles}\n`;
            presentation += `📞 WhatsApp: ${owner.whatsapp}\n`;
            // presentation += `💼 LinkedIn: ${owner.porfolio}\n`;
        });

        await message.reply(presentation+"\n\n\n👥 Nous sommes 2 etudiants de l'IUA💙");
        console.log("✅ Présentation des propriétaires envoyée !");
    } //c'est OK

    async handleStatutCommand(message) {
        const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

        // Calcul des jours, heures, minutes et secondes
        const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
        const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        // Création d’un texte lisible
        let uptimeString = "";
        if (days > 0) uptimeString += `${days} jour${days > 1 ? 's' : ''}, `;
        if (hours > 0) uptimeString += `${hours} heure${hours > 1 ? 's' : ''}, `;
        if (minutes > 0) uptimeString += `${minutes} minute${minutes > 1 ? 's' : ''}, `;
        uptimeString += `${seconds} seconde${seconds > 1 ? 's' : ''}`;

        // Envoi du message
        await message.reply(`nobody's bot🤖\n\n🤖 En ligne depuis ${uptimeString}`);

    } //c'est OK

    async handlePingCommand(message) {
        const start = Date.now(); // 🕒 Temps de départ
        const latency = Date.now() - start;

        const output = "nobody's bot🤖\n\n🤖 Pong 🤣🤣!";

        await message.reply(output);
        console.log(`✅ Ping exécuté (${latency} ms)`);
    } //c'est OK

    async handleStartCommand(message) {
        const messageText = `
        Salut ! Je suis *Nobody*, ton bot WhatsApp 🤖\n\nJe peux t'aider avec plusieurs commandes utiles.\nPour voir toutes les fonctionnalités disponibles, tape : *#help*
        `.trim();

        await message.reply(messageText);
        console.log('✅ Message de bienvenue envoyé : Nobody Bot');
    } //c'est OK

    async handleHelpCommand(message) {
        const helpText = `
    🤖 *NOBODY'S BOT* - Commandes\n\n\n\n#start - Intro du bot\n\n#ping - verifier si le bot recoit les commandes\n\n#tagall - Mentionner tous les membres d'un groupe (groupes uniquement)\n\n#pp - récupérer la photo de profil d'un utilisateur\n\n#info - Infos sur un groupe (groupes uniquement)\n\n#statut - Statut du bot\n\n#owner - Propriétaires du bot\n\n#help - ouvrir le menu contenant toutes les commandes`.trim();
        
        await message.reply(helpText);
    } //c'est OK

    async handleTagAllCommand(message) {
        try {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                await message.reply("❌ Groupes uniquement");
                return;
            }

            console.log(`🏷️ Tagall dans le groupe: ${chat.name}`);
            const participants = chat.participants;
        
            // Vérifier s'il y a des participants
            if (participants.length === 0) {
                await message.reply("❌ Aucun participant dans le groupe");
                return;
            }
            let mentionText = `Nobody's Whatsapp Bot🤖\n\n📢 **Mention des 👥 ${participants.length} membres du groupe:**\n\n`;
        
            // Préparer les mentions correctement
            const mentions = [];
        
            participants.forEach(participant => {
                const participantId = participant.id._serialized; // Format correct pour les mentions
                mentionText += `@${participantId.split('@')[0]} `; // Juste le numéro pour l'affichage
                mentions.push(participantId); // L'ID complet pour les mentions
            });

            console.log(`👥 ${participants.length} membres à mentionner`);
        
            // Envoyer le message avec mentions
            await chat.sendMessage(mentionText, { mentions: mentions });
            console.log(`✅ Tagall envoyé à ${participants.length} membres`);

        } catch (error) {
            console.error('❌ Erreur tagall:', error.message);
            await message.reply('❌ Erreur lors de la mention de tous les membres');
        }
    } //c'est OK

    async handlePpCommand(message, params) {
        try {
            let contactId;
        
            // Si un numéro est spécifié en paramètre
            if (params.length > 0 && params[0].match(/\d+/)) {
                contactId = params[0].replace(/\D/g, '') + '@c.us';
                console.log(`📸 Photo demandée pour le numéro: ${contactId}`);
            } 
            // Si on répond à un message
            else if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                contactId = quotedMsg.author || quotedMsg.from;
                console.log(`📸 Photo demandée pour l'auteur du message cité: ${contactId}`);
            }
                // Sinon, prendre l'interlocuteur (celui à qui on envoie le message)
            else {
                // Dans une conversation privée, message.to est l'interlocuteur
                // Dans un groupe, message.to est le groupe et message.author est l'expéditeur
                const chat = await message.getChat();
                if (chat.isGroup) {
                    // En groupe, on ne peut pas récupérer la PP de l'interlocuteur spécifique
                    // On demande plutôt un numéro ou de citer un message
                    await message.reply("❌ Dans un groupe, spécifiez un numéro ou répondez à un message avec #pp");
                    console.log('❌ Commande PP dans un groupe sans paramètre');
                    return;
                } else {
                    // En conversation privée, l'interlocuteur est celui à qui on envoie le message
                    contactId = message.to;
                    console.log(`📸 Photo demandée pour l'interlocuteur en privé: ${contactId}`);
                }
            }

            // Récupérer le contact
            const contact = await this.client.getContactById(contactId);
            const profilePicUrl = await contact.getProfilePicUrl();
        
            if (profilePicUrl) {
                const media = await MessageMedia.fromUrl(profilePicUrl);
                await message.reply(media, null, {
                caption: `nobody's bot🤖\n\n📸 Photo de profil`
            });
            console.log('✅ Photo de profil envoyée');
            } else {
                await message.reply("nobody's bot🤖\n\n❌ Aucune photo de profil disponible");
                console.log('❌ Aucune photo disponible');
            }

        } catch (error) {
            console.error('❌ Erreur pp:', error.message);
            await message.reply('❌ Erreur lors de la récupération de la photo de profil');
        }
    } //c'est OK

    async handleInfoCommand(message) {
        try {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                await message.reply('❌ Groupes uniquement');
                return;
            }

            console.log(`ℹ️ Info groupe: ${chat.name}`);
        
            // Récupérer les participants et compter les admins
            const participants = chat.participants;
            const adminCount = participants.filter(p => p.isAdmin || p.isSuperAdmin).length;
        
            // Récupérer les infos du groupe
            const infoText = `
            nobody's bot🤖\n\n\n\n📊 *INFORMATIONS DU GROUPE*\n\n\n*Nom* : ${chat.name}\n*Membres* : ${participants.length}\n*Administrateurs* : ${adminCount}\n*Description* : ${chat.description || 'Aucune'}\n
            `.trim();
        
            await message.reply(infoText);
            console.log('✅ Info groupe envoyée');

        } catch (error) {
            console.error('❌ Erreur info:', error.message);
            await message.reply("nobody's bot🤖\n\n\n❌ Erreur lors de la récupération des informations");
        }
    } //c'est OK



    // ________________________utilitaire_____________________________
    async cleanup() {
        try {
            if (this.client) {
                this.client.removeAllListeners();
                await this.client.destroy();
                this.client = null;
            }
            this.isConnected = false;
            this.qrCode = null;
            this.startTime = null;
            console.log('🧹 Bot arrêté');
        } catch (error) {
            console.error('❌ Erreur nettoyage:', error.message);
        }
    }

    getQRCode() {
        return this.qrCode;
    }

    isBotConnected() {
        return this.isConnected;
    }

    async stop() {
        await this.cleanup();
    }
}

module.exports = new WhatsappService();