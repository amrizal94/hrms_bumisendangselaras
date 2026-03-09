module.exports = {
  apps: [
    {
      name: "facehrm-web",
      script: "server.js",
      cwd: "/www/wwwroot/facehrm/web/.next/standalone",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
