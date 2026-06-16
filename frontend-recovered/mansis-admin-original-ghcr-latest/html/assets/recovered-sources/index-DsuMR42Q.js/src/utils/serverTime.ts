import { apiClient } from '@/data/apiService';
import { SERVER_TIME } from '@/data/endpoints';

/**
 * QR kodlarında cihaz saati yerine sunucu saatini kullanmak için
 * sunucu zamanı ile cihaz zamanı arasındaki farkı (offset) hesaplar.
 *
 * Bu sayede farklı cihazlardaki saat farkları QR geçerlilik kontrolünü etkilemez.
 */

let serverTimeOffset: number | null = null;
let lastSyncTime: number | null = null;

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 dakikada bir yeniden senkronize et

/**
 * Sunucu ile zamanı senkronize eder ve offset'i hesaplar.
 * offset = serverTime - deviceTime
 *
 * Önceki senkronizasyon 5 dakikadan yeniyse tekrar istek atmaz (performans optimizasyonu).
 */
export async function syncServerTime(): Promise<void> {
  // Eğer son senkronizasyon 5 dakikadan yeniyse tekrar senkronize etme
  if (lastSyncTime !== null && Date.now() - lastSyncTime < SYNC_INTERVAL_MS) {
    return;
  }

  try {
    const beforeRequest = Date.now();
    const response = await apiClient.get<{ serverTime: string }>(SERVER_TIME);
    const afterRequest = Date.now();

    // Ağ gecikmesini hesapla (round-trip / 2)
    const networkLatency = (afterRequest - beforeRequest) / 2;

    const serverTimestamp =
      new Date(response.data.serverTime).getTime() + networkLatency;
    const deviceTimestamp = afterRequest;

    serverTimeOffset = serverTimestamp - deviceTimestamp;
    lastSyncTime = Date.now();
  } catch (error) {
    console.warn('Sunucu zamanı senkronizasyonu başarısız:', error);
  }
}

/**
 * QR doğrulama sırasında sunucu zamanına göre düzeltilmiş Date nesnesi döndürür.
 */
export function getServerTimeNow(): Date {
  if (serverTimeOffset !== null) {
    return new Date(Date.now() + serverTimeOffset);
  }
  return new Date();
}

/** QR kod geçerlilik süresi (saniye) - tüm platformlarda aynı olmalı */
export const QR_VALIDITY_SECONDS = 60;
