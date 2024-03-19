import Discord from 'discord.js';
const { EmbedBuilder, Client } = Discord;
import GuildSchema from '../../database/guildSchema.js';

export default {
    name: "party",
    description: "See who's in the party!",
    category: "mafia",
    cooldown: 5000,
    dmPermission: false,
    /**
    * @param {Client} client
    */
    async execute(i, args, client) {
        await i.deferReply()
        let guild = await GuildSchema.findOne({ guildId: i.guild.id })
        if (!guild) guild = await GuildSchema.create({ guildId: i.guild.id })
        guild.party = guild.party.filter(x => x)
        guild.markModified('party')
        await guild.save()
        if (!guild.party.length) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`There's no party lmao😅`)
                .setColor('Red')
            return i.followUp({ embeds: [embed] })
        } else {
            const embed = new EmbedBuilder()
                .setTitle(`🎊 │ \`Dank Zone\`'s Mafia Party`)
                .setDescription(`\u200b`)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields({
                    name: `Players(${guild.party.length}) 🕵️‍♂️`,
                    value: guild.party.map((x, i) => `🔸 │ ${i === 0 ? 'Party leader: ' : ''}<@${x.userId}>`).join('\n'),
                    inline: true
                })
                .addFields({
                    name: 'Current gamemode 🎮',
                    value: `\`${guild.gameMode}\` ✅`,
                    inline: true
                })
                .setFooter({text: 'When you\'re ready type /setup to start!'})
                .setColor('Green')
            return i.followUp({ embeds: [embed] })
        }
    }
}
