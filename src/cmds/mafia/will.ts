import { Command } from "@/types/utils"
import { getGuild } from "@/utils/guild.js"
import { EmbedBuilder } from "discord.js"

export default {
    name: "will",
    description: "Shows your will",
    category: "mafia",
    dmPermission: true,
    cooldown: 1000,
    async execute(i, _, client) {
        await i.deferReply(i.guild ? { ephemeral: true } : { ephemeral: false })
        let guildId = '738394656211206234'
        if (i.guild) guildId = i.guild.id

        let guild = await getGuild(guildId)
        let userInParty = guild.party.find(z => z.userId === i.user.id)
        if (!userInParty) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`You are not in the game.`)
                .setColor('Red')
            await i.editReply({ embeds: [embed] })
            return
        } else {
            if (!guild.currentGame.status || !guild.currentGame.started) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`No game has been started yet.`)
                    .setColor('Red')
                await i.editReply({ embeds: [embed] })
                return
            }
            let lines = guild.wills[i.user.id]

            const embed = new EmbedBuilder()
                .setTitle(`${i.user.username}'s will`)
                .setDescription(lines ? lines.map((x, i) => `(Line ${i + 1}) ${x}`).join('\n') : 'You have not written anything yet')
                .setColor('Green')
                .setThumbnail(i.user.displayAvatarURL())
            await i.editReply({ embeds: [embed] })
        }
    }
} as Command