import Input from "@/components/atoms/Input";
import { useDebounce } from "@/hooks/useDebounce";
import { useState } from "react";


export default function SearchBox({ placeholder = 'Search…', onSearch, className = '!w-fit' }) {
    const [localValue, setLocalValue] = useState('');
    const { debouncedValue } = useDebounce({
        value: localValue,
        onDebounce: () => onSearch(localValue)
    });
    return (
        <div>
            <Input iconLeft={'/icons/search.svg'} className={className} value={localValue}
                onChange={e => setLocalValue(e.target.value)} placeholder={placeholder || 'Search…'} />
        </div>
    );
}