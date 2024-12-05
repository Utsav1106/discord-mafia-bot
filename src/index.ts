import { Client, Collection, ApplicationCommandDataResolvable } from 'discord.js';
import { readdir } from 'fs/promises';
import path from 'path';
import { Command } from './types/utils';
import { BOT_TOKEN, MONGO_URI, NODE_ENV } from './constants/env';
import logger from './utils/logger';
import { connectDB } from './constants/db';

const client = new Client({ intents: 3211517 });

client.cmds = new Collection<string, Command>();

const isProd = NODE_ENV === 'production';
const FILE_EXT = isProd ? '.js' : '.ts';

async function init() {
  const commandsToRegister: ApplicationCommandDataResolvable[] = [];

  const commandsPath = path.join(__dirname, 'cmds');
  const cmdFolders = await readdir(commandsPath);

  for (const folder of cmdFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = (await readdir(folderPath)).filter(file => file.endsWith(FILE_EXT));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath).default;

      if ('name' in command && 'execute' in command) {
        client.cmds.set(command.name, command);
        commandsToRegister.push(command);
      } else {
        logger.error(`The command at ${filePath} is missing a required "name" or "execute" property.`);
      }
    }
  }

  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = (await readdir(eventsPath)).filter(file => file.endsWith(FILE_EXT));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    const eventName = file.split('.')[0];
    logger.info(`Loading event: ${eventName}`);
    client.on(eventName, event.default.bind(null, client));
  }

  client.once('ready', async (readyClient) => {
    await readyClient.application.commands.set(commandsToRegister);
    logger.success(`Successfully registered ${commandsToRegister.length} application commands.`);
  });

  await connectDB(MONGO_URI);
  await client.login(BOT_TOKEN);
}

init();

process.on('unhandledRejection', (reason: Error | any) => {
  console.error('Unhandled Rejection at:', reason);
});
