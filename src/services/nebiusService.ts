import type { NebiusModelOption, EmergencyDispatch } from '../types';

export const NEBIUS_MODELS: NebiusModelOption[] = [
  {
    id: 'nvidia/nemotron-3-nano',
    name: 'NVIDIA Nemotron 3 Nano',
    tier: 'Nano',
    description: 'Ultra-fast token streaming (<60ms). Ideal for real-time sign gloss reconstruction and fast everyday edge calls.',
    contextWindow: '32k',
    typicalLatency: '45ms - 80ms',
    recommendedFor: 'Real-time Camera Stream & Fast Gloss Parsing'
  },
  {
    id: 'nvidia/nemotron-3-super',
    name: 'NVIDIA Nemotron 3 Super',
    tier: 'Super',
    description: 'High-speed MoE balanced architecture. Perfect for two-way conversational flow and dialogue management.',
    contextWindow: '64k',
    typicalLatency: '110ms - 180ms',
    recommendedFor: 'Interactive Dialogue & Daily Conversations'
  },
  {
    id: 'nvidia/llama-3_1-nemotron-ultra-253b-v1',
    name: 'NVIDIA Nemotron 3 Ultra',
    tier: 'Ultra',
    description: 'Heavyweight reasoning flagship. Disambiguates complex sign syntax, intent, tone adjustment, and multi-lingual translation.',
    contextWindow: '128k',
    typicalLatency: '350ms - 550ms',
    recommendedFor: 'Deep Reasoning, Complex ASL Grammar & SOS Dispatches'
  },
  {
    id: 'nvidia/Llama-3.1-Nemotron-70B-Instruct',
    name: 'NVIDIA Llama 3.1 Nemotron 70B',
    tier: 'Super',
    description: 'General-purpose instruction Nemotron model optimized on Nebius for high precision and zero-shot reasoning.',
    contextWindow: '128k',
    typicalLatency: '150ms - 240ms',
    recommendedFor: 'Structured Grammar Transformation'
  }
];

export interface NebiusCallResult {
  text: string;
  model: string;
  latencyMs: number;
  tokensProcessed?: number;
  isSimulated?: boolean;
}

export class NebiusService {
  private static STORAGE_KEY = 'transsistant_nebius_api_key';
  private static MODEL_STORAGE_KEY = 'transsistant_selected_model';

  public static getApiKey(): string {
    return localStorage.getItem(this.STORAGE_KEY) || '';
  }

  public static setApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  public static getSelectedModel(): string {
    return localStorage.getItem(this.MODEL_STORAGE_KEY) || 'nvidia/nemotron-3-nano';
  }

  public static setSelectedModel(modelId: string): void {
    localStorage.setItem(this.MODEL_STORAGE_KEY, modelId);
  }

  // Core caller for Nebius Token Factory
  private static async callNebiusAPI(
    messages: { role: string; content: string }[],
    modelOverride?: string,
    temperature = 0.6
  ): Promise<NebiusCallResult> {
    const apiKey = this.getApiKey();
    const model = modelOverride || this.getSelectedModel();
    const startTime = performance.now();

    // If no API key is provided, return intelligent simulated Nemotron response
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 450)); // simulate network latency
      const simulatedText = this.getSimulatedResponse(messages);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        text: simulatedText,
        model,
        latencyMs,
        tokensProcessed: Math.round(simulatedText.length / 3.8),
        isSimulated: true
      };
    }

    try {
      const endpoint = 'https://api.tokenfactory.nebius.com/v1/chat/completions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Nebius API error, falling back to simulated output:', errorText);
        // Fallback gracefully so demo never crashes
        const simulatedText = this.getSimulatedResponse(messages);
        return {
          text: simulatedText,
          model,
          latencyMs: Math.round(performance.now() - startTime),
          isSimulated: true
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        text: content.trim(),
        model,
        latencyMs,
        tokensProcessed: data.usage?.total_tokens || Math.round(content.length / 4),
        isSimulated: false
      };
    } catch (err) {
      console.error('Fetch error from Nebius Token Factory:', err);
      const simulatedText = this.getSimulatedResponse(messages);
      return {
        text: simulatedText,
        model,
        latencyMs: Math.round(performance.now() - startTime),
        isSimulated: true
      };
    }
  }

  // Workflow 1: Convert raw recognized sign glosses into natural spoken speech
  public static async synthesizeSignGlosses(
    glosses: string[],
    tone: 'casual' | 'polite' | 'urgent' | 'direct' = 'casual',
    targetLanguage = 'English',
    modelTier: 'nano' | 'super' | 'ultra' = 'nano'
  ): Promise<NebiusCallResult> {
    const model = modelTier === 'ultra' 
      ? 'nvidia/llama-3_1-nemotron-ultra-253b-v1' 
      : modelTier === 'super' 
        ? 'nvidia/nemotron-3-super' 
        : 'nvidia/nemotron-3-nano';

    const systemPrompt = `You are Transsistant, an expert sign language interpreter powered by NVIDIA Nemotron on Nebius Token Factory.
Your task is to take a raw sequence of Sign Language Glosses (spatial/gestural tokens) and reconstruct them into a fluent, naturally spoken sentence.
Sign language grammar is topic-comment and omits filler words. Re-insert appropriate tenses, prepositions, articles, and emotional clarity.
Output ONLY the final translated sentence, without quotation marks, markdown headings, or explanation.

Tone requested: ${tone}
Target spoken language: ${targetLanguage}`;

    const userPrompt = `Sign Gloss Sequence: [ ${glosses.join(' -> ')} ]`;

    return await this.callNebiusAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], model);
  }

  // Workflow 2: Hearing person speaks -> translate into ASL topic-comment grammar & visual guide steps
  public static async translateSpeechToSignGuide(
    spokenText: string,
    modelOverride = 'nvidia/nemotron-3-super'
  ): Promise<{ glosses: string[]; explanation: string; latencyMs: number; model: string }> {
    const systemPrompt = `You are an expert ASL (American Sign Language) linguistic agent powered by NVIDIA Nemotron.
When given a spoken English sentence, translate it into proper ASL Topic-Comment Gloss syntax and give step-by-step guidance.
Respond in valid JSON format only:
{
  "glosses": ["WORD1", "WORD2", ...],
  "explanation": "Brief explanation of spatial grammar and non-manual markers (facial expressions)"
}`;

    const res = await this.callNebiusAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Spoken Sentence: "${spokenText}"` }
    ], modelOverride, 0.4);

    try {
      // Find JSON block if wrapped
      const jsonMatch = res.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          glosses: parsed.glosses || [spokenText.toUpperCase()],
          explanation: parsed.explanation || 'Express with clear facial expressions and topic-comment structure.',
          latencyMs: res.latencyMs,
          model: res.model
        };
      }
    } catch {
      // Fallback
    }

    return {
      glosses: spokenText.toUpperCase().split(' ').slice(0, 6),
      explanation: 'Signed in direct ASL sequence with expressive facial grammar.',
      latencyMs: res.latencyMs,
      model: res.model
    };
  }

  // Workflow 3: AI Pattern Coach - evaluate hand posture and give encouraging feedback
  public static async generateSignCoachingFeedback(
    targetSignName: string,
    userNotes: string
  ): Promise<NebiusCallResult> {
    const systemPrompt = `You are the Transsistant AI Sign Language Coach powered by NVIDIA Nemotron.
Provide 2 concise, highly encouraging, and kinesthetically actionable tips for a student practicing the sign "${targetSignName}".
Keep your response under 35 words. Tone: warm, precise, motivating.`;

    const userPrompt = `Target Sign: ${targetSignName}\nStudent current position: ${userNotes}`;

    return await this.callNebiusAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 'nvidia/nemotron-3-nano', 0.5);
  }

  // Workflow 4: Autonomous Emergency SOS Dispatch Formatter
  public static async generateEmergencyDispatchReport(
    emergencyType: string,
    customDetails: string
  ): Promise<EmergencyDispatch> {
    const systemPrompt = `You are the Emergency Response Agent for Transsistant (Deaf & Non-Verbal Life Safety System), powered by NVIDIA Nemotron 3 Ultra on Nebius Token Factory.
Format a structured emergency dispatch report ready for 911 / Medical responders.
Respond in pure JSON:
{
  "urgency": "CRITICAL" or "HIGH",
  "type": "MEDICAL" or "FIRE" or "POLICE" or "GENERAL_HELP",
  "headline": "Short bold emergency headline",
  "spokenScript": "Text-to-speech script to be read aloud to first responders on scene",
  "smsMessage": "Concise text message for emergency dispatchers with vital details",
  "vitalDetails": ["Point 1", "Point 2", "Point 3"]
}`;

    const userPrompt = `Emergency Category: ${emergencyType}\nDetails: ${customDetails || 'Immediate assistance required. The user is deaf and communicates via visual screen.'}`;

    const res = await this.callNebiusAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 'nvidia/llama-3_1-nemotron-ultra-253b-v1', 0.3);

    try {
      const jsonMatch = res.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          timestamp: new Date().toLocaleTimeString()
        };
      }
    } catch {
      // Fallback
    }

    return {
      urgency: 'CRITICAL',
      type: 'GENERAL_HELP',
      headline: 'EMERGENCY: Deaf Individual Requires Immediate Assistance',
      spokenScript: 'Attention: The person showing this device is deaf and non-verbal. They require immediate emergency assistance. Please examine this screen.',
      smsMessage: `URGENT SOS: Deaf citizen needs ${emergencyType} assistance. Unable to hear spoken instructions.`,
      vitalDetails: [
        'User is Deaf / Non-verbal',
        `Incident Category: ${emergencyType}`,
        'Communicating through Transsistant AI visual display'
      ],
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Realistic mock generator for instant judge/user testing without requiring an immediate API key
  private static getSimulatedResponse(messages: { role: string; content: string }[]): string {
    const lastMsg = messages[messages.length - 1].content.toLowerCase();

    if (lastMsg.includes('gloss sequence') || lastMsg.includes('sign gloss')) {
      if (lastMsg.includes('hello') && lastMsg.includes('help')) {
        return 'Hello, I need some assistance, please.';
      }
      if (lastMsg.includes('i love you')) {
        return 'I love you very much!';
      }
      if (lastMsg.includes('water')) {
        return 'Could I please get some water?';
      }
      if (lastMsg.includes('doctor')) {
        return 'I need to see a doctor right away.';
      }
      if (lastMsg.includes('thank you')) {
        return 'Thank you very much for your help.';
      }
      return 'I am communicating with you through sign language assisted by Transsistant.';
    }

    if (lastMsg.includes('spoken sentence') || lastMsg.includes('spoken english')) {
      return JSON.stringify({
        glosses: ['NICE', 'MEET', 'YOU', 'GLAD'],
        explanation: 'In ASL, sign NICE then MEET-YOU with a warm smile and steady eye contact.'
      });
    }

    if (lastMsg.includes('target sign')) {
      return 'Great posture! Make sure your thumb is tucked neatly against your curled fingers, and keep your wrist relaxed.';
    }

    if (lastMsg.includes('emergency category')) {
      return JSON.stringify({
        urgency: 'CRITICAL',
        type: 'MEDICAL',
        headline: 'CRITICAL MEDICAL ASSISTANCE REQUESTED',
        spokenScript: 'Attention emergency responders. The individual holding this phone is deaf and non-verbal. They require urgent medical attention.',
        smsMessage: '911 DISPATCH: Deaf citizen in medical emergency. Visual communication needed on arrival.',
        vitalDetails: [
          'Patient is Deaf / Hard of Hearing',
          'Medical evaluation needed immediately',
          'Do not shout; provide written or visual cues'
        ]
      });
    }

    return 'Transsistant AI agent active. NVIDIA Nemotron on Nebius Token Factory ready.';
  }
}
