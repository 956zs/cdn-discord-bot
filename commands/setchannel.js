const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Set the default channel for file operations')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to set as default')
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guildId;
        const filePath = path.join(__dirname, '..', 'data', 'guilds.json');

        let guildData = {};
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                guildData = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error reading guilds.json:', error);
            return interaction.reply('Error reading configuration file.');
        }

        guildData[guildId] = { channelId: channel.id };

        try {
            fs.writeFileSync(filePath, JSON.stringify(guildData, null, 2), 'utf-8');
            console.log('Guild data written to file:', guildData); // 调试信息
            await interaction.reply(`Default channel set to ${channel.name}`);
        } catch (error) {
            console.error('Error writing to guilds.json:', error);
            await interaction.reply('Failed to set the default channel.');
        }
    }
};
