import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

export async function generateAIConsultingResponse(customerName: string, businessQuestion: string): Promise<string> {
  console.log("=== AI RESPONSE GENERATION STARTED ===");
  console.log("Customer:", customerName);
  console.log("Question:", businessQuestion);
  
  const genAI = getGeminiClient();
  if (!genAI) {
    console.warn("GEMINI_API_KEY not configured, using fallback response");
    return generateFallbackResponse(businessQuestion);
  }

  console.log("Gemini client initialized, calling API...");
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `You are an expert business consultant at Kings Advice, a premium consulting service.
Provide thoughtful, actionable business advice based on the customer's specific question.
Be professional but approachable. Structure your response with clear sections.
Keep your response concise but valuable - around 200-300 words.
Focus on practical, implementable recommendations.
Address the customer by name when appropriate.

Customer Name: ${customerName}

Business Question: ${businessQuestion}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("=== GEMINI RESPONSE RECEIVED ===");
    console.log("Response length:", text?.length || 0);
    
    return text || generateFallbackResponse(businessQuestion);
  } catch (error) {
    console.error("=== GEMINI API ERROR ===");
    console.error("Gemini API error:", error);
    console.log("Using fallback response instead");
    return generateFallbackResponse(businessQuestion);
  }
}

function generateFallbackResponse(description: string): string {
  let aiResponse = "AI Consultant Analysis:\n\n";
  const desc = description.toLowerCase();
  
  if (desc.includes("market") || desc.includes("sell") || desc.includes("customer")) {
    aiResponse += "Based on your query about market/sales:\n1. Analyze your current customer acquisition cost (CAC).\n2. Segment your audience for personalized messaging.\n3. Consider a referral program to leverage existing happy customers.";
  } else if (desc.includes("employee") || desc.includes("team") || desc.includes("culture")) {
    aiResponse += "Regarding your team/culture query:\n1. Foster psychological safety to encourage innovation.\n2. Review your compensation packages against market rates.\n3. Invest in professional development opportunities.";
  } else if (desc.includes("money") || desc.includes("profit") || desc.includes("cost")) {
    aiResponse += "Financial Analysis:\n1. Audit your recurring subscriptions and cut unused tools.\n2. Negotiate better terms with key suppliers.\n3. Focus on increasing the Lifetime Value (LTV) of existing clients.";
  } else {
    aiResponse += "Based on your input, we recommend a SWOT analysis to identify internal strengths and external opportunities. Ensure your strategic goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound).";
  }
  
  return aiResponse;
}
