const { SlashCommandBuilder } = require('@discordjs/builders');
const fileManager = require('../utils/fileManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all uploaded files'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        fileManager.listFiles(guildId, (err, files) => {
            if (err) {
                return interaction.reply('Unable to list files.');
            }
            if (files.length === 0) {
                return interaction.reply('No files found.');
            }
            interaction.reply(`Files: \n${files.join('\n')}`);
        });
    }
};
