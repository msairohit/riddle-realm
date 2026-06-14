const fs = require('fs');
const https = require('https');
const path = require('path');

const soundsDir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
}

const SOUND_URLS = {
    click: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/button-3.mp3',
    swipe: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/swipe-1.mp3',
    correct: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/success-1.mp3',
    wrong: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/error-1.mp3',
    near: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/warning-1.mp3',
    bookmark: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/bell-1.mp3',
    hint: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/magic-1.mp3',
    // For bgmusic, let's use a public domain or creative commons loop from another repo or just a placeholder for now
    bgmusic: 'https://raw.githubusercontent.com/rse/soundfx/master/soundfx.d/theme-1.mp3',
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
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
