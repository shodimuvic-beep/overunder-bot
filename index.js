require('dotenv').config();
const axios = require('axios');
const { Client, LocalAuth } = require('whatsapp-web.js');

const API_KEY = process.env.API_KEY;
const TARGET = process.env.TARGET_NUMBER;
const MIN_CONF = parseInt(process.env.MIN_CONFIDENCE || '65');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
  console.log('QR_RECEIVED:' + qr);
});

client.on('ready', () => {
  console.log('READY - Bot is online');
  checkMatches();
  setInterval(checkMatches, 10 * 60 * 1000);
});

async function checkMatches() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const fixtures = res.data.response || [];
    console.log(`Found ${fixtures.length} fixtures for ${today}`);
    for (const f of fixtures.slice(0, 5)) {
      const msg = `⚽ *Over/Under Tip*\n\n${f.teams.home.name} vs ${f.teams.away.name}\nLeague: ${f.league.name}\nTime: ${f.fixture.date}\n\nChecking odds...`;
      await client.sendMessage(TARGET + '@c.us', msg);
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

client.initialize();
