// components/ErrorState.tsx



export default function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Retry' }) {
    return (
        <div className="col-span-full grid place-items-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-700">
            <p className="font-medium">{title}</p>
            {message && <p className="mt-1 text-sm opacity-80">{message}</p>}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
                >
                    {retryLabel}
                </button>
            )}
        </div>
    );
}
