// ============================================================
//  𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔 — Unified Entry Point
//  Author: BL@CKN1TE — The Incisive Tri-Hat Hacker
//  Version: V16 ULTRA
//  Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f
//  Entry: server.js (boots via index.js on panels)
// ============================================================

require('dotenv').config();

// ============================================================
// TEMP FIX — redirect temp storage on hosted panels
// ============================================================
const fs = require('fs');
const path = require('path');
const os = require('os');

const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

setInterval(() => {
    fs.readdir(customTemp, (err, files) => {
        if (err) return;
        for (const file of files) {
            const filePath = path.join(customTemp, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
                    fs.unlink(filePath, () => {});
                }
            });
        }
    });
    console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

// ============================================================
// CORE IMPORTS
// ============================================================
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const P = require('pino');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    downloadContentFromMessage,
    jidNormalizedUser,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');

const { OpenAI } = require('openai');

// ============================================================
// SAFE SETTINGS
// ============================================================
let settings;
try {
    settings = require('./settings');
} catch (e) {
    console.log('⚠️  settings.js not found — using BL@CKN1TE defaults');
    settings = {
        botName: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔',
        ownerNumber: '263714799483,263780540231',
        ownerName: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘 — The Incisive Tri-Hat Hacker',
        prefix: '.',
        version: 'V16 ULTRA'
    };
}

// ============================================================
// BRAND CONFIG
// ============================================================
global.packname = settings.packname || '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦';
global.author = settings.author || '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘 • Tri-Hat Hacker';
global.botName = settings.botName || '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔';
global.channelLink = settings.channelLink || 'https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f';

const LOGO_URL = 'https://i.ibb.co/hRbc4JJ8/logo.jpg';
const LOCAL_LOGO = path.join(__dirname, 'logo.jpg');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦',
            serverMessageId: -1
        }
    }
};

// ============================================================
// CONFIG
// ============================================================
const PREFIXES = ['.', '/', '>'];
const OWNER_SECRET = process.env.OWNER_SECRET || 'blacknite_owner_2025';
const CMD_DIR = path.join(__dirname, 'commands');

// ============================================================
// ♾️ LIFETIME CONNECTION FLAGS
// ============================================================
const INFINITE_MODE = true;
const SILENT_RECONNECT = true;
const PROMax_SPEED = true;
const LIFETIME_CONNECTION = true;

const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const AUTO_RELOAD_INTERVAL_MS = 3 * 60 * 1000;
const SESSION_WATCHDOG_MS = 45 * 1000;
const KEEPALIVE_PRESENCE_MS = 30 * 1000;
const ACTIVE_CHECK_INTERVAL_MS = 45 * 60 * 1000;
const CONNECT_TIMEOUT_MS = 20000;
const DEFAULT_QUERY_TIMEOUT_MS = 20000;
const KEEP_ALIVE_INTERVAL_MS = 10000;
const RETRY_REQUEST_DELAY_MS = 300;
const MAX_MSG_RETRY_COUNT = 3;
const RECONNECT_SILENCE_WINDOW_MS = 120000;

// ============================================================
// 🖼️ LOGO BUFFER CACHE
// ============================================================
let LOGO_BUFFER = null;
let LOGO_LOADING = false;

async function preloadLogo() {
    if (LOGO_BUFFER || LOGO_LOADING) return LOGO_BUFFER;
    LOGO_LOADING = true;

    try {
        if (fs.existsSync(LOCAL_LOGO)) {
            LOGO_BUFFER = fs.readFileSync(LOCAL_LOGO);
            console.log(`✅ [LOGO] Loaded from local file (${LOGO_BUFFER.length} bytes)`);
            LOGO_LOADING = false;
            return LOGO_BUFFER;
        }
    } catch (e) { console.error('Local logo read failed:', e.message); }

    try {
        const res = await axios.get(LOGO_URL, { responseType: 'arraybuffer', timeout: 15000 });
        LOGO_BUFFER = Buffer.from(res.data);
        console.log(`✅ [LOGO] Fetched from URL (${LOGO_BUFFER.length} bytes)`);
    } catch (e) {
        console.error(`⚠️ [LOGO] Preload failed: ${e.message}`);
    }

    LOGO_LOADING = false;
    return LOGO_BUFFER;
}

async function getLogoBuffer() {
    if (LOGO_BUFFER && LOGO_BUFFER.length > 0) return LOGO_BUFFER;
    return await preloadLogo();
}

async function ensureLogo(retries = 5) {
    for (let i = 0; i < retries; i++) {
        const buf = await getLogoBuffer();
        if (buf && buf.length > 0) return buf;
        await delay(2000);
    }
    return null;
}

// ============================================================
// 🅱️ BOLD UNICODE
// ============================================================
const toBold = (text) => {
    const boldChars = {
        'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇',
        'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭',
        '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵'
    };
    return String(text).split('').map(c => boldChars[c] || c).join('');
};

// ============================================================
// SAFE COMMAND LOADER
// ============================================================
function safeRequire(filePath, name) {
    try {
        if (fs.existsSync(filePath) || fs.existsSync(filePath + '.js')) {
            console.log(`✅ [CMD] Loaded: ${name}`);
            return require(filePath);
        }
        console.log(`⚠️  [CMD] Skipped (missing): ${name}`);
        return async function stub(sock, from, msg) {
            try { await sock.sendMessage(from, { text: `⚠️ *Command ${PREFIXES[0]}${name} unavailable.*` }, { quoted: msg }); } catch (e) {}
        };
    } catch (e) {
        console.error(`❌ [CMD] Failed: ${name}: ${e.message}`);
        return async function stub(sock, from, msg) {
            try { await sock.sendMessage(from, { text: `⚠️ *Command ${PREFIXES[0]}${name} unavailable.*` }, { quoted: msg }); } catch (e) {}
        };
    }
}

const commands = {
    // Core utility
    ping: safeRequire(path.join(CMD_DIR, 'ping'), 'ping'),
    owner: safeRequire(path.join(CMD_DIR, 'owner'), 'owner'),
    alive: safeRequire(path.join(CMD_DIR, 'alive'), 'alive'),
    settings: safeRequire(path.join(CMD_DIR, 'settings'), 'settings'),

    // Media / Downloaders
    song: safeRequire(path.join(CMD_DIR, 'song'), 'song'),
    play: safeRequire(path.join(CMD_DIR, 'play'), 'play'),
    video: safeRequire(path.join(CMD_DIR, 'video'), 'video'),
    tiktok: safeRequire(path.join(CMD_DIR, 'tiktok'), 'tiktok'),
    insta: safeRequire(path.join(CMD_DIR, 'insta'), 'insta'),
    instagram: safeRequire(path.join(CMD_DIR, 'instagram'), 'instagram'),
    igs: safeRequire(path.join(CMD_DIR, 'igs'), 'igs'),
    facebook: safeRequire(path.join(CMD_DIR, 'facebook'), 'facebook'),
    spotify: safeRequire(path.join(CMD_DIR, 'spotify'), 'spotify'),
    gdrive: safeRequire(path.join(CMD_DIR, 'gdrive'), 'gdrive'),
    mf: safeRequire(path.join(CMD_DIR, 'mf'), 'mf'),
    apk: safeRequire(path.join(CMD_DIR, 'apk'), 'apk'),
    url: safeRequire(path.join(CMD_DIR, 'url'), 'url'),
    ss: safeRequire(path.join(CMD_DIR, 'ss'), 'ss'),
    lyrics: safeRequire(path.join(CMD_DIR, 'lyrics'), 'lyrics'),

    // Media Tools
    dp: safeRequire(path.join(CMD_DIR, 'dp'), 'dp'),
    vv: safeRequire(path.join(CMD_DIR, 'vv'), 'vv'),
    viewonce: safeRequire(path.join(CMD_DIR, 'viewonce'), 'viewonce'),
    sticker: safeRequire(path.join(CMD_DIR, 'sticker'), 'sticker'),
    stickercrop: safeRequire(path.join(CMD_DIR, 'stickercrop'), 'stickercrop'),
    stickertelegram: safeRequire(path.join(CMD_DIR, 'stickertelegram'), 'stickertelegram'),
    take: safeRequire(path.join(CMD_DIR, 'take'), 'take'),
    attp: safeRequire(path.join(CMD_DIR, 'attp'), 'attp'),
    simage: safeRequire(path.join(CMD_DIR, 'simage'), 'simage'),
    imgblur: safeRequire(path.join(CMD_DIR, 'img-blur'), 'img-blur'),
    removebg: safeRequire(path.join(CMD_DIR, 'removebg'), 'removebg'),
    remini: safeRequire(path.join(CMD_DIR, 'remini'), 'remini'),
    setpp: safeRequire(path.join(CMD_DIR, 'setpp'), 'setpp'),

    // AI & Generation
    ai: safeRequire(path.join(CMD_DIR, 'ai'), 'ai'),
    image: safeRequire(path.join(CMD_DIR, 'image'), 'image'),
    imagine: safeRequire(path.join(CMD_DIR, 'imagine'), 'imagine'),
    tts: safeRequire(path.join(CMD_DIR, 'tts'), 'tts'),
    translate: safeRequire(path.join(CMD_DIR, 'translate'), 'translate'),
    character: safeRequire(path.join(CMD_DIR, 'character'), 'character'),
    chatbot: safeRequire(path.join(CMD_DIR, 'chatbot'), 'chatbot'),
    textmaker: safeRequire(path.join(CMD_DIR, 'textmaker'), 'textmaker'),
    emojimix: safeRequire(path.join(CMD_DIR, 'emojimix'), 'emojimix'),
    sora: safeRequire(path.join(CMD_DIR, 'sora'), 'sora'),

    // Fun & Games
    joke: safeRequire(path.join(CMD_DIR, 'joke'), 'joke'),
    meme: safeRequire(path.join(CMD_DIR, 'meme'), 'meme'),
    quote: safeRequire(path.join(CMD_DIR, 'quote'), 'quote'),
    fact: safeRequire(path.join(CMD_DIR, 'fact'), 'fact'),
    dare: safeRequire(path.join(CMD_DIR, 'dare'), 'dare'),
    truth: safeRequire(path.join(CMD_DIR, 'truth'), 'truth'),
    compliment: safeRequire(path.join(CMD_DIR, 'compliment'), 'compliment'),
    insult: safeRequire(path.join(CMD_DIR, 'insult'), 'insult'),
    eightball: safeRequire(path.join(CMD_DIR, 'eightball'), 'eightball'),
    flirt: safeRequire(path.join(CMD_DIR, 'flirt'), 'flirt'),
    ship: safeRequire(path.join(CMD_DIR, 'ship'), 'ship'),
    wasted: safeRequire(path.join(CMD_DIR, 'wasted'), 'wasted'),
    simp: safeRequire(path.join(CMD_DIR, 'simp'), 'simp'),
    stupid: safeRequire(path.join(CMD_DIR, 'stupid'), 'stupid'),
    goodnight: safeRequire(path.join(CMD_DIR, 'goodnight'), 'goodnight'),
    shayari: safeRequire(path.join(CMD_DIR, 'shayari'), 'shayari'),
    roseday: safeRequire(path.join(CMD_DIR, 'roseday'), 'roseday'),
    tictactoe: safeRequire(path.join(CMD_DIR, 'tictactoe'), 'tictactoe'),
    hangman: safeRequire(path.join(CMD_DIR, 'hangman'), 'hangman'),
    trivia: safeRequire(path.join(CMD_DIR, 'trivia'), 'trivia'),
    anime: safeRequire(path.join(CMD_DIR, 'anime'), 'anime'),
    pies: safeRequire(path.join(CMD_DIR, 'pies'), 'pies'),
    misc: safeRequire(path.join(CMD_DIR, 'misc'), 'misc'),

    // Utilities
    weather: safeRequire(path.join(CMD_DIR, 'weather'), 'weather'),
    news: safeRequire(path.join(CMD_DIR, 'news'), 'news'),
    qr: safeRequire(path.join(CMD_DIR, 'qr'), 'qr'),
    shorten: safeRequire(path.join(CMD_DIR, 'shorten'), 'shorten'),
    calc: safeRequire(path.join(CMD_DIR, 'calc'), 'calc'),
    github: safeRequire(path.join(CMD_DIR, 'github'), 'github'),
    update: safeRequire(path.join(CMD_DIR, 'update'), 'update'),

    // Group Admin
    tagall: safeRequire(path.join(CMD_DIR, 'tagall'), 'tagall'),
    tagnotadmin: safeRequire(path.join(CMD_DIR, 'tagnotadmin'), 'tagnotadmin'),
    hidetag: safeRequire(path.join(CMD_DIR, 'hidetag'), 'hidetag'),
    tag: safeRequire(path.join(CMD_DIR, 'tag'), 'tag'),
    kick: safeRequire(path.join(CMD_DIR, 'kick'), 'kick'),
    mute: safeRequire(path.join(CMD_DIR, 'mute'), 'mute'),
    unmute: safeRequire(path.join(CMD_DIR, 'unmute'), 'unmute'),
    ban: safeRequire(path.join(CMD_DIR, 'ban'), 'ban'),
    unban: safeRequire(path.join(CMD_DIR, 'unban'), 'unban'),
    promote: safeRequire(path.join(CMD_DIR, 'promote'), 'promote'),
    demote: safeRequire(path.join(CMD_DIR, 'demote'), 'demote'),
    warn: safeRequire(path.join(CMD_DIR, 'warn'), 'warn'),
    warnings: safeRequire(path.join(CMD_DIR, 'warnings'), 'warnings'),
    groupinfo: safeRequire(path.join(CMD_DIR, 'groupinfo'), 'groupinfo'),
    resetlink: safeRequire(path.join(CMD_DIR, 'resetlink'), 'resetlink'),
    staff: safeRequire(path.join(CMD_DIR, 'staff'), 'staff'),
    welcome: safeRequire(path.join(CMD_DIR, 'welcome'), 'welcome'),
    goodbye: safeRequire(path.join(CMD_DIR, 'goodbye'), 'goodbye'),
    setgname: safeRequire(path.join(CMD_DIR, 'groupmanage'), 'groupmanage'),
    setgdesc: safeRequire(path.join(CMD_DIR, 'groupmanage'), 'groupmanage'),
    setgpp: safeRequire(path.join(CMD_DIR, 'groupmanage'), 'groupmanage'),
    clear: safeRequire(path.join(CMD_DIR, 'clear'), 'clear'),
    delete: safeRequire(path.join(CMD_DIR, 'delete'), 'delete'),

    // Anti-*
    antilink: safeRequire(path.join(CMD_DIR, 'antilink'), 'antilink'),
    antitag: safeRequire(path.join(CMD_DIR, 'antitag'), 'antitag'),
    anticall: safeRequire(path.join(CMD_DIR, 'anticall'), 'anticall'),
    antidelete: safeRequire(path.join(CMD_DIR, 'antidelete'), 'antidelete'),
    antistatus: safeRequire(path.join(CMD_DIR, 'antistatus'), 'antistatus'),
    antibadword: safeRequire(path.join(CMD_DIR, 'antibadword'), 'antibadword'),
    pmblocker: safeRequire(path.join(CMD_DIR, 'pmblocker'), 'pmblocker'),
    mention: safeRequire(path.join(CMD_DIR, 'mention'), 'mention'),

    // Automation
    autoread: safeRequire(path.join(CMD_DIR, 'autoread'), 'autoread'),
    read: safeRequire(path.join(CMD_DIR, 'read'), 'read'),
    autotyping: safeRequire(path.join(CMD_DIR, 'autotyping'), 'autotyping'),
    autoreacts: safeRequire(path.join(CMD_DIR, 'autoreacts'), 'autoreacts'),
    autostatus: safeRequire(path.join(CMD_DIR, 'status'), 'status'),
    status: safeRequire(path.join(CMD_DIR, 'status'), 'status'),
    online: safeRequire(path.join(CMD_DIR, 'online'), 'online'),

    // Mode
    private: safeRequire(path.join(CMD_DIR, 'private'), 'private'),
    public: safeRequire(path.join(CMD_DIR, 'public'), 'public'),

    // Misc / Owner
    hack: safeRequire(path.join(CMD_DIR, 'hack'), 'hack'),
    sudo: safeRequire(path.join(CMD_DIR, 'sudo'), 'sudo'),
    clearsession: safeRequire(path.join(CMD_DIR, 'clearsession'), 'clearsession'),
    cleartmp: safeRequire(path.join(CMD_DIR, 'cleartmp'), 'cleartmp'),

    // Brand Hub
    incisiveTrihatTools: safeRequire(path.join(CMD_DIR, 'incisive-trihat-tools'), 'incisive-trihat-tools'),
    blackn1teWebsites: safeRequire(path.join(CMD_DIR, 'blackn1te-websites'), 'blackn1te-websites')
};

// ============================================================
// HOOK LOADERS
// ============================================================
let handleAutoread = async () => {};
let autoreadCommand = null;
try {
    if (fs.existsSync(path.join(CMD_DIR, 'autoread.js'))) {
        const ar = require(path.join(CMD_DIR, 'autoread'));
        if (ar.handleAutoread) handleAutoread = ar.handleAutoread;
        if (ar.autoreadCommand) autoreadCommand = ar.autoreadCommand;
    }
} catch (e) { console.error('autoread load error:', e.message); }

let handleStatusUpdate = async () => {};
try {
    if (fs.existsSync(path.join(CMD_DIR, 'autostatus.js'))) {
        const su = require(path.join(CMD_DIR, 'autostatus'));
        if (su.handleStatusUpdate) handleStatusUpdate = su.handleStatusUpdate;
    }
} catch (e) {}

let storeMessage = async () => {};
let handleMessageRevocation = async () => {};
try {
    if (fs.existsSync(path.join(CMD_DIR, 'antidelete.js'))) {
        const ad = require(path.join(CMD_DIR, 'antidelete'));
        if (ad.storeMessage) storeMessage = ad.storeMessage;
        if (ad.handleMessageRevocation) handleMessageRevocation = ad.handleMessageRevocation;
    }
} catch (e) {}

// ============================================================
// APP + SOCKET
// ============================================================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling'],
    pingInterval: 15000,
    pingTimeout: 10000,
    connectTimeout: 5000,
    maxHttpBufferSize: 1e8,
    perMessageDeflate: false
});

let openai = null;
if (process.env.OPENAI_API_KEY) {
    try {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1"
        });
    } catch (e) {}
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ============================================================
// ROUTES
// ============================================================
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/welcome', (req, res) => { res.redirect('/login.html'); });
app.get('/welcome.html', (req, res) => { res.redirect('/login.html'); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/index.html', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.get('/logo.jpg', (req, res) => {
    if (LOGO_BUFFER) {
        res.set('Content-Type', 'image/jpeg');
        res.send(LOGO_BUFFER);
    } else {
        res.redirect(LOGO_URL);
    }
});

// ============================================================
// LIVE MONITORING HELPERS
// ============================================================
let cachedPing = -1;
let cachedPingTime = 0;

async function measurePing() {
    if (Date.now() - cachedPingTime < 15000 && cachedPing > 0) return cachedPing;
    const start = Date.now();
    try {
        await axios.get('https://www.google.com', { timeout: 2500 });
        cachedPing = Date.now() - start;
        cachedPingTime = Date.now();
        return cachedPing;
    } catch (e) {
        return cachedPing > 0 ? cachedPing : -1;
    }
}

function getSystemStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
    const cpuLoad = os.loadavg()[0].toFixed(2);
    const uptimeSec = Math.floor(process.uptime());
    return {
        memory: {
            total: (totalMem / 1024 / 1024).toFixed(0) + ' MB',
            used: (usedMem / 1024 / 1024).toFixed(0) + ' MB',
            percent: memPercent + '%'
        },
        cpu: cpuLoad,
        uptime: uptimeSec,
        uptimeHuman: formatUptime(uptimeSec),
        platform: os.platform(),
        node: process.version
    };
}

function getSessionStats() {
    const all = Object.values(sessions);
    return {
        total: all.length,
        running: all.filter(s => s.isRunning).length,
        online: all.filter(s => s.isConnected).length,
        paused: all.filter(s => !s.isRunning && s.isConnected).length
    };
}

function formatUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ============================================================
// HEALTH + BADGE
// ============================================================
app.get('/health', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sys = getSystemStats();
    const sess = getSessionStats();
    res.json({
        status: 'ok', bot: global.botName, version: 'V16 ULTRA',
        sessions: sess.total, active: sess.running, online: sess.online, paused: sess.paused,
        uptime: sys.uptime, uptimeHuman: sys.uptimeHuman,
        memory: sys.memory, cpu: sys.cpu, node: sys.node, platform: sys.platform,
        timestamp: Date.now(),
        mode: INFINITE_MODE ? 'INFINITE' : 'STANDARD',
        speed: PROMax_SPEED ? 'PROMAX' : 'STANDARD',
        connection: LIFETIME_CONNECTION ? 'LIFETIME' : 'STANDARD',
        logoCached: !!LOGO_BUFFER
    });
});

app.get('/api/badge', (req, res) => {
    const sess = getSessionStats();
    const uptimeSec = Math.floor(process.uptime());
    res.set('Cache-Control', 'public, max-age=30');
    res.json({
        status: sess.running > 0 ? 'online' : 'idle',
        schemaVersion: 1, label: 'bot',
        message: sess.running > 0 ? 'ONLINE' : 'IDLE',
        color: sess.running > 0 ? '00ff80' : 'ffbe3c',
        isError: false, activeBots: sess.running,
        onlineSessions: sess.online, sessions: sess.total,
        uptime: uptimeSec, uptimeHuman: formatUptime(uptimeSec),
        speed: PROMax_SPEED ? 'PROMAX' : 'STANDARD'
    });
});

app.get('/api/session-state/:userId', (req, res) => {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
    const persisted = sessionStates[userId] || {};
    const live = sessions[userId];
    const isConnected = live ? live.isConnected : false;
    const isRunning = live ? live.isRunning : (persisted.isRunning || false);
    res.json({
        success: true, userId,
        connected: isConnected, running: isRunning,
        paused: isConnected && !isRunning,
        botName: botData.userNames[userId] || global.botName,
        prefixes: PREFIXES
    });
});

app.get('/api/json/stats', async (req, res) => {
    const sys = getSystemStats();
    const sess = getSessionStats();
    const ping = await measurePing();
    res.json({ success: true, system: sys, sessions: sess, ping, bot: global.botName, version: 'V16 ULTRA', timestamp: new Date().toISOString() });
});

// ============================================================
// STORAGE
// ============================================================
const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
const BLACKLIST_FILE = './data/blacklist.json';
const SESSION_STATE_FILE = './data/session_states.json';
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

const defaultBotData = {
    antilinkGroups: {}, totalBots: 0, registeredBots: [],
    statusSettings: {}, antiDelete: {}, userNames: {},
    antiCall: {}, antiStatusGroups: {}, readSettings: {}
};

function safeReadJson(file, fallback) {
    try {
        if (fs.existsSync(file)) {
            const raw = fs.readFileSync(file, 'utf8');
            if (!raw.trim()) return JSON.parse(JSON.stringify(fallback));
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && parsed !== null) return { ...JSON.parse(JSON.stringify(fallback)), ...parsed };
            return JSON.parse(JSON.stringify(fallback));
        }
    } catch (e) {
        console.error(`⚠️ [JSON] Corrupt: ${file}`);
        try { fs.copyFileSync(file, file + '.corrupt.' + Date.now()); } catch (_) {}
    }
    return JSON.parse(JSON.stringify(fallback));
}

function safeWriteJson(file, data) {
    try {
        const dir = path.dirname(file);
        fs.ensureDirSync(dir);
        const tmp = file + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
        fs.renameSync(tmp, file);
    } catch (e) { console.error(`❌ [JSON] Write failed: ${file}: ${e.message}`); }
}

let botData = safeReadJson(DATA_FILE, defaultBotData);
function saveBotData() { safeWriteJson(DATA_FILE, botData); }

let blacklist = safeReadJson(BLACKLIST_FILE, { numbers: [], botNames: [] });
function saveBlacklist() { safeWriteJson(BLACKLIST_FILE, blacklist); }

let sessionStates = safeReadJson(SESSION_STATE_FILE, {});
function saveSessionStates() { safeWriteJson(SESSION_STATE_FILE, sessionStates); }

function isNumberBlacklisted(num) {
    if (!num) return false;
    const clean = String(num).replace(/\D/g, '');
    return blacklist.numbers.some(n => String(n).replace(/\D/g, '') === clean);
}
function isBotNameBlacklisted(name) {
    if (!name) return false;
    return blacklist.botNames.some(n => n.toLowerCase() === String(name).toLowerCase());
}

// ============================================================
// RUNTIME
// ============================================================
const sessions = {};
const userSockets = {};
const messageLogs = {};

// ============================================================
// 🎩 CYBERPUNK CONNECTION BANNER
// ============================================================
function buildCyberpunkBanner(session, botName) {
    const pingMs = cachedPing;
    const sys = getSystemStats();
    const sess = getSessionStats();
    const pingStr = pingMs < 0 ? '⛔ --' : (pingMs < 150 ? `🟢 ${pingMs} ms` : pingMs < 400 ? `🟡 ${pingMs} ms` : `🔴 ${pingMs} ms`);
    const botState = session.isRunning ? '🟢 ONLINE' : '🔴 OFFLINE';
    const linkState = session.isConnected ? '✅ LINKED' : '❌ UNLINKED';
    const liveStamp = new Date().toLocaleString();

    return (
`⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧
    ░▒▓█  ${toBold('BL@CKN1TE-NXS')}  █▓▒░
    ░▒▓█  ${toBold('V16 • CYBERPUNK • INFINITE')}  █▓▒░
⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧

⚡️🔥⚡️   ${toBold('SYSTEM ONLINE')}   ⚡️🔥⚡️

╔═══════════════════════════════════════╗
║  📡 ${toBold('LIVE CONSOLE SNAPSHOT')}
╚═══════════════════════════════════════╝

╰┈➤ 🛰️ ${toBold('LINK')}      : ✅ ${toBold('ESTABLISHED')}
╰┈➤ 🤖 ${toBold('BOT')}       : ${botName}
╰┈➤ 🧬 ${toBold('SESSION')}   : ${session.userId.slice(0, 18)}
╰┈➤ ⚙️ ${toBold('MODE')}      : ♾️ ${toBold('INFINITE')}
╰┈➤ ${session.isRunning ? '🟢' : '🔴'} ${toBold('STATE')}     : ${botState}
╰┈➤ 🔗 ${toBold('LINK')}      : ${linkState}
╰┈➤ 📶 ${toBold('PING')}      : ${pingStr}
╰┈➤ ⏱️ ${toBold('UPTIME')}    : ${sys.uptimeHuman}
╰┈➤ 🧠 ${toBold('MEMORY')}    : ${sys.memory.used} / ${sys.memory.total}
╰┈➤ ⚙️ ${toBold('CPU')}       : ${sys.cpu}
╰┈➤ 🔣 ${toBold('PREFIXES')}  : .  /  >
╰┈➤ ⏱️ ${toBold('STAMP')}     : ${liveStamp}

╔═══════════════════════════════════════╗
║   🚀✨💎  ${toBold('CONNECTION SUCCESSFUL')}
╚═══════════════════════════════════════╝

╰┈➤ 🎯 ${toBold("YOU'RE NOW LINKED TO")}
╰┈➤ ➜ ${toBold('BL@CKN1TE-NXS')} · ${toBold('V16 ULTRA')}
╰┈➤ ➜ ${toBold('SECURED & ENCRYPTED')}

┏━〔 ${toBold('🌐 SESSION POOL')} 〕━━━━━━━━━
┃  🟢 ${toBold('RUNNING')}  : ${sess.running}
┃  🟢 ${toBold('ONLINE')}   : ${sess.online}
┃  🟡 ${toBold('PAUSED')}   : ${sess.paused}
┃  📊 ${toBold('TOTAL')}    : ${sess.total}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡️🔥 ${toBold('READY TO DOMINATE')} 🔥⚡️
💎 ${toBold('TYPE')}  .menu   ${toBold('FOR COMMANDS')}
🔥 ${toBold('TYPE')}  .owner  ${toBold('FOR HACKER')}
🚀 ${toBold('TYPE')}  .ping   ${toBold('FOR LATENCY')}

⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧
║  🔗 ${toBold('CHANNEL')}
║  ➜ ${global.channelLink}
⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧

   🎩🔥⚡️ ${toBold('BL@CKN1TE-NXS')} ⚡️🔥🎩
       ▸ ${toBold('END OF TRANSMISSION')} ◂`
    );
}

// ============================================================
// 🎨 CYBERPUNK MENU
// ============================================================
function buildBeautifulMenu(session, botData, customName) {
    const p = PREFIXES[0] || '.';
    const modeIcon = session.isPublic ? '🌐' : '🔒';
    const modeText = session.isPublic ? 'PUBLIC' : 'PRIVATE';
    const ownerName = settings.ownerName || 'BL@CKN1TE';
    const version = 'V16 ULTRA';
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('en-GB');
    const sysStats = getSystemStats();
    const pingStr = cachedPing > 0 ? `${cachedPing} ms` : '--';
    const statusStr = session.isRunning ? '🟢 ONLINE' : '🔴 OFFLINE';

    // Command groups
    const userCore = [`${p}read`, `${p}ghost`, `${p}autoreacts`, `${p}ai`, `${p}vv`, `${p}dp`, `${p}ping`, `${p}owner`, `${p}translate`, `${p}online`];
    const mediaVault = [`${p}song`, `${p}play`, `${p}video`, `${p}tiktok`, `${p}insta`, `${p}facebook`, `${p}spotify`, `${p}lyrics`, `${p}gdrive`, `${p}mf`, `${p}apk`, `${p}url`, `${p}ss`, `${p}igs`, `${p}igsc`];
    const aiSynthesis = [`${p}ai`, `${p}image`, `${p}imagine`, `${p}tts`, `${p}character`, `${p}chatbot`, `${p}textmaker`, `${p}emojimix`, `${p}sora`, `${p}translate`];
    const utilities = [`${p}weather`, `${p}news`, `${p}qr`, `${p}shorten`, `${p}calc`, `${p}sticker`, `${p}stickercrop`, `${p}take`, `${p}attp`, `${p}simage`, `${p}blur`, `${p}removebg`, `${p}remini`, `${p}vv`];
    const funZone = [`${p}joke`, `${p}meme`, `${p}quote`, `${p}fact`, `${p}dare`, `${p}truth`, `${p}compliment`, `${p}insult`, `${p}8ball`, `${p}flirt`, `${p}ship`, `${p}wasted`, `${p}simp`, `${p}stupid`, `${p}goodnight`, `${p}shayari`, `${p}roseday`, `${p}ttt`, `${p}hangman`, `${p}trivia`, `${p}anime`, `${p}pies`, `${p}heart`, `${p}horny`, `${p}circle`, `${p}lgbt`, `${p}lolice`, `${p}simpcard`, `${p}tonikawa`, `${p}tweet`, `${p}ytcomment`, `${p}comrade`, `${p}gay`, `${p}glass`, `${p}jail`, `${p}passed`, `${p}triggered`];
    const adminProtocols = [`${p}private`, `${p}public`, `${p}autoread`, `${p}autotyping`, `${p}autostatus`, `${p}status`, `${p}anticall`, `${p}antidelete`, `${p}antilink`, `${p}antitag`, `${p}antibadword`, `${p}antistatus`, `${p}pmblocker`, `${p}mention`, `${p}settings`, `${p}mode`];
    const groupWarfare = [`${p}tagall`, `${p}tagnotadmin`, `${p}hidetag`, `${p}tag`, `${p}kick`, `${p}mute`, `${p}unmute`, `${p}ban`, `${p}unban`, `${p}promote`, `${p}demote`, `${p}warn`, `${p}warnings`, `${p}groupinfo`, `${p}resetlink`, `${p}staff`, `${p}welcome`, `${p}goodbye`, `${p}setgname`, `${p}setgdesc`, `${p}setgpp`, `${p}clear`, `${p}delete`];
    const ownerZone = [`${p}sudo`, `${p}update`, `${p}clearsession`, `${p}cleartmp`, `${p}setpp`, `${p}settings`, `${p}hack`, `${p}github`, `${p}menu`];
    const hub = [`${p}websites`, `${p}trihat`];

    const totalCmds = userCore.length + mediaVault.length + aiSynthesis.length + utilities.length +
                     funZone.length + adminProtocols.length + groupWarfare.length + ownerZone.length + hub.length;

    const header = `⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧
    ░▒▓█  ${toBold('BL@CKN1TE-NXS')}  █▓▒░
    ░▒▓█  ${toBold('V16 ULTRA • CYBERPUNK CORE')}  █▓▒░
⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧

⚡️🔥  ${statusStr}  🔥⚡️`;

    const stats = `╔═══════════════════════════════════════╗
║  📡 ${toBold('CYBERPUNK CORE STATUS')}
╚═══════════════════════════════════════╝
╰┈➤ 👑 ${toBold('OPERATOR')} : ${ownerName}
╰┈➤ 🧬 ${toBold('SESSION')}  : ${session.userId.slice(0, 18)}
╰┈➤ ⚙️ ${toBold('VERSION')}  : ${version} • PROMAX
╰┈➤ 📅 ${toBold('DATE')}     : ${dayName}, ${dateStr}
╰┈➤ ⏱️ ${toBold('UPTIME')}   : ${sysStats.uptimeHuman}
╰┈➤ ${modeIcon} ${toBold('MODE')}     : ${modeText}
╰┈➤ 📶 ${toBold('PING')}     : ${pingStr}
╰┈➤ 📊 ${toBold('COMMANDS')} : ${totalCmds}+ loaded
╰┈➤ 🔣 ${toBold('PREFIXES')} : ${PREFIXES.join('  ')}
⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧`;

    const menu = `╔═══════════════════════════════════════╗
║  ░▒▓ ${toBold('COMMAND MATRIX')} ▓▒░
╚═══════════════════════════════════════╝

┏━〔 ${toBold('⚙️ USER CORE')} 〕━━━━━━━━━━━━
${userCore.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('🎬 MEDIA VAULT')} 〕━━━━━━━━━━
${mediaVault.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('🧠 AI & SYNTHESIS')} 〕━━━━━━━
${aiSynthesis.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('🛠️ UTILITIES')} 〕━━━━━━━━━━━
${utilities.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('🎮 FUN ZONE')} 〕━━━━━━━━━━━━
${funZone.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('🛡️ ADMIN PROTOCOLS')} 〕━━━━━
${adminProtocols.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('⚔️ GROUP WARFARE')} 〕━━━━━━
${groupWarfare.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('👑 OWNER ZONE')} 〕━━━━━━━━━
${ownerZone.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('🌐 BL@CKN1TE HUB')} 〕━━━━━━━
${hub.map(c => `┃  ▸ ${toBold(c)}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔═══════════════════════════════════════╗
║  🚀 ${toBold('QUICK START')}
╚═══════════════════════════════════════╝
╰┈➤ 🔣 ${toBold('PREFIXES')}  : .  /  >
╰┈➤ ✨ ${toBold('EXAMPLE')}   : .menu
╰┈➤ 👑 ${toBold('OWNER')}     : .owner
╰┈➤ 📖 ${toBold('HELP')}      : .menu`;

    const footer = `⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧
║  🔗 ${toBold('CHANNEL')}
║  ➜ ${global.channelLink}
║  ──────────────────────────────────
║  ⚡ ${toBold('Powered by BL@CKN1TE')}
║  🎩 ${toBold('The Incisive Tri-Hat Hacker')}
║  ♾️ ${toBold('INFINITE')} • ${toBold('24/7/365')} • ${toBold('PROMAX')}
⛧━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⛧

  ░▒▓█ ${toBold('END OF TRANSMISSION')} █▓▒░
       🎩🔥⚡️ ${toBold('BL@CKN1TE-NXS')} ⚡️🔥🎩`;

    return header + '\n\n' + stats + '\n\n' + menu + '\n\n' + footer;
}

const LIGHTNING_EMOJIS = ['⚡', '🌩️', '⚡️', '✨', '🌟', '🔥', '💫', '🪄', '⚡'];
const RANDOM_REACTIONS = ['⚡', '🔥', '✨', '🌟', '💫', '🎯', '🚀', '💥', '⚡️', '👑', '💎', '🎉', '✅', '🤖', '😎', '🙌', '👏', '💯', '🌟', '🪄', '🧿', '🍀', '🌈', '❤️', '👍', '🎊', '⭐'];
function getRandomReaction() { return RANDOM_REACTIONS[Math.floor(Math.random() * RANDOM_REACTIONS.length)]; }

// ============================================================
// ♾️ BOT SESSION
// ============================================================
class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.isRunning = false;
        this.isPaused = false;
        this.aiEnabled = false;
        this.isPairing = false;

        const persisted = sessionStates[userId];
        if (persisted && typeof persisted.isRunning === 'boolean') this.isRunning = persisted.isRunning;

        const persistedRead = botData.readSettings?.[userId]?.enabled;
        this.readReceipts = (persistedRead === undefined) ? true : persistedRead;

        this.autoReact = botData.statusSettings?.[userId]?.autoReact || false;
        this.isPublic = botData.statusSettings?.[userId]?.isPublic || false;
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.keepAliveInterval = null;
        this.watchdogInterval = null;
        this.heartbeatInterval = null;
        this.isInitializing = false;
        this.lastConnectMessageTime = null;
        this.reconnectAttempts = 0;
        this.silentMode = SILENT_RECONNECT;
        this.lastReconnectLog = 0;
        this.everConnected = false;
        this.botJidCache = null;
        this._lastStatusSignature = null;
        this._linkedLoggedOnce = false;
        this._reconnectTimer = null;
        this.disconnectedSince = null;
    }

    persistState() {
        sessionStates[this.userId] = { isRunning: this.isRunning, updatedAt: Date.now() };
        saveSessionStates();
    }

    sendLog(message, type = 'info') {
        if (this.everConnected) {
            const noise = /reconnect|closed|retry|attempt|link dropped|restart required|connection lost|init hiccup/i;
            if (noise.test(message)) {
                const now = Date.now();
                const disconnectedFor = this.disconnectedSince ? (now - this.disconnectedSince) : 0;
                if (disconnectedFor < RECONNECT_SILENCE_WINDOW_MS) return;
                if (now - this.lastReconnectLog < 5 * 60 * 1000) return;
                this.lastReconnectLog = now;
            }
        }
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type, user: this.userId };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        io.emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    sendConnectionStatus(force = false) {
        const signature = `${this.isConnected}|${this.isRunning}`;
        if (!force && this._lastStatusSignature === signature) return;
        this._lastStatusSignature = signature;
        const socketId = userSockets[this.userId];
        const payload = { connected: this.isConnected, running: this.isRunning, user: this.userId };
        if (socketId) io.to(socketId).emit('connection-status', payload);
        io.emit('session-status', payload);
        io.emit('total-active', {
            count: Object.values(sessions).filter(s => s.isRunning).length,
            online: Object.values(sessions).filter(s => s.isConnected).length,
            sessions: Object.keys(sessions).length
        });
    }

    async reactRandom(msg) {
        try { await this.sock.sendMessage(msg.key.remoteJid, { react: { text: getRandomReaction(), key: msg.key } }); } catch (e) {}
    }

    async getAIResponse(userJid, userMessage) {
        if (!openai) return null;
        try {
            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are BL@CKN1TE-NXS, a helpful cyberpunk assistant. Reply in the same language the user writes in. Keep replies concise." },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 250
            });
            return completion.choices[0].message.content.trim();
        } catch (error) { return null; }
    }

    startKeepAlive() {
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try { await this.sock.sendPresenceUpdate(this.isRunning ? 'available' : 'unavailable'); } catch (e) {}
            }
        }, KEEPALIVE_PRESENCE_MS);
    }

    startWatchdog() {
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        this.watchdogInterval = setInterval(async () => {
            if (this.isInitializing || this.isPairing) return;
            if (!this.sock || !this.sock.user || !this.isConnected) {
                try { await this.initialize(); } catch (e) {}
            }
        }, SESSION_WATCHDOG_MS);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(async () => {
            if (!this.sock || !this.sock.user) return;
            try { await this.sock.sendPresenceUpdate(this.isRunning ? 'available' : 'unavailable'); }
            catch (e) { if (!this.isInitializing) { try { await this.initialize(); } catch (err) {} } }
        }, HEARTBEAT_INTERVAL_MS);
    }

    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.isRunning && this.sock?.user) {
                try {
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await this.sock.sendMessage(botNumber, { text: "♾️ 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗜𝗦 𝗢𝗡𝗟𝗜𝗡𝗘 🚀\n\n_Lifetime Connection Active_" });
                } catch (e) {}
            }
        }, ACTIVE_CHECK_INTERVAL_MS);
    }

    async forceReconnect(delayMs = 3000) {
        if (this.isInitializing || this.isPairing) return;
        this.reconnectAttempts++;
        this.sendLog(`🔄 Reconnect #${this.reconnectAttempts} in ${delayMs/1000}s`, "warning");
        setTimeout(async () => {
            try { await this.initialize(); }
            catch (e) {
                const next = Math.min(delayMs * 2, 30000);
                setTimeout(() => this.forceReconnect(next), next);
            }
        }, delayMs);
    }

    async initialize(pairingNumber = null) {
        if (this.isInitializing) return;
        this.isInitializing = true;
        if (pairingNumber) this.isPairing = true;

        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

            this.sock = makeWASocket({
                version,
                auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })) },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: false,
                keepAliveIntervalMs: KEEP_ALIVE_INTERVAL_MS,
                connectTimeoutMs: CONNECT_TIMEOUT_MS,
                defaultQueryTimeoutMs: DEFAULT_QUERY_TIMEOUT_MS,
                emitOwnEvents: true,
                retryRequestDelayMs: RETRY_REQUEST_DELAY_MS,
                maxMsgRetryCount: MAX_MSG_RETRY_COUNT,
                linkPreviewImageThumbnailWidth: 192,
                generateHighQualityLinkPreview: false,
                getMessage: async (key) => {
                    if (messageLogs[key.id]) return { conversation: messageLogs[key.id].text };
                    return { conversation: 'Bot is active' };
                }
            });

            if (pairingNumber && !state.creds.registered) {
                setTimeout(async () => {
                    try {
                        let code = await this.sock.requestPairingCode(pairingNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        this.sendLog(`🔑 Pairing Code: ${code}`, 'success');
                        const socketId = userSockets[this.userId];
                        if (socketId) io.to(socketId).emit('pairing-code', code);
                        this.isPairing = false;
                    } catch (err) {
                        this.sendLog(`❌ Pairing error: ${err.message}`, 'error');
                        this.isPairing = false;
                    }
                }, 1500);
            }

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('call', async (calls) => {
                if (botData.antiCall?.[this.userId] && this.isRunning) {
                    for (const call of calls) {
                        if (call.status === 'offer') {
                            try { await this.sock.rejectCall(call.id, call.from); await this.sock.sendMessage(call.from, { text: "⚠️ *ANTI-CALL:* Calls rejected." }); } catch (e) {}
                        }
                    }
                }
            });

            // ═══════════════════════════════════════════════════
            // MESSAGE HANDLER — 125+ commands
            // ═══════════════════════════════════════════════════
            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;
                if (!this.isRunning) return;
                await handleMessages(this.sock, m, this);
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    this.isConnected = false;
                    this.isInitializing = false;
                    if (!this.disconnectedSince) this.disconnectedSince = Date.now();
                    if (!this.isPairing) this.sendLog(`⚠️ Link dropped (code ${statusCode}). Auto-restoring...`, 'warning');
                    this.sendConnectionStatus(true);

                    const reconnectDelay =
                        statusCode === DisconnectReason.loggedOut ? 4000 :
                        statusCode === DisconnectReason.restartRequired ? 300 :
                        statusCode === DisconnectReason.connectionLost ? 800 : 1500;

                    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
                    this._reconnectTimer = setTimeout(() => {
                        this._reconnectTimer = null;
                        this.forceReconnect(reconnectDelay);
                    }, 300);

                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.everConnected = true;
                    this.isInitializing = false;
                    this.isPairing = false;
                    this.reconnectAttempts = 0;
                    this.disconnectedSince = null;

                    if (this._reconnectTimer) {
                        clearTimeout(this._reconnectTimer);
                        this._reconnectTimer = null;
                    }

                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    const botNumClean = botNumber.split('@')[0].split(':')[0];
                    this.botJidCache = botNumber;

                    const persistedRead = botData.readSettings?.[this.userId]?.enabled;
                    if (persistedRead !== undefined) this.readReceipts = persistedRead;

                    const persisted = sessionStates[this.userId];
                    if (persisted && typeof persisted.isRunning === 'boolean') this.isRunning = persisted.isRunning;

                    if (!this._linkedLoggedOnce) {
                        this._linkedLoggedOnce = true;
                        this.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
                        this.sendLog('🎉 SESSION LINKED — LIFETIME CONNECTION ACTIVE', 'success');
                        this.sendLog(`👤 Bot: ${this.userId}`, 'success');
                        this.sendLog(`📱 Number: +${botNumClean}`, 'success');
                        this.sendLog(`♾️ Lifetime Mode: ENABLED`, 'success');
                        this.sendLog(`🚀 Speed: PROMAX UNLIMITED`, 'success');
                        this.sendLog(`🎯 Session state: ${this.isRunning ? 'ONLINE' : 'PAUSED'}`, 'info');
                        this.sendLog(`🖼️ Logo cached: ${LOGO_BUFFER ? 'YES' : 'NO'}`, 'info');
                        this.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
                    } else {
                        this.sendLog('♾️ Connection restored (silent)', 'info');
                    }

                    this.sendConnectionStatus(true);
                    this.startActiveCheck();
                    this.startKeepAlive();
                    this.startWatchdog();
                    this.startHeartbeat();

                    setTimeout(async () => {
                        try {
                            await this.sock.query({
                                tag: 'iq',
                                attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                                content: [{ tag: 'status', attrs: {}, content: Buffer.from("I'M USING BEST BOT BL@CKN1TE-NXS V16 ULTRA", 'utf-8') }]
                            });
                        } catch (e) {}
                    }, 2000);

                    if (this.isRunning && (!this.lastConnectMessageTime || (Date.now() - this.lastConnectMessageTime > 60 * 60 * 1000))) {
                        this.sock.sendMessage(botNumber, {
                            text: "♾️ 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 ✅\n\nPrefixes: .  /  >\n\nType .menu to unleash commands."
                        }).catch(() => {});
                        this.lastConnectMessageTime = Date.now();
                    }
                }
            });

        } catch (err) {
            this.isInitializing = false;
            this.isPairing = false;
            this.sendLog(`Init hiccup: ${err.message}. Auto-retrying...`, 'error');
            setTimeout(() => this.forceReconnect(4000), 4000);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MESSAGE DISPATCHER
// ═══════════════════════════════════════════════════════════
async function handleMessages(sock, messageUpdate, session) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        // Autoread
        try { await handleAutoread(sock, message, session); } catch (e) {}

        // Store for antidelete
        try { storeMessage(sock, message); } catch (e) {}

        // Handle revocations
        if (message.message?.protocolMessage?.type === 0) {
            try { await handleMessageRevocation(sock, message); } catch (e) {}
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        // Extract text
        const rawText = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            message.message?.buttonsResponseMessage?.selectedButtonId ||
            ''
        ).trim();

        const userMessage = rawText.toLowerCase().replace(/\.\s+/g, '.').trim();

        if (userMessage.startsWith('.')) {
            console.log(`📝 Command in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }

        // Button handler
        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, { text: `📢 *Join our Channel:*\n${global.channelLink}` }, { quoted: message });
                return;
            } else if (buttonId === 'owner') {
                try { await commands.owner(sock, chatId, message); } catch (e) {}
                return;
            }
        }

        // Game moves
        if (/^[1-9]$/.test(userMessage) || userMessage === 'surrender') {
            try {
                const ttt = require(path.join(CMD_DIR, 'tictactoe'));
                if (ttt.handleTicTacToeMove) await ttt.handleTicTacToeMove(sock, chatId, senderId, userMessage);
            } catch (e) {}
            return;
        }

        // Increment message counter
        try {
            const tm = require(path.join(CMD_DIR, 'topmembers'));
            if (tm.incrementMessageCount && !message.key.fromMe) tm.incrementMessageCount(chatId, senderId);
        } catch (e) {}

        // Moderation (group-only)
        if (isGroup) {
            try {
                const ab = require(path.join(CMD_DIR, 'antibadword'));
                if (ab.handleBadwordDetection && userMessage) await ab.handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            } catch (e) {}

            try {
                const al = require(path.join(CMD_DIR, 'antilink'));
                if (al.Antilink) await al.Antilink(message, sock);
            } catch (e) {}

            try {
                const at = require(path.join(CMD_DIR, 'antitag'));
                if (at.handleTagDetection) await at.handleTagDetection(sock, chatId, message, senderId);
            } catch (e) {}

            try {
                const mt = require(path.join(CMD_DIR, 'mention'));
                if (mt.handleMentionDetection) await mt.handleMentionDetection(sock, chatId, message);
            } catch (e) {}
        }

        // Only commands below
        if (!userMessage.startsWith('.') && !userMessage.startsWith('/') && !userMessage.startsWith('>')) {
            if (isGroup && session.isPublic) {
                try {
                    const cb = require(path.join(CMD_DIR, 'chatbot'));
                    if (cb.handleChatbotResponse) await cb.handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                } catch (e) {}
            }
            return;
        }

        // Resolve command name + args
        const matchedPrefix = PREFIXES.find(p => userMessage.startsWith(p));
        if (!matchedPrefix) return;

        const withoutPrefix = userMessage.slice(matchedPrefix.length);
        const commandName = withoutPrefix.split(/\s+/)[0];
        const args = withoutPrefix.split(/\s+/).slice(1);
        const q = args.join(' ');

        // React
        if (session.reactRandom) session.reactRandom(message).catch(() => {});

        // Route
        try {
            await routeCommand(commandName, sock, chatId, message, args, q, rawText, session);
        } catch (e) {
            console.error(`Command error (${commandName}):`, e.message);
            try {
                await sock.sendMessage(chatId, { text: `❌ *Command error:* ${e.message}` }, { quoted: message });
            } catch (e2) {}
        }

    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
    }
}

// ═══════════════════════════════════════════════════════════
// COMMAND ROUTER — 125+ commands
// ═══════════════════════════════════════════════════════════
async function routeCommand(commandName, sock, chatId, message, args, q, rawText, session) {
    const isGroup = chatId.endsWith('@g.us');
    const senderId = message.key.participant || message.key.remoteJid;

    switch (commandName) {
        // ── Menu / Start ──
        case 'menu':
        case 'start': {
            try {
                const lightning = LIGHTNING_EMOJIS[Math.floor(Math.random() * LIGHTNING_EMOJIS.length)];
                sock.sendMessage(chatId, { react: { text: lightning, key: message.key } }).catch(() => {});

                const customName = (botData.userNames && botData.userNames[session.userId]) || message.pushName || 'Operator';
                const menuText = buildBeautifulMenu(session, botData || {}, customName);

                const logoBuffer = await ensureLogo(5);

                if (logoBuffer && logoBuffer.length > 0) {
                    try {
                        await sock.sendMessage(chatId, {
                            image: logoBuffer,
                            caption: menuText,
                            mimetype: 'image/jpeg'
                        }, { quoted: message });
                    } catch (imgErr) {
                        try {
                            await sock.sendMessage(chatId, {
                                image: { url: LOGO_URL },
                                caption: menuText,
                                mimetype: 'image/jpeg'
                            }, { quoted: message });
                        } catch (urlErr) {
                            await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
                        }
                    }
                } else {
                    try {
                        await sock.sendMessage(chatId, {
                            image: { url: LOGO_URL },
                            caption: menuText,
                            mimetype: 'image/jpeg'
                        }, { quoted: message });
                    } catch (urlErr) {
                        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
                    }
                }
            } catch (e) {
                console.error('Menu error:', e);
            }
            break;
        }

        // Core
        case 'ping': await commands.ping(sock, chatId, message); break;
        case 'owner': await commands.owner(sock, chatId, message); break;
        case 'alive': await commands.alive(sock, chatId, message); break;
        case 'settings': await commands.settings(sock, chatId, message, session); break;

        // Media
        case 'song': case 'play': case 'mp3': case 'ytmp3': await commands.song(sock, chatId, message, q); break;
        case 'video': case 'ytmp4': await commands.video(sock, chatId, message, q); break;
        case 'tiktok': case 'tt': await commands.tiktok(sock, chatId, message, q); break;
        case 'insta': case 'ig': await commands.insta(sock, chatId, message, q); break;
        case 'instagram': await commands.instagram(sock, chatId, message, q); break;
        case 'igs': await commands.igs(sock, chatId, message, false); break;
        case 'igsc': await commands.igs(sock, chatId, message, true); break;
        case 'facebook': case 'fb': await commands.facebook(sock, chatId, message, q); break;
        case 'spotify': await commands.spotify(sock, chatId, message, q); break;
        case 'gdrive': await commands.gdrive(sock, chatId, message, q); break;
        case 'mf': await commands.mf(sock, chatId, message, q); break;
        case 'apk': await commands.apk(sock, chatId, message); break;
        case 'url': case 'tourl': await commands.url(sock, chatId, message); break;
        case 'ss': case 'ssweb': case 'screenshot': await commands.ss(sock, chatId, message, q); break;
        case 'lyrics': case 'lyric': await commands.lyrics(sock, chatId, message, q); break;

        // Media Tools
        case 'dp': await commands.dp(sock, chatId, message); break;
        case 'vv': case 'viewonce': await commands.vv(sock, chatId, message); break;
        case 'sticker': case 's': await commands.sticker(sock, chatId, message); break;
        case 'crop': case 'stickercrop': await commands.stickercrop(sock, chatId, message); break;
        case 'tg': case 'stickertelegram': case 'tgsticker': case 'telesticker': await commands.stickertelegram(sock, chatId, message); break;
        case 'take': case 'steal': await commands.take(sock, chatId, message, args); break;
        case 'attp': await commands.attp(sock, chatId, message); break;
        case 'simage': await commands.simage(sock, chatId, message); break;
        case 'blur': case 'imgblur': await commands.imgblur(sock, chatId, message); break;
        case 'removebg': case 'rmbg': case 'nobg': await commands.removebg.exec(sock, message, args); break;
        case 'remini': case 'enhance': case 'upscale': await commands.remini(sock, chatId, message, args); break;
        case 'setpp': await commands.setpp(sock, chatId, message); break;

        // AI
        case 'ai': case 'gpt': case 'gemini': await commands.ai(sock, chatId, message, false, session, args); break;
        case 'image': case 'img': await commands.image(sock, chatId, message, q); break;
        case 'imagine': case 'flux': case 'dalle': await commands.imagine(sock, chatId, message, q); break;
        case 'tts': await commands.tts(sock, chatId, message, q); break;
        case 'translate': case 'trt': await commands.translate(sock, chatId, message, q); break;
        case 'character': await commands.character(sock, chatId, message); break;
        case 'chatbot': await commands.chatbot(sock, chatId, message, q, false); break;
        case 'emojimix': case 'emix': await commands.emojimix(sock, chatId, message); break;
        case 'sora': await commands.sora(sock, chatId, message, q); break;

        // Text Makers
        case 'metallic': case 'ice': case 'snow': case 'impressive': case 'matrix':
        case 'light': case 'neon': case 'devil': case 'purple': case 'thunder':
        case 'leaves': case '1917': case 'arena': case 'hacker': case 'sand':
        case 'blackpink': case 'glitch': case 'fire':
            await commands.textmaker(sock, chatId, message, rawText, commandName);
            break;

        // Fun & Games
        case 'joke': await commands.joke(sock, chatId, message); break;
        case 'meme': await commands.meme(sock, chatId, message); break;
        case 'quote': await commands.quote(sock, chatId, message); break;
        case 'fact': await commands.fact(sock, chatId, message, message); break;
        case 'dare': await commands.dare(sock, chatId, message); break;
        case 'truth': await commands.truth(sock, chatId, message); break;
        case 'compliment': await commands.compliment(sock, chatId, message); break;
        case 'insult': await commands.insult(sock, chatId, message); break;
        case '8ball': await commands.eightball(sock, chatId, message, q); break;
        case 'flirt': await commands.flirt(sock, chatId, message); break;
        case 'ship': await commands.ship(sock, chatId, message); break;
        case 'waste': case 'wasted': await commands.wasted(sock, chatId, message); break;
        case 'simp': await commands.simp(sock, chatId, message); break;
        case 'stupid': case 'itssostupid': case 'iss': await commands.stupid(sock, chatId, message); break;
        case 'goodnight': case 'gn': case 'lovenight': await commands.goodnight(sock, chatId, message); break;
        case 'shayari': case 'shayri': await commands.shayari(sock, chatId, message); break;
        case 'roseday': await commands.roseday(sock, chatId, message); break;
        case 'ttt': case 'tictactoe': await commands.tictactoe(sock, chatId, message, q); break;
        case 'hangman': await commands.hangman(sock, chatId, message); break;
        case 'trivia': await commands.trivia(sock, chatId, message); break;
        case 'animu': case 'nom': case 'poke': case 'cry': case 'kiss': case 'pat':
        case 'hug': case 'wink': case 'facepalm': case 'loli':
            await commands.anime(sock, chatId, message, [commandName]);
            break;
        case 'pies': case 'china': case 'indonesia': case 'japan': case 'korea':
        case 'india': case 'malaysia': case 'thailand':
            await commands.pies(sock, chatId, message, [commandName]);
            break;
        case 'heart': case 'horny': case 'circle': case 'lgbt': case 'lolice':
        case 'simpcard': case 'tonikawa': case 'namecard': case 'oogway':
        case 'oogway2': case 'tweet': case 'ytcomment': case 'youtube-comment':
        case 'comrade': case 'gay': case 'glass': case 'jail': case 'passed':
        case 'triggered': case 'its-so-stupid':
            await commands.misc(sock, chatId, message, [commandName]);
            break;

        // Utilities
        case 'weather': await commands.weather(sock, chatId, message, q); break;
        case 'news': await commands.news(sock, chatId, message); break;
        case 'qr': await commands.qr(sock, chatId, message, q); break;
        case 'shorten': case 'short': await commands.shorten(sock, chatId, message, q); break;
        case 'calc': case 'math': await commands.calc(sock, chatId, message, q); break;
        case 'git': case 'github': case 'sc': case 'script': case 'repo': await commands.github(sock, chatId, message); break;
        case 'update': await commands.update(sock, chatId, message, args[0] || ''); break;

        // Group
        case 'tagall': await commands.tagall(sock, chatId, senderId, message); break;
        case 'tagnotadmin': await commands.tagnotadmin(sock, chatId, senderId, message); break;
        case 'hidetag': await commands.hidetag(sock, chatId, senderId, q, null, message); break;
        case 'tag': await commands.tag(sock, chatId, senderId, q, null, message); break;
        case 'kick': {
            const mentions = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            await commands.kick(sock, chatId, senderId, mentions, message);
            break;
        }
        case 'mute': {
            const dur = args[0] ? parseInt(args[0], 10) : undefined;
            await commands.mute(sock, chatId, senderId, message, dur);
            break;
        }
        case 'unmute': await commands.unmute(sock, chatId, senderId); break;
        case 'ban': await commands.ban(sock, chatId, message); break;
        case 'unban': await commands.unban(sock, chatId, message); break;
        case 'promote': {
            const mentions = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            await commands.promote(sock, chatId, mentions, message);
            break;
        }
        case 'demote': {
            const mentions = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            await commands.demote(sock, chatId, mentions, message);
            break;
        }
        case 'warn': {
            const mentions = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            await commands.warn(sock, chatId, senderId, mentions, message);
            break;
        }
        case 'warnings': {
            const mentions = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            await commands.warnings(sock, chatId, mentions);
            break;
        }
        case 'groupinfo': case 'infogp': await commands.groupinfo(sock, chatId, message); break;
        case 'resetlink': case 'revoke': await commands.resetlink(sock, chatId, senderId); break;
        case 'staff': case 'admins': await commands.staff(sock, chatId, message); break;
        case 'welcome': await commands.welcome(sock, chatId, message); break;
        case 'goodbye': await commands.goodbye(sock, chatId, message); break;
        case 'setgname': await commands.setgname(sock, chatId, senderId, q, message); break;
        case 'setgdesc': await commands.setgdesc(sock, chatId, senderId, q, message); break;
        case 'setgpp': await commands.setgpp(sock, chatId, senderId, message); break;
        case 'clear': if (isGroup) await commands.clear(sock, chatId); break;
        case 'delete': case 'del': await commands.delete(sock, chatId, message, senderId); break;

        // Anti-*
        case 'antilink': await commands.antilink(sock, chatId, message, false, botData, saveBotData, args); break;
        case 'antitag': await commands.antitag(sock, chatId, message, false, botData, saveBotData, args); break;
        case 'anticall': await commands.anticall(sock, chatId, message, args.join(' ')); break;
        case 'antidelete': await commands.antidelete(sock, chatId, message, args.join(' ')); break;
        case 'antistatus': await commands.antistatus(sock, chatId, message, false, botData, saveBotData, args); break;
        case 'antibadword': await commands.antibadword(sock, chatId, message, senderId, false); break;
        case 'pmblocker': await commands.pmblocker(sock, chatId, message, args.join(' ')); break;
        case 'mention': await commands.mention(sock, chatId, message, args.join(' '), false); break;

        // Automation
        case 'autoread': if (autoreadCommand) await autoreadCommand(sock, chatId, message, false, botData, saveBotData, session.userId, args); break;
        case 'read': await commands.read(sock, chatId, message, false, session, args); break;
        case 'autotyping': await commands.autotyping(sock, chatId, message); break;
        case 'autoreacts': case 'areact': case 'autoreact': case 'autoreaction':
            await commands.autoreacts(sock, chatId, message, false, session, args);
            break;
        case 'autostatus': await commands.autostatus(sock, chatId, message, false, botData, saveBotData, session.userId, args); break;
        case 'status': await commands.status(sock, chatId, message, false, botData, saveBotData, session.userId, args); break;
        case 'online': await commands.online(sock, chatId, message, false, session, args); break;

        // Mode
        case 'private': await commands.private(sock, chatId, message, false, session); break;
        case 'public': await commands.public(sock, chatId, message, false, session); break;
        case 'mode': {
            const action = args[0]?.toLowerCase();
            if (action === 'public' || action === 'private') {
                session.isPublic = action === 'public';
                if (!botData.statusSettings[session.userId]) botData.statusSettings[session.userId] = {};
                botData.statusSettings[session.userId].isPublic = session.isPublic;
                saveBotData();
                await sock.sendMessage(chatId, { text: `🌐 Bot is now *${action.toUpperCase()}* mode` }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { text: `Current mode: *${session.isPublic ? 'PUBLIC' : 'PRIVATE'}*\n\nUsage: .mode public|private` }, { quoted: message });
            }
            break;
        }

        // Misc / Owner
        case 'hack': await commands.hack(sock, chatId, message); break;
        case 'sudo': await commands.sudo(sock, chatId, message); break;
        case 'clearsession': await commands.clearsession(sock, chatId, message); break;
        case 'cleartmp': await commands.cleartmp(sock, chatId, message); break;

        // Brand Hub
        case 'websites': case 'sites': case 'blackn1te-websites':
            await commands.blackn1teWebsites(sock, chatId, message);
            break;
        case 'trihat': case 'tools': case 'incisive-trihat-tools':
            await commands.incisiveTrihatTools(sock, chatId, message);
            break;

        // Ghost / Read aliases
        case 'ghost': {
            const mode = args[0]?.toLowerCase();
            if (mode === 'on') {
                session.readReceipts = false;
                if (!botData.readSettings[session.userId]) botData.readSettings[session.userId] = {};
                botData.readSettings[session.userId].enabled = false;
                saveBotData();
                await sock.sendMessage(chatId, { text: '👻 *Ghost Mode:* ON' }, { quoted: message });
            } else if (mode === 'off') {
                session.readReceipts = true;
                if (!botData.readSettings[session.userId]) botData.readSettings[session.userId] = {};
                botData.readSettings[session.userId].enabled = true;
                saveBotData();
                await sock.sendMessage(chatId, { text: '👻 *Ghost Mode:* OFF' }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { text: `👻 *Ghost Mode:* ${session.readReceipts === false ? 'ON' : 'OFF'}` }, { quoted: message });
            }
            break;
        }

        default:
            // Unknown command — silently ignore
            break;
    }
}

// ============================================================
// SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
    socket.emit('total-active', {
        count: Object.values(sessions).filter(s => s.isRunning).length,
        online: Object.values(sessions).filter(s => s.isConnected).length,
        sessions: Object.keys(sessions).length
    });

    socket.on('set-user', (userId) => {
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        const s = sessions[userId];
        const persisted = sessionStates[userId];
        if (persisted && typeof persisted.isRunning === 'boolean') {
            if (!s.everConnected && !s.isRunning && persisted.isRunning) s.isRunning = true;
        }
        socket.emit('connection-status', { connected: s.isConnected, running: s.isRunning, user: userId, restored: true });
    });

    socket.on('pair-request', async ({ userId, number }) => {
        try {
            if (isNumberBlacklisted(number)) {
                socket.emit('blacklist-block', { type: 'number', message: `🚫 *ACCESS DENIED*\n\nYour number is blacklisted.` });
                return;
            }
            if (isBotNameBlacklisted(userId)) {
                socket.emit('blacklist-block', { type: 'botname', message: `🚫 *ACCESS DENIED*\n\nBot name "${userId}" is blacklisted.` });
                return;
            }
            if (!sessions[userId]) sessions[userId] = new BotSession(userId);
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { autoStatus: false, autoSeen: false, autoLike: false, autoDownload: false, isPublic: false };
                saveBotData();
            }
            sessions[userId].isPairing = true;
            await sessions[userId].initialize(number);
        } catch (e) { console.error('[PAIR-REQUEST]', e); }
    });

    socket.on('start-session', async (payload) => {
        try {
            const userId = (typeof payload === 'string') ? payload : (payload && payload.userId);
            const botName = (payload && payload.botName) || global.botName;
            if (!userId) return;

            if (!sessions[userId]) sessions[userId] = new BotSession(userId);
            const s = sessions[userId];

            if (!s.sock || !s.sock.user) {
                const startWait = Date.now();
                while ((!s.sock || !s.sock.user) && (Date.now() - startWait < 20000)) {
                    await delay(250);
                    if (!s.isInitializing && (!s.sock || !s.sock.user)) {
                        try { await s.initialize(); } catch (e) {}
                    }
                }
            }

            if (!s.sock || !s.sock.user) {
                s.sendLog('❌ Socket not ready.', 'error');
                return;
            }

            s.isRunning = true;
            s.isPaused = false;
            s._pausedNoticeShown = false;
            s.everConnected = true;
            s.persistState();

            if (!s.botJidCache) s.botJidCache = jidNormalizedUser(s.sock.user.id);
            s.sock.sendPresenceUpdate('available').catch(() => {});

            const banner = buildCyberpunkBanner(s, botName);
            const logoBuffer = await ensureLogo(5);

            const sendBanner = async () => {
                if (logoBuffer && logoBuffer.length > 0) {
                    try {
                        await s.sock.sendMessage(s.botJidCache, { image: logoBuffer, caption: banner, mimetype: 'image/jpeg' });
                        s.sendLog('🎩🔥⚡️ CYBERPUNK BANNER DELIVERED ✅', 'success');
                        return;
                    } catch (e) {}
                }
                try {
                    await s.sock.sendMessage(s.botJidCache, { image: { url: LOGO_URL }, caption: banner, mimetype: 'image/jpeg' });
                    s.sendLog('🎩 Banner delivered (URL fallback) ✅', 'success');
                } catch (e2) {
                    await s.sock.sendMessage(s.botJidCache, { text: banner });
                    s.sendLog('🎩 Banner delivered (text fallback) ⚠️', 'warning');
                }
            };

            sendBanner().catch(() => {});

            s.sendConnectionStatus(true);
            socket.emit('session-status', { user: userId, running: true, connected: true });

            io.emit('console', {
                timestamp: new Date().toLocaleTimeString(),
                message: `🟢 START — ${userId} ONLINE · PROMAX`,
                type: 'success', user: userId
            });
        } catch (e) {
            console.error('[START-SESSION]', e);
        }
    });

    socket.on('stop-session', async (payload) => {
        try {
            const userId = (typeof payload === 'string') ? payload : (payload && payload.userId);
            if (!userId) return;
            if (!sessions[userId]) return;
            const s = sessions[userId];

            s.isRunning = false;
            s.isPaused = true;
            s._pausedNoticeShown = false;
            s.persistState();

            try { await s.sock.sendPresenceUpdate('unavailable'); } catch (e) {}

            s.sendConnectionStatus(true);
            socket.emit('session-status', { user: userId, running: false, connected: s.isConnected });

            io.emit('console', {
                timestamp: new Date().toLocaleTimeString(),
                message: `🔴 STOP — ${userId} paused`,
                type: 'warning', user: userId
            });
        } catch (e) { console.error('[STOP-SESSION]', e); }
    });

    socket.on('logout', async (userId) => {
        try {
            if (sessions[userId]) {
                sessions[userId].isRunning = false;
                sessions[userId].persistState();
                if (sessions[userId].sock) { try { await sessions[userId].sock.logout(); } catch (e) {} }
                [sessions[userId].activeInterval, sessions[userId].keepAliveInterval,
                 sessions[userId].watchdogInterval, sessions[userId].heartbeatInterval]
                    .forEach(t => { if (t) clearInterval(t); });
                const authPath = path.join(AUTH_DIR, userId);
                if (fs.existsSync(authPath)) fs.removeSync(authPath);
                delete sessions[userId];
                if (sessionStates[userId]) { delete sessionStates[userId]; saveSessionStates(); }
                io.emit('total-active', {
                    count: Object.values(sessions).filter(s => s.isRunning).length,
                    online: Object.values(sessions).filter(s => s.isConnected).length,
                    sessions: Object.keys(sessions).length
                });
                const socketId = userSockets[userId];
                if (socketId) io.to(socketId).emit('connection-status', { connected: false, running: false, user: userId });
                delete userSockets[userId];
            }
        } catch (e) {}
    });

    socket.on('terminate-session', async (userId) => {
        try {
            if (sessions[userId]) {
                if (sessions[userId].sock) { try { await sessions[userId].sock.logout(); } catch (e) {} }
                [sessions[userId].activeInterval, sessions[userId].keepAliveInterval,
                 sessions[userId].watchdogInterval, sessions[userId].heartbeatInterval]
                    .forEach(t => { if (t) clearInterval(t); });
                const authPath = path.join(AUTH_DIR, userId);
                if (fs.existsSync(authPath)) fs.removeSync(authPath);
                delete sessions[userId];
                if (sessionStates[userId]) { delete sessionStates[userId]; saveSessionStates(); }
                const socketId = userSockets[userId];
                if (socketId) { io.to(socketId).emit('connection-status', { connected: false, running: false, user: userId }); delete userSockets[userId]; }
                io.emit('total-active', {
                    count: Object.values(sessions).filter(s => s.isRunning).length,
                    online: Object.values(sessions).filter(s => s.isConnected).length,
                    sessions: Object.keys(sessions).length
                });
                io.emit('console', { timestamp: new Date().toLocaleTimeString(), message: `🚨 Session terminated: ${userId}`, type: 'warning', user: userId });
            }
        } catch (e) {}
    });

    socket.on('terminate-all-sessions', async () => {
        try {
            for (const userId of Object.keys(sessions)) {
                try {
                    if (sessions[userId].sock) { try { await sessions[userId].sock.logout(); } catch (e) {} }
                    [sessions[userId].activeInterval, sessions[userId].keepAliveInterval,
                     sessions[userId].watchdogInterval, sessions[userId].heartbeatInterval]
                        .forEach(t => { if (t) clearInterval(t); });
                    const authPath = path.join(AUTH_DIR, userId);
                    if (fs.existsSync(authPath)) fs.removeSync(authPath);
                    delete sessions[userId]; delete userSockets[userId];
                    if (sessionStates[userId]) delete sessionStates[userId];
                } catch (e) {}
            }
            saveSessionStates();
            io.emit('total-active', { count: 0, online: 0, sessions: 0 });
            io.emit('console', { timestamp: new Date().toLocaleTimeString(), message: `🚨 ALL sessions terminated`, type: 'warning', user: 'system' });
        } catch (e) {}
    });

    socket.on('disconnect', () => {
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) { delete userSockets[userId]; break; }
        }
    });
});

// ============================================================
// OWNER ENDPOINTS
// ============================================================
app.get('/api/sessions', (req, res) => {
    const list = Object.values(sessions).map(s => ({
        userId: s.userId, connected: s.isConnected, running: s.isRunning,
        paused: s.isPaused, initialized: !!s.sock
    }));
    res.json({ total: list.length, active: list.filter(s => s.running).length, online: list.filter(s => s.connected).length, sessions: list });
});

app.post('/api/terminate', async (req, res) => {
    try {
        const { userId, secret } = req.body || {};
        if (secret !== OWNER_SECRET) return res.status(403).json({ success: false, error: 'Invalid secret' });
        if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
        if (sessions[userId]) {
            if (sessions[userId].sock) { try { await sessions[userId].sock.logout(); } catch (e) {} }
            [sessions[userId].activeInterval, sessions[userId].keepAliveInterval,
             sessions[userId].watchdogInterval, sessions[userId].heartbeatInterval]
                .forEach(t => { if (t) clearInterval(t); });
            const authPath = path.join(AUTH_DIR, userId);
            if (fs.existsSync(authPath)) fs.removeSync(authPath);
            delete sessions[userId];
            if (sessionStates[userId]) { delete sessionStates[userId]; saveSessionStates(); }
            const socketId = userSockets[userId];
            if (socketId) { io.to(socketId).emit('connection-status', { connected: false, running: false, user: userId }); delete userSockets[userId]; }
            return res.json({ success: true, userId });
        }
        return res.json({ success: false, error: 'Session not found' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/terminate-all', async (req, res) => {
    try {
        const { secret } = req.body || {};
        if (secret !== OWNER_SECRET) return res.status(403).json({ success: false, error: 'Invalid secret' });
        let count = 0;
        for (const userId of Object.keys(sessions)) {
            try {
                if (sessions[userId].sock) { try { await sessions[userId].sock.logout(); } catch (e) {} }
                const authPath = path.join(AUTH_DIR, userId);
                if (fs.existsSync(authPath)) fs.removeSync(authPath);
                delete sessions[userId]; delete userSockets[userId]; count++;
            } catch (e) {}
        }
        try {
            const dirs = fs.readdirSync(AUTH_DIR);
            for (const d of dirs) {
                const p = path.join(AUTH_DIR, d);
                if (fs.statSync(p).isDirectory()) fs.removeSync(p);
            }
        } catch (e) {}
        sessionStates = {};
        saveSessionStates();
        io.emit('total-active', { count: 0, online: 0, sessions: 0 });
        res.json({ success: true, count });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============================================================
// BLACKLIST ENDPOINTS
// ============================================================
app.get('/api/blacklist', (req, res) => {
    const { secret } = req.query;
    if (secret !== OWNER_SECRET) return res.status(403).json({ error: 'Invalid secret' });
    res.json({ success: true, numbers: blacklist.numbers, botNames: blacklist.botNames });
});

app.post('/api/blacklist/add', async (req, res) => {
    try {
        const { secret, type, value } = req.body || {};
        if (secret !== OWNER_SECRET) return res.status(403).json({ error: 'Invalid secret' });
        if (!type || !value) return res.status(400).json({ error: 'type and value required' });
        const clean = String(value).trim();
        let added = false;
        if (type === 'number') { const num = clean.replace(/\D/g, ''); if (!blacklist.numbers.includes(num)) { blacklist.numbers.push(num); added = true; } }
        else if (type === 'botname') { if (!blacklist.botNames.map(n => n.toLowerCase()).includes(clean.toLowerCase())) { blacklist.botNames.push(clean); added = true; } }
        else return res.status(400).json({ error: 'type must be number or botname' });
        saveBlacklist();
        res.json({ success: true, added, numbers: blacklist.numbers, botNames: blacklist.botNames });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/blacklist/remove', (req, res) => {
    try {
        const { secret, type, value } = req.body || {};
        if (secret !== OWNER_SECRET) return res.status(403).json({ error: 'Invalid secret' });
        const clean = String(value).trim();
        if (type === 'number') { const num = clean.replace(/\D/g, ''); blacklist.numbers = blacklist.numbers.filter(n => n !== num); }
        else if (type === 'botname') { blacklist.botNames = blacklist.botNames.filter(n => n.toLowerCase() !== clean.toLowerCase()); }
        saveBlacklist();
        res.json({ success: true, numbers: blacklist.numbers, botNames: blacklist.botNames });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/blacklist/clear', (req, res) => {
    try {
        const { secret } = req.body || {};
        if (secret !== OWNER_SECRET) return res.status(403).json({ error: 'Invalid secret' });
        blacklist.numbers = []; blacklist.botNames = [];
        saveBlacklist();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// AUTO-LOAD SESSIONS
// ============================================================
async function loadExistingSessions() {
    try {
        const authDirs = await fs.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.stat(authPath);
            if (stats.isDirectory()) {
                const credsFile = path.join(authPath, 'creds.json');
                if (fs.existsSync(credsFile)) {
                    if (isBotNameBlacklisted(userId)) continue;
                    console.log(`[System] Auto-loading: ${userId}`);
                    if (!sessions[userId]) {
                        sessions[userId] = new BotSession(userId);
                        sessions[userId].initialize().catch(err => {
                            console.error(`Failed ${userId}:`, err.message);
                            setTimeout(() => sessions[userId]?.forceReconnect(4000), 4000);
                        });
                    }
                }
            }
        }
    } catch (err) { console.error('[System] Load error:', err.message); }
}

// ============================================================
// INFINITE SUPERVISOR
// ============================================================
function startInfiniteSupervisor() {
    setInterval(async () => {
        try {
            const authDirs = await fs.readdir(AUTH_DIR);
            for (const userId of authDirs) {
                const authPath = path.join(AUTH_DIR, userId);
                const stats = await fs.stat(authPath);
                if (stats.isDirectory() && fs.existsSync(path.join(authPath, 'creds.json'))) {
                    if (isBotNameBlacklisted(userId)) continue;
                    if (!sessions[userId]) {
                        console.log(`♾️ [Supervisor] Reviving: ${userId}`);
                        sessions[userId] = new BotSession(userId);
                        sessions[userId].initialize().catch(() => {});
                    } else if (!sessions[userId].isConnected && !sessions[userId].isInitializing && !sessions[userId]._reconnectTimer && !sessions[userId].isPairing) {
                        console.log(`♾️ [Supervisor] Re-linking: ${userId}`);
                        sessions[userId].forceReconnect(1200).catch(() => {});
                    }
                }
            }
        } catch (e) {}
    }, AUTO_RELOAD_INTERVAL_MS);

    setInterval(() => {
        const activeCount = Object.values(sessions).filter(s => s.isRunning).length;
        const onlineCount = Object.values(sessions).filter(s => s.isConnected).length;
        console.log(`🚀 [PROMAX] Sessions: ${Object.keys(sessions).length} | Running: ${activeCount} | Online: ${onlineCount} | Uptime: ${formatUptime(Math.floor(process.uptime()))}`);
    }, 30 * 60 * 1000);
}

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`🚀 ${global.botName} · V16 ULTRA on port ${PORT}`);
    console.log(`🌐 Panel: http://localhost:${PORT}`);
    console.log(`🤖 Bot: ${global.botName}`);
    console.log(`🔣 Prefixes: .  /  >`);
    console.log(`♾️  INFINITE MODE: ENABLED`);
    console.log(`🔒 LIFETIME CONNECTION: ENABLED`);
    console.log(`🎯 PER-SESSION START/STOP: ENABLED`);
    console.log(`📡 CYBERPUNK MENU + BANNER: ADVANCED`);
    console.log(`📊 TOTAL COMMANDS: ~125 across 9 sectors`);
    console.log(`🖼️ LOGO: Preloading now...`);

    await ensureLogo(10);
    if (LOGO_BUFFER) console.log(`✅ [LOGO] Ready in RAM (${LOGO_BUFFER.length} bytes)`);
    else console.log(`⚠️ [LOGO] Not cached — will fetch on demand`);

    measurePing().catch(() => {});

    loadExistingSessions();
    startInfiniteSupervisor();

    const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try { await axios.get(APP_URL + '/health', { timeout: 5000 }); console.log("♾️ Anti-Sleep ping ✅"); } catch (e) {}
    }, 4 * 60 * 1000);

    setInterval(async () => {
        try { await axios.get(APP_URL + '/api/badge', { timeout: 4000 }); } catch (e) {}
    }, 90 * 1000);

    setInterval(() => { preloadLogo().catch(() => {}); }, 30 * 60 * 1000);
});

// ============================================================
// GLOBAL ERROR HANDLERS — never die
// ============================================================
process.on('uncaughtException', (err) => { console.error('♾️ [Uncaught]', err.message); });
process.on('unhandledRejection', (err) => { console.error('♾️ [Unhandled]', err?.message || err); });
process.on('SIGTERM', () => { console.log('♾️ [SIGTERM] Ignored — staying online'); });
process.on('SIGINT', () => { console.log('♾️ [SIGINT] Ignored — staying online'); });
process.on('warning', (w) => { console.warn('♾️ [Warning]', w.message); });