# Dynamic Audio dengan Emotion/Tone Recognition

Fitur baru untuk **membuat audio dengan tone yang sesuai konteks** secara otomatis! 🎭

## 🎯 Fitur Utama

### 1. **Automatic Emotion Detection**
- Server otomatis mendeteksi emosi dari teks input
- Menyesuaikan speed, model, dan karakteristik suara
- Tidak perlu setup tambahan

### 2. **5 Jenis Emosi Supported**

| Emosi | Karakteristik | Speed | Model | Keywords |
|-------|---|---|---|---|
| **Happy** 😊 | Ceria & energik | 1.1x (lebih cepat) | arctic-medium | senang, bahagia, mantap, keren |
| **Sad** 😢 | Sedih & melankois | 0.9x (lebih lambat) | news_tts | sedih, susah, duka |
| **Angry** 😠 | Marah & tegas | 1.2x (paling cepat) | arctic-medium | marah, kesal, dongkol |
| **Serious** ⚠️ | Formal & serius | 0.95x | news_tts | penting, urgen, kritis |
| **Calm** 🧘 | Tenang & santai | 0.85x | news_tts | tenang, santai, relaks |

## 🚀 Quick Start

### Setup
```bash
npm install
npm start
```

### 1. Test Emotions
```bash
curl http://localhost:3000/test-emotions
```

Akan menampilkan contoh teks untuk setiap emosi.

### 2. Lihat Available Emotions
```bash
curl http://localhost:3000/emotions
```

### 3. Generate TTS dengan Emotion Otomatis
```bash
curl -X POST http://localhost:3000/generate-tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Saya sangat senang dan bahagia hari ini!"}'
```

**Response:**
```json
{
  "status": "File generated successfully",
  "emotion": "happy",
  "description": "Suara ceria & energik",
  "speed": 1.1,
  "model": "en_US-arctic-medium.onnx",
  "path": "/api/voice/happy_Saya_sangat_senang___1234567890.wav",
  "url": "http://your-base-url/api/voice/happy_Saya_sangat_senang___1234567890.wav"
}
```

## 📝 API Examples

### Contoh 1: Auto Emotion Detection (Recommended)
```bash
curl -X POST http://localhost:3000/generate-tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Aku sangat sedih mendengar kabar buruk ini"
  }'
```
→ Akan terdeteksi emosi **sad**, speed 0.9x (lebih lambat & melankois)

### Contoh 2: Force Emosi Tertentu
```bash
curl -X POST http://localhost:3000/generate-tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Dengarkan dengan tenang",
    "forceEmotion": "calm"
  }'
```
→ Akan gunakan konfigurasi emosi **calm** meski text tidak memiliki keywords

### Contoh 3: Custom Model + Auto Emotion
```bash
curl -X POST http://localhost:3000/generate-tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Ini sangat penting dan urgen!",
    "model": "id_ID-news_tts-medium.onnx"
  }'
```

### Contoh 4: Neutral (Tanpa Emosi Terdeteksi)
Jika text tidak mengandung emotion keywords:
```bash
curl -X POST http://localhost:3000/generate-tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hari ini cuaca bagus"
  }'
```
→ Akan gunakan **neutral** config (speed 1.0x normal)

## 🔍 Emotion Keywords

Berikut kata-kata yang memicu masing-masing emosi:

**Happy/Senang:**
```
senang, bahagia, gembira, suka, hebat, luar biasa, mantap, keren, yahaha
```

**Sad/Sedih:**
```
sedih, susah, bersedih, melankolis, duka
```

**Angry/Marah:**
```
marah, kesal, sial, merah, murka, dongkol, benci
```

**Serious/Serius:**
```
penting, serius, urgen, kritis, danger, waspada, darurat
```

**Calm/Tenang:**
```
tenang, santai, relaks, rileks, damai, nyaman, istirahat
```

## 🎛️ Parameter

### Body Request
```json
{
  "text": "string (required, max 500 chars)",
  "model": "string (optional, default berdasar emosi)",
  "forceEmotion": "string (optional: happy|sad|angry|serious|calm|neutral)"
}
```

### Response
```json
{
  "status": "string",
  "emotion": "string (detected emotion)",
  "description": "string (human readable description)",
  "speed": "number (1.0 = normal, >1 = faster, <1 = slower)",
  "model": "string (model yang digunakan)",
  "path": "string (path relatif)",
  "url": "string (URL lengkap)"
}
```

## 🔧 Customization

Untuk menambah/edit emosi, edit file `server.js`:

### 1. Tambah Keywords
```javascript
const EMOTION_KEYWORDS = {
    excited: ['excited', 'thrilled', 'wow', '🤩'], // ADD THIS
    // ... existing
}
```

### 2. Tambah Konfigurasi
```javascript
const EMOTION_CONFIG = {
    excited: {
        speed: 1.25,
        model: 'en_US-arctic-medium.onnx',
        description: 'Suara excited & antusias'
    },
    // ... existing
}
```

### 3. Update Detection Function
Jika logic detection terlalu sederhana, bisa ganti dengan library:
```bash
npm install sentiment
```

Lalu di `server.js`:
```javascript
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

function detectEmotion(text) {
    const analysis = sentiment.analyze(text);
    if (analysis.score > 2) return 'happy';
    if (analysis.score < -2) return 'sad';
    // ... etc
}
```

## 📊 Logging

Server sekarang menampilkan detail pada console:

```
📝 Text: "Saya sangat senang!"
🎭 Detected Emotion: happy
🎵 Model: en_US-arctic-medium.onnx
⚡ Speed: 1.1x
```

## ⚠️ Notes

1. **Piper Parameter Support:** Fitur speed menggunakan `--length_scale` dari Piper. Jika Piper tidak support, parameter akan diabaikan
2. **Model Selection:** Setiap emosi memiliki model default, tapi bisa di-override dengan parameter `model`
3. **Filename:** Berisi emosi untuk tracking (misal: `happy_Saya_sangat_senang_1234567890.wav`)
4. **Caching:** File dengan path/emosi yang sama tidak akan di-regenerate

## 🚀 Next Steps

Untuk fitur lebih advanced:
1. **Phoneme-level control** - Edit pitch per kata
2. **SSML support** - Jika Piper support SSML markup
3. **ML-based sentiment** - Gunakan library sentiment/emotional analysis
4. **Prosody generation** - Generate prosody features dari context

---

**Created:** Feb 2026  
**Version:** 1.1 (Emotion Detection)
