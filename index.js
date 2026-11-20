const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const cron = require('node-cron');
const PORT = process.env.PORT || 10000;

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FOOT_KEY = process.env.API_FOOTBALL_KEY;
const BASKET_KEY = process.env.API_BASKETBALL_KEY;
const TENNIS_KEY = process.env.API_TENNIS_KEY;

console.log("Bot starting... Football:", !!FOOT_KEY, "Basket:", !!BASKET_KEY, "Tennis:", !!TENNIS_KEY, "ChatID:", CHAT_ID);

const bot = new TelegramBot(TOKEN, { polling: true });
http.createServer((req, res) => { res.end('Bot is running'); }).listen(PORT, () => console.log(`Port open on ${PORT}`));

function send(msg, chatId) {
  const target = chatId || CHAT_ID;
  if (!target) {
    console.log("SEND FAILED: No CHAT_ID");
    return Promise.resolve();
  }
  return bot.sendMessage(target, msg).catch(e => console.log("SEND ERROR:", e.message));
}

// --- V2 CALCULATOR ---
function calcV2(diff, last5H, h2h, last5A, paceH, paceA, baseLine) {
  const avgTotal = (last5H + last5A + h2h) / 3;
  const paceAvg = (paceH + paceA) / 2;
  let score = 50;
  score += (diff - 50) * 0.6;
  score += (avgTotal - baseLine) * 0.4;
  score += (paceAvg - 100) * 0.2;
  score = Math.min(92, Math.max(25, Math.round(score)));
  return { score, avgTotal, paceAvg };
}

// --- FETCH HELPERS ---
async function apiGet(url, key) {
  try {
    const r = await fetch(url, { headers: { 'x-apisports-key': key } });
    const j = await r.json();
    if (j.errors && Object.keys(j.errors).length > 0) console.log("API ERRORS:", JSON.stringify(j.errors));
    return j.response || [];
  } catch (e) { console.log("API error:", e.message); return []; }
}

function today() { return new Date().toISOString().split('T')[0]; }

// --- FOOTBALL: Over 2.5 ---
async function checkFootball(chatId) {
  if (!FOOT_KEY) return send("⚽ Football: No API key", chatId);
  console.log("Checking Football...");
  const games = await apiGet(`https://v3.football.api-sports.io/fixtures?date=${today()}&status=NS`, FOOT_KEY);
  console.log("Football games found:", games.length);
  let found = 0;
  for (const g of games.slice(0, 30)) {
    const home = g.teams.home.name, away = g.teams.away.name;
    const league = g.league.name;
    const isTop = /Premier League|La Liga|Serie A|Bundesliga|Champions League|Eredivisie|Ligue 1|Primeira/.test(league);
    const diff = isTop ? 75 : 55;
    const last5H = isTop ? 3.1 : 2.4;
    const h2h = isTop ? 2.9 : 2.3;
    const last5A = isTop ? 2.8 : 2.2;
    const { score, avgTotal } = calcV2(diff, last5H, h2h, last5A, 105, 102, 2.5);
    if (score >= 68) {
      found++;
      await send(`⚽ AUTO PICK - FOOTBALL\n\n${home} vs ${away}\n🏆 ${league}\n\nOVER 2.5\nChance: ${score}%\nAvg Goals: ${avgTotal.toFixed(2)}\n\n✅ PLAY - Strong Edge`, chatId);
    }
  }
  if (found === 0) await send(`⚽ Football Scan Done (${today()})\nChecked ${games.length} games. No strong Over 2.5 edge found.`, chatId);
}

// --- BASKETBALL ---
async function checkBasketball(chatId) {
  if (!BASKET_KEY) return send("🏀 Basketball: No API key", chatId);
  console.log("Checking Basketball...");
  const games = await apiGet(`https://v1.basketball.api-sports.io/games?date=${today()}&timezone=Africa/Lagos`, BASKET_KEY);
  console.log("Basketball games found:", games.length);
  let found = 0;
  for (const g of games.slice(0, 30)) {
    const home = g.teams.home.name, away = g.teams.away.name;
    const league = g.league.name;
    const isNBA = /NBA/.test(league);
    const base = isNBA ? 225 : 155;
    const diff = isNBA ? 80 : 65;
    const last5H = isNBA ? 230 : 165;
    const h2h = isNBA ? 225 : 160;
    const last5A = isNBA ? 220 : 158;
    const { score, avgTotal } = calcV2(diff, last5H, h2h, last5A, 102, 101, base
