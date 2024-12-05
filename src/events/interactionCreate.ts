import { GuildCommandInteraction } from '@/types/utils';
import logger from '@/utils/logger';
import { EmbedBuilder } from 'discord.js';
import { CommandClient } from '../types/utils'
const cooldowns: Record<string, number> = {};

export default async (client: CommandClient, i: GuildCommandInteraction) => {
  try {
    if (!i.isCommand()) return;
    if (!client.user) throw new Error("Client user is not defined");
    if (!i.guild) throw new Error("Guild is not defined");

    const cmd = client.cmds.get(i.commandName);
    if (!cmd) {
      await i.deferReply({ ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("An error occurred while executing the command.")
        .setColor("Red");
      return i.editReply({ embeds: [embed] });
    }

    const args: Record<string, any> = {};
    for (const option of i.options.data) {
      if (option.type === 1) {
        if (option.name) {
          args[option.name] = option.options?.map(x =>
            x.value ? { [x.name]: x.value } : null
          ).filter(Boolean) || [];
        }
      } else if (option.value) {
        args[option.name] = option.value;
      }
    }

    const cooldownKey = `${i.user.id}_${cmd.name}`;
    const remainingCooldown = cooldowns[cooldownKey] - Date.now();

    if (remainingCooldown > 0) {
      const embed = new EmbedBuilder()
        .setTitle("Calm Down..")
        .setDescription(
          `You just used that command. Try again in ${Math.round(remainingCooldown / 1000)} seconds`
        )
        .setColor("Red");
      return i.reply({ embeds: [embed], ephemeral: true });
    }

    cooldowns[cooldownKey] = Date.now() + (cmd.cooldown || 0);

    logger.info(`${i.user.tag} used /${cmd.name}`);
    await cmd.execute(i, args, client);
  } catch (error) {
    console.error('Command execution error:', error);
    const content = i.replied || i.deferred
      ? { content: '⚠️ An error occurred during execution', ephemeral: true }
      : { content: '⚠️ An error occurred during execution', ephemeral: true };

    return i.reply(content).catch(console.error);
  }
};