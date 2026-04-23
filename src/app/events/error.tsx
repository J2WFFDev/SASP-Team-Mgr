"use client";

export default function EventsError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Failed to load events
        </h2>
        <p className="text-red-700 text-sm font-mono break-all">{error.message}</p>
        {error.digest && (
          <p className="text-red-400 text-xs mt-2">Digest: {error.digest}</p>
        )}
        <p className="text-red-600 text-sm mt-4">
          Check that <code className="bg-red-100 px-1 rounded">DATABASE_URL</code> is
          set correctly in your Vercel environment variables. For Neon, use the
          connection-pooler URL (contains <code className="bg-red-100 px-1 rounded">pooler.neon.tech</code>
          ) as <code className="bg-red-100 px-1 rounded">DATABASE_URL</code> and the direct URL as{" "}
          <code className="bg-red-100 px-1 rounded">DIRECT_URL</code>.
        </p>
      </div>
    </div>
  );
}
