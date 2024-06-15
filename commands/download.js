const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('download')
        .setDescription('Download a file from the server'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        const filesPath = path.join(__dirname, '..', 'backups', guildId);
        
        if (!fs.existsSync(filesPath)) {
            return interaction.reply('No backup files found.');
        }

        const files = fs.readdirSync(filesPath);
        const fileChunks = chunkArray(files, 25); // Discord allows max 25 options in a select menu
        
        let currentPage = 0;
        
        const createPage = (page) => {
            const options = fileChunks[page].map(file => (
                new StringSelectMenuOptionBuilder()
                    .setLabel(file)
                    .setValue(file)
            ));
            
            const menu = new StringSelectMenuBuilder()
                .setCustomId('select')
                .setPlaceholder('Select a file')
                .addOptions(options);
            
            const row = new ActionRowBuilder().addComponents(menu);
            
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === fileChunks.length - 1)
            );

            return { components: [row, buttons] };
        };
        
        await interaction.reply(createPage(currentPage));

        const filter = i => i.customId === 'select' || i.customId === 'previous' || i.customId === 'next';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'previous') {
                currentPage--;
                await i.update(createPage(currentPage));
            } else if (i.customId === 'next') {
                currentPage++;
                await i.update(createPage(currentPage));
            } else if (i.customId === 'select') {
                const selectedFile = i.values[0];
                const filePath = path.join(filesPath, selectedFile);
                await i.update({ content: `Downloading ${selectedFile}...`, components: [] });
                await interaction.followUp({ files: [{ attachment: filePath, name: selectedFile }] });
                collector.stop();
            }
        });

        collector.on('end', collected => {
            interaction.editReply({ components: [] }).catch(console.error);
        });
    },
};

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
