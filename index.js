const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const cron = require('node-cron');
const PORT = process.env.PORT || 10000;
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FOOT_KEY = process.env.API_FOOTBALL_KEY;
const BASKET_KEY = process.env.API_BASKETBALL_KEY;
const TENNIS_KEY = process.env.API_TENNIS_KEY;
const bot = new TelegramBot(TOKEN, { polling: true });
http.createServer((req, res) => res.end('ok')).listen(PORT);
function send(m, c) {
  var t = c || CHAT_ID;
  if (!t) return Promise.resolve();
  return bot.sendMessage(t, m).catch(e => console.log("SEND ERR " + e.message));
}
function calc(diff, a, h, b, p1, p2, base) {
  var avg = (a + b + h) / 3;
  var pace = (p1 + p2) / 2;
  var s = 50 + (diff - 50) * 0.6 + (avg - base) * 0.4 + (pace - 100) * 0.2;
  s = Math.min(92, Math.max(25, Math.round(s)));
  return { s: s, avg: avg, pace: pace };
}
async function get(url, key) {
  try {
    var r = await fetch(url, { headers: { 'x-apisports-key': key } });
    var j = await r.json();
    return j.response || [];
  } catch (e) { console.log("API ERR " + e.message); return []; }
}
function today() { return new Date().toISOString().split('T')[0]; }async function foot(c) {
  var g = await get("https://v3.football.api-sports.io/fixtures?date=" + today() + "&status=NS", FOOT_KEY);
  var f = 0;
  for (var i = 0; i < Math.min(g.length, 30); i++) {
    var x = g[i];
    var top = /Premier League|La Liga|Serie A|Bundesliga|Champions/.test(x.league.name);
    var r = calc(top ? 75 : 55, top ? 3.1 : 2.4, top ? 2.9 : 2.3, top ? 2.8 : 2.2, 105, 102, 2.5);
    if (r.s >= 68) { f++; await send("FOOTBALL PICK\n" + x.teams.home.name + " vs " + x.teams.away.name + "\n" + x.league.name + "\nOVER 2.5 - " + r.s + "%\nPLAY", c); }
  }
  if (f === 0) await send("Football: checked " + g.length + " games, no strong pick", c);
}
async function basket(c) {
  var g = await get("https://v1.basketball.api-sports.io/games?date=" + today() + "&timezone=Africa/Lagos", BASKET_KEY);
  var f = 0;
  for (var i = 0; i < Math.min(g.length, 30); i++) {
    var x = g[i];
    var nba = /NBA/.test(x.league.name);
    var base = nba ? 225 : 155;
    var r = calc(nba ? 80 : 65, nba ? 230 : 165, nba ? 225 : 160, nba ? 220 : 158, 102, 101, base);
    if (r.s >= 68) { f++; await send("BASKETBALL PICK\n" + x.teams.home.name + " vs " + x.teams.away.name + "\n" + x.league.name + "\nOVER " + base + ".5 - " + r.s + "%\nPLAY", c); }
  }
  if (f === 0) await send("Basketball: checked " + g.length + " games, no strong pick", c);
}
async function tennis(c) {
  var g = await get("https://v1.tennis.api-sports.io/fixtures?date=" + today() + "&timezone=Africa/Lagos", TENNIS_KEY);
  var f = 0;
  for (var i = 0; i < Math.min(g.length, 30); i++) {
    var x = g[i];
    var h = "Player 1", a = "Player 2", l = "Tennis";
    if (x.players && x.players[0]) h = x.players[0].name;
    if (x.players && x.players[1]) a = x.players[1].name;
    if (x.league) l = x.league.name;
    var r = calc(70, 24, 23, 22, 102, 101, 22.5);
    if (r.s >= 68) { f++; await send("TENNIS PICK\n" + h + " vs " + a + "\n" + l + "\nOVER 22.5 - " + r.s + "%\nPLAY", c); }
  }
  if (f === 0) await send("Tennis: checked " + g.length + " games, no strong pick", c);
}
async function runAll(c) {
  await send("SCAN STARTING...", c);
  await foot(c); await basket(c); await tennis(c);
}bot.onText(/\/start/, (m) => bot.sendMessage(m.chat.id, "Connected! ID: " + m.chat.id));bot.onText(/\/analyze (.+)/, (m, match) => {
var nums = (match[1].match(/\d+/g) || []).map(Number);
if (nums.length < 6) return bot.sendMessage(m.chat.id, "Use: /analyze 80 230 225 220 102 101");
var r = calc(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5], 155);
var line = r.avg >= 156 ? "OVER 155.5" : "UNDER 155.5";
var v = r.s >= 68 ? "PLAY" : r.s >= 58 ? "SMALL PLAY" : "SKIP";
bot.sendMessage(m.chat.id, "ANALYSIS\n" + line + "\nChance: " + r.s + "%\nAvg: " + r.avg.toFixed(1) + "\n" + v);
});
bot.onText(/\/test/, (m) => bot.sendMessage(m.chat.id, "TEST OK - Man City vs Arsenal OVER 2.5 78%"));
bot.onText(/\/scan/, (m) => { bot.sendMessage(m.chat.id, "Scan started... 30 secs"); runAll(m.chat.id); }); bot.onText(/\/analyze (.+)/, (m, match) => {
var nums = (match[1].match(/\d+/g) || []).map(Number);
if (nums.length < 6) return bot.sendMessage(m.chat.id, "Use: /analyze 80 230 225 220 102 101");
var r = calc(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5], 155);
var line = r.avg >= 156 ? "OVER 155.5" : "UNDER 155.5";
var v = r.s >= 68 ? "PLAY" : r.s >= 58 ? "SMALL PLAY" : "SKIP";
bot.sendMessage(m.chat.id, "ANALYSIS\n" + line + "\nChance: " + r.s + "%\nAvg: " + r.avg.toFixed(1) + "\n" + v);
});
bot.onText(/\/football/, (m) => foot(m.chat.id));
bot.onText(/\/basketball/, (m) => basket(m.chat.id));
bot.onText(/\/tennis/, (m) => tennis(m.chat.id)); cron.schedule('0 8 * * *', () => runAll(), { timezone: "Africa/Lagos" });
cron.schedule('0 12 * * *', () => runAll(), { timezone: "Africa/Lagos" });
cron.schedule('0 16 * * *', () => runAll(), { timezone: "Africa/Lagos" });
bot.on('polling_error', (e) => console.log("Polling: " + e.message));
console.log("Auto bot ready");
