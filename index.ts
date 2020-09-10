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
const log = async (msg: string) => {
	console.log(msg);
	await client.chat.postMessage({
		token: BOT_OAUTH_TOKEN,
		text: msg,
		channel: CHANNEL_ID,
	});
};

const changeStatus = async (emoji: string, text: string, time: number) => {
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

const setDnd = async (time: number) => {
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

app.get('/ping', (req: any, res: any) => {
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

app.post(`/${API_ENDPOINT}/clear`, (req: any, res: any) => {
	res.status(200).send('Removed Status and turned off DND');
	changeStatus('', '', 0);
	setDnd(0);
});

app.post(`/${API_ENDPOINT}/driving`, (req: any, res: any) => {
	const emojis = [':oncoming_automobile:', ':car:'];

	res.status(200).send('Set Driving Status');
	changeStatus(emojis[Math.floor(Math.random() * emojis.length)], '', 80);
});

app.post(`/${API_ENDPOINT}/showering`, (req: any, res: any) => {
	const emojis = [':shower:'];

	res.status(200).send('Set Shower Status');
	changeStatus(emojis[Math.floor(Math.random() * emojis.length)], '', 30);
});

app.post(`/${API_ENDPOINT}/running`, (req: any, res: any) => {
	const emojis = [':runner:', ':athletic_shoe:'];

	res.status(200).send('Set Running Status');
	changeStatus(emojis[Math.floor(Math.random() * emojis.length)], '', 20);
	setDnd(25);
});

app.post(`/${API_ENDPOINT}/sleeping`, (req: any, res: any) => {
	const emojis = [':zzz:'];

	res.status(200).send('Set Sleeping Status');
	changeStatus(emojis[Math.floor(Math.random() * emojis.length)], '', 540);
});
