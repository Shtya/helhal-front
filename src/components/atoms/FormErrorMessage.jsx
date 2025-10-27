

export default function FormErrorMessage({ message }) {
    if (!message) return null;

    return (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            ⚠ {message}
        </p>
    );
}
