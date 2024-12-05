import guildModel from "@/models/guild";
import { Command } from "@/types/utils";
import { getGuild } from "@/utils/guild";
import { EmbedBuilder } from "discord.js";

export default {
    name: "clear",
    description: "Clear the mafia party...",
    category: "mafia",
    dmPermission: false,
    cooldown: 10000,
    async execute(i, _, client) {
        await i.deferReply()

        let guild = await getGuild(i.guild.id);

        let userInParty = guild.party.find(z => z.userId === i.user.id)
        if (!userInParty) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`You are not in the party.`)
                .setColor('Red')
            await i.editReply({ embeds: [embed] })
            return
        } else {
            if (guild.currentGame.status) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`Game has already been setup, you cannot clear now.`)
                    .setColor('Red')
                await i.editReply({ embeds: [embed] })
                return
            }
            await guildModel.findOneAndUpdate({ guildId: i.guild.id }, { $set: { party: [] } })
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`The current party is now cleared.`)
                .setColor('Red')
            await i.editReply({ embeds: [embed] })
            return
        }
    }
} as Command;
