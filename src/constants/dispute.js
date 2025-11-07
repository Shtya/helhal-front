

export const disputeType = [
    { id: 'money', name: 'Money issues' },
    { id: 'quality', name: 'Work quality concerns' },
    { id: 'requirements', name: 'Requirements not met' },
    { id: 'other', name: 'Other issue' },
];


export const DisputeStatus = {
    OPEN: 'open',
    IN_REVIEW: 'in_review',
    RESOLVED: 'resolved',
    REJECTED: 'rejected',
    CLOSED_NO_PAYOUT: 'closed_no_payout', // Admin closed without resolution
}
