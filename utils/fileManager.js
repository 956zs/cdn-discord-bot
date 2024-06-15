const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

module.exports = {
    uploadFile: async (url, guildId, filename, callback) => {
        const dir = path.join(__dirname, '..', 'uploads', guildId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const response = await fetch(url);
        const totalBytes = parseInt(response.headers.get('content-length'), 10);

        if (totalBytes > 8 * 1024 * 1024) { // 8 MB
            let partNumber = 0;
            let downloadedBytes = 0;
            const reader = response.body.getReader();

            while (downloadedBytes < totalBytes) {
                partNumber++;
                const partFileName = `${filename}.part${partNumber}`;
                const partFilePath = path.join(dir, partFileName);
                const partStream = fs.createWriteStream(partFilePath);
                let receivedBytes = 0;

                while (receivedBytes < 8 * 1024 * 1024) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    receivedBytes += value.length;
                    partStream.write(value);
                }

                downloadedBytes += receivedBytes;
                partStream.close();
            }
        } else {
            const fileStream = fs.createWriteStream(path.join(dir, filename));
            await pipeline(response.body, fileStream);
        }

        callback();
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
    downloadFile: async (guildId, filename, callback) => {
        const dir = path.join(__dirname, '..', 'uploads', guildId);
        const partFiles = fs.readdirSync(dir).filter(file => file.startsWith(filename));

        if (partFiles.length > 1) {
            const combinedFilePath = path.join(dir, `combined_${filename}`);
            const writeStream = fs.createWriteStream(combinedFilePath);

            for (const partFile of partFiles) {
                const partFilePath = path.join(dir, partFile);
                const readStream = fs.createReadStream(partFilePath);
                await pipeline(readStream, writeStream);
            }

            callback(null, combinedFilePath);
        } else {
            callback(null, path.join(dir, filename));
        }
    }
};
