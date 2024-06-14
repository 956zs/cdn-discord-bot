const { SlashCommandBuilder } = require('@discordjs/builders');
const fileManager = require('../utils/fileManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('download')
        .setDescription('Download a file from the server')
        .addStringOption(option =>
            option.setName('filename')
                .setDescription('The name of the file to download')
                .setRequired(true)),
    async execute(interaction) {
        const filename = interaction.options.getString('filename');
        const guildId = interaction.guildId;

        if (fileManager.fileExists(guildId, filename)) {
            const filePath = path.join(__dirname, '..', 'uploads', guildId, filename);
            interaction.reply({ files: [filePath] });
        } else {
            interaction.reply('File not found.');
        }
    }
};
