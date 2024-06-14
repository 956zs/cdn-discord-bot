const fs = require('fs');
const https = require('https');
const path = require('path');
const { splitFile, mergeChunks } = require('./chunkManager');

module.exports = {
    uploadFile: (url, guildId, filename, chunkSize, callback) => {
        const dir = path.join(__dirname, '..', 'uploads', guildId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const dest = path.join(dir, filename);
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    const chunks = splitFile(dest, chunkSize);
                    callback(chunks);
                });
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
        const chunkPaths = chunkFiles.map(file => path.join(dir, file));
        const outputPath = path.join(dir, outputFilename);
        mergeChunks(chunkPaths, outputPath);
        return outputPath;
    }
};
