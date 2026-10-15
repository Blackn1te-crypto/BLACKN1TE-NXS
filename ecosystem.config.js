/* =========================================================
   ECOSYSTEM.CONFIG.JS — PM2 Configuration
   BL@CKN1TE-NXS ULTRA · V16
   Author: BL@CKN1TE — The Incisive Tri-Hat Hacker
   Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f
   ========================================================= */

module.exports = {
  apps: [
    {
      // ─────────────────────────────────────────
      // 🎩 APP IDENTITY
      // ─────────────────────────────────────────
      name: 'BLACKN1TE-NXS-ULTRA',
      script: './server.js',
      cwd: __dirname,

      // ─────────────────────────────────────────
      // 🔄 PROCESS MANAGEMENT
      // ─────────────────────────────────────────
      instances: 1,                  // Single instance (WhatsApp session = 1 socket)
      exec_mode: 'fork',             // Fork (not cluster — needed for Baileys)
      watch: false,                  // Don't restart on file changes
      ignore_watch: [
        'node_modules',
        'auth_info',
        'data',
        'temp',
        '*.log',
        '.git'
      ],

      // ─────────────────────────────────────────
      // ♾️ AUTO-RESTART (INFINITE MODE)
      // ─────────────────────────────────────────
      autorestart: true,
      max_restarts: 100,             // Allow many restarts (Bot may reconnect often)
      min_uptime: '30s',             // Consider app "started" after 30s
      restart_delay: 2000,           // Wait 2s between restarts
      kill_timeout: 10000,           // Give 10s for graceful shutdown

      // ─────────────────────────────────────────
      // 💾 MEMORY & PERFORMANCE
      // ─────────────────────────────────────────
      max_memory_restart: '1G',      // Restart if memory exceeds 1GB
      node_args: [
        '--max-old-space-size=1024', // 1GB heap
        '--optimize-for-size',
        '--gc-interval=100'
      ],

      // ─────────────────────────────────────────
      // 📝 LOGGING
      // ─────────────────────────────────────────
      output: './logs/out.log',
      error: './logs/error.log',
      log: './logs/combined.log',
      merge_logs: true,
      time: true,                    // Prefix logs with timestamp
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ─────────────────────────────────────────
      // 🌍 ENVIRONMENT
      // ─────────────────────────────────────────
      env: {
        NODE_ENV: 'production',
        PORT: 20378,
        APP_URL: 'http://145.239.65.118:20378',
        TZ: 'Africa/Harare'
      },

      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        APP_URL: 'http://localhost:3000',
        watch: true
      },

      // ─────────────────────────────────────────
      // ⚙️ ADVANCED
      // ─────────────────────────────────────────
      wait_ready: false,             // Don't wait for process.send('ready')
      listen_timeout: 10000,         // Wait 10s for app to listen
      shutdown_with_message: false,  // Skip graceful shutdown message

      // ─────────────────────────────────────────
      // 🔁 EXPONENTIAL BACKOFF
      // ─────────────────────────────────────────
      exp_backoff_restart_delay: 100, // Delay increases on repeated crashes

      // ─────────────────────────────────────────
      // 🎯 SOURCE MAP SUPPORT (for debugging)
      // ─────────────────────────────────────────
      source_map_support: true,

      // ─────────────────────────────────────────
      // 📊 HEALTH MONITORING (PM2+ feature — optional)
      // ─────────────────────────────────────────
      // Note: Only used if you connect to PM2 Plus (paid)
      // monitor: {
      //   cpu_threshold: 80,
      //   memory_threshold: 90
      // }
    }
  ]
};