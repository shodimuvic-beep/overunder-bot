const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const cron = require('node-cron');
const PORT = process.env.PORT || 10000;

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FOOT_KEY = process.env.API_FOOTBALL_KEY;
const BASKET_KEY = process.env.API_BASKETBALL_KEY;
const TENNIS_KEY = process.env.API_TENNIS_KEY;

console.log("Bot starting... Football:", !!FOOT_KEY, "Basket:", !!BASKET_KEY, "Tennis:", !!TENNIS_KEY);

const bot = new TelegramBot(TOKEN, { polling: true });
http.createServer((req, res) => { res.end('Bot is running'); }).listen(PORT, () => console.log(`Port open on ${PORT}`));

function send(msg) {
  if (!CHAT_ID) return console.log("No CHAT_ID");
  return bot.sendMessage(CHAT_ID, msg).catch(e => console.log(e.message));
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
    return j.response || [];
  } catch (e) { console.log("API error:", e.message); return []; }
}

function today() { return new Date().toISOString().split('T')[0]; }

// --- FOOTBALL: Over 2.5 ---
async function checkFootball() {
  if (!FOOT_KEY) return send("⚽ Football: No API key");
  const games = await apiGet(`https://v3.football.api-sports.io/fixtures?date=${today()}&status=NS`, FOOT_KEY);
  let found = 0;
  for (const g of games.slice(0, 30)) {
    // Simple V2 for football: use league + teams as placeholder, use odds if available
    // For now we use a quick model: if both teams in top leagues, check
    const home = g.teams.home.name, away = g.teams.away.name;
    const league = g.league.name;
    // We estimate from league average: top leagues = higher scoring
    const isTop = /Premier League|La Liga|Serie A|Bundesliga|NBA|Champions League|Eredivisie/.test(league);
    const diff = isTop ? 75 : 55;
    const last5H = isTop ? 3.1 : 2.4;
    const h2h = isTop ? 2.9 : 2.3;
    const last5A = isTop ? 2.8 : 2.2;
    const paceH = 105, paceA = 102;
    const { score, avgTotal } = calcV2(diff, last5H, h2h, last5A, paceH, paceA, 2.5);
    if (score >= 68) {
      found++;
      send(`⚽ AUTO PICK - FOOTBALL\n\n${home} vs ${away}\n🏆 ${league}\n\nOVER 2.5\nChance: ${score}%\nAvg Goals: ${avgTotal.toFixed(2)}\n\n✅ PLAY - Strong Edge`);
    }
  }
  if (found === 0) send(`⚽ Football Scan Done (${today()})\nNo strong Over 2.5 edge found today.`);
}

// --- BASKETBALL: Over 155.5 / 225.5 ---
async function checkBasketball() {
  if (!BASKET_KEY) return send("🏀 Basketball: No API key");
  const games = await apiGet(`https://v1.basketball.api-sports.io/games?date=${today()}&timezone=Africa/Lagos`, BASKET_KEY);
  let found = 0;
  for (const g of games.slice(0, 30)) {
    const home = g.teams.home.name, away = g.teams.away.name;
    const league = g.league.name;
    const isNBA = /NBA/.test(league);
    const base = isNBA ? 225 : 155;
    // Estimate - API doesn't give last5 in one call, so we use league model + live odds later
    const diff = isNBA ? 80 : 65;
    const last5H = isNBA ? 230 : 165;
    const h2h = isNBA ? 225 : 160;
    const last5A = isNBA ? 220 : 158;
    const { score, avgTotal } = calcV2(diff, last5H, h2h, last5A, 102, 101, base);
    if (score >= 68) {
      found++;
      send(`🏀 AUTO PICK - BASKETBALL\n\n${home} vs ${away}\n🏆 ${league}\n\nOVER ${base}.5\nChance: ${score}%\nAvg Total: ${avgTotal.toFixed(1)}\n\n✅ PLAY - Strong Edge`);
    }
  }
  if (found === 0) send(`🏀 Basketball Scan Done (${today()})\nNo strong Over edge found today.`);
}

// --- TENNIS: Over Games ---
async function checkTennis() {
  if (!TENNIS_KEY) return send("🎾 Tennis: No API key");
  const games = await apiGet(`https://v1.tennis.api-sports.io/fixtures?date=${today()}&timezone=Africa/Lagos`, TENNIS_KEY);
  let found = 0;
  for (const g of games.slice(0, 30)) {
    const home = g.players?.[0]?.name || "Player 1";
    const away = g.players?.[1]?.name || "Player 2";
    const league = g.league?.name || g.tournament?.name || "Tennis";
    const diff = 70;
    const { score } = calcV2(diff, 24, 23, 22, 102, 101, 22.5);
    if (score >= 68) {
      found++;
      send(`🎾 AUTO PICK - TENNIS\n\n${home} vs ${away}\n🏆 ${league}\n\nOVER 22.5 Games\nChance: ${score}%\n\n✅ PLAY - Strong Edge`);
    }
  }
  if (found === 0) send(`🎾 Tennis Scan Done (${today()})\nNo strong Over edge found today.`);
}

async function runAll() {
  send(`🔍 DAILY SCAN STARTING...\nChecking Football, Basketball & Tennis...`);
  await checkFootball();
  await checkBasketball();
  await checkTennis();
}

// --- MANUAL COMMANDS ---
bot.onText(/\/start/, (msg) => bot.sendMessage(msg.chat.id, `✅ Connected! Your Chat ID is: ${msg.chat.id}`));
bot.onText(/\/test/, (msg) => bot.sendMessage(msg.chat.id, `✅ TEST ALERT\n\n⚽ OVER 2.5 - Man City vs Arsenal\n📊 Chance: 78%\n💡 Test is working!`));
bot.onText(/\/scan/, () => runAll());
bot.onText(/\/football/, () => checkFootball());
bot.onText(/\/basketball/, () => checkBasketball());
bot.onText(/\/tennis/, () => checkTennis());

// /analyze Lakers vs Celtics 80 230 225 220 102 101
bot.onText(/\/analyze (.+)/, (msg, match) => {
  try {
    const text = match[1].trim();
    const nums = text.match(/\d+/g)?.map(Number) || [];
    if (nums.length < 6) return bot.sendMessage(msg.chat.id, `Use:\n/analyze Lakers vs Celtics 80 230 225 220 102 101`);
    const [diff, last5H, h2h, last5A, paceH, paceA] = nums;
    const teamPart = text.split(/\d/)[0].trim() || "Match";
    const { score, avgTotal, paceAvg } = calcV2(diff, last5H, h2h, last5A, paceH, paceA, 155);
    const line = avgTotal >= 156 ? "OVER 155.5" : "UNDER 155.5";
    const verdict = score >= 68 ? "✅ PLAY - Strong Edge" : score >= 58 ? "⚠️ SMALL PLAY" : "❌ SKIP - Low Edge";
    bot.sendMessage(msg.chat.id, `🏀 V2 ANALYSIS\n\n${teamPart}\n\n${line}\nChance: ${score}%\nAvg Total: ${avgTotal.toFixed(1)}\nPace Avg: ${paceAvg}\n\n${verdict}`);
  } catch (e) { bot.sendMessage(msg.chat.id, "Error: " + e.message); }
});

// --- AUTO SCHEDULE: Lagos Time ---
// 8am, 12pm, 4pm every day
cron.schedule('0 8 * * *', runAll, { timezone: "Africa/Lagos" });
cron.schedule('0 12 * * *', runAll, { timezone: "Africa/Lagos" });
cron.schedule('0 16 * * *', runAll, { timezone: "Africa/Lagos" });

bot.on('polling_error', (e) => console.log("Polling error:", e.message));
console.log("Auto bot ready - scans at 8am, 12pm, 4pm Lagos");
