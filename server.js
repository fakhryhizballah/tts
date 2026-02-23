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

// Kata kunci untuk deteksi emosi/konteks
const EMOTION_KEYWORDS = {
    happy: ['senang', 'bahagia', 'gembira', 'suka', 'hebat', 'luar biasa', 'mantap', 'keren', 'yahaha', '🎉', '😊', '😄', '😁'],
    sad: ['sedih', 'susah', 'sedih', 'bersedih', 'melankolis', 'duka', '😢', '😭', 'sakit hati'],
    angry: ['marah', 'kesal', 'sial', 'merah', 'murka', 'dongkol', '😠', '😡', '🤬', 'benci'],
    serious: ['penting', 'serius', 'urgen', 'kritis', 'danger', '⚠️', '⚡', 'waspada', 'darurat'],
    calm: ['tenang', 'santai', 'relaks', 'rileks', 'damai', 'nyaman', '😌', '🧘', 'istirahat']
};

// Fungsi deteksi emosi dari teks
function detectEmotion(text) {
    const lowerText = text.toLowerCase();
    let emotionScores = {
        happy: 0,
        sad: 0,
        angry: 0,
        serious: 0,
        calm: 0
    };

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
        keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                emotionScores[emotion]++;
            }
        });
    }

    const maxEmotion = Object.entries(emotionScores)
        .sort(([, a], [, b]) => b - a)[0];

    return maxEmotion[1] > 0 ? maxEmotion[0] : 'neutral';
}

// Mapping emosi ke parameter Piper
const EMOTION_CONFIG = {
    happy: {
        speed: 1.1,  // Lebih cepat
        model: 'en_US-arctic-medium.onnx', // Atau model yang lebih cheerful
        description: 'Suara ceria & energik'
    },
    sad: {
        speed: 0.9,  // Lebih lambat
        model: 'id_ID-news_tts-medium.onnx',
        description: 'Suara sedih & melankois'
    },
    angry: {
        speed: 1.2,  // Lebih cepat & keras
        model: 'en_US-arctic-medium.onnx',
        description: 'Suara marah & tegas'
    },
    serious: {
        speed: 0.95,
        model: 'id_ID-news_tts-medium.onnx',
        description: 'Suara formal & serius'
    },
    calm: {
        speed: 0.85,  // Lebih lambat
        model: 'id_ID-news_tts-medium.onnx',
        description: 'Suara tenang & santai'
    },
    neutral: {
        speed: 1.0,
        model: 'id_ID-news_tts-medium.onnx',
        description: 'Suara normal'
    }
};


function generateWav(text, outputFile, model, options = {}) {
    return new Promise((resolve, reject) => {
        // Piper command arguments
        const args = [
            '--model', MODEL_PATH + model,
            '--output_file', outputFile
        ];

        // Add speed parameter jika ada
        if (options.speed && options.speed !== 1.0) {
            args.push('--length_scale', String(1.0 / options.speed)); // Piper menggunakan length_scale (inverse of speed)
        }

        const piper = spawn('piper', args);

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

// Endpoint untuk mendapatkan daftar emosi yang tersedia
app.get('/emotions', (req, res) => {
    const emotions = Object.entries(EMOTION_CONFIG).map(([emotion, config]) => ({
        emotion: emotion,
        description: config.description,
        speed: config.speed,
        keywords: EMOTION_KEYWORDS[emotion] || [],
        model: config.model
    }));

    return res.json({
        available_emotions: emotions,
        total: emotions.length,
        usage: {
            automatic: "Emosi akan dideteksi otomatis dari teks",
            manual: "Atau kirim parameter 'forceEmotion' untuk memaksa emosi tertentu"
        }
    });
});

// Endpoint untuk testing dengan berbagai emosi
app.get('/test-emotions', (req, res) => {
    const testTexts = {
        happy: "Saya sangat senang dan bahagia hari ini!",
        sad: "Aku sedih mendengar kabar buruk ini",
        angry: "Ini sangat membuat saya marah!",
        serious: "Ini adalah penting dan urgen untuk diimplementasikan",
        calm: "Dengarkan dengan santai dan tenang"
    };

    return res.json({
        test_examples: testTexts,
        instructions: "POST /generate-tts dengan salah satu text di atas"
    });
});

app.post('/generate-tts', async (req, res) => {
    const { text, model, forceEmotion } = req.body;

    if (!text || text.length > 500) {
        return res.status(400).json({ error: 'Invalid text' });
    }

    // Deteksi emosi otomatis atau gunakan yang dipaksa
    let emotion = forceEmotion || detectEmotion(text);
    const config = EMOTION_CONFIG[emotion] || EMOTION_CONFIG['neutral'];
    const selectedModel = model || config.model;

    console.log(`📝 Text: "${text}"`);
    console.log(`🎭 Detected Emotion: ${emotion}`);
    console.log(`🎵 Model: ${selectedModel}`);
    console.log(`⚡ Speed: ${config.speed}x`);

    // Generate unique filename dengan emosi
    const sanitizedText = text.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const fileName = `${emotion}_${sanitizedText}_${Date.now()}.wav`;
    const outputPath = path.join(TMP_DIR, fileName);

    // Check if file exists
    if (fs.existsSync(outputPath)) {
        console.log('✅ File already exists');
        return res.json({
            status: 'File already exists',
            emotion: emotion,
            description: config.description,
            path: `/api/voice/${fileName}`,
            url: `${BASE_URL}/api/voice/${fileName}`
        });
    }

    try {
        await generateWav(text, outputPath, selectedModel, {
            speed: config.speed
        });

        return res.json({
            status: 'File generated successfully',
            emotion: emotion,
            description: config.description,
            speed: config.speed,
            model: selectedModel,
            path: `/api/voice/${fileName}`,
            url: `${BASE_URL}/api/voice/${fileName}`
        });
    } catch (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({ error: err.message });
    }
});




app.listen(process.env.PORT || 3000, () => {
    console.log('🎵 TTS Server running on port 3000');
    console.log(`📍 Base URL: ${process.env.BASE_URL}`);
    console.log('\n🚀 Available Endpoints:');
    console.log('   GET  /emotions         - Lihat daftar emosi tersedia');
    console.log('   GET  /test-emotions    - Lihat contoh teks untuk setiap emosi');
    console.log('   POST /generate-tts     - Generate audio dengan emosi otomatis');
    console.log('\n💡 Contoh POST body:');
    console.log('   { "text": "Saya sangat senang!" }');
    console.log('   { "text": "Aku sedih...", "forceEmotion": "sad" }');
    console.log('   { "text": "Halo", "model": "en_US-arctic-medium.onnx" }\n');
});