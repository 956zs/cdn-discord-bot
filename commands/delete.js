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

        if (!fileManager.fileExists(guildId, filename)) {
            return interaction.reply('File not found.');
        }

        fileManager.deleteFile(guildId, filename, (error) => {
            if (error) {
                console.error(error);
                return interaction.reply('Error deleting the file.');
            }

            interaction.reply(`File ${filename} deleted successfully!`);
        });
    }
};
