const fs = require('fs');
const https = require('https');
const path = require('path');

module.exports = {
    uploadFile: (url, guildId, filename, callback) => {
        const dir = path.join(__dirname, '..', 'uploads', guildId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const dest = path.join(dir, filename);
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(callback);
            });
        });
    },
    listFiles: (guildId, callback) => {
        const dir = path.join(__dirname, '..', 'uploads', guildId);
        if (!fs.existsSync(dir)) {
            return callback(null, []);
        }
        fs.readdir(dir, callback);
    },
    deleteFile: (guildId, filename, callback) => {
        const filepath = path.join(__dirname, '..', 'uploads', guildId, filename);
        fs.unlink(filepath, callback);
    },
    fileExists: (guildId, filename) => {
        const filepath = path.join(__dirname, '..', 'uploads', guildId, filename);
        return fs.existsSync(filepath);
    },
    mergeChunks: (guildId, chunkFiles, outputFilename) => {
        const dir = path.join(__dirname, '..', 'uploads', guildId);
        const outputFilePath = path.join(dir, outputFilename);
        const writeStream = fs.createWriteStream(outputFilePath);

        chunkFiles.forEach(chunkFile => {
            const chunkFilePath = path.join(dir, chunkFile);
            const data = fs.readFileSync(chunkFilePath);
            writeStream.write(data);
        });

        writeStream.end();
        return outputFilePath;
    }
};
