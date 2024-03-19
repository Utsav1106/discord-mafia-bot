import Discord from 'discord.js';
const { EmbedBuilder } = Discord;
import GuildSchema from '../../database/guildSchema.js';

export default {
    name: "erase",
    description: "Write a line on your will",
    category: "mafia",
    dmPermission: true,
    cooldown: 1000,
    options: [
        {
            name: "index",
            description: "...",
            required: true,
            type: 10,
        }
    ],
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
            if(!lines) lines =[]
            if(!lines[args.index-1]) {
                return i.editReply({ content: `There is no line ${args.index}` })
            }
            lines = lines.filter((x, i) => i !== args.index-1)
            guild.wills[i.user.id] = lines
            await GuildSchema.findOneAndUpdate({ guildId: guildId }, { $set: {wills: guild.wills } }, {upsert: true})
            const embed = new EmbedBuilder()
                .setTitle(`Your will has been updated.`)
                .setDescription(lines.map((x, i) => `(Line ${i + 1}) ${x}`).join('\n'))
                .setColor('Green')
                .setThumbnail(i.user.displayAvatarURL())
            return i.editReply({ embeds: [embed] })
        }
    }
};
