import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Gemini API Key .env dosyasında tanımlanmalı!');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Gemini AI kullanarak ürün açıklaması oluşturur
 * @param {string} productName - Ürün adı
 * @param {string} brand - Marka
 * @param {string} category - Kategori
 * @returns {Promise<string>} - Üretilen açıklama
 */
export const generateProductDescription = async (productName, brand = '', category = '') => {
  try {
    const prompt = `Sen bir medikal ürün uzmanısın. Aşağıdaki ürün için profesyonel ve bilgilendirici bir açıklama yaz (maksimum 150 kelime):

Ürün Adı: ${productName}
Marka: ${brand || 'Belirtilmemiş'}
Kategori: ${category || 'Medikal Ürün'}

Açıklama Türkçe olmalı, ürünün özelliklerini, kullanım alanlarını ve faydalarını içermeli.`;
    
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    const text = response.text;
    
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
