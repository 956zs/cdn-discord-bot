const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const { 
    DefaultWebSocketManagerOptions: { 
        identifyProperties 
    } 
} = require("@discordjs/ws");

identifyProperties.browser = "Discord Android"; // or "Discord iOS"

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select-file') {
            const selectedFile = interaction.values[0];
            const guildId = interaction.guildId;

            fileManager.downloadFile(guildId, selectedFile, (error, filePath) => {
                if (error) {
                    console.error(error);
                    return interaction.reply('Error downloading the file.');
                }

                interaction.update({
                    content: `File ${selectedFile} downloaded successfully!`,
                    files: [{
                        attachment: filePath,
                        name: selectedFile
                    }],
                    components: []
                });
            });
        }
    } else if (interaction.isButton()) {
        const command = client.commands.get('download');
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
