require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const express = require('express');
const app = express();

// env vars
const USER_OAUTH_TOKEN = process.env.USER_OAUTH_TOKEN;
const BOT_OAUTH_TOKEN = process.env.BOT_OAUTH_TOKEN;
const CHANNEL_ID = process.env.ADMIN_CHANNEL_ID;

const client = new WebClient(USER_OAUTH_TOKEN);

// Log actions in console and Slack Channel
const log = async (msg) => {
  console.log(msg);
  await client.chat.postMessage({
    token: BOT_OAUTH_TOKEN,
    text: msg,
    channel: CHANNEL_ID,
  });
};

const changeStatus = async (emoji, text, time) => {
  const expiryTime = (Date.now() + time * 60000) / 1000; // Converts time (in minutes) to UNIX seconds
  try {
    await client.users.profile.set({
      profile: JSON.stringify({
        status_text: text,
        status_emoji: emoji,
        status_expiration: expiryTime,
      }),
    });
  } catch (error) {
    console.error(error);
  }

  log(`Set status for ${time} minutes: ${emoji} ${text}`);
};

changeStatus(':jacob:', 'testing shit dw about it', 0.1);

app.get('/', (req, res) => {
  res.status(200).send("Hi! I'm awake");
  log('Pinged 🤖');
});

app.listen(process.env.PORT || 3000, async () => {
	try {
		log('Starting express server 🏁');
  } catch (err) {
    console.error(err);
    log('THERE WAS AN ERROR WITH THE EXPRESS SERVER 🚨');
  }
});

process.on('SIGINT' || 'SIGTERM', () => {
  log('Down 🔴');
});
