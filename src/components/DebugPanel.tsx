interface DebugPanelProps {
  lastInput: string;
  apiStatus: 'idle' | 'calling' | 'success' | 'error';
  itemsCount: number;
  lastResponse: string;
  lastError: string;
}

export function DebugPanel({ lastInput, apiStatus, itemsCount, lastResponse, lastError }: DebugPanelProps) {
  return (
    <div className="bg-gray-200 border border-gray-300 rounded-lg p-3 text-xs font-mono text-gray-700 space-y-1">
      <div><span className="font-semibold">Last input:</span> {lastInput || 'none'}</div>
      <div><span className="font-semibold">API status:</span> {apiStatus}</div>
      <div><span className="font-semibold">Items in state:</span> {itemsCount}</div>
      <div><span className="font-semibold">Last API response:</span> {lastResponse ? lastResponse.substring(0, 200) : 'none'}</div>
      <div><span className="font-semibold">Last error:</span> {lastError || 'none'}</div>
    </div>
  );
}
