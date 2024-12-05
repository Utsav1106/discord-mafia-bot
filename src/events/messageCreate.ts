import guildModel from '@/models/guild';
import { Message } from 'discord.js';

export default async function execute(message: Message) {

  if (message.author.bot || !message.guild) return;

  try {
    await guildModel.findOneAndUpdate(
      { guildId: message.guild.id },
      { guildId: message.guild.id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error(`Failed to ensure guild document for ${message.guild.name} (${message.guild.id}):`, error);
  }
}
