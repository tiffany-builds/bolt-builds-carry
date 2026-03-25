import { useState } from 'react';
import { Activity } from 'lucide-react';

export function ApiTestButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testApiConnection = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    const testText = "Frankie has football Tuesday at 4, I need to order a birthday gift for Noah and I've been thinking about a trip to Portugal";

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

      if (!apiKey) {
        setError("API key is missing or incorrect — check your environment variable");
        setTesting(false);
        return;
      }

      if (!apiKey.startsWith('sk-ant-')) {
        setError("API key is missing or incorrect — check your environment variable");
        setTesting(false);
        return;
      }

      const systemPrompt = "You are an AI assistant helping a parent organise their daily life. When given a voice note or text input, extract all actionable items, reminders, events or ideas mentioned. For each item return a JSON array where each object has: title (short, max 6 words), detail (one sentence), category (one of: Kids, Household, Errands, Me, Ideas, Work, Projects, Other), type (event, task, reminder, or idea), and if time is mentioned: date and time fields. Return only valid JSON, no other text.";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: testText,
            },
          ],
        }),
      });

      if (response.status === 401) {
        setError("API key is missing or incorrect — check your environment variable");
        setTesting(false);
        return;
      }

      if (response.status === 429) {
        setError("Too many requests — wait a moment and try again");
        setTesting(false);
        return;
      }

      if (response.status === 500) {
        setError("Anthropic API server error — try again shortly");
        setTesting(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error?.message || "API request failed");
        setTesting(false);
        return;
      }

      const data = await response.json();

      if (!data || !data.content || !data.content[0]) {
        setError("No response received — check your internet connection");
        setTesting(false);
        return;
      }

      const responseText = data.content[0].text;
      setResult(responseText);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("No response received — check your internet connection");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-up">
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg max-w-md">
        <button
          onClick={testApiConnection}
          disabled={testing}
          className="w-full flex items-center justify-center gap-2 bg-accent text-surface rounded-xl px-4 py-3 font-ui hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Activity size={18} />
          <span>{testing ? 'Testing API Connection...' : 'Test API Connection'}</span>
        </button>

        {result && (
          <div className="mt-4">
            <div className="text-xs font-ui font-semibold text-text/60 mb-2">API Response:</div>
            <div className="bg-cream border border-border rounded-xl p-3 text-xs font-mono text-text whitespace-pre-wrap max-h-96 overflow-y-auto">
              {result}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-accent/10 border border-accent/30 rounded-xl p-3">
            <div className="text-sm font-ui text-accent">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
