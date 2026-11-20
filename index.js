const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const cron = require('node-cron');
const PORT = process.env.PORT || 10000;

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FOOT_KEY = process.env.API_FOOTBALL_KEY;
const BASKET_KEY = process.env.API_BASKETBALL_KEY;
const TENNIS_KEY = process.env.API_TENNIS_KEY;

console.log("Bot starting Football:" + !!FOOT_KEY + " Basket:" + !!BASKET_KEY + " Tennis:" + !!TENNIS_KEY + " ChatID:" + CHAT_ID);

const bot = new TelegramBot(TOKEN, { polling: true });
http.createServer(function(req, res) { res.end('Bot is running'); }).listen(PORT, function() { console.log("Port open on " + PORT); });

function send(msg, chatId) {
  var target = chatId || CHAT_ID;
  if (!target) {
    console.log("SEND FAILED: No CHAT_ID");
    return Promise.resolve();
  }
  return bot.sendMessage(target, msg).catch(function(e) { console.log("SEND ERROR: " + e.message); });
}

function calcV2(diff, last5H, h2h, last5A, paceH, paceA, baseLine) {
  var avgTotal = (last5H + last5A + h2h) / 3;
  var paceAvg = (paceH + paceA) / 2;
  var score = 50;
  score += (diff - 50) * 0.6;
  score += (avgTotal - baseLine) * 0.4;
  score += (paceAvg - 100) * 0.2;
  score = Math.min(92, Math.max(25, Math.round(score)));
  return { score: score, avgTotal: avgTotal, paceAvg: paceAvg };
}

async function apiGet(url, key) {
  try {
    var r = await fetch(url, { headers: { 'x-apisports-key': key } });
    var j = await r.json();
    if (j.errors) console.log("API ERRORS: " + JSON.stringify(j.errors));
    return j.response || [];
  } catch (e) { console.log("API error: " + e.message); return []; }
}

function today() { return new Date().toISOString().split('T')[0]; }

async function checkFootball(chatId) {
  if (!FOOT_KEY) return send("Football: No API key", chatId);
  console.log("Checking Football...");
  var games = await apiGet("https://v3.football.api-sports.io/fixtures?date=" + today() + "&status=NS", FOOT_KEY);
  console.log("Football games found: " + games.length);
  var found = 0;
  for (var i = 0; i < Math.min(games.length, 30); i++) {
    var g = games[i];
    var home = g.teams.home.name;
    var away = g.teams.away.name;
    var league = g.league.name;
    var isTop = /Premier League|La Liga|Serie A|Bundesliga|Champions League|Eredivisie|Ligue 1/.test(league);
    var diff = isTop ? 75 : 55;
    var last5H = isTop ? 3.1 : 2.4;
    var h2h = isTop ? 2.9 : 2.3;
    var last5A = isTop ? 2.8 : 2.2;
    var res = calcV2(diff, last5H, h2h, last5A, 105, 102, 2.5);
    if (res.score >= 68) {
      found++;
      await send("AUTO PICK - FOOTBALL\n\n" + home + " vs " + away + "\n" + league + "\n\nOVER 2.5\nChance: " + res.score + "%\nAvg Goals: " + res.avgTotal.toFixed(2) + "\n\nPLAY - Strong Edge", chatId);
    }
  }
  if (found === 0) await send("Football Scan Done (" + today() + ")\nChecked " + games.length + " games. No strong Over 2.5 edge.", chatId);
}

async function checkBasketball(chatId) {
  if (!BASKET_KEY) return send("Basketball: No API key", chatId);
  console.log("Checking Basketball...");
  var games = await apiGet("https://v1.basketball.api-sports.io/games?date=" + today() + "&timezone=Africa/Lagos", BASKET_KEY);
  console.log("Basketball games found: " + games.length);
  var found = 0;
  for (var i = 0; i < Math.min(games.length, 30); i++) {
    var g = games[i];
    var home = g.teams.home.name;
    var away = g.teams.away.name;
    var league = g.league.name;
    var isNBA = /NBA/.test(league);
    var base = isNBA ? 225 : 155;
    var diff = isNBA ? 80 : 65;
    var last5H = isNBA ? 230 : 165;
    var h2h = isNBA ? 225 : 160;
    var last5A = isNBA ? 220 : 158;
    var res = calcV2(diff, last5H, h2h, last5A, 102, 101, base);
    if (res.score >= 68) {
      found++;
      await send("AUTO PICK - BASKETBALL\n\n" + home + " vs " + away + "\n" + league + "\n\nOVER " + base + ".5\nChance: " + res.score + "%\nAvg Total: " + res.avgTotal.toFixed(1) + "\n\nPLAY - Strong Edge", chatId);
    }
  }
  if (found === 0) await send("Basketball Scan Done (" + today() + ")\nChecked " + games.length + " games. No strong Over edge.", chatId);
}

async function checkTennis(chatId) {
  if (!TENNIS_KEY) return send("Tennis: No API key", chatId);
  console.log("Checking Tennis...");
  var
