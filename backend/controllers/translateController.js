const { InferenceClient } = require('@huggingface/inference');

/**
 * mBART-50 language code mapping
 * Maps simple language codes to mBART's language codes
 */
const LANGUAGE_MAP = {
  si: 'si_LK', // Sinhala (Sri Lanka)
  ta: 'ta_IN'  // Tamil (India)
};

const SOURCE_LANGUAGE = 'en_XX'; // English
const MODEL_ID = 'facebook/mbart-large-50-many-to-many-mmt';

/**
 * Strip HTML tags and return plain text
 * @param {String} html - HTML string
 * @returns {String} Plain text
 */
const stripHtmlTags = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

/**
 * Split long text into manageable chunks for translation
 * mBART has token limits, so we split by paragraphs/sentences
 * @param {String} text - Text to split
 * @param {Number} maxLength - Maximum chunk length (characters)
 * @returns {String[]} Array of text chunks
 */
const splitTextIntoChunks = (text, maxLength = 450) => {
  if (!text || text.length <= maxLength) return [text];

  const chunks = [];
  // Split by double newlines (paragraphs) first
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxLength) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      // If a single paragraph is too long, split by sentences
      if (paragraph.length > maxLength) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+\s*/g) || [paragraph];
        let sentenceChunk = '';
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length <= maxLength) {
            sentenceChunk += sentence;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk.trim());
            sentenceChunk = sentence;
          }
        }
        if (sentenceChunk) currentChunk = sentenceChunk;
      } else {
        currentChunk = paragraph;
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  return chunks.filter((c) => c.trim());
};

/**
 * Create Hugging Face inference client (singleton)
 */
let hfClient = null;
const getHFClient = () => {
  if (!hfClient) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('Hugging Face API key not configured');
    }
    hfClient = new InferenceClient(apiKey);
  }
  return hfClient;
};

/**
 * Call Hugging Face Inference API for translation using mBART-50
 * @param {String} text - Text to translate
 * @param {String} targetLang - mBART target language code
 * @returns {Promise<String>} Translated text
 */
const callHuggingFaceTranslation = async (text, targetLang) => {
  const client = getHFClient();

  try {
    const result = await client.translation({
      model: MODEL_ID,
      inputs: text,
      parameters: {
        src_lang: SOURCE_LANGUAGE,
        tgt_lang: targetLang
      }
    });

    if (result && result.translation_text) {
      return result.translation_text;
    }

    throw new Error('Unexpected response format from translation API');
  } catch (error) {
    // Handle model loading (cold start)
    if (error.message && error.message.includes('loading')) {
      const retryError = new Error('Translation model is loading. Please try again in ~20 seconds.');
      retryError.statusCode = 503;
      retryError.retryAfter = 20;
      throw retryError;
    }
    throw error;
  }
};

/**
 * @desc    Translate text from English to Sinhala or Tamil
 * @route   POST /api/translate
 * @access  Private (any authenticated user)
 */
exports.translate = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string'
      });
    }

    if (!targetLanguage || !LANGUAGE_MAP[targetLanguage]) {
      return res.status(400).json({
        success: false,
        error: 'targetLanguage must be "si" (Sinhala) or "ta" (Tamil)'
      });
    }

    const mbartTargetLang = LANGUAGE_MAP[targetLanguage];

    // Strip HTML from input
    const plainText = stripHtmlTags(text);

    if (!plainText.trim()) {
      return res.status(200).json({
        success: true,
        data: {
          translatedText: '',
          sourceLanguage: 'en',
          targetLanguage
        }
      });
    }

    // Split into chunks and translate each
    const chunks = splitTextIntoChunks(plainText);
    const translatedChunks = [];

    for (const chunk of chunks) {
      const translated = await callHuggingFaceTranslation(chunk, mbartTargetLang);
      translatedChunks.push(translated);
    }

    const translatedText = translatedChunks.join('\n\n');

    res.status(200).json({
      success: true,
      data: {
        translatedText,
        sourceLanguage: 'en',
        targetLanguage,
        model: MODEL_ID
      }
    });
  } catch (error) {
    console.error('Translation error:', error.message);

    const statusCode = error.statusCode || 500;
    const response = {
      success: false,
      error: error.message || 'Translation failed'
    };

    if (error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    res.status(statusCode).json(response);
  }
};
