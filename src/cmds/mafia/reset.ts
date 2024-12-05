import { Command } from "@/types/utils";
import { getGuild } from "@/utils/guild";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";

export default {
    name: "reset",
    dmPermission: false,
    description: "Deletes mafia channel, clear the party. Do this to rest the party!",
    category: "mafia",
    defaultMemberPermission: "8",
    cooldown: 25000,
    async execute(i, _, client) {
        await i.deferReply()
        await getGuild(i.guild.id);

        const resetBtn = new ButtonBuilder()
            .setCustomId(`reset_mafia_${i.user.id}`)
            .setLabel('Confirm')
            .setStyle(3)
        const cancelBtn = new ButtonBuilder()
            .setCustomId(`cancel_reset_mafia_${i.user.id}`)
            .setLabel('Cancel')
            .setStyle(2)

        const row = new ActionRowBuilder()
            .addComponents(resetBtn, cancelBtn)

        const embed = new EmbedBuilder()
            .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
            .setDescription(`IMPORTANT: You are resetting the bot's current game status on this server. Everything will reset except players' progresses. If you have any current games playing right now it can really mess everything up. Do you wish to proceed?`)
            .setColor('Red')
        await i.followUp({ embeds: [embed], components: [row as any] })
    }
} as Command