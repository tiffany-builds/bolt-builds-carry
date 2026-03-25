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
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-items`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: testText,
          userCategories: ["Kids", "Household", "Errands", "Me", "Ideas", "Work", "Projects", "Other"],
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
        const errorData = await response.json();
        if (errorData.error?.includes("ANTHROPIC_API_KEY")) {
          setError("API key is missing or incorrect — check your environment variable");
        } else {
          setError("Server error — try again shortly");
        }
        setTesting(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "API request failed");
        setTesting(false);
        return;
      }

      const data = await response.json();

      if (!data || !data.items) {
        setError("No response received — check your internet connection");
        setTesting(false);
        return;
      }

      setResult(JSON.stringify(data.items, null, 2));
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
