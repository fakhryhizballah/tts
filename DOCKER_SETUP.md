# Docker Setup untuk TTS Application

## Persyaratan
- Docker
- Docker Compose

## Instalasi & Menjalankan

### Cara 1: Menggunakan Docker Compose (Recommended)
```bash
docker-compose up --build
```

Server akan berjalan di `http://localhost:3000`

### Cara 2: Menggunakan Docker Manually
```bash
# Build image
docker build -t tts-app .

# Run container dengan binding folder tmp
docker run -p 3000:3000 -v $(pwd)/tmp:/app/tmp tts-app
```

## Struktur Folder
- `tmp/` - Folder untuk output file wav (di-bind dengan container)
- `models/` - Folder berisi model ONNX piper
- `src/` - Source code aplikasi
- `server.js` - Entry point aplikasi
- `package.json` - Dependencies Node.js

## Menggunakan API

### Generate TTS
```bash
curl -X POST http://localhost:3000/generate-tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Halo ini adalah test suara", "model":"id_ID-news_tts-medium.onnx"}'
```

## Stop Container
```bash
docker-compose down
```

## Troubleshooting
Jika ada masalah dengan Piper, pastikan:
1. Model file ada di folder `models/`
2. File permissions sudah benar
3. Folder `tmp/` sudah ada atau docker akan membuatnya secara otomatis
