import { add, has, remove } from "@/utils/permissions";
import { useTranslations } from "next-intl";


export function PermissionRow({ domain, value = 0, onChange, removeAll }) {
    const t = useTranslations('Dashboard.users.permissions');
    const viewValue = domain.viewValue;

    const toggle = (perm) => {
        if (has(value, perm)) {
            if (perm === viewValue) {
                removeAll(domain.key);
            } else {
                onChange(remove(value, perm));
            }
        } else {
            let newValue = add(value, perm)

            if (perm !== viewValue && !has(newValue, viewValue)) {
                newValue = add(newValue, viewValue);
            }
            onChange(newValue);
        }
    };

    return (
        <div className="flex max-md:gap-4 md:items-center flex-col md:flex-row bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3">
            {/* Domain Label */}
            <div className="w-1/3 min-w-[150px] font-bold text-gray-800 text-lg px-2">
                {t(`domains.${domain.labelKey}`)}
            </div>

            {/* Vertical Divider */}
            <div className="max-md:hidden h-10 w-px bg-gray-200 mx-4" />

            {/* Actions Grid */}
            <div className="flex flex-1 flex-wrap items-center justify-start gap-5 px-4">
                {domain.actions.map(action => (
                    <label key={action.value} className="flex flex-row items-center gap-2 cursor-pointer group">
                        {/* Checkbox Styled */}
                        <input
                            type="checkbox"
                            checked={has(value, action.value)}
                            onChange={() => toggle(action.value)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        {/* Action Label */}
                        <span className="text-[10px] capitalize font-semibold text-gray-700 group-hover:text-indigo-500 transition-colors">
                            {t(`actions.${action.labelKey}`)}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
