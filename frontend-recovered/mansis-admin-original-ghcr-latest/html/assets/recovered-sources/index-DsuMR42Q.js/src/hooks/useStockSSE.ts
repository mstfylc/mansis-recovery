import { useEffect, useRef, useState } from 'react';
import { environments } from '@/utils/helpers';

interface StockUpdateEvent {
  type: 'stock:updated';
  payload: {
    branchId: number;
    productId: number;
    productName: string;
    previousQuantity: number;
    newQuantity: number;
    movementType: string;
    timestamp: string;
  };
}

interface LowStockEvent {
  type: 'stock:low';
  payload: {
    branchId: number;
    productId: number;
    productName: string;
    currentQuantity: number;
    minThreshold: number;
    unit: string;
    severity: 'WARNING' | 'CRITICAL';
  };
}

interface StockTransferEvent {
  type: 'stock:transfer';
  payload: {
    fromBranchId: number;
    toBranchId: number;
    productId: number;
    productName: string;
    quantity: number;
    fromBranchName: string;
    toBranchName: string;
  };
  direction?: 'inbound' | 'outbound';
}

type StockEvent = StockUpdateEvent | LowStockEvent | StockTransferEvent;

interface UseStockSSEOptions {
  onStockUpdate?: (event: StockUpdateEvent['payload']) => void;
  onLowStock?: (event: LowStockEvent['payload']) => void;
  onTransfer?: (event: StockTransferEvent) => void;
  enabled?: boolean;
  branchId?: number | null; // Optional for filtering on frontend
}

export const useStockSSE = ({
  onStockUpdate,
  onLowStock,
  onTransfer,
  enabled = true,
  branchId
}: UseStockSSEOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const onStockUpdateRef = useRef(onStockUpdate);
  const onLowStockRef = useRef(onLowStock);
  const onTransferRef = useRef(onTransfer);

  useEffect(() => {
    onStockUpdateRef.current = onStockUpdate;
    onLowStockRef.current = onLowStock;
    onTransferRef.current = onTransfer;
  }, [onStockUpdate, onLowStock, onTransfer]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const baseURL = environments.backendBaseUrl;
    const token = localStorage.getItem('access_token');

    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Use AbortController for cleanup
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Use fetch instead of EventSource to support Authorization header
    // We can't use apiClient here because SSE requires streaming the response
    const connectSSE = async () => {
      try {
        const response = await fetch(`${baseURL}/stocks/events/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream'
          },
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        setIsConnected(true);
        setError(null);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);

              try {
                const event: StockEvent = JSON.parse(data);

                // Optional frontend filtering by branchId
                if (branchId) {
                  const eventBranchId =
                    event.type === 'stock:transfer'
                      ? event.payload.fromBranchId || event.payload.toBranchId
                      : event.payload.branchId;

                  if (eventBranchId !== branchId) {
                    continue; // Skip events not for this branch
                  }
                }

                switch (event.type) {
                  case 'stock:updated':
                    onStockUpdateRef.current?.(event.payload);
                    break;

                  case 'stock:low':
                    onLowStockRef.current?.(event.payload);
                    break;

                  case 'stock:transfer':
                    onTransferRef.current?.(event);
                    break;
                }
              } catch (parseError) {
                console.error('[Stock SSE] Failed to parse event:', parseError);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[Stock SSE] Connection error:', err);
          setError(err.message || 'Failed to connect to stock updates');
          setIsConnected(false);
        }
      }
    };

    connectSSE();

    return () => {
      abortController.abort();
      setIsConnected(false);
    };
  }, [enabled, branchId]); // Only reconnect when enabled or branchId changes

  const disconnect = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsConnected(false);
    }
  };

  return {
    isConnected,
    error,
    disconnect
  };
};
