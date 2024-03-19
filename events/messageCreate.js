
import guildSchema from '../database/guildSchema.js';

export default async (client, message) => {
  let guild = await guildSchema.findOne({ id: message.guild.id });
  if (!guild) await guildSchema.create({ id: message.guild.id });
};
