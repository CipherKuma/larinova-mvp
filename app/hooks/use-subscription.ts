'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AIFeature, UsageCheck } from '@/types/billing';

interface SubscriptionState {
  plan: string;
  status: string;
  usage: Record<string, { used: number; limit: number }>;
  loading: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    status: 'active',
    usage: {},
    loading: true,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data = await res.json();
        setState({
          plan: data.subscription?.plan ?? 'free',
          status: data.subscription?.status ?? 'active',
          usage: data.usage ?? {},
          loading: false,
        });
      }
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const checkUsage = useCallback(async (feature: AIFeature): Promise<UsageCheck> => {
    try {
      const res = await fetch('/api/subscription/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { allowed: true, used: 0, limit: 3, plan: 'free' };
  }, []);

  const isPro = state.plan === 'pro' && state.status === 'active';

  return { ...state, isPro, checkUsage, refetch: fetchStatus };
}
