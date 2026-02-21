# Local Text-to-Speech (Node.js + Voice Cloning)

Aplikasi Text-to-Speech berbasis Node.js yang menjalankan model AI **secara lokal** dengan dukungan **voice cloning**.

## Fitur
- ✅ **Standard TTS** - Input teks lewat web UI, generate audio WAV
- ✅ **REST API** - Akses programmatic ke semua fitur
- ✅ **Local Processing** - Semua dijalankan lokal, tanpa cloud

## Requirements
- Node.js 18+
- Python 3.8+ (untuk voice cloning)
- 4GB+ RAM recommended
- Disk space untuk models (~500MB - 2GB)

## Quick Start

### Dengan Docker (Recommended)

```bash
docker-compose up --build
```

Buka browser di `http://localhost:3000`

### Manual Setup

**Terminal 1 - Node.js Server:**
```bash
npm install
npm start
```

**Terminal 2 - Voice Cloning Service:**
```bash
pip install -r requirements.txt
python3 voice_cloning_service.py
```

Buka browser di `http://localhost:3000`

## Usage

### 1. Upload Voice Sample
1. Buka tab "Upload Voice"
2. Upload file audio (WAV, MP3, OGG) 5-30 detik
3. Beri nama unik untuk voice tersebut

### 2. Generate Speech dengan Cloned Voice
1. Buka tab "Generate Speech"
2. Pilih voice dari list
3. Masukkan teks
4. Klik "Generate Speech"
5. Dengarkan hasilnya!

### 3. Standard TTS
1. Buka tab "Standard TTS"
2. Pilih model bahasa
3. Masukkan teks
4. Generate!

## API Endpoints

### Voice Cloning

```bash
# Upload voice sample
curl -X POST http://localhost:3000/voice-clone/upload \
  -F "file=@voice.wav" \
  -F "voice_id=my_voice"

# Generate speech
curl -X POST http://localhost:3000/voice-clone/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "voice_id": "my_voice"}'

# List voices
curl http://localhost:3000/voice-clone/list-voices

# Delete voice
curl -X DELETE http://localhost:3000/voice-clone/delete/my_voice
```

### Standard TTS

```bash
curl -X POST http://localhost:3000/generate-tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Halo dunia",
    "model": "id_ID-news_tts-medium.onnx"
  }'
```

## Catatan

- Saat pertama kali generate, model akan diunduh (bisa cukup lama tergantung internet)
- Setelah terunduh, inferensi berjalan lokal di mesin kamu
- Untuk voice cloning, pertama kali akan muat model VITS (~5-10 menit di first run)
- Selanjutnya lebih cepat (~10-30 detik per request)

## File Structure

```
.
├── server.js                   # Express server utama
├── voice_cloning_service.py    # Python service untuk voice cloning
├── public/
│   └── index.html              # Web interface
├── models/                     # Piper TTS models
├── voice_samples/              # Uploaded voice samples
├── generated_audio/            # Generated audio files
└── tmp/                        # Temporary files
```

## Ports

- **3000** - Main TTS server
- **5000** - Voice cloning service

## Dokumentasi Lengkap

Lihat [VOICE_CLONING_GUIDE.md](VOICE_CLONING_GUIDE.md) untuk dokumentasi detail tentang voice cloning.

Lihat [DOCKER_SETUP.md](DOCKER_SETUP.md) untuk setup Docker.

## Troubleshooting

### "VITS not installed"
```bash
pip install -r requirements.txt
```

### Service tidak terkoneksi
```bash
# Pastikan kedua service berjalan
# Terminal 1: npm start
# Terminal 2: python3 voice_cloning_service.py

# Test koneksi
curl http://localhost:3000/voice-clone/health
```

### Docker issues
```bash
docker-compose down
docker-compose up --build
```

## Performance Tips

- Gunakan text lebih pendek untuk hasil lebih cepat
- Voice sample yang lebih bagus = hasil lebih baik
- GPU akan mempercepat proses (otomatis terdeteksi)

## License

MIT

---

**Enjoy voice cloning!** 🎙️✨

