"use client";

import { useNotification } from '@/components/NotificationProvider';
import { useState, useCallback } from 'react';

interface X402Options {
  maxValue?: number;
  uiEnabled?: boolean;
  parseAs?: 'json' | 'text' | 'raw';
  retryOnPayment?: boolean;
  timeout?: number;
}

interface PaymentProof {
  amount: number;
  target: string;
  timestamp: number;
  signature: string;
}

/**
 * PINKSYNC x402 PROTOCOL CLIENT (V3)
 * ----------------------------------
 * A React-specific wrapper that automatically handles 402 Payment Required 
 * responses with built-in UI for payment errors and identity handshakes.
 * 
 * The x402 protocol enables micro-payment gating for PinkSync mesh node access,
 * ensuring fair compensation for accommodation providers while maintaining
 * seamless user experience through DeafAuth identity integration.
 */
export const useX402Fetch = () => {
  const [isPending, setIsPending] = useState(false);
  const [lastPayment, setLastPayment] = useState<PaymentProof | null>(null);
  const { addNotification } = useNotification();

  /**
   * Helper to simulate domain hashing for the mesh
   * In production, this would use actual cryptographic hashing
   */
  const hashId = useCallback((id: string): string => {
    return '0x' + Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '').slice(0, 8) + '...' + id.slice(-4);
  }, []);

  /**
   * Generate payment signature
   * In production, this would interface with wallet/DeafAuth signing
   */
  const generateSignature = useCallback((): string => {
    return "SIG_FIBON_" + Math.random().toString(36).slice(2, 10).toUpperCase();
  }, []);

  /**
   * Create payment proof for x402 response
   */
  const createPaymentProof = useCallback((nodeHash: string, amount: number = 0.0402): PaymentProof => {
    return {
      amount,
      target: nodeHash,
      timestamp: Date.now(),
      signature: generateSignature(),
    };
  }, [generateSignature]);

  /**
   * Main fetch function with x402 payment handling
   */
  const fetchWithPayment = useCallback(async <T = unknown>(
    url: string, 
    options: RequestInit = {}, 
    x402Options: X402Options = {}
  ): Promise<T> => {
    setIsPending(true);
    const { 
      uiEnabled = true, 
      parseAs = 'json',
      retryOnPayment = true,
      timeout = 30000,
    } = x402Options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // 1. Initial Request
      let response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      // 2. Detection of 402 Payment Required
      // Also simulate 402 for PinkSync mesh nodes (demonstration purposes)
      const isPaymentRequired = response.status === 402 || 
        (url.includes('pinksync.io') && Math.random() > 0.7) ||
        (url.includes('/api/mesh') && response.status === 200 && Math.random() > 0.8);
        
      if (isPaymentRequired && retryOnPayment) {
        if (uiEnabled) {
          addNotification("x402: Ingestion Fee Required for Node Fulfillment", "info");
        }
        
        // 3. Parsing Requirements
        const nodeHash = hashId(url);
        
        // 4. Creating and Signing Payment Authorization (Handshake)
        // This simulates the user's wallet/DeafAuth signing the 0.0402 fee
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const paymentProof = createPaymentProof(nodeHash);
        setLastPayment(paymentProof);
        
        const paymentProofEncoded = btoa(JSON.stringify(paymentProof));

        if (uiEnabled) {
          addNotification(`Handshake Signed for ${nodeHash}`, "success");
        }

        // 5. Retry with Payment Credentials
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            "X-PinkSync-Payment-Proof": paymentProofEncoded,
            "X-Hashed-Identity": "0xDEAF...AUTH",
            "X-Protocol-Version": "x402-v3",
          },
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok && response.status !== 402) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response based on options
      if (parseAs === 'raw') return response as unknown as T;
      if (parseAs === 'text') return await response.text() as unknown as T;
      return await response.json() as T;
      
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          if (uiEnabled) addNotification("Request Timeout: Mesh Node Unreachable", "error");
        } else {
          if (uiEnabled) addNotification("Handshake Aborted: Mesh Connectivity Failure", "error");
        }
      }
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [addNotification, hashId, createPaymentProof]);

  /**
   * Convenience method for GET requests
   */
  const get = useCallback(<T = unknown>(url: string, x402Options?: X402Options): Promise<T> => {
    return fetchWithPayment<T>(url, { method: 'GET' }, x402Options);
  }, [fetchWithPayment]);

  /**
   * Convenience method for POST requests
   */
  const post = useCallback(<T = unknown>(
    url: string, 
    body: unknown, 
    x402Options?: X402Options
  ): Promise<T> => {
    return fetchWithPayment<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, x402Options);
  }, [fetchWithPayment]);

  /**
   * Check if a payment proof exists and is still valid (within 5 minutes)
   */
  const hasValidPayment = useCallback((): boolean => {
    if (!lastPayment) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastPayment.timestamp < fiveMinutes;
  }, [lastPayment]);

  return { 
    fetchWithPayment, 
    get,
    post,
    isPending, 
    lastPayment,
    hasValidPayment,
    hashId,
  };
};

export default useX402Fetch;
