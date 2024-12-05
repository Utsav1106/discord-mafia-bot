import { Command } from "@/types/utils";
import { getGuild } from "@/utils/guild";
import { EmbedBuilder } from "discord.js";

export default {
    name: "leave",
    description: "Leave the mafia party...",
    category: "mafia",
    dmPermission: false,
    cooldown: 10000,
    async execute(i, _, client) {
        await i.deferReply()
        if (!i.guild) throw new Error('This command can only be used in a server.');
        if (!client.user) throw new Error('Client user not found.');

        let guild = await getGuild(i.guild.id);

        let userInParty = guild.party.find(z => z.userId === i.user.id)
        if (!userInParty) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`You are not in the party.`)
                .setColor('Red')
            await i.followUp({ embeds: [embed] })
            return
        } else {
            if (guild.currentGame.status) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`Game has already been setup, you cannot leave now.`)
                    .setColor('Red')
                await i.followUp({ embeds: [embed] })
                return
            }
            guild.party = guild.party.filter(z => z.userId !== i.user.id)
            guild.markModified('party')
            await guild.save()
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`${i.user.username} left the party.`)
                .setColor('Red')
            await i.followUp({ embeds: [embed] })
            return
        }
    }
} as Command