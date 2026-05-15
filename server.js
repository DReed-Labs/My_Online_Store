/**
 * server.js — starts the HTTP listener. All app logic lives in app.js.
 */
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`${app.SITE_NAME} running at ${app.SITE_URL}`);
});
