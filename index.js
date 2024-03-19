import Discord from 'discord.js';
import fs from 'fs';
import { readdir } from 'fs/promises';
import mongoose from 'mongoose';
import config from './config.js';

import log from './tools/log.js';

const client = new Discord.Client({ intents: 3211517 });
client.cmds = new Discord.Collection();
client.events = new Discord.Collection();
client.log = log;

async function init() {
  let intfolder = await readdir('./events/interactions/');
  intfolder.forEach(async (direct) => {
    const commandFiles = await fs.readdirSync(`./events/interactions/${direct}/`).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const event = await import(`./events/interactions/${direct}/${file}`);
      client.on('interactionCreate', event.default.bind(null, client));
    }
  });

  const eventFiles = await fs.readdirSync('./events/').filter((file) => file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    const eventName = file.split('.')[0];
    client.log.event(`Loading... ${eventName}`);
    client.on(eventName, event.default.bind(null, client));
  }

  const commands = [];
  const folders = await readdir('./cmds');
  for (const x of folders) {
    const cmdFolders = await fs.readdirSync(`./cmds/${x}`);
    for (const file of cmdFolders) {
      const cmd = await import(`./cmds/${x}/${file}`);
      commands.push(cmd.default);
      await client.cmds.set(cmd.default.name, cmd.default);
    }
  }

  client.on('ready', async () => {
    await client.application.commands.set(commands);
  });

  try {
    await mongoose.connect(config.mongoDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    client.log.success('Connected to MongoDB');
  } catch (err) {
    client.log.error(`Unable to connect to MongoDB Database.\nError: ${err}`);
  }

  await client.login(config.token);
}

init();

process.on('unhandledRejection', (err) => {
  console.log('Unknown error occurred:\n');
  console.log(err);
});
