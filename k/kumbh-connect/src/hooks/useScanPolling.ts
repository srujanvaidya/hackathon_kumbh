import { useState, useEffect, useRef } from 'react';

interface ScanResult {
    bandId: string;
    timestamp: string;
}

export const useScanPolling = (enabled: boolean, onScan?: (bandId: string) => void) => {
    useEffect(() => {
        if (!enabled) return;

        const eventSource = new EventSource('/api/scan/');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // "if esp sends the band id then only take it"
                if (data && data.bandId) {
                    if (onScan) {
                        onScan(data.bandId);
                    }
                }
            } catch (e) {
                console.error("Error parsing SSE event", e);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [enabled, onScan]);
};
