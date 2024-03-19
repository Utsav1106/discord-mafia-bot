import Discord from 'discord.js';
const { EmbedBuilder } = Discord;
import GuildSchema from '../../database/guildSchema.js';

export default {
    name: "will",
    description: "Shows your will",
    category: "mafia",
    dmPermission: true,
    cooldown: 1000,
    async execute(i, args, client) {
        await i.deferReply(i.guild ? {ephemeral: true} : {ephemeral: false})
        let guildId = '738394656211206234'
        if (i.guild) guildId = i.guild.id

        let guild = await GuildSchema.findOne({ guildId: guildId })
        if (!guild) guild = await GuildSchema.create({ guildId: guildId })
        let userInParty = guild.party.find(z => z.userId === i.user.id)
        if (!userInParty) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`You are not in the game.`)
                .setColor('Red')
            return i.editReply({ embeds: [embed] })
        } else {
            if (!guild.currentGame.status || !guild.currentGame.started) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`No game has been started yet.`)
                    .setColor('Red')
                return i.editReply({ embeds: [embed] })
            }
            let lines = guild.wills[i.user.id]
        
            const embed = new EmbedBuilder()
                .setTitle(`${i.user.username}'s will`)
                .setDescription(lines ? lines.map((x, i) => `(Line ${i + 1}) ${x}`).join('\n') : 'You have not written anything yet')
                .setColor('Green')
                .setThumbnail(i.user.displayAvatarURL())
            return i.editReply({ embeds: [embed] })
        }
    }
};
