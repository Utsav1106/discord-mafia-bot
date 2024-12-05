import { Command } from "@/types/utils"
import { getGuild } from "@/utils/guild"
import { EmbedBuilder } from "discord.js"

export default {
    name: "setting",
    dmPermission: false,
    description: "Shows the current setting of the server.",
    category: "mafia",
    cooldown: 25000,
    async execute(i, _, client) {
        await i.deferReply()
        let guild = await getGuild(i.guild.id)

        const embed = new EmbedBuilder()
            .setTitle(`Current settings on ${i.guild.name}`)
            .setDescription(`Customizable settings for ${client.user.username}!`)
            .setColor('Blue')
            .addFields({
                name: 'Game Mode',
                value: guild.gameMode,
                inline: true
            })
            .addFields({
                name: 'DM Time',
                value: (guild.dmTime / 1000).toString(),
                inline: true
            })
            .addFields({
                name: 'Vote Time',
                value: (guild.voteTime / 1000).toString(),
                inline: true
            })
            .addFields({
                name: 'Talk Time',
                value: (guild.talkTime / 1000).toString(),
                inline: true
            })
            .addFields({
                name: 'Category',
                value: guild.categoryId ? guild.categoryId : 'None',
                inline: true
            })
            .addFields({
                name: 'Show dead role',
                value: guild.showDeadRole.toString(),
                inline: true
            })
            .addFields({
                name: 'Anamoly',
                value: guild.anamoly.toString(),
                inline: true
            })
            .setFooter({ text: 'NOTE: Wills are only available when showDeadRole setting is off.' })
        await i.followUp({ embeds: [embed] })
    }
} as Command