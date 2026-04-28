import { useState } from 'react';
import { ArrowLeft, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  userEmail: string;
  onBack: () => void;
}

export function Settings({ userEmail, onBack }: SettingsProps) {
  const { signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You are not signed in.');
        setIsDeleting(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete account');
      }

      await signOut();
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors mb-6"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-ui text-sm">Back</span>
        </button>

        <h1 className="font-display italic text-3xl font-light text-text mb-8">
          Settings
        </h1>

        <div className="space-y-6">
          <section className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="font-ui text-xs uppercase tracking-wide text-muted mb-3">
              Account
            </h2>
            <p className="font-ui text-text">{userEmail}</p>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-ui text-xs uppercase tracking-wide text-muted">
              Session
            </h2>
            <button
              onClick={signOut}
              className="flex items-center gap-3 text-text font-ui hover:text-accent transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-ui text-xs uppercase tracking-wide text-muted">
              Danger zone
            </h2>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-3 text-red-700 font-ui hover:text-red-800 transition-colors w-full text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete account</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-ui font-medium text-red-900 text-sm">
                      This will permanently delete your account and everything in it.
                    </p>
                    <p className="font-ui text-red-800 text-sm">
                      All your items, categories, and profile data will be removed. This cannot be undone.
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="font-ui text-sm text-red-700">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setError(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 bg-surface border border-border text-text rounded-xl px-4 py-3 font-ui font-medium hover:border-accent/30 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 bg-red-700 text-white rounded-xl px-4 py-3 font-ui font-medium hover:bg-red-800 transition-all disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
