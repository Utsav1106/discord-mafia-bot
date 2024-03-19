import Discord from 'discord.js';
const { EmbedBuilder } = Discord;
import GuildSchema from '../../database/guildSchema.js';

export default {
    name: "clear",
    description: "Clear the mafia party...",
    category: "mafia",
    dmPermission: false,
    cooldown: 10000,
    async execute(i, args, client) {
        await i.deferReply()
        let guild = await GuildSchema.findOne({ guildId: i.guild.id })
        if (!guild) guild = await GuildSchema.create({ guildId: i.guild.id })
        let userInParty = guild.party.find(z => z.userId === i.user.id)
        if (!userInParty) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`You are not in the party.`)
                .setColor('Red')
            return i.editReply({ embeds: [embed] })
        } else {
            if (guild.currentGame.status) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`Game has already been setup, you cannot clear now.`)
                    .setColor('Red')
                return i.editReply({ embeds: [embed] })
            }
            await GuildSchema.findOneAndUpdate({guildId: i.guild.id}, {$set: {party: []}})
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`The current party is now cleared.`)
                .setColor('Red')
            return i.editReply({ embeds: [embed] })
        }
    }
};
