import { PERMISSION_DOMAINS } from "@/constants/permissions";
import React from "react";
import { PermissionRow } from "./PermissionRow";

export const PermissionMatrix = React.memo(function PermissionMatrix({
    permissions,
    setPermissions,
}) {
    return (
        <div
            className="bg-gray-50 rounded-xl"
        >
            {PERMISSION_DOMAINS.map(domain => (
                <PermissionRow
                    key={domain.key}
                    domain={domain}
                    removeAll={() =>
                        setPermissions(p => ({ ...p, [domain.key]: null }))
                    }
                    value={permissions?.[domain.key] || []}
                    onChange={(v) =>
                        setPermissions(p => ({ ...p, [domain.key]: v }))
                    }
                />
            ))}
        </div>
    );
});
