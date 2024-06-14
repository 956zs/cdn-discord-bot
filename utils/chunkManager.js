const fs = require('fs');
const path = require('path');

module.exports = {
    splitFile: (filePath, chunkSize) => {
        const fileBuffer = fs.readFileSync(filePath);
        const chunks = [];
        let chunkIndex = 0;

        for (let i = 0; i < fileBuffer.length; i += chunkSize) {
            const chunk = fileBuffer.slice(i, i + chunkSize);
            const chunkPath = `${filePath}.part${chunkIndex}`;
            fs.writeFileSync(chunkPath, chunk);
            chunks.push(chunkPath);
            chunkIndex++;
        }

        return chunks;
    },
    mergeChunks: (chunkPaths, outputPath) => {
        const writeStream = fs.createWriteStream(outputPath);
        chunkPaths.forEach(chunkPath => {
            const chunkBuffer = fs.readFileSync(chunkPath);
            writeStream.write(chunkBuffer);
        });
        writeStream.end();
    }
};
