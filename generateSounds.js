const fs = require('fs');
const path = require('path');
const { WaveFile } = require('wavefile');

const soundsDir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
}

function generateTone(frequency, durationMs, type = 'sine') {
    const sampleRate = 44100;
    const numSamples = Math.floor((durationMs / 1000) * sampleRate);
    const samples = new Float64Array(numSamples);

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
        
        // Envelope: quick attack, slow decay
        let envelope = 1;
        if (durationMs > 100) {
            envelope = Math.max(0, 1 - (i / numSamples));
        }
        samples[i] = val * envelope * 0.5; // volume
    }

    const wav = new WaveFile();
    wav.fromScratch(1, sampleRate, '32f', samples);
    return wav.toBuffer();
}

function generateSequence(notes) {
    const sampleRate = 44100;
    let totalSamples = 0;
    notes.forEach(n => { totalSamples += Math.floor((n.durationMs / 1000) * sampleRate); });
    
    const samples = new Float64Array(totalSamples);
    let offset = 0;
    
    notes.forEach(note => {
        const numSamples = Math.floor((note.durationMs / 1000) * sampleRate);
        for (let i = 0; i < numSamples; i++) {
            let t = i / sampleRate;
            let val = Math.sin(2 * Math.PI * note.freq * t);
            let envelope = Math.max(0, 1 - (i / numSamples));
            samples[offset + i] = val * envelope * 0.5;
        }
        offset += numSamples;
    });

    const wav = new WaveFile();
    wav.fromScratch(1, sampleRate, '32f', samples);
    return wav.toBuffer();
}

// Generate basic sounds
const sounds = {
    click: generateTone(800, 50, 'sine'),
    swipe: generateTone(400, 150, 'noise'),
    wrong: generateTone(150, 300, 'square'),
    near: generateTone(400, 200, 'triangle'),
    bookmark: generateTone(600, 150, 'sine'),
    hint: generateSequence([{freq: 800, durationMs: 100}, {freq: 1200, durationMs: 200}]),
    bgmusic: generateTone(200, 1000, 'sine') // just a silent-ish tone for now since bgmusic is hard
};

for (const [name, buffer] of Object.entries(sounds)) {
    fs.writeFileSync(path.join(soundsDir, `${name}.wav`), buffer);
    console.log(`Generated ${name}.wav`);
}
