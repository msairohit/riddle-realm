const fs = require('fs');
const https = require('https');
const path = require('path');

const soundsDir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
}

const SOUND_URLS = {
    click: 'https://cdn.pixabay.com/audio/2022/03/10/audio_270f37b60e.mp3',
    swipe: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8b55e4c0e0.mp3',
    correct: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
    wrong: 'https://cdn.pixabay.com/audio/2021/08/09/audio_da2d5a9bf8.mp3',
    near: 'https://cdn.pixabay.com/audio/2022/09/12/audio_d25b66083c.mp3',
    bookmark: 'https://cdn.pixabay.com/audio/2022/03/24/audio_4b515a4c73.mp3',
    hint: 'https://cdn.pixabay.com/audio/2022/01/19/audio_39b4c87c50.mp3',
    bgmusic: 'https://cdn.pixabay.com/audio/2024/02/28/audio_0aaf8e81a4.mp3',
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        };
        https.get(url, options, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function run() {
    for (const [name, url] of Object.entries(SOUND_URLS)) {
        console.log(`Downloading ${name}...`);
        try {
            await download(url, path.join(soundsDir, `${name}.mp3`));
            console.log(`Success: ${name}.mp3`);
        } catch (e) {
            console.error(`Error downloading ${name}:`, e.message);
        }
    }
}

run();
