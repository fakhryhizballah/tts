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
            '--model', MODEL_PATH+model,
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
app.use("/api/voice/", express.static(path.join(__dirname, 'tmp')));

app.post('/generate-tts', async (req, res) => {
    const { text, model } = req.body;
    let enginModel = model || 'id_ID-news_tts-medium.onnx';
    console.log(MODEL_PATH + model);

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
        })
    }
    try {
        await generateWav(text, outputPath, enginModel);
      return  res.json({
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