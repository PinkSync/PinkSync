/**
 * RAG (Retrieval-Augmented Generation) Engine
 * 
 * Manages research documents, community feedback, and vector-based search
 * for accessibility insights and provider recommendations.
 */

import { ResearchDocument, VectorSearchQuery, VectorSearchResult, ResearchType } from '@/types/index.ts';
import { events } from '@/services/event-orchestrator/index.ts';

class RagEngine {
  private documents: Map<string, ResearchDocument> = new Map();
  private index: Map<string, Set<string>> = new Map(); // Simple text index

  /**
   * Index a research document
   */
  async indexDocument(document: Omit<ResearchDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateDocumentId();
    const fullDocument: ResearchDocument = {
      id,
      ...document,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.documents.set(id, fullDocument);
    this.indexText(id, fullDocument.content + ' ' + fullDocument.title);

    // Emit indexing event
    await events.researchIndexed('api', {
      documentId: id,
      type: document.type,
      tags: document.tags,
    });

    return id;
  }

  /**
   * Search documents using vector similarity
   */
  async search(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    const { query: searchText, topK = 10, filter } = query;

    // Simple text-based search (in production, use vector embeddings)
    const results: VectorSearchResult[] = [];
    const searchTerms = searchText.toLowerCase().split(' ');

    for (const [docId, doc] of this.documents) {
      // Apply filters
      if (filter) {
        if (filter.type && doc.type !== filter.type) continue;
        if (filter.verified !== undefined && doc.verified !== filter.verified) continue;
        if (filter.tags && !filter.tags.some((tag: string) => doc.tags.includes(tag))) continue;
      }

      // Calculate simple relevance score
      const content = (doc.content + ' ' + doc.title).toLowerCase();
      const score = searchTerms.reduce((acc, term) => {
        const matches = (content.match(new RegExp(term, 'g')) || []).length;
        return acc + matches;
      }, 0);

      if (score > 0) {
        results.push({
          document: doc,
          score,
          metadata: query.includeMetadata ? this.getDocumentMetadata(docId) : undefined,
        });
      }
    }

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<ResearchDocument | null> {
    return this.documents.get(id) || null;
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: Partial<ResearchDocument>): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;

    const updatedDoc = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
    };

    this.documents.set(id, updatedDoc);
    
    // Re-index if content changed
    if (updates.content || updates.title) {
      this.indexText(id, updatedDoc.content + ' ' + updatedDoc.title);
    }

    return true;
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(type: ResearchType): Promise<ResearchDocument[]> {
    return Array.from(this.documents.values()).filter(doc => doc.type === type);
  }

  /**
   * Get top community-voted documents
   */
  async getTopCommunityDocuments(limit: number = 10): Promise<ResearchDocument[]> {
    const docs = Array.from(this.documents.values());
    docs.sort((a, b) => b.communityVotes - a.communityVotes);
    return docs.slice(0, limit);
  }

  /**
   * Vote on a document
   */
  async voteDocument(id: string, increment: number = 1): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;

    doc.communityVotes += increment;
    doc.updatedAt = new Date();
    
    // Emit community feedback event
    await events.communityFeedback(undefined, 'web', {
      documentId: id,
      action: 'vote',
      increment,
    });

    return true;
  }

  /**
   * Get recommendations based on user preferences
   */
  async getRecommendations(userId: string, preferences: any): Promise<ResearchDocument[]> {
    // In production, use ML model to generate recommendations
    // For now, return top community-voted verified documents
    const docs = Array.from(this.documents.values())
      .filter(doc => doc.verified)
      .sort((a, b) => b.communityVotes - a.communityVotes)
      .slice(0, 5);

    return docs;
  }

  /**
   * Index text for search
   */
  private indexText(docId: string, text: string): void {
    const terms = text.toLowerCase().split(/\W+/);
    for (const term of terms) {
      if (term.length < 3) continue;
      if (!this.index.has(term)) {
        this.index.set(term, new Set());
      }
      this.index.get(term)!.add(docId);
    }
  }

  /**
   * Get document metadata
   */
  private getDocumentMetadata(id: string) {
    const doc = this.documents.get(id);
    if (!doc) return {};

    return {
      indexed: true,
      termCount: doc.content.split(/\W+/).length,
      tagCount: doc.tags.length,
      communityVotes: doc.communityVotes,
    };
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      documentCount: this.documents.size,
      indexedTerms: this.index.size,
      verifiedDocuments: Array.from(this.documents.values()).filter(d => d.verified).length,
      totalVotes: Array.from(this.documents.values()).reduce((sum, d) => sum + d.communityVotes, 0),
    };
  }
}

// Singleton instance
export const ragEngine = new RagEngine();

// Seed with initial documents
async function seedInitialDocuments() {
  await ragEngine.indexDocument({
    title: 'Visual Authentication Best Practices',
    content: 'Visual authentication methods should prioritize clear visual feedback, avoid audio-only verification, and support pattern-based or image-based selection. Key principles include: 1) Clear visual cues, 2) No time pressure, 3) Alternative verification methods.',
    source: 'PinkSync Research',
    type: 'accessibility-guideline',
    tags: ['authentication', 'visual', 'best-practice'],
    communityVotes: 0,
    verified: true,
  });

  await ragEngine.indexDocument({
    title: 'Text Simplification for Accessibility',
    content: 'Simplifying complex text improves accessibility for deaf users who may use ASL as their primary language. Strategies include: breaking down long sentences, using bullet points, replacing jargon with common terms, and adding visual aids.',
    source: 'Deaf Community Feedback',
    type: 'community-feedback',
    tags: ['text-simplification', 'ASL', 'accessibility'],
    communityVotes: 0,
    verified: true,
  });

  await ragEngine.indexDocument({
    title: 'Vocational Rehabilitation Service Integration',
    content: 'When integrating with VR services, ensure all documentation is accessible. Provide simplified versions of complex forms, visual guides for processes, and support for sign language interpretation scheduling.',
    source: 'Provider Integration Guide',
    type: 'technical-documentation',
    tags: ['vocational-rehabilitation', 'integration', 'providers'],
    communityVotes: 0,
    verified: true,
  });
}

// Initialize with seed data
seedInitialDocuments();

export default ragEngine;
