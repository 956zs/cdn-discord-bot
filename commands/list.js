const { SlashCommandBuilder } = require('@discordjs/builders');
const fileManager = require('../utils/fileManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all uploaded files'),
    async execute(interaction) {
        const guildId = interaction.guildId;

        fileManager.listFiles(guildId, (error, files) => {
            if (error) {
                console.error(error);
                return interaction.reply('Error listing the files.');
            }

            if (files.length === 0) {
                return interaction.reply('No files found.');
            }

            const fileList = files.join('\n');
            interaction.reply(`Files:\n${fileList}`);
        });
    }
};
