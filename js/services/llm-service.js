// =================================
// LLM SERVICE - Centralized AI API Access for ElxaOS
// Single source of truth for API key, model selection, and API calls.
// All programs/websites should use this instead of making their own fetch calls.
// Currently supports Gemini. Designed to support additional providers later.
// =================================

class LLMService {
    constructor() {
        this.apiKey = null;
        this.selectedModel = 'gemini-2.5-flash';
        this.loadSettings();
        console.log('🤖 LLM Service initialized');
    }

    // ===== SETTINGS =====

    loadSettings() {
        try {
            const messengerSettings = localStorage.getItem('snakesia-messenger-settings');
            if (messengerSettings) {
                const settings = JSON.parse(messengerSettings);
                this.apiKey = settings.apiKey || null;
                this.selectedModel = settings.selectedModel || 'gemini-2.5-flash';
            }
        } catch (error) {
            console.error('❌ LLM Service: Failed to load settings:', error);
        }
    }

    /** Refresh settings from localStorage (call after user changes settings in Messenger) */
    refreshSettings() {
        this.loadSettings();
    }

    isAvailable() {
        return !!this.apiKey;
    }

    getModel() {
        return this.selectedModel;
    }

    // ===== CORE API CALL =====

    /**
     * Send a prompt to the LLM and get a text response.
     * @param {string} prompt - The full prompt text
     * @param {object} [options] - Optional overrides
     * @param {number} [options.maxTokens=150] - Max output tokens
     * @param {number} [options.temperature=0.8] - Sampling temperature
     * @param {number} [options.topP=0.9] - Top-p sampling
     * @param {number} [options.topK] - Top-k sampling (omitted if not set)
     * @param {Array}  [options.safetySettings] - Custom safety settings
     * @returns {Promise<string|null>} The response text, or null on failure
     */
    async generateContent(prompt, options = {}) {
        if (!this.apiKey) {
            console.log('⚠️ LLM Service: No API key available');
            return null;
        }

        const {
            maxTokens = 150,
            temperature = 0.8,
            topP = 0.9,
            topK,
            safetySettings
        } = options;

        const generationConfig = {
            maxOutputTokens: maxTokens,
            temperature,
            topP
        };
        if (topK !== undefined) {
            generationConfig.topK = topK;
        }

        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig
        };
        if (safetySettings) {
            requestBody.safetySettings = safetySettings;
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }

            console.error('🚫 LLM Service: Unexpected response format:', data);
            return null;

        } catch (error) {
            console.error('🚫 LLM Service: API call failed:', error);
            return null;
        }
    }

    // ===== HELPERS =====

    /**
     * Truncate a response to a max character length, cutting at sentence boundaries.
     * @param {string} text - Raw response text
     * @param {number} [maxLength=300] - Max characters
     * @returns {string} Truncated text
     */
    truncateResponse(text, maxLength = 300) {
        let processed = text.trim();
        if (processed.length <= maxLength) return processed;

        const sentences = processed.match(/[^.!?]*[.!?]+/g) || [];
        let truncated = '';
        for (const sentence of sentences) {
            if ((truncated + sentence).length <= maxLength - 50) {
                truncated += sentence;
            } else {
                break;
            }
        }

        return truncated.length > 50 ? truncated.trim() : processed.substring(0, maxLength).trim() + '...';
    }

    /** Get current Snakesia time string */
    getSnakesiaTime() {
        const now = new Date();
        const snakesiaTime = new Date(now.getTime() + (2 * 60 + 1) * 60 * 1000);
        return snakesiaTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        }) + ' (Snakesia Time)';
    }
}

// Create global instance
window.elxaLLM = new LLMService();
