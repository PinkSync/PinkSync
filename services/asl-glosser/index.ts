/**
 * ASL GLOSSER Service
 * 
 * Text simplification tool that converts heavily intelligent advanced words
 * into simple words that any middle school student can read.
 * 
 * This helps deaf users who may use ASL as their primary language,
 * as ASL has a different grammatical structure than English.
 */

import { events } from '@/services/event-orchestrator/index.ts';

export interface SimplificationRequest {
  id: string;
  userId: string;
  originalText: string;
  simplifiedText?: string;
  readingLevel: ReadingLevel;
  targetLevel: ReadingLevel;
  context?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: {
    originalComplexity: number;
    simplifiedComplexity: number;
    wordsReplaced: number;
    processingTime: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export type ReadingLevel = 
  | 'elementary'      // Grade 1-5
  | 'middle-school'   // Grade 6-8
  | 'high-school'     // Grade 9-12
  | 'college'         // College level
  | 'advanced';       // Advanced/Academic

export interface WordSimplification {
  original: string;
  simplified: string;
  reason: string;
  examples: string[];
}

export interface GlosserRule {
  id: string;
  pattern: string | RegExp;
  replacement: string;
  category: string;
  targetLevel: ReadingLevel;
  priority: number;
}

class ASLGlosserService {
  private simplifications: Map<string, SimplificationRequest> = new Map();
  private rules: GlosserRule[] = [];
  private wordCache: Map<string, string> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * Simplify text to target reading level
   */
  async simplify(
    text: string,
    userId: string,
    options?: {
      targetLevel?: ReadingLevel;
      context?: string;
    }
  ): Promise<SimplificationRequest> {
    const startTime = Date.now();
    const id = this.generateId('simplify');
    
    const originalComplexity = this.calculateComplexity(text);
    const targetLevel = options?.targetLevel || 'middle-school';

    const request: SimplificationRequest = {
      id,
      userId,
      originalText: text,
      readingLevel: this.determineReadingLevel(originalComplexity),
      targetLevel,
      context: options?.context,
      status: 'processing',
      metadata: {
        originalComplexity,
        simplifiedComplexity: 0,
        wordsReplaced: 0,
        processingTime: 0,
      },
      createdAt: new Date(),
    };

    this.simplifications.set(id, request);

    try {
      // Perform simplification
      const result = await this.performSimplification(text, targetLevel, options?.context);
      
      request.simplifiedText = result.text;
      request.metadata.simplifiedComplexity = this.calculateComplexity(result.text);
      request.metadata.wordsReplaced = result.replacements;
      request.metadata.processingTime = Date.now() - startTime;
      request.status = 'completed';
      request.completedAt = new Date();

      await events.contentTransform(userId, 'api', {
        action: 'asl-glosser-simplification',
        requestId: id,
        originalComplexity,
        simplifiedComplexity: request.metadata.simplifiedComplexity,
      });

    } catch (error) {
      request.status = 'failed';
      console.error('Simplification failed:', error);
    }

    return request;
  }

  /**
   * Perform the actual text simplification
   */
  private async performSimplification(
    text: string,
    targetLevel: ReadingLevel,
    context?: string
  ): Promise<{ text: string; replacements: number }> {
    let simplified = text;
    let replacements = 0;

    // Apply rules based on target level
    const applicableRules = this.rules
      .filter(rule => this.isRuleLevelApplicable(rule.targetLevel, targetLevel))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      const before = simplified;
      simplified = simplified.replace(rule.pattern, rule.replacement);
      if (before !== simplified) {
        replacements++;
      }
    }

    // Break down long sentences
    simplified = this.breakLongSentences(simplified);

    // Simplify complex phrases
    simplified = this.simplifyPhrases(simplified);

    // Convert passive to active voice
    simplified = this.convertPassiveToActive(simplified);

    return { text: simplified, replacements };
  }

  /**
   * Break long sentences into shorter ones
   */
  private breakLongSentences(text: string): string {
    const sentences = text.split(/([.!?]+\s+)/);
    const result: string[] = [];

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '';

      if (!sentence.trim()) continue;

      const words = sentence.split(/\s+/);
      
      // If sentence has more than 15 words, try to break it
      if (words.length > 15) {
        // Find conjunction points
        const conjunctions = ['and', 'but', 'because', 'when', 'while', 'although', 'though'];
        let broken = false;

        for (const conj of conjunctions) {
          const conjIndex = words.findIndex(w => w.toLowerCase() === conj);
          if (conjIndex > 5 && conjIndex < words.length - 5) {
            // Break at conjunction
            const first = words.slice(0, conjIndex).join(' ');
            const second = words.slice(conjIndex).join(' ');
            result.push(first + '.' + punctuation);
            result.push(second.charAt(0).toUpperCase() + second.slice(1));
            broken = true;
            break;
          }
        }

        if (!broken) {
          result.push(sentence + punctuation);
        }
      } else {
        result.push(sentence + punctuation);
      }
    }

    return result.join(' ').trim();
  }

  /**
   * Simplify complex phrases
   */
  private simplifyPhrases(text: string): string {
    const phrases: Record<string, string> = {
      // Academic/Complex → Simple
      'in order to': 'to',
      'due to the fact that': 'because',
      'for the purpose of': 'to',
      'in the event that': 'if',
      'at this point in time': 'now',
      'prior to': 'before',
      'subsequent to': 'after',
      'in close proximity to': 'near',
      'has the ability to': 'can',
      'is able to': 'can',
      'make a decision': 'decide',
      'give consideration to': 'consider',
      'conduct an investigation': 'investigate',
      'provide assistance': 'help',
      'make a payment': 'pay',
      'reach a conclusion': 'conclude',
      'come to an agreement': 'agree',
      'take into consideration': 'consider',
      'in spite of the fact that': 'although',
      'with regard to': 'about',
      'in relation to': 'about',
      'as a consequence of': 'because of',
      'in the majority of cases': 'usually',
      'a number of': 'several',
      'it is important to note that': '',
      'it should be noted that': '',
    };

    let simplified = text;
    for (const [complex, simple] of Object.entries(phrases)) {
      const regex = new RegExp(complex, 'gi');
      simplified = simplified.replace(regex, simple);
    }

    return simplified;
  }

  /**
   * Convert passive voice to active (simplified approach)
   */
  private convertPassiveToActive(text: string): string {
    // Simplified passive voice detection and conversion
    let simplified = text;

    // Common patterns: "was [verb]ed by" → "[subject] [verb]ed"
    simplified = simplified.replace(
      /was (\w+ed) by (\w+)/gi,
      (match, verb, subject) => `${subject} ${verb}`
    );

    simplified = simplified.replace(
      /were (\w+ed) by (\w+)/gi,
      (match, verb, subject) => `${subject} ${verb}`
    );

    return simplified;
  }

  /**
   * Calculate text complexity (Flesch-Kincaid inspired)
   */
  private calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = text.split(/\s+/).filter(w => w.trim());
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Simplified Flesch-Kincaid grade level
    const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

    return Math.max(0, Math.min(100, Math.round(gradeLevel * 5))); // Scale 0-100
  }

  /**
   * Count syllables in a word (simplified)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const syllableMatches = word.match(/[aeiouy]{1,2}/g);
    return syllableMatches ? syllableMatches.length : 1;
  }

  /**
   * Determine reading level from complexity score
   */
  private determineReadingLevel(complexity: number): ReadingLevel {
    if (complexity < 20) return 'elementary';
    if (complexity < 40) return 'middle-school';
    if (complexity < 60) return 'high-school';
    if (complexity < 80) return 'college';
    return 'advanced';
  }

  /**
   * Check if rule applies to target level
   */
  private isRuleLevelApplicable(ruleLevel: ReadingLevel, targetLevel: ReadingLevel): boolean {
    const levels: ReadingLevel[] = ['elementary', 'middle-school', 'high-school', 'college', 'advanced'];
    const ruleIndex = levels.indexOf(ruleLevel);
    const targetIndex = levels.indexOf(targetLevel);
    return ruleIndex >= targetIndex;
  }

  /**
   * Get simplification by ID
   */
  async getSimplification(id: string): Promise<SimplificationRequest | null> {
    return this.simplifications.get(id) || null;
  }

  /**
   * Get user simplifications
   */
  async getUserSimplifications(userId: string): Promise<SimplificationRequest[]> {
    return Array.from(this.simplifications.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get word simplification suggestions
   */
  async getWordSimplification(word: string): Promise<WordSimplification | null> {
    // Check cache first
    if (this.wordCache.has(word.toLowerCase())) {
      const simplified = this.wordCache.get(word.toLowerCase())!;
      return {
        original: word,
        simplified,
        reason: 'Common simplification',
        examples: [`Instead of "${word}", use "${simplified}"`],
      };
    }

    return null;
  }

  /**
   * Initialize simplification rules
   */
  private initializeRules(): void {
    // Academic/Complex words → Simple words
    const wordReplacements: Record<string, string> = {
      // Very common academic words
      'utilize': 'use',
      'necessitate': 'need',
      'facilitate': 'help',
      'demonstrate': 'show',
      'implement': 'do',
      'accomplish': 'do',
      'acquire': 'get',
      'additional': 'more',
      'adequate': 'enough',
      'advantageous': 'helpful',
      'advise': 'tell',
      'allocate': 'give',
      'ameliorate': 'improve',
      'anticipate': 'expect',
      'approximately': 'about',
      'ascertain': 'find out',
      'assistance': 'help',
      'attempt': 'try',
      'commence': 'start',
      'compensate': 'pay',
      'comprehend': 'understand',
      'concerning': 'about',
      'consequently': 'so',
      'constitute': 'make up',
      'currently': 'now',
      'determine': 'find',
      'diminish': 'reduce',
      'discontinue': 'stop',
      'endeavor': 'try',
      'enumerate': 'list',
      'equivalent': 'equal',
      'establish': 'set up',
      'exclusively': 'only',
      'expedite': 'speed up',
      'feasible': 'possible',
      'finalize': 'finish',
      'furnish': 'give',
      'however': 'but',
      'identical': 'same',
      'immediately': 'now',
      'indicate': 'show',
      'individual': 'person',
      'inform': 'tell',
      'initiate': 'start',
      'inquire': 'ask',
      'investigate': 'look into',
      'nevertheless': 'but',
      'numerous': 'many',
      'objective': 'goal',
      'obtain': 'get',
      'optimum': 'best',
      'participate': 'take part',
      'perform': 'do',
      'permit': 'let',
      'possess': 'have',
      'preclude': 'prevent',
      'preserve': 'keep',
      'previously': 'before',
      'prioritize': 'rank',
      'proceed': 'go',
      'provide': 'give',
      'purchase': 'buy',
      'regarding': 'about',
      'reimburse': 'pay back',
      'represent': 'stand for',
      'request': 'ask',
      'require': 'need',
      'residence': 'home',
      'retain': 'keep',
      'select': 'choose',
      'submit': 'send',
      'subsequent': 'later',
      'sufficient': 'enough',
      'terminate': 'end',
      'therefore': 'so',
      'transmit': 'send',
      'verify': 'check',
      'whereas': 'while',
    };

    // Create rules from word replacements
    let priority = 100;
    for (const [complex, simple] of Object.entries(wordReplacements)) {
      this.rules.push({
        id: this.generateId('rule'),
        pattern: new RegExp(`\\b${complex}\\b`, 'gi'),
        replacement: simple,
        category: 'word-simplification',
        targetLevel: 'middle-school',
        priority: priority--,
      });

      // Add to cache
      this.wordCache.set(complex.toLowerCase(), simple);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStats() {
    const requests = Array.from(this.simplifications.values());
    const completed = requests.filter(r => r.status === 'completed');

    return {
      totalRequests: requests.length,
      completedRequests: completed.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      failedRequests: requests.filter(r => r.status === 'failed').length,
      averageComplexityReduction: completed.length > 0
        ? completed.reduce((sum, r) => 
            sum + (r.metadata.originalComplexity - r.metadata.simplifiedComplexity), 0
          ) / completed.length
        : 0,
      totalWordsSimplified: completed.reduce((sum, r) => sum + r.metadata.wordsReplaced, 0),
      cachedWords: this.wordCache.size,
      totalRules: this.rules.length,
    };
  }
}

// Singleton instance
export const aslGlosser = new ASLGlosserService();

export default aslGlosser;
