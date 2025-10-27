const { useMemo, useState, useEffect } = require("react");
const { default: Select } = require("./Select");
import countryCodes from '@/constants/CountryCodes.json';
import Input from './Input';
import Image from 'next/image';

const FlagSvg = ({ code }) => {
    const [data, setData] = useState('');

    useEffect(() => {
        const fetchSvg = async () => {
            try {
                const response = await fetch(`https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`);
                const svgText = await response.text();

                setData(svgText);
            } catch (err) {
                console.error(`Failed to fetch flag for ${code}:`, err);
            }
        };

        fetchSvg();
    }, [code]);

    return (
        <div
            className="w-5 h-3 object-cover"
        >
            {data ? <Image src={`data:image/svg+xml;utf8,${encodeURIComponent(data)}`} alt={`${code} flag`} width={20} height={12} /> : null}
        </div>
    );
};

//examble: value={{ countryCode: state.countryCode, phone: state.phone }}
//countryCode is a object: { code: 'SA', dial_code: '+966' }
//phone is a string: '234589654'
export default function PhoneInputWithCountry({
    value,
    onChange,
}) {
    const formattedOptions = useMemo(() => countryCodes.map(({ name, dial_code, code }) => ({
        id: code,
        value: dial_code,
        countryName: name,
        name: (
            <div title={`${name} ${dial_code}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FlagSvg code={code} />
                <span className='truncate'>{`${name} ${dial_code}`}</span>
            </div>
        ),
    })), [countryCodes]);


    const handleCodeChange = (opt) => {
        onChange({ ...value, countryCode: { code: opt.id, dial_code: opt.value } });
    };

    const handlePhoneChange = (e) => {
        const raw = e.target.value;
        const digitsOnly = raw.replace(/\D/g, '').slice(0, 14); // Remove non-digits and limit to 14
        onChange({ ...value, phone: digitsOnly });
    };


    return (
        <div className="grid gap-2 items-center grid-cols-1 sm:grid-cols-[auto_1fr]">
            <Select
                label="Country Code"
                options={formattedOptions}
                value={value.countryCode?.code}
                onChange={handleCodeChange}
                placeholder="Choose country"
                cnSelect="w-full sm:!w-[120px]"
                cnMenu="sm:!min-w-[302px]"
                VirtualizeWidth={300}
                cnVirtualize='select-virtualized-container'
                showSearch={true}
                isVirtualized
                customSearch={(term) => {
                    return formattedOptions.filter(opt => {
                        const searchTerm = term.toLowerCase();
                        return opt.countryName.toLowerCase().includes(searchTerm) || opt.value.toLowerCase().includes(searchTerm);
                    });
                }}
                formatSelected={(sel) => {
                    return <div title={`${sel.countryName} ${sel.value}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FlagSvg code={sel.id} />
                        <span className=''>{`${sel.value}`}</span>
                    </div>
                }}
            />
            <Input
                label="Phone"
                value={value.phone}
                onChange={handlePhoneChange}
                maxLength={14}
                className="w-full"
            />
        </div>

    );
}
