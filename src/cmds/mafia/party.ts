import { Command } from "@/types/utils"
import { getGuild } from "@/utils/guild"
import { EmbedBuilder } from "discord.js"

export default {
    name: "party",
    description: "See who's in the party!",
    category: "mafia",
    cooldown: 5000,
    dmPermission: false,
    async execute(i, _, client) {
        await i.deferReply()
        let guild = await getGuild(i.guild.id);
        guild.party = guild.party.filter(x => x)
        guild.markModified('party')
        await guild.save()
        if (!guild.party.length) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`There's no party lmao😅`)
                .setColor('Red')
            await i.followUp({ embeds: [embed] })
            return
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
                .setFooter({ text: 'When you\'re ready type /setup to start!' })
                .setColor('Green')
            return i.followUp({ embeds: [embed] })
        }
    }
} as Command