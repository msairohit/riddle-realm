const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function generateWav(frequency, durationMs, type) {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const numSamples = Math.floor((durationMs / 1000) * sampleRate);
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = numSamples * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        let t = i / sampleRate;
        let val = 0;
        
        if (type === 'sine') {
            val = Math.sin(2 * Math.PI * frequency * t);
        } else if (type === 'square') {
            val = Math.sign(Math.sin(2 * Math.PI * frequency * t));
        } else if (type === 'triangle') {
            val = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
        } else if (type === 'noise') {
            val = Math.random() * 2 - 1;
        }
        
        // basic envelope
        let envelope = Math.max(0, 1 - (i / numSamples));
        val = val * envelope * 0.3; // volume
        
        let sample = Math.max(-1, Math.min(1, val));
        sample = sample < 0 ? sample * 32768 : sample * 32767;
        view.setInt16(offset, sample, true);
        offset += 2;
    }

    return Buffer.from(buffer);
}

const sounds = {
    click: generateWav(800, 50, 'sine'),
    swipe: generateWav(400, 100, 'noise'),
    wrong: generateWav(150, 300, 'square'),
    near: generateWav(400, 200, 'triangle'),
    bookmark: generateWav(600, 150, 'sine'),
    hint: generateWav(800, 200, 'sine'),
    bgmusic: generateWav(200, 1000, 'sine') // fallback small file
};

for (const [name, buf] of Object.entries(sounds)) {
    fs.writeFileSync(path.join(soundsDir, `${name}.wav`), buf);
    console.log(`Saved ${name}.wav`);
}
