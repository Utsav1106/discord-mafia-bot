import Discord from 'discord.js';
const { Client, Interaction, EmbedBuilder } = Discord;

import GuildSchema from './../../../database/guildSchema.js';
/**
* @param {Client} client 
* @param {Interaction} i
*/
export default async (client, i) => {
    try {
        if (i.isButton()) {
            if (i.customId.includes('reset_mafia_')) {
                if (i.customId.endsWith(i.user.id)) {
                    if (i.customId.startsWith('cancel_reset_mafia_')) {
                        const embed = new EmbedBuilder()
                            .setTitle('Cancelled')
                            .setDescription('Your action has been cancelled')
                            .setColor('Red')

                        return i.update({ embeds: [embed], components: [] })
                    }
                    if (i.customId.startsWith('reset_mafia_')) {
                        let guild = await GuildSchema.findOne({guildId: i.guild.id})
                        await GuildSchema.findOneAndUpdate({ guildId: i.guild.id }, { $set: { currentGame: {}, party: [] } })
                        let channel;
                        try {
                            channel = await i.guild.channels.fetch(guild.currentGame.channelId)
                            await channel.delete()
                        } catch (err) {
                            console.log(channel)
                        }
                        return i.update({
                            embeds: [new EmbedBuilder()
                                .setTitle('Successfully resetted')
                                .setDescription('Reset complete. All conditions are cleared.')
                                .setColor('Green')],
                            components: []
                        })
                    }
                } else {
                    const embed = new EmbedBuilder()
                        .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                        .setDescription(`This is not for you.`)
                        .setColor('Red')
                    i.reply({ embeds: [embed], ephemeral: true })
                }
            }
        }
    } catch {

    }
}