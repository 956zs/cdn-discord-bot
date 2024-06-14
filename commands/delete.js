const { SlashCommandBuilder } = require('@discordjs/builders');
const fileManager = require('../utils/fileManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Delete a file from the server')
        .addStringOption(option =>
            option.setName('filename')
                .setDescription('The name of the file to delete')
                .setRequired(true)),
    async execute(interaction) {
        const filename = interaction.options.getString('filename');
        const guildId = interaction.guildId;

        if (fileManager.fileExists(guildId, filename)) {
            fileManager.deleteFile(guildId, filename, err => {
                if (err) {
                    return interaction.reply('Error deleting file.');
                }
                interaction.reply('File deleted successfully.');
            });
        } else {
            interaction.reply('File not found.');
        }
    }
};
