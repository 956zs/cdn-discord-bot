const { SlashCommandBuilder } = require('@discordjs/builders');
const fileManager = require('../utils/fileManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload a file to the server')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('The file to upload')
                .setRequired(true)),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment('file');
        const guildId = interaction.guildId;
        const filePath = path.join(__dirname, '..', 'data', 'guilds.json');

        let guildData = {};
        try {
            if (fs.existsSync(filePath)) {
                guildData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } else {
                return interaction.reply('Please set a default channel first using /setchannel.');
            }
        } catch (error) {
            console.error('Error reading guilds.json:', error);
            return interaction.reply('Error reading configuration file.');
        }

        if (!guildData[guildId] || !guildData[guildId].channelId) {
            return interaction.reply('Please set a default channel first using /setchannel.');
        }

        const defaultChannelId = guildData[guildId].channelId;
        const channel = interaction.guild.channels.cache.get(defaultChannelId);

        if (!channel) {
            return interaction.reply('Default channel not found.');
        }

        fileManager.uploadFile(attachment.url, guildId, attachment.name, () => {
            interaction.reply(`File ${attachment.name} uploaded successfully!`);
        });
    }
};
