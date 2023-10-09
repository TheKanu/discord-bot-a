require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { initializeDatabase, startBot, startEventLoop } = require('./bot');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: ['MESSAGE', 'CHANNEL'],
});

initializeDatabase(); // Initialisiere die Datenbank

client.on('ready', () => {
  console.log(`Eingeloggt als ${client.user.tag}`);
  startEventLoop(client); // Starte den Event-Loop
});

client.login(config.TOKEN);

startBot(client); // Starte den Bot
