import { GoogleGenerativeAI } from '@google/genai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Gemini API Key .env dosyasında tanımlanmalı!');
}

const genAI = new GoogleGenerativeAI({ apiKey: API_KEY });

/**
 * Gemini AI kullanarak ürün açıklaması oluşturur
 * @param {string} productName - Ürün adı
 * @param {string} brand - Marka
 * @param {string} category - Kategori
 * @returns {Promise<string>} - Üretilen açıklama
 */
export const generateProductDescription = async (productName, brand = '', category = '') => {
  try {
    // Gemini 1.5 Flash modelini kullan
    const model = genAI.models.generate({
      model: 'gemini-1.5-flash',
      prompt: `Sen bir medikal ürün uzmanısın. Aşağıdaki ürün için profesyonel ve bilgilendirici bir açıklama yaz (maksimum 150 kelime):

Ürün Adı: ${productName}
Marka: ${brand || 'Belirtilmemiş'}
Kategori: ${category || 'Medikal Ürün'}

Açıklama Türkçe olmalı, ürünün özelliklerini, kullanım alanlarını ve faydalarını içermeli.`
    });
    
    const result = await model;
    const text = result.text || result.content || result.response?.text || '';
    
    if (!text) {
      throw new Error('Gemini AI yanıt üretemedi');
    }
    
    return text.trim();
  } catch (error) {
    console.error('Gemini AI hatası:', error);
    throw new Error('AI açıklama oluşturulamadı: ' + error.message);
  }
};

export default genAI;
