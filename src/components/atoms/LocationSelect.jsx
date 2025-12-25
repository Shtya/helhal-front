import api from "@/lib/axios";
import toast from "react-hot-toast";

import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo, forwardRef, useEffect, useRef } from "react";
import Select from "./Select";
import { promise } from "zod";

const LocationSelect = forwardRef(({
    type = 'country',
    parentId, // This will be the countryId when type is 'state'
    value,
    onChange,
    placeholder,
    cnPlaceholder,
    label,
    error,
    disabled
}, ref) => {
    const t = useTranslations('LocationSelect');
    const locale = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);


    // track which (type,parentId) combos were fetched already
    const fetchedKeysRef = useRef(new Set());
    const scopeKey = useMemo(() => `${type}:${parentId || 'root'}`, [type, parentId]);


    const fetchLocations = async () => {
        if (type === 'state' && !parentId) {
            setItems([]);
            return;
        }

        if (fetchedKeysRef.current.has(scopeKey)) return; // already fetched for this scope

        let fetchUrl = ''
        if (type === 'state') fetchUrl = `/states/by-country/${parentId}`;
        else fetchUrl = '/countries';
        setLoading(true);

        try {
            const res = await api.get(fetchUrl);
            // Ensure we handle different possible API response shapes
            const records = Array.isArray(res?.data) ? res.data : (res?.data?.records || []);
            setItems(records);
            fetchedKeysRef.current.add(scopeKey);
        } catch (e) {
            setItems([]);
            toast.error(t('errors.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        if (!open && !value) {
            return;
        }

        fetchLocations();
    }, [open, value, scopeKey]);

    // Transform items into the format your Select component expects
    const options = useMemo(() => items.map(item => {
        return {
            id: item.id,
            ...item,
            name: locale === 'ar' ? (item.name_ar || item.name) : item.name,
            originalName: item.name,
        }
    }), [items]);

    function customSearch(term, oldOptions) {
        if (!term) return oldOptions;

        return oldOptions.filter(opt => opt.originalName.toLowerCase().includes(term.toLowerCase()) || opt.name_ar.toLowerCase().includes(term.toLowerCase()));
    }

    return (
        <Select
            ref={ref}
            label={label}
            options={options}
            cnPlaceholder={cnPlaceholder}
            onOpenToggle={(val) => setOpen(val)}
            customSearch={customSearch}
            value={value} // Pass the ID or the object based on your Select implementation
            onChange={onChange}
            placeholder={placeholder}
            isLoading={loading}
            showSearch={true}
            disabled={disabled || (type === 'state' && !parentId)}
            error={error}
        />)
});

export default LocationSelect;