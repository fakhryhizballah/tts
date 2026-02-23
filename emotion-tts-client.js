/**
 * Emotion TTS API Client
 * Simple client untuk interact dengan emotion-aware TTS server
 */

class EmotionTTSClient {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
    }

    /**
     * Get semua available emotions
     */
    async getEmotions() {
        try {
            const response = await fetch(`${this.baseURL}/emotions`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching emotions:', error);
            return null;
        }
    }

    /**
     * Get test examples untuk setiap emosi
     */
    async getTestExamples() {
        try {
            const response = await fetch(`${this.baseURL}/test-emotions`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching test examples:', error);
            return null;
        }
    }

    /**
     * Generate TTS dengan auto emotion detection
     * @param {string} text - Text yang akan di-generate
     * @param {object} options - Optional { model, forceEmotion }
     */
    async generateTTS(text, options = {}) {
        try {
            const body = {
                text: text,
                ...options
            };

            const response = await fetch(`${this.baseURL}/generate-tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate TTS');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating TTS:', error);
            return null;
        }
    }

    /**
     * Generate TTS dengan emotion tertentu
     */
    async generateTTSWithEmotion(text, emotion) {
        return this.generateTTS(text, { forceEmotion: emotion });
    }

    /**
     * Play audio dari URL (helper function)
     */
    playAudio(audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(err => console.error('Error playing audio:', err));
        return audio;
    }

    /**
     * Batch generate TTS untuk multiple texts
     */
    async generateBatch(texts) {
        const results = [];
        for (const text of texts) {
            const result = await this.generateTTS(text);
            results.push(result);
            // Add delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return results;
    }
}

// Export untuk Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmotionTTSClient;
}

// Contoh penggunaan di browser:
/*

// Initialize client
const client = new EmotionTTSClient('http://localhost:3000');

// Example 1: Auto emotion detection
client.generateTTS('Saya sangat senang!').then(result => {
    console.log('Emotion:', result.emotion);
    console.log('Audio URL:', result.url);
    client.playAudio(result.url);
});

// Example 2: Force emotion
client.generateTTSWithEmotion('Ini text normal', 'sad').then(result => {
    console.log('Forced emotion:', result.emotion);
    client.playAudio(result.url);
});

// Example 3: Get available emotions
client.getEmotions().then(emotions => {
    console.log('Available emotions:', emotions);
});

// Example 4: Batch generate
const texts = [
    'Saya senang!',
    'Aku sedih...',
    'Ini penting!'
];
client.generateBatch(texts).then(results => {
    results.forEach(result => {
        console.log(`${result.emotion}: ${result.url}`);
    });
});

*/
