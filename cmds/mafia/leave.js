import Discord from 'discord.js';
const { EmbedBuilder } = Discord;
import GuildSchema from '../../database/guildSchema.js';

export default {
    name: "leave",
    description: "Leave the mafia party...",
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
            return i.followUp({ embeds: [embed] })
        } else {
            if (guild.currentGame.status) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`Game has already been setup, you cannot leave now.`)
                    .setColor('Red')
                return i.followUp({ embeds: [embed] })
            }
            guild.party = guild.party.filter(z => z.userId !== i.user.id)
            guild.markModified('party')
            await guild.save()
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`${i.user.username} left the party.`)
                .setColor('Red')
            return i.followUp({ embeds: [embed] })
        }
    }
};
