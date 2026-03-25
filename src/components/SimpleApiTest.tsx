import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function SimpleApiTest() {
  const [input, setInput] = useState("Remind me to call the dentist tomorrow and Frankie has football Tuesday at 4");
  const [response, setResponse] = useState("");
  const [testing, setTesting] = useState(false);

  const testApi = async () => {
    setTesting(true);
    setResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('carry-intelligence', {
        body: { input }
      });

      if (error) {
        setResponse(`ERROR: ${error.message}\n\nFull error:\n${JSON.stringify(error, null, 2)}`);
        setTesting(false);
        return;
      }

      setResponse(`SUCCESS!\n\nFull API Response:\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setResponse(`ERROR: ${err instanceof Error ? err.message : String(err)}\n\nStack: ${err instanceof Error ? err.stack : 'N/A'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4 mb-8">
      <h2 className="font-ui text-lg font-semibold text-text">API Test</h2>

      <div>
        <label className="block text-sm font-ui text-text/60 mb-2">Test Input:</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-border bg-cream font-ui text-text focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <button
        onClick={testApi}
        disabled={testing}
        className="w-full bg-accent text-surface rounded-xl px-6 py-3 font-ui font-medium hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? 'Testing...' : 'Test Carry Intelligence'}
      </button>

      {response && (
        <div>
          <label className="block text-sm font-ui text-text/60 mb-2">Response:</label>
          <textarea
            value={response}
            readOnly
            rows={15}
            className="w-full px-4 py-3 rounded-xl border border-border bg-cream font-mono text-xs text-text resize-none"
          />
        </div>
      )}
    </div>
  );
}
