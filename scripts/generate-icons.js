const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/lo-chat.svg');
const outputDir = path.join(__dirname, '../public/icons');


if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
    for (const size of sizes) {
        const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
        await sharp(inputSvg)
            .resize(size, size)
            .png()
            .toFile(outputPath);
        console.log(`Generated ${size}x${size} icon`);
    }
}

generateIcons().catch(console.error); 