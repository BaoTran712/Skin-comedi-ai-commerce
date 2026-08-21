import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const evalFilePath = path.resolve(__dirname, "../data/chatbot_eval.json");
const CHAT_API_URL = "http://127.0.0.1:3000/api/chat";

const ERROR_MARKERS = [
    "xin lỗi, hiện tại tôi không thể kết nối đến máy chủ ai",
    "vui lòng thử lại sau",
    "không thể kết nối đến máy chủ",
    "ai service unavailable",
    "internal server error",
    "something went wrong"
];

async function runChatbotEvaluation() {
    const args = process.argv.slice(2);
    let limit = 110;
    const limitArg = args.find(a => a.startsWith("--limit="));
    if (limitArg) {
        limit = parseInt(limitArg.split("=")[1]) || 110;
    } else if (args[0] && !isNaN(parseInt(args[0]))) {
        limit = parseInt(args[0]);
    }

    console.log("==================================================");
    console.log(`STARTING STRICT CHATBOT EVALUATION (Limit: ${limit} tests)`);
    console.log("==================================================\n");

    if (!fs.existsSync(evalFilePath)) {
        console.error(`Error: Evaluation dataset not found at ${evalFilePath}. Run generate-dataset.js first.`);
        process.exit(1);
    }

    const fullEvalData = JSON.parse(fs.readFileSync(evalFilePath, "utf-8"));
    const evalData = fullEvalData.slice(0, limit);
    console.log(`Loaded ${evalData.length} evaluation test cases.\n`);

    let passCount = 0;
    let partialCount = 0;
    let failCount = 0;
    let errorCount = 0;

    let apiSuccessCount = 0;
    let ragSuccessCount = 0;
    let productSuccessCount = 0;

    let totalLatency = 0;
    const failureReasons = {};

    const recordFailure = (reason) => {
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    };

    for (let i = 0; i < evalData.length; i++) {
        const item = evalData[i];
        console.log(`[Test ${i + 1}/${evalData.length}] [${item.intent}] "${item.question}"`);

        const payload = {
            message: item.question,
            history: [],
            aiContext: item.requiresAIContext ? { condition: "Acne", confidence: 0.91 } : null
        };

        const startTime = Date.now();
        try {
            const res = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const latency = Date.now() - startTime;
            totalLatency += latency;

            if (res.ok) {
                apiSuccessCount++;
                const data = await res.json();
                const text = data.text || "";
                const lowerText = text.toLowerCase();
                const sources = data.sources || [];
                const suggestedProducts = data.suggestedProducts || [];

                // 1. Detect AI Connection Error Response
                const isErrorResponse = ERROR_MARKERS.some(marker => lowerText.includes(marker));
                if (isErrorResponse) {
                    console.log(`  ❌ ERROR (${latency}ms) -> "AI_CONNECTION_ERROR"`);
                    recordFailure("AI_CONNECTION_ERROR");
                    errorCount++;
                    continue;
                }

                // 2. Detect Empty Response
                if (!text.trim()) {
                    console.log(`  ❌ FAIL (${latency}ms) -> "EMPTY_RESPONSE"`);
                    recordFailure("EMPTY_RESPONSE");
                    failCount++;
                    continue;
                }

                // 3. Evaluate RAG and Product expectations
                let ragOk = true;
                let productOk = true;

                if (item.requiresRAG) {
                    if (sources.length === 0) {
                        ragOk = false;
                    } else {
                        ragSuccessCount++;
                    }
                }

                if (item.requiresProductSearch) {
                    if (suggestedProducts.length === 0) {
                        productOk = false;
                    } else {
                        productSuccessCount++;
                    }
                }

                if (ragOk && productOk) {
                    console.log(`  ✅ PASS (${latency}ms) -> "${text.substring(0, 65).replace(/\n/g, ' ')}..."`);
                    passCount++;
                } else {
                    const reason = !ragOk ? "MISSING_RAG_SOURCES" : "MISSING_PRODUCT_SUGGESTIONS";
                    console.log(`  ⚠️ PARTIAL (${latency}ms) [${reason}] -> "${text.substring(0, 50).replace(/\n/g, ' ')}..."`);
                    recordFailure(reason);
                    partialCount++;
                }
            } else {
                console.log(`  ❌ ERROR (${latency}ms) -> HTTP ${res.status}`);
                recordFailure(`HTTP_${res.status}`);
                errorCount++;
            }
        } catch (err) {
            console.error(`  ❌ ERROR with Exception: ${err.message}`);
            recordFailure("FETCH_EXCEPTION");
            errorCount++;
        }

        // Inter-request delay to manage Free Tier rate limits (15 RPM)
        await new Promise(r => setTimeout(r, 2000));
    }

    const avgLatency = Math.round(totalLatency / (evalData.length || 1));

    console.log("\n==================================================");
    console.log("CHATBOT EVALUATION REPORT (STRICT STAGED)");
    console.log("==================================================");
    console.log(`Total tests executed     : ${evalData.length}`);
    console.log(`PASS                     : ${passCount}`);
    console.log(`PARTIAL                  : ${partialCount}`);
    console.log(`FAIL                     : ${failCount}`);
    console.log(`ERROR                    : ${errorCount}`);
    console.log("--------------------------------------------------");
    console.log(`HTTP API Success Rate    : ${apiSuccessCount}/${evalData.length}`);
    console.log(`RAG Retrieval Success    : ${ragSuccessCount}`);
    console.log(`Product Search Success  : ${productSuccessCount}`);
    console.log(`Average Response Time    : ${avgLatency}ms`);
    console.log("--------------------------------------------------");
    console.log("Top Failure / Error Reasons:");
    Object.entries(failureReasons)
        .sort((a, b) => b[1] - a[1])
        .forEach(([reason, count]) => {
            console.log(`  - ${reason}: ${count}`);
        });
    console.log("==================================================\n");

    process.exit(0);
}

runChatbotEvaluation();
