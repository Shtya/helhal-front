

export default function FormErrorMessage({ message, className }) {
    if (!message) return null;

    return (
        <p className={`mt-1 text-sm text-red-600 flex items-center gap-1 ${className}`}>
            ⚠ {message}
        </p>
    );
}
