// src/utils/contentFilter.js

/**
 * Hàm giả định để phát hiện spam hoặc nội dung không phù hợp.
 * Trong thực tế, bạn sẽ tích hợp các dịch vụ/thư viện AI/ML tại đây.
 *
 * @param {string} text - Văn bản cần kiểm tra.
 * @returns {Promise<boolean>} - True nếu phát hiện spam/nội dung không phù hợp, ngược lại False.
 */
async function detectSpamContent(text) {
    
    const lowerText = text.toLowerCase();

    
    const bannedKeywords = [
        'sex', 'cần thơ', 'mại dâm', 'hack', 'crack', 
        'ma túy', 'chất cấm', 'kỳ thị', 'phân biệt', 'đả kích', 'xâm hại',
        'rác', 'khỏa thân', 'tình dục', 
        'đe dọa', 'tuyệt mật', 'nhạy cảm', 'quấy rối', 'chửi bới', 'đồi trụy'
    ];

    
    for (const keyword of bannedKeywords) {
        if (lowerText.includes(keyword)) {
            console.log(`[Content Filter] Detected banned keyword: "${keyword}" in text: "${text}"`);
            return true; 
        }
    }

   

    return false;
}

module.exports = {
    detectSpamContent
};