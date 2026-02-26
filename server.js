const express = require('express');
const { spawn } = require('child_process');
// const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');


dotenv.config();
const BASE_URL = process.env.BASE_URL;

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
const MODEL_PATH = path.join(__dirname, './models/');
const TMP_DIR = path.join(__dirname, './tmp/');

if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}


function generateWav(text, outputFile, model) {
    return new Promise((resolve, reject) => {
        const piper = spawn('piper', [
            '--model', MODEL_PATH + model,
            '--output_file', outputFile
        ]);

        let stderr = '';
        let stdout = '';

        if (piper.stderr) {
            piper.stderr.on('data', (data) => {
                stderr += data.toString();
            });
        }

        if (piper.stdout) {
            piper.stdout.on('data', (data) => {
                stdout += data.toString();
            });
        }

        const timeout = setTimeout(() => {
            piper.kill('SIGKILL');
            reject(new Error('Timeout'));
        }, 30000);

        piper.stdin.write(text);
        piper.stdin.end();

        piper.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                resolve(outputFile);
            } else {
                reject(new Error(`Piper error (code ${code}): ${stderr || 'No error details'}`));
            }
        });

        piper.on('error', (err) => {
            clearTimeout(timeout);
            reject(new Error(`Failed to spawn piper: ${err.message}`));
        });
    });
}

// helper: get WAV sample rate via ffprobe
function getWavSampleRate(inputPath) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'error',
            '-select_streams', 'a:0',
            '-show_entries', 'stream=sample_rate',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            inputPath
        ]);
        let output = '';
        ffprobe.stdout.on('data', (data) => {
            output += data.toString();
        });
        ffprobe.on('error', (err) => reject(err));
        ffprobe.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error('ffprobe failed with code ' + code));
            }
            const sr = parseInt(output.trim(), 10);
            if (!sr || Number.isNaN(sr)) {
                return reject(new Error('Unable to determine sample rate'));
            }
            resolve(sr);
        });
    });
}

// helper: apply a voice style via ffmpeg filters
async function applyVoiceStyle(inputPath, style) {
    const sampleRate = await getWavSampleRate(inputPath);
    const pitchFactor = 1.08; // raise pitch ~8% for a more feminine timbre
    const tempoComp = (1 / pitchFactor).toFixed(4);
    const asetrate = Math.round(sampleRate * pitchFactor);

    const styles = {
        informative: {
            // Slightly faster, clearer presence, tighter dynamics
            filter: [
                'highpass=f=80',
                `lowpass=f=${Math.min(10000, Math.floor(sampleRate / 2) - 100)}`,
                'equalizer=f=1600:width_type=o:width=2:g=3',
                'compand=attacks=0.05:decays=0.2:points=-80/-80|-20/-12|0/-3',
                'loudnorm=I=-16:TP=-1.5:LRA=7',
                'atempo=1.03'
            ].join(','),
        }
    };

    if (!style || !styles[style]) return Promise.resolve(inputPath);

    return new Promise((resolve, reject) => {
        const tmpPath = inputPath.replace(/\.wav$/, `_${style}.wav`);
        const pitchChain = [
            `asetrate=${asetrate}`,
            `aresample=${sampleRate}`,
            `atempo=${tempoComp}`
        ].join(',');
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-af', `${pitchChain},${styles[style].filter}`,
            tmpPath
        ]);
        let stderr = '';
        if (ffmpeg.stderr) {
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });
        }
        ffmpeg.on('error', (err) => reject(err));
        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                const detail = (stderr || '').trim();
                reject(new Error(`ffmpeg failed with code ${code}${detail ? `: ${detail}` : ''}`));
            } else {
                fs.renameSync(tmpPath, inputPath);
                resolve(inputPath);
            }
        });
    });
}

// helper: fade out last portion of WAV using ffmpeg

app.use("/api/voice/", express.static(path.join(__dirname, 'tmp')));

app.post('/generate-tts', async (req, res) => {
    const { text, model, intonation } = req.body;
    let enginModel = model || 'id_ID-news_tts-medium.onnx';
    console.log(MODEL_PATH + enginModel);

    if (!text || text.length > 500) {
        return res.status(400).json({ error: 'Invalid text' });
    }

    const fileName = `${text}.wav`;
    const outputPath = path.join(TMP_DIR, fileName);
    console.log(outputPath);

    if (fs.existsSync(outputPath)) {
        console.log('File already exists');
        return res.json({
            status: 'File already exists',
            path: `/api/voice/${fileName}`,
            url: `${BASE_URL}/api/voice/${fileName}`
        });
    }

    try {
        await generateWav(text, outputPath, enginModel);
        try {
            await applyVoiceStyle(outputPath, 'informative');
        } catch (err) {
            console.warn('Intonation style skipped:', err.message);
        }

        return res.json({
            status: 'File generated',
            path: `/api/voice/${fileName}`,
            url: `${BASE_URL}/api/voice/${fileName}`
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});




app.listen(process.env.PORT || 3000, () => {
    console.log('TTS running on port 3000');
    console.log(process.env.BASE_URL);
});
