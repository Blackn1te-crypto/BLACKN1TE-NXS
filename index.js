// ============================================================
//  𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔 — Entry Point
//  Author: BL@CKN1TE — The Incisive Tri-Hat Hacker
//  Version: V16 ULTRA
//  Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f
// ============================================================
//  What this file does:
//    • Prints a cyberpunk boot banner
//    • Locates server.js anywhere in the project
//    • Boots the full bot logic
//    • Refuses to die on stray signals or crashes
// ============================================================

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================
//  🎩 BOOT BANNER
// ============================================================
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  ░▒▓█  𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦  𝗨𝗟𝗧𝗥𝗔  █▓▒░              ║');
console.log('║  ⚡  V16 · CYBERPUNK CORE · INFINITE MODE         ║');
console.log('║  🎩  The Incisive Tri-Hat Hacker                   ║');
console.log('║  ♾️   Lifetime Connection — Set & Forget           ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log(`⚡ Node.js   : ${process.version}`);
console.log(`🌍 Platform  : ${process.platform}`);
console.log(`📁 Working dir: ${process.cwd()}`);
console.log(`🔣 Port (env): ${process.env.PORT || '(default 3000)'}`);
console.log('');

// ============================================================
//  📡 LOCATE server.js
//  (handles root, subfolder, and panel-mounted paths)
// ============================================================
const CANDIDATE_PATHS = [
    './server.js',
    './main.js',
    path.join(__dirname, 'server.js'),
    path.join(__dirname, 'main.js'),
    path.join(process.cwd(), 'server.js'),
    path.join(process.cwd(), 'main.js'),
    '/home/container/server.js',
    '/home/container/main.js',
    '/home/container/BLACKN1TE-NXS-main/server.js',
    '/home/container/BLACKN1TE-NXS-main/main.js'
];

let serverPath = null;
for (const p of CANDIDATE_PATHS) {
    try {
        if (fs.existsSync(p)) {
            serverPath = p;
            break;
        }
    } catch (e) {
        // ignore
    }
}

if (!serverPath) {
    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║  ❌ FATAL: server.js / main.js NOT FOUND           ║');
    console.error('║                                                   ║');
    console.error('║  Expected in one of these locations:              ║');
    CANDIDATE_PATHS.forEach(p => console.error(`║    • ${p}`));
    console.error('║                                                   ║');
    console.error('║  Fix: Upload server.js to the project root.       ║');
    console.error('╚═══════════════════════════════════════════════════╝');
    process.exit(1);
}

console.log(`✅ [ENTRY] Found server logic at: ${serverPath}`);

// ============================================================
//  🚀 LOAD THE SERVER
// ============================================================
try {
    require(serverPath);
    console.log('✅ [ENTRY] server.js loaded successfully');
    console.log('♾️  [ENTRY] Infinite mode armed — bot is now running');
    console.log('🎩 [ENTRY] BL@CKN1TE-NXS ULTRA is live');
} catch (err) {
    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║  ❌ FATAL: Failed to load server.js                ║');
    console.error('╚═══════════════════════════════════════════════════╝');
    console.error('Message:', err && err.message ? err.message : err);
    console.error('Stack:', err && err.stack ? err.stack : '(no stack)');
    // Do not exit — let it retry
}

// ============================================================
//  🛡️ KEEP PROCESS ALIVE
// ============================================================
process.stdin.resume();

// ============================================================
//  ♾️ REFUSE TO DIE — ignore shutdown signals
// ============================================================
process.on('SIGINT',  () => console.log('♾️ [ENTRY] SIGINT  ignored — staying online'));
process.on('SIGTERM', () => console.log('♾️ [ENTRY] SIGTERM ignored — staying online'));
process.on('SIGHUP',  () => console.log('♾️ [ENTRY] SIGHUP  ignored — staying online'));

// ============================================================
//  🛡️ CATCH STRAY ERRORS — never crash
// ============================================================
process.on('uncaughtException', (err) => {
    console.error('♾️ [ENTRY] Uncaught Exception:', err && err.message ? err.message : err);
});

process.on('unhandledRejection', (err) => {
    console.error('♾️ [ENTRY] Unhandled Rejection:', err && err.message ? err.message : err);
});

process.on('warning', (w) => {
    console.warn('♾️ [ENTRY] Warning:', w && w.message ? w.message : w);
});

// ============================================================
//  ❤️ HEARTBEAT LOG — proof of life every 30 minutes
// ============================================================
setInterval(() => {
    const uptimeSec = Math.floor(process.uptime());
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;
    const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
    console.log(`♾️ [ENTRY] Heartbeat — uptime: ${h}h ${m}m ${s}s | memory: ${mem} MB`);
}, 30 * 60 * 1000);

// ============================================================
//  ✅ BOOT COMPLETE
// ============================================================
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  ✅ index.js boot complete                        ║');
console.log('║  🚀 Bot is now running 24/7/365                   ║');
console.log('║  ♾️  Lifetime connection — set & forget            ║');
console.log('║  🎩  BL@CKN1TE — The Incisive Tri-Hat Hacker       ║');
console.log('║  🔗  Channel:                                     ║');
console.log('║     https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f');
console.log('╚═══════════════════════════════════════════════════╝');