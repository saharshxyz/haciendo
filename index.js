require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const express = require('express');
const app = express();

// env vars
const USER_OAUTH_TOKEN = process.env.USER_OAUTH_TOKEN;
const BOT_OAUTH_TOKEN = process.env.BOT_OAUTH_TOKEN;
const CHANNEL_ID = process.env.ADMIN_CHANNEL_ID;
const API_ENDPOINT = process.env.API_ENDPOINT;

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

  log(`⚪️ Set status for ${time} minutes: ${emoji} ${text}`);
};

const setDnd = async (time) => {
  if (time > 1) {
    log('🔕 DND on');
    return await client.dnd.setSnooze({
      token: USER_OAUTH_TOKEN,
      num_minutes: time,
    });
  } else if (time == 0) {
    log('🔔 DND off');
    return await client.dnd.endDnd({
      token: USER_OAUTH_TOKEN,
    });
  }
};

app.get('/ping', (req, res) => {
  res.status(200).send("Hi! I'm awake");
  log('🤖 Pinged');
});

app.listen(process.env.PORT || 3000, async () => {
  try {
    log('🟢 Starting express server');
  } catch (err) {
    console.error(err);
    log('🚨 THERE WAS AN ERROR WITH THE EXPRESS SERVER');
  }
});

process.on('SIGINT' || 'SIGTERM', () => {
  log('🔴 Down');
});

// ----------
// all endpoints and commands
// ----------

app.post(`/${API_ENDPOINT}/clear`, (req, res) => {
  res.status(200).send('Removed Status and turned off DND');
  changeStatus('', '', 0);
  setDnd(0);
});

app.post(`/${API_ENDPOINT}/driving`, (req, res) => {
  res.status(200).send('Set Driving Status');
  changeStatus(':oncoming_automobile:', 'driving, will respond later', 80);
});

app.post(`/${API_ENDPOINT}/showering`, (req, res) => {
  res.status(200).send('Set Shower Status');
  changeStatus(':shower:', "go away, i'm taking a shower", 30);
});

app.post(`/${API_ENDPOINT}/running`, (req, res) => {
  res.status(200).send('Set Running Status');
  changeStatus(':runner:', 'on a run', 20);
  setDnd(25);
});

app.post(`/${API_ENDPOINT}/sleeping`, (req, res) => {
  let emoji;

  switch (Math.floor(Math.random() * 3)) {
    case 0:
      emoji = ':zzz:';
      break;

    case 1:
      emoji = ':sleeping:';
      break;

    case 2:
      emoji = ':bed:';
      break;
  }

  res.status(200).send('Set Sleeping Status');
  changeStatus(emoji, 'sleeping', 540);
});
