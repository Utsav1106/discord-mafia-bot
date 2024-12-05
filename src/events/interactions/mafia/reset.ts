import {
    Client,
    Interaction,
    EmbedBuilder,
    ButtonInteraction,
} from 'discord.js';
import guildModel from '@/models/guild';

export default async (client: Client, i: Interaction): Promise<void> => {
    if (!i.isButton()) return;

    try {
        if (!i.customId.includes('reset_mafia_')) {
            return;
        }

        if (!i.customId.endsWith(i.user.id)) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({
                    name: client.user?.username ?? 'Error',
                    iconURL: client.user?.displayAvatarURL(),
                })
                .setDescription('This button is not for you.');

            await i.reply({ embeds: [embed], ephemeral: true });
            return;
        }


        if (i.customId.startsWith('cancel_reset_mafia_')) {
            const embed = new EmbedBuilder()
                .setTitle('Action Cancelled')
                .setDescription('The reset operation has been successfully cancelled.')
                .setColor('Red');

            await i.update({ embeds: [embed], components: [] });

        } else if (i.customId.startsWith('reset_mafia_')) {
            await handleGameReset(i);
        }

    } catch (error) {
        console.error('An error occurred in the mafia reset interaction:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Oops! Something went wrong.')
            .setDescription('An unexpected error occurred. Please try again later.');

        if (i.replied || i.deferred) {
            await i.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await i.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};


export const handleGameReset = async (interaction: ButtonInteraction) => {
    let guild = interaction.guild;
    if (!guild) {
        await interaction.reply({ content: 'You can only reset mafia in a server.', ephemeral: true });
        return;
    }
    const guildData = await guildModel.findOne({ guildId: guild.id });
    const channelId = guildData?.currentGame?.channelId;

    await guildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $set: { currentGame: {}, party: [] } }
    );

    if (channelId) {
        try {
            const channel = await guild.channels.fetch(channelId);
            await channel?.delete('Mafia game has been reset.');
        } catch (err) {
            console.error(`Failed to delete old mafia game channel (${channelId}):`, err);
        }
    }

    const successEmbed = new EmbedBuilder()
        .setTitle('Game Reset Successfully')
        .setDescription('The game has been reset. All roles and parties have been cleared.')
        .setColor('Green');

    await interaction.update({ embeds: [successEmbed], components: [] });
}