import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PricePoint } from '@/api/types';
import { ENV } from '@/config/env';

// We can't fetch a user's historical net worth from any single API, so we
// build it honestly from real balance snapshots: each day the portfolio loads,
// we record { day, totalUsd }. Over time this produces a real net-worth curve.
const keyFor = (owner: string) => `networth:${ENV.network}:${owner}`;

interface Snapshot {
  t: number; // unix seconds (start of day)
  v: number; // total usd
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export function useNetWorthHistory(owner?: string, currentTotal?: number) {
  const [series, setSeries] = useState<PricePoint[]>([]);

  const load = useCallback(async () => {
    if (!owner) return;
    const raw = await AsyncStorage.getItem(keyFor(owner));
    const snaps: Snapshot[] = raw ? JSON.parse(raw) : [];
    setSeries(snaps.map((s) => ({ unixTime: s.t, value: s.v })));
  }, [owner]);

  useEffect(() => {
    load();
  }, [load]);

  // Record/refresh today's snapshot whenever we have a fresh total.
  useEffect(() => {
    if (!owner || currentTotal === undefined || currentTotal === null) return;
    (async () => {
      const raw = await AsyncStorage.getItem(keyFor(owner));
      const snaps: Snapshot[] = raw ? JSON.parse(raw) : [];
      const today = startOfDay(Date.now());
      const existingIdx = snaps.findIndex((s) => s.t === today);
      if (existingIdx >= 0) {
        snaps[existingIdx].v = currentTotal;
      } else {
        snaps.push({ t: today, v: currentTotal });
      }
      // Keep last 90 days.
      const trimmed = snaps.slice(-90);
      await AsyncStorage.setItem(keyFor(owner), JSON.stringify(trimmed));
      setSeries(trimmed.map((s) => ({ unixTime: s.t, value: s.v })));
    })();
  }, [owner, currentTotal]);

  return series;
}
