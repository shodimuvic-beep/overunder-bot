const http = require('http');
http.createServer((req,res)=>{res.writeHead(200);res.end('Bot is running');}).listen(process.env.PORT || 3000, '0.0.0.0');
require('dotenv').config();
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const API_KEY = process.env.API_KEY;
const TARGET = process.env.TARGET_NUMBER;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u) => {
    const { qr, connection } = u;
    if (!sock.authState.creds.registered) {
  const code = await sock.requestPairingCode(process.env.TARGET_NUMBER);
  console.log('PAIRING CODE:', code);
}
    if (connection === 'open') { console.log('READY - Bot is online'); checkMatches(sock); setInterval(() => checkMatches(sock), 10*60*1000); }
  });
}

async function checkMatches(sock) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`https://v3.football.api-sports.io/fixtures?date=${today}`, { headers: { 'x-apisports-key': API_KEY } });
    const fixtures = res.data.response || [];
    console.log(`Found ${fixtures.length} fixtures`);
    for (const f of fixtures.slice(0, 5)) {
      const msg = `⚽ *Over/Under Tip*\n\n${f.teams.home.name} vs ${f.teams.away.name}\nLeague: ${f.league.name}\nTime: ${f.fixture.date}`;
      await sock.sendMessage(TARGET + '@s.whatsapp.net', { text: msg });
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) { console.log('Error:', e.message); }
}
start();
