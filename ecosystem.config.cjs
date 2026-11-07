/**
 * PM2 — менеджер процессов для продакшена.
 * Запуск: pm2 start ecosystem.config.cjs && pm2 save
 * Переменные окружения берутся из .env.local (Next.js читает его сам).
 */
module.exports = {
  apps: [
    {
      name: 'mono',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
