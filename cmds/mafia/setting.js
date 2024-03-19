import Discord from 'discord.js';
const { EmbedBuilder, Client, AttachmentBuilder, Interaction, ButtonBuilder, ActionRowBuilder } = Discord;

import { roles, gameModes } from '../../tools/jsons.js';
import GuildSchema from '../../database/guildSchema.js';

export default {
    name: "setting",
    dmPermission: false,
    description: "Shows the current setting of the server.",
    category: "mafia",
    cooldown: 25000,
    /**
    * @param {Interaction} i
    * @param {Client} client
    */
    async execute(i, args, client) {
        await i.deferReply()
        let guild = await GuildSchema.findOne({ guildId: i.guild.id })
        if (!guild) guild = await GuildSchema.create({ guildId: i.guild.id })

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
                value: (guild.dmTime/1000).toString(),
                inline: true
            })
            .addFields({
                name: 'Vote Time',
                value: (guild.voteTime/1000).toString(),
                inline: true
            })
            .addFields({
                name: 'Talk Time',
                value: (guild.talkTime/1000).toString(),
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
            .setFooter({text: 'NOTE: Wills are only available when showDeadRole setting is off.'})
        return i.followUp({ embeds: [embed] })
    }
}