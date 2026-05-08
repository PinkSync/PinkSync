/**
 * PinkSync Gemini AI Service
 * 
 * MBTQ Stack Integration for the 2026 Deaf Global Roadmap.
 * Provides AI-powered accessibility accommodation fulfillment.
 */

import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import type { 
  HeatmapAnalysisResult, 
  Event, 
  MarketingContentSuggestion, 
  TrainingScenario, 
  AspectRatio, 
  MediaAnalysisResult, 
  PinkSyncSession,
  AccommodationMatch,
} from '@/types/index';

const SYSTEM_CONTEXT = `
  MASTER PROTOCOL INSTRUCTION:
  You are the PinkSync Oracle. PinkSync is the INFRASTRUCTURE PLUMBING for the 2026 Deaf Global Roadmap.
  
  CORE MISSION: 
  Carry out accessibility accommodation requests by HONORING USER SETTINGS stored in their DeafAuth identity via efficient BROKERAGE ROUTING.
  
  MBTQ STACK DEFINITION:
  - Magician (M): Studio interface for orchestration of complex accommodation workflows.
  - Broker (B): Deno Distributed Mesh routing traffic.
  - Translator (T): The fulfillment engine rendering any user-requested accommodation.
  - Quality (Q): Automated integrity logs and FibonRose verification.
`;

// Helper to convert browser File object to GenAI inlineData part
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string, mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get the GenAI client instance
 */
function getClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * PROTOCOL DISCOVERY ENGINE
 * Performs weekly-style sync using Search and Maps grounding.
 */
export const syncGlobalDiscovery = async (location?: { lat: number, lng: number }): Promise<{
  structuredEvents: Event[],
  sources: { title: string; uri?: string; type: string }[],
  rawAnalysis: string
}> => {
  const ai = getClient();
  
  // 1. SEARCH GROUNDING: Discover new global events (Gemini 3 Flash)
  const searchResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: "Identify 5 major Deaf community events, conferences, or festivals specifically scheduled for 2026. Provide the name, date, location, and a brief description for each.",
    config: { tools: [{ googleSearch: {} }] },
  });

  // 2. MAPS GROUNDING: Discover local nodes (Gemini 2.5 Flash)
  const mapsConfig: { tools: { googleMaps: object }[]; toolConfig?: object } = {
    tools: [{ googleMaps: {} }],
  };
  
  if (location) {
    mapsConfig.toolConfig = {
      retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } }
    };
  }
  
  const mapsResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: "Locate active Deaf community centers, ASL-friendly establishments, or Deaf-owned businesses near this coordinate sector. Provide names and categories.",
    config: mapsConfig,
  });

  // 3. SYNTHESIS: Convert grounded text into structured Event objects
  const synthesisResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Based on these search results:
    SEARCH: ${searchResponse.text}
    MAPS: ${mapsResponse.text}
    
    Extract a JSON list of events/establishments matching the 'Event' interface:
    { category: string, name: string, date: string, location: string, description: string, isGlobal: boolean }
    Use 'TBD' for missing dates. If an establishment, the 'date' should be 'Permanent'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            name: { type: Type.STRING },
            date: { type: Type.STRING },
            location: { type: Type.STRING },
            description: { type: Type.STRING },
            isGlobal: { type: Type.BOOLEAN }
          },
          required: ["category", "name", "date", "location", "description"]
        }
      }
    }
  });

  const extractSources = (response: { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { title?: string; uri?: string }; maps?: { title?: string; uri?: string } }> } }> }) => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks.map((chunk) => ({
      title: chunk.web?.title || chunk.maps?.title || "Node Found",
      uri: chunk.web?.uri || chunk.maps?.uri,
      type: chunk.web ? 'SEARCH' : 'MAPS'
    })).filter((s) => s.uri);
  };

  let structuredEvents: Event[] = [];
  try {
    structuredEvents = JSON.parse(synthesisResponse.text || "[]");
  } catch (e) {
    console.error("Failed to parse synthesis", e);
  }

  return {
    structuredEvents,
    sources: [...extractSources(searchResponse as unknown as Parameters<typeof extractSources>[0]), ...extractSources(mapsResponse as unknown as Parameters<typeof extractSources>[0])],
    rawAnalysis: `### DISCOVERY SYNC\n\n${searchResponse.text}\n\n${mapsResponse.text}`
  };
};

/**
 * Execute matching protocol for accommodation fulfillment
 */
export const executeMatchingProtocol = async (userNeed: string, context: string): Promise<AccommodationMatch> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Carry out fulfillment for user need: "${userNeed}" in context: "${context}". Return PinkSync-compliant JSON with provider, confidence (0-1), accommodationType, estimatedWaitTime in minutes, and alternatives array.`,
    config: {
      systemInstruction: SYSTEM_CONTEXT,
      responseMimeType: "application/json",
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Get deep thinking response for complex queries
 */
export const getDeepThinkingResponse = async (userPrompt: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-thinking-exp',
    contents: userPrompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: SYSTEM_CONTEXT,
    },
  });
  return response.text || "No response received.";
};

/**
 * Get grounded search response with sources
 */
export const getGroundedSearchResponse = async (query: string): Promise<{ text: string; sources: unknown[] }> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: query,
    config: { tools: [{ googleSearch: {} }] },
  });
  return {
    text: response.text || "",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

/**
 * Get grounded maps response with location data
 */
export const getGroundedMapsResponse = async (query: string, location?: { latitude: number; longitude: number }): Promise<{ text: string; sources: unknown[] }> => {
  const ai = getClient();
  
  const config: { tools: { googleMaps: object }[]; toolConfig?: object } = {
    tools: [{ googleMaps: {} }],
  };
  
  if (location) {
    config.toolConfig = {
      retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } }
    };
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: query,
    config,
  });
  return {
    text: response.text || "",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

/**
 * Get heatmap analysis for accessibility data
 */
export const getHeatmapAnalysis = async (prompt: string): Promise<HeatmapAnalysisResult> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Analyze this heatmap query: ${prompt}`,
    config: {
      systemInstruction: "You are an accessibility data analyst. Provide structured insights.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "keyFactors", "recommendations"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Generate protocol visualization image
 */
export const generateProtocolImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp-image-generation',
    contents: { parts: [{ text: `High-fidelity PinkSync protocol visualization: ${prompt}` }] },
    config: { 
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: { aspectRatio: aspectRatio as string } 
    }
  });
  
  let base64 = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      base64 = part.inlineData.data || "";
      break;
    }
  }
  return `data:image/png;base64,${base64}`;
};

/**
 * Start live protocol session for real-time communication
 */
export const startLiveProtocolSession = async (callbacks: {
  onOpen?: () => void;
  onMessage?: (message: unknown) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}): Promise<unknown> => {
  const ai = getClient();
  return ai.live.connect({
    model: 'gemini-2.0-flash-live-preview',
    callbacks: callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: SYSTEM_CONTEXT,
    }
  });
};

/**
 * Get proactive insight for business operators
 */
export const getProactiveInsight = async (businessType: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Insight for ${businessType} on how to better honor user-defined accommodations.`,
    config: { systemInstruction: SYSTEM_CONTEXT }
  });
  return response.text || "Protocol nominal.";
};

/**
 * Generate system video for training/demos
 */
export const generateSystemVideo = async (prompt: string): Promise<string> => {
  const ai = getClient();
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.API_KEY;
  return `${downloadLink}&key=${apiKey}`;
};

/**
 * Generate accessibility-conscious marketing content
 */
export const generateMarketingContent = async (contentType: string, goal: string, businessType: string): Promise<MarketingContentSuggestion[]> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Generate 3 accessibility-conscious ${contentType} suggestions for a ${businessType} with the goal: "${goal}".`,
    config: {
      systemInstruction: SYSTEM_CONTEXT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            accessibilityTip: { type: Type.STRING }
          },
          required: ["content", "accessibilityTip"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * Send protocol inquiry for validation
 */
export const sendProtocolInquiry = async (formData: Record<string, unknown>): Promise<boolean> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Process this protocol inquiry: ${JSON.stringify(formData)}. Is it valid and relevant to PinkSync? Just answer YES or NO.`,
  });
  return response.text?.toUpperCase().includes('YES') || false;
};

/**
 * Create training chat session for accessibility training
 */
export const createTrainingChatSession = (): Chat => {
  const ai = getClient();
  return ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: `${SYSTEM_CONTEXT} You are a training simulator. Create scenarios where a business operator must accommodate a Deaf user. Provide choices for the user. Always return JSON matching the TrainingScenario interface.`,
    },
  });
};

/**
 * Continue training scenario conversation
 */
export const continueTrainingScenario = async (session: Chat, message: string): Promise<TrainingScenario> => {
  const response = await session.sendMessage({ message });
  return JSON.parse(response.text || "{}");
};

/**
 * Analyze media for accessibility compliance
 */
export const analyzeProtocolMedia = async (file: File, prompt: string): Promise<MediaAnalysisResult> => {
  const ai = getClient();
  const part = await fileToGenerativePart(file);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: { parts: [part, { text: prompt }] },
    config: {
      systemInstruction: "You are an accessibility auditor. Analyze media for ASL visibility and compliance.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          accessibilityScore: { type: Type.NUMBER },
          criticalIssues: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["analysis", "accessibilityScore", "criticalIssues"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Simulate PinkSync handshake session
 */
export const simulateHandshake = async (mode: string, reason: string): Promise<PinkSyncSession> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Simulate a PinkSync handshake for mode: ${mode} and reason: ${reason}.`,
    config: {
      systemInstruction: SYSTEM_CONTEXT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          session_id: { type: Type.STRING },
          status: { type: Type.STRING },
          user_id: { type: Type.STRING },
          location_id: { type: Type.STRING },
          mode: { type: Type.STRING },
          accommodation: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              provider: { type: Type.STRING },
              estimated_start_seconds: { type: Type.NUMBER }
            },
            required: ["type"]
          },
          endpoints: {
            type: Type.OBJECT,
            properties: {
              user_url: { type: Type.STRING },
              staff_url: { type: Type.STRING },
              captions_url: { type: Type.STRING }
            },
            required: ["user_url", "staff_url"]
          }
        },
        required: ["session_id", "status", "user_id", "location_id", "mode", "accommodation", "endpoints"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Simplify complex text for accessibility
 */
export const simplifyText = async (complexText: string, targetLevel: 'simple' | 'standard' = 'simple'): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Simplify the following text for a ${targetLevel} reading level while preserving all important information. Format with bullet points where appropriate:\n\n${complexText}`,
    config: {
      systemInstruction: "You are an accessibility specialist focused on making content accessible to Deaf users. Use clear, concise language and visual formatting.",
    }
  });
  return response.text || complexText;
};

export default {
  syncGlobalDiscovery,
  executeMatchingProtocol,
  getDeepThinkingResponse,
  getGroundedSearchResponse,
  getGroundedMapsResponse,
  getHeatmapAnalysis,
  generateProtocolImage,
  startLiveProtocolSession,
  getProactiveInsight,
  generateSystemVideo,
  generateMarketingContent,
  sendProtocolInquiry,
  createTrainingChatSession,
  continueTrainingScenario,
  analyzeProtocolMedia,
  simulateHandshake,
  simplifyText,
};
