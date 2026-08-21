import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, '../../../knowledge_base');
const EMBEDDINGS_FILE = path.resolve(__dirname, '../../../knowledge_base/knowledge_embeddings.json');

// Initialize Gemini SDK
let genAI = null;

try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (error) {
    console.error("Failed to initialize Google Gen AI.", error);
}

// Cosine similarity function
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Global cache for embeddings
let cachedEmbeddings = null;

export const loadEmbeddings = async () => {
    if (cachedEmbeddings) return cachedEmbeddings;
    
    if (fs.existsSync(EMBEDDINGS_FILE)) {
        try {
            const data = fs.readFileSync(EMBEDDINGS_FILE, 'utf-8');
            cachedEmbeddings = JSON.parse(data);
            return cachedEmbeddings;
        } catch (error) {
            console.error("Error reading embeddings file:", error);
        }
    }
    
    // If not exists, generate them
    return await generateAllEmbeddings();
};

export const generateAllEmbeddings = async () => {
    if (!genAI) {
        if (process.env.GEMINI_API_KEY) {
            genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        } else {
            console.error("Gemini API is not initialized. Cannot generate embeddings because GEMINI_API_KEY is missing.");
            return [];
        }
    }

    console.log("Generating embeddings for knowledge base...");
    const files = fs.readdirSync(KNOWLEDGE_BASE_DIR).filter(file => file.endsWith('.md'));
    const documents = [];

    for (const file of files) {
        const filePath = path.join(KNOWLEDGE_BASE_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const chunks = content.split('\n\n').filter(c => c.trim().length > 100);
        
        for (let i = 0; i < chunks.length; i++) {
            documents.push({
                file,
                chunkIndex: i,
                content: chunks[i].trim()
            });
        }
    }

    console.log(`Found ${documents.length} chunks. Generating embeddings in batches...`);
    const embeddingsData = [];
    const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const batchSize = 25;

    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        let success = false;
        let retries = 0;

        while (!success && retries < 3) {
            try {
                console.log(`Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)} (${batch.length} chunks)...`);
                const response = await embedModel.batchEmbedContents({
                    requests: batch.map(doc => ({
                        content: { parts: [{ text: doc.content }] }
                    }))
                });

                if (response && response.embeddings) {
                    for (let j = 0; j < batch.length; j++) {
                        embeddingsData.push({
                            ...batch[j],
                            embedding: response.embeddings[j].values
                        });
                    }
                    success = true;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                retries++;
                if (error.status === 429 || (error.message && error.message.includes("429"))) {
                    console.warn(`Rate limit 429 encountered on batch starting at index ${i}. Retrying in 12s (attempt ${retries}/3)...`);
                    await new Promise(resolve => setTimeout(resolve, 12000));
                } else {
                    console.error(`Error embedding batch starting at index ${i}:`, error.message);
                    break;
                }
            }
        }
    }

    fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(embeddingsData, null, 2));
    cachedEmbeddings = embeddingsData;
    console.log("Embeddings generated and saved successfully.");
    return cachedEmbeddings;
};

export const queryChatbot = async (userMessage, conversationHistory = [], aiContext = null, orderContext = "", productsContext = "") => {
    if (!genAI) {
        if (process.env.GEMINI_API_KEY) {
             genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        } else {
             throw new Error("Chatbot is currently unavailable because GEMINI_API_KEY is not configured in .env");
        }
    }

    // 1 & 2. Try RAG retrieval
    let contextText = "Chưa có tài liệu kho kiến thức tĩnh.";
    let sources = [];

    try {
        const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
        const queryEmbeddingResponse = await embedModel.embedContent(userMessage);
        const queryEmbedding = queryEmbeddingResponse?.embedding?.values;

        if (queryEmbedding) {
            const embeddingsData = await loadEmbeddings();
            if (embeddingsData && embeddingsData.length > 0) {
                const similarities = embeddingsData.map(doc => ({
                    ...doc,
                    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
                }));

                similarities.sort((a, b) => b.similarity - a.similarity);
                const topChunks = similarities.slice(0, 5);
                console.log(`[RAG RETRIEVAL] Question: "${userMessage}" -> Top matched docs:`, [...new Set(topChunks.map(c => c.file))]);
                contextText = topChunks.map(chunk => `[Source: ${chunk.file}]\n${chunk.content}`).join('\n\n');
                sources = [...new Set(topChunks.map(c => c.file))];
            }
        }
    } catch (ragError) {
        console.error(`[CHATBOT RAG FALLBACK] Vector search skipped due to embedding error (${ragError.status || ragError.message}). Falling back to generative AI.`);
    }

    // 3. Construct prompt with context
    let systemInstruction = `Bạn là một chuyên gia tư vấn da liễu thân thiện của website Skin. 
Dựa vào các thông tin tham khảo sau đây (Context), hãy trả lời câu hỏi của người dùng một cách chuyên nghiệp, chính xác và dễ hiểu.
Nếu thông tin không có trong Context, hãy dùng kiến thức chung về da liễu để tư vấn nhưng hãy thêm vào ý "dựa trên thông tin chung" và khuyên người dùng nên đi khám bác sĩ để chắc chắn.
Tránh trả lời các câu hỏi không liên quan đến da liễu.

THÔNG TIN THAM KHẢO:
${contextText}`;

    if (aiContext && aiContext.condition) {
        systemInstruction += `\n\nLƯU Ý AI DIAGNOSIS CONTEXT: Người dùng này vừa được AI nhận diện tình trạng da là "${aiContext.condition}" (Độ tin cậy: ${Math.round(aiContext.confidence * 100)}%). Hãy ưu tiên tư vấn, khuyên bảo và giới thiệu các sản phẩm phù hợp cho tình trạng da "${aiContext.condition}" này.`;
    }

    if (orderContext) {
        systemInstruction += `\n\n${orderContext}\nHãy dựa vào danh sách đơn hàng trên để trả lời trực tiếp câu hỏi của người dùng một cách chính xác nhất về trạng thái và thông tin đơn hàng của họ.`;
    }

    if (productsContext) {
        systemInstruction += `\n\n${productsContext}\nHãy giới thiệu rõ ràng tên và giá các sản phẩm thực tế trên khi khuyên người dùng mua hàng. Chỉ giới thiệu các sản phẩm có trong danh sách trên. Nếu không có sản phẩm nào phù hợp, hãy thông báo hiện tại cửa hàng chưa có sản phẩm hỗ trợ cho tình trạng này.`;
    }

    const genModel = genAI.getGenerativeModel({ 
        model: 'gemini-3.6-flash',
        systemInstruction: systemInstruction 
    });

    const formattedHistory = conversationHistory.map(msg => ({
         role: msg.role === 'user' ? 'user' : 'model',
         parts: [{ text: msg.text }]
    }));
    
    let retries = 0;
    while (retries < 3) {
        try {
            const chat = genModel.startChat({
                 history: formattedHistory,
                 generationConfig: { temperature: 0.4 }
            });

            const response = await chat.sendMessage(userMessage);
            
            return {
                text: response.response.text(),
                sources: sources
            };
        } catch (error) {
            retries++;
            const status = error.status || (error.message && error.message.includes("429") ? 429 : 500);
            console.error(`[CHATBOT ERROR] Stage: Gemini Generation | Status: ${status} | Error: ${error.message} (Attempt ${retries}/3)`);
            if ((status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) && retries < 3) {
                console.log(`[RATE LIMIT BACKOFF] Pausing 4 seconds before retry attempt ${retries + 1}...`);
                await new Promise(r => setTimeout(r, 4000));
            } else {
                throw error;
            }
        }
    }
};
