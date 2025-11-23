import { Trash2 } from 'lucide-react';
import Button from './Button';
import { useRef } from 'react';
import AttachFilesButton from './AttachFilesButton';
import { resolveUrl } from '@/utils/helper';

export default function FileUploader({
    label,
    files = [],
    onChange,
    error,
    maxFiles = 10,
    maxSizeMB = 25,
}) {
    const inputRef = useRef(null);

    function handleFileChange(selectedFiles) {
        const combined = selectedFiles.slice(0, maxFiles);
        console.log(combined)
        const valid = combined.filter((f) => !f.size || f.size <= maxSizeMB * 1024 * 1024);
        onChange(valid);
        // clear input so same file can be re-selected (optional)
        if (inputRef.current) inputRef.current.value = '';
    }

    function removeFile(index) {
        const updated = [...files];
        updated.splice(index, 1);
        onChange(updated);
    }

    return (
        <div className=" space-y-2 min-w-0 w-full">
            {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}

            <div className='relative w-fit h-fit'>

                <AttachFilesButton maxSelection={10} hiddenFiles={true} onChange={files => {
                    handleFileChange(files)
                }} cnModel="z-[110]" />
            </div>

            <p className="text-xs text-slate-500">
                You can upload up to {maxFiles} files. Each file must be under {maxSizeMB}MB.
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {files.length > 0 && (
                <ul className="space-y-2 text-sm text-slate-700 max-h-72 overflow-y-auto w-full min-w-0">
                    {files.map((file, i) => (
                        <li
                            key={i}
                            className=" flex items-center gap-2 border rounded px-3 py-2 bg-slate-50 w-full"
                        >
                            <a href={resolveUrl(file.url)} target='_blank' className="min-w-0 flex-1 flex hover:underline cursor-pointer">
                                <span className="truncate block min-w-0">
                                    {file.name || file.filename}
                                </span>
                            </a>

                            <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="text-red-500 hover:text-red-700 shrink-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        </li>

                    ))}
                </ul>
            )}
        </div>
    );
}
