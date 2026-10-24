module.exports = {
  apps: [
    {
      name: 'wattar-api',
      cwd: '/var/www/wattar/backEnd',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
