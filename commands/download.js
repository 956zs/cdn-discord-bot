const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const fileManager = require('../utils/fileManager');
const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('download')
        .setDescription('Download a file from the server'),
    async execute(interaction) {
        const guildId = interaction.guildId;

        fileManager.listFiles(guildId, async (err, files) => {
            if (err) {
                return interaction.reply('Unable to list files.');
            }
            if (files.length === 0) {
                return interaction.reply('No files found.');
            }

            const options = files.map(file => ({
                label: file,
                value: file,
            }));

            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId('selectFile')
                    .setPlaceholder('Select a file to download')
                    .addOptions(options)
            );

            await interaction.reply({ content: 'Please select a file to download:', components: [row], ephemeral: true });

            const filter = i => i.customId === 'selectFile' && i.user.id === interaction.user.id;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const filename = i.values[0];

                const filePath = path.join(__dirname, '..', 'data', 'guilds.json');
                let guildData = {};
                try {
                    if (fs.existsSync(filePath)) {
                        const data = fs.readFileSync(filePath, 'utf-8');
                        guildData = JSON.parse(data);
                    } else {
                        return i.reply('Please set a default channel first using /setchannel.');
                    }
                } catch (error) {
                    console.error('Error reading guilds.json:', error);
                    return i.reply('Error reading configuration file.');
                }

                if (!guildData[guildId] || !guildData[guildId].channelId) {
                    return i.reply('Please set a default channel first using /setchannel.');
                }

                const defaultChannelId = guildData[guildId].channelId;
                const channel = interaction.guild.channels.cache.get(defaultChannelId);

                if (!channel) {
                    return i.reply('Default channel not found.');
                }

                const messages = await channel.messages.fetch({ limit: 100 });
                const fileChunks = messages.filter(msg => msg.attachments.size > 0)
                    .map(msg => msg.attachments.first())
                    .filter(attachment => attachment.name.startsWith(filename))
                    .sort((a, b) => a.name.localeCompare(b.name));

                const chunkFiles = [];
                for (const file of fileChunks) {
                    const dest = path.join(__dirname, '..', 'uploads', guildId, file.name);
                    const writeStream = fs.createWriteStream(dest);
                    https.get(file.url, response => {
                        response.pipe(writeStream);
                        writeStream.on('finish', () => {
                            writeStream.close();
                        });
                    });
                    chunkFiles.push(file.name);
                }

                const outputFilePath = fileManager.mergeChunks(guildId, chunkFiles, filename);
                await i.update({ content: `File ${filename} downloaded successfully!`, files: [outputFilePath], components: [] });

                // Clean up chunk files after merging
                chunkFiles.forEach(file => fs.unlinkSync(path.join(__dirname, '..', 'uploads', guildId, file)));
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply('No file selected.');
                }
            });
        });
    }
};
