export const Permissions = {
    Users: {
        Add: 1 << 0,        // 000001 (1)
        Edit: 1 << 1,       // 000010 (2)
        Delete: 1 << 2,     // 000100 (4)
        View: 1 << 3,       // 001000 (8)
        ChangeStatus: 1 << 4, // 010000 (16)
        UpdateLevel: 1 << 5   // 100000 (32)
    },

    Categories: {
        Add: 1 << 0,        // 000001 (1)
        Edit: 1 << 1,       // 000010 (2)
        Delete: 1 << 2,     // 000100 (4)
        View: 1 << 3,       // 001000 (8)
        TopToggle: 1 << 4   // 010000 (16)
    },

    Services: {
        Add: 1 << 0,        // 000001 (1)
        Edit: 1 << 1,       // 000010 (2)
        Delete: 1 << 2,     // 000100 (4)
        View: 1 << 3,       // 001000 (8)
        PopularToggle: 1 << 4, // 010000 (16)
        ChangeStatus: 1 << 5   // 100000 (32)
    },

    Jobs: {
        Add: 1 << 0,        // 000001 (1)
        Edit: 1 << 1,       // 000010 (2)
        Delete: 1 << 2,     // 000100 (4)
        View: 1 << 3,       // 001000 (8)
        ChangeStatus: 1 << 4 // 010000 (16)
    },

    Orders: {
        View: 1 << 0,       // 0001 (1)
        ChangeStatus: 1 << 1, // 0010 (2)
        MarkAsPayout: 1 << 2, // 000100 (3)
    },

    Invoices: {
        View: 1 << 0        // 0001 (1)
    },

    Disputes: {
        View: 1 << 0,       // 0001 (1)
        Chat: 1 << 1,       // 0010 (2)
        Propose: 1 << 2,    // 0100 (4)
        ChangeStatus: 1 << 3 // 1000 (8)
    },

    Finance: {
        View: 1 << 0        // 0001 (1)
    },

    Settings: {
        Update: 1 << 0      // 0001 (1)
    },

    Statistics: {
        View: 1 << 0        // 0001 (1)
    }
};


export const PERMISSION_DOMAINS = [
    {
        key: 'statistics',
        labelKey: 'statistics',
        viewValue: Permissions.Statistics.View,
        actions: [
            { labelKey: 'view', value: Permissions.Statistics.View },
        ],
    },
    {
        key: 'users',
        labelKey: 'users',
        viewValue: Permissions.Users.View,
        actions: [
            { labelKey: 'view', value: Permissions.Users.View },
            { labelKey: 'add', value: Permissions.Users.Add },
            { labelKey: 'edit', value: Permissions.Users.Edit },
            { labelKey: 'delete', value: Permissions.Users.Delete },
            { labelKey: 'change_status', value: Permissions.Users.ChangeStatus },
            { labelKey: 'update_level', value: Permissions.Users.UpdateLevel },
        ],
    },
    {
        key: 'categories',
        labelKey: 'categories',
        viewValue: Permissions.Categories.View,
        actions: [
            { labelKey: 'view', value: Permissions.Categories.View },
            { labelKey: 'add', value: Permissions.Categories.Add },
            { labelKey: 'edit', value: Permissions.Categories.Edit },
            { labelKey: 'delete', value: Permissions.Categories.Delete },
            { labelKey: 'top_toggle', value: Permissions.Categories.TopToggle },
        ],
    },
    {
        key: 'services',
        labelKey: 'services',
        viewValue: Permissions.Users.View,
        actions: [
            { labelKey: 'view', value: Permissions.Services.View },
            { labelKey: 'add', value: Permissions.Services.Add },
            { labelKey: 'edit', value: Permissions.Services.Edit },
            { labelKey: 'delete', value: Permissions.Services.Delete },
            { labelKey: 'popular_toggle', value: Permissions.Services.PopularToggle },
            { labelKey: 'change_status', value: Permissions.Services.ChangeStatus },
        ],
    },
    {
        key: 'jobs',
        labelKey: 'jobs',
        viewValue: Permissions.Jobs.View,
        actions: [
            { labelKey: 'view', value: Permissions.Jobs.View },
            { labelKey: 'add', value: Permissions.Jobs.Add },
            { labelKey: 'edit', value: Permissions.Jobs.Edit },
            { labelKey: 'delete', value: Permissions.Jobs.Delete },
            { labelKey: 'change_status', value: Permissions.Jobs.ChangeStatus },
        ],
    },
    {
        key: 'orders',
        labelKey: 'orders',
        viewValue: Permissions.Orders.View,
        actions: [
            { labelKey: 'view', value: Permissions.Orders.View },
            { labelKey: 'change_status', value: Permissions.Orders.ChangeStatus },
            { labelKey: 'mark_as_paid', value: Permissions.Orders.MarkAsPayout },
        ],
    },
    {
        key: 'invoices',
        labelKey: 'invoices',
        viewValue: Permissions.Invoices.View,
        actions: [
            { labelKey: 'view', value: Permissions.Invoices.View },
        ],
    },
    {
        key: 'disputes',
        labelKey: 'disputes',
        viewValue: Permissions.Disputes.View,
        actions: [
            { labelKey: 'view', value: Permissions.Disputes.View },
            { labelKey: 'chat', value: Permissions.Disputes.Chat },
            { labelKey: 'propose', value: Permissions.Disputes.Propose },
            { labelKey: 'change_status', value: Permissions.Disputes.ChangeStatus },
        ],
    },
    {
        key: 'finance',
        labelKey: 'finance',
        viewValue: Permissions.Finance.View,
        actions: [
            { labelKey: 'view', value: Permissions.Finance.View },
        ],
    },
    {
        key: 'settings',
        labelKey: 'settings',
        viewValue: Permissions.Settings.View,
        actions: [
            { labelKey: 'update', value: Permissions.Settings.Update },
        ],
    },

];
