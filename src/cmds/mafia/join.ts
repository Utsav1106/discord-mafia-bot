import guildModel from "@/models/guild";
import { getGuild } from "@/utils/guild";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";

export default {
    name: "join",
    description: "Join the party in the server!",
    category: "mafia",
    dmPermission: false,
    cooldown: 10000,
    async execute(i: CommandInteraction, _: {}, client: Client) {
        
        await i.deferReply()
        if (!i.guild) throw new Error('This command can only be used in a server.');
        if (!client.user) throw new Error('Client user not found.');

        let guild = await getGuild(i.guild.id);

        let userInParty = guild.party.find(z => z.userId === i.user.id)
        if (userInParty) {
            const embed = new EmbedBuilder()
                .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                .setDescription(`You are already in the party.`)
                .setColor('Red')
            return i.editReply({ embeds: [embed] })
        } else {
            if (guild.currentGame.status) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`Game has already been setup, you cannot join now.`)
                    .setColor('Red')
                return i.editReply({ embeds: [embed] })
            }

            if (guild.party.length >= 20) {
                const embed = new EmbedBuilder()
                    .setAuthor({ iconURL: client.user.displayAvatarURL(), name: client.user.username })
                    .setDescription(`Sorry. The max number of players is 19.`)
                    .setColor('Red')
                return i.editReply({ embeds: [embed] })
            }
            await guildModel.findOneAndUpdate({ guildId: i.guild.id }, { $push: { party: { userId: i.user.id, displayName: i.user.tag, username: i.user.username } } })
            const embed = new EmbedBuilder()
                .setTitle(`${i.user.username} has joined the party`)
                .setDescription(`🥳 │ Party Size: \`${guild.party.length + 1}\`\n🎲 │ Current Mode : \`${guild.gameMode}\`\n\nType /party to see who's in the party!`)
                .setThumbnail(i.user.displayAvatarURL())
                .setColor('Green')
            return i.editReply({ embeds: [embed] })
        }
    }
};
