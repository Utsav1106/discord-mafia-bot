import guildModel from "@/models/guild";
import { Command } from "@/types/utils";
import { getGuild } from "@/utils/guild";
import { EmbedBuilder } from "discord.js";

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
        await i.deferReply(i.guild ? { ephemeral: true } : { ephemeral: false })
        
        let guildId = '738394656211206234'
        if (i.guild) guildId = i.guild.id

        let guild = await getGuild(guildId);

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
            if (!lines) lines = []
            if (!lines[args.index - 1]) {
                await i.editReply({ content: `There is no line ${args.index}` })
                return
            }
            lines = lines.filter((_, i) => i !== args.index - 1)
            guild.wills[i.user.id] = lines
            await guildModel.findOneAndUpdate({ guildId: guildId }, { $set: { wills: guild.wills } }, { upsert: true })
            const embed = new EmbedBuilder()
                .setTitle(`Your will has been updated.`)
                .setDescription(lines.map((x, i) => `(Line ${i + 1}) ${x}`).join('\n'))
                .setColor('Green')
                .setThumbnail(i.user.displayAvatarURL())
            await i.editReply({ embeds: [embed] })
            return
        }
    }
} as Command