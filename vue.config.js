const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    webSocketServer: "sockjs",
    client: {
      webSocketTransport: "sockjs",
    },
  },
});
