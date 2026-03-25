import { useState } from 'react';

export function SimpleApiTest() {
  const [input, setInput] = useState("Remind me to call the dentist tomorrow and Frankie has football Tuesday at 4");
  const [response, setResponse] = useState("");
  const [testing, setTesting] = useState(false);

  const testApi = async () => {
    setTesting(true);
    setResponse("");

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

      if (!apiKey) {
        setResponse("ERROR: VITE_ANTHROPIC_API_KEY is not set in environment variables.\n\nPlease add it to your .env file.");
        setTesting(false);
        return;
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are Carry, a personal assistant for parents. Extract all items from the input and return ONLY a JSON array. Each item must have: title (max 6 words), category (one of: Kids, Household, Errands, Me, Ideas, Work, Projects, Other), type (event, task, reminder or idea). Return valid JSON only — no explanation, no markdown, no code blocks.",
          messages: [
            { role: "user", content: `INPUT: ${input}` }
          ]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setResponse(`ERROR: HTTP ${res.status} ${res.statusText}\n\nFull response:\n${JSON.stringify(errorData, null, 2)}`);
        setTesting(false);
        return;
      }

      const data = await res.json();
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
