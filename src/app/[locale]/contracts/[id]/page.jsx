'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, FileText, Clock, CheckCircle, XCircle,
    ChevronDown, Paperclip, Send,
    AlertTriangle, ArrowLeft, RefreshCw, Loader2,
    Banknote, HandCoins, Truck, Star,
    FileWarning, MessageCircle,
} from 'lucide-react';

import { OrderStatus } from '@/constants/order';
import { formatDate, formatDateTime } from '@/utils/date';
import UserMini from '@/components/dashboard/UserMini';
import Currency from '@/components/common/Currency';
import AttachmentList from '@/components/common/AttachmentList';
import OrderDeliveryTimer from '@/components/pages/my-orders/OrderDeliveryTimer';
import DeliverModel from '@/components/pages/my-orders/DeliverModel';
import ReviewSubmissionModel from '@/components/pages/my-orders/ReviewSubmissionModel';
import CongratulationsModal from '@/components/pages/my-orders/Congratulationsmodal';
import RequestChangesModel from '@/components/pages/my-orders/RequestChangesModel';
import { Link } from '@/i18n/navigation';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmtMoney = (v) => {
    const n = Number(v ?? 0);
    return Number.isNaN(n) ? '—' : n.toFixed(2);
};

const STATUS_CFG = {
    [OrderStatus.PENDING]: { dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 ring-amber-200/80' },
    [OrderStatus.ACCEPTED]: { dot: 'bg-main-400', pill: 'bg-main-50 text-main-700 ring-main-200/80' },
    [OrderStatus.DELIVERED]: { dot: 'bg-blue-400', pill: 'bg-blue-50 text-blue-700 ring-blue-200/80' },
    [OrderStatus.COMPLETED]: { dot: 'bg-teal-500', pill: 'bg-teal-50 text-teal-700 ring-teal-200/80' },
    [OrderStatus.CANCELLED]: { dot: 'bg-rose-400', pill: 'bg-rose-50 text-rose-700 ring-rose-200/80' },
    [OrderStatus.REJECTED]: { dot: 'bg-rose-400', pill: 'bg-rose-50 text-rose-700 ring-rose-200/80' },
    [OrderStatus.DISPUTED]: { dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 ring-violet-200/80' },
    [OrderStatus.CHANGES_REQUESTED]: { dot: 'bg-pink-400', pill: 'bg-pink-50 text-pink-700 ring-pink-200/80' },
    [OrderStatus.WAITING]: { dot: 'bg-orange-400', pill: 'bg-orange-50 text-orange-700 ring-orange-200/80' },
};
const getStatusCfg = (s) => STATUS_CFG[s] ?? { dot: 'bg-slate-400', pill: 'bg-slate-50 text-slate-600 ring-slate-200' };

// Staggered reveal helper
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1], delay } },
});


// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">{children}</p>
    );
}

function Hr() {
    return <div className="border-t border-slate-100 my-3" />;
}


// ─────────────────────────────────────────────
// Money Stats Bar (inside header)
// ─────────────────────────────────────────────
function MoneyStatsBar({ order, invoice, buyerView, t }) {
    const sellerNetPay = invoice
        ? Number(invoice.subtotal) - (Number(invoice.subtotal) * (Number(invoice.sellerServiceFee) / 100))
        : 0;

    const stats = buyerView
        ? [
            { label: t('stats.projectPrice'), value: fmtMoney(order?.totalAmount), accent: false },
            { label: t('stats.platformFee'), value: fmtMoney(Number(invoice?.totalAmount) - Number(invoice?.subtotal)), accent: false },
            { label: t('stats.totalPaid'), value: fmtMoney(invoice?.totalAmount ?? order?.totalAmount), accent: true },
        ]
        : [
            { label: t('stats.orderAmount'), value: fmtMoney(invoice?.subtotal ?? order?.totalAmount), accent: false },
            { label: t('stats.commission'), value: `−\u202F${fmtMoney(Number(invoice?.subtotal) * (Number(invoice?.sellerServiceFee) / 100))}`, accent: false, danger: true },
            { label: t('stats.netEarnings'), value: fmtMoney(sellerNetPay || order?.totalAmount), accent: true },
        ];

    return (
        <div className="mt-5 grid grid-cols-3 rounded-xl overflow-hidden ring-1 ring-white/20">
            {stats.map((s, i) => (
                <div
                    key={s.label}
                    className={[
                        'px-4 py-3.5',
                        s.accent ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/10',
                        i !== 0 ? 'border-l border-white/15' : '',
                    ].join(' ')}
                >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55 mb-0.5">{s.label}</p>
                    <p className={`text-xl font-black tabular-nums leading-none ${s.danger ? 'text-rose-300' : 'text-white'}`}>
                        <span className="text-sm font-medium mr-0.5 opacity-75">$</span>
                        {s.value}
                    </p>
                </div>
            ))}
        </div>
    );
}


// ─────────────────────────────────────────────
// Timeline Item
// ─────────────────────────────────────────────
function TimelineItem({ item, isLast, t, index }) {
    const [expanded, setExpanded] = useState(true);
    const isSubmission = item.type === 'submission';

    // Per-type colours
    const dotBg = isSubmission ? 'bg-blue-500' : 'bg-pink-500';
    const dotRing = isSubmission ? 'bg-blue-100' : 'bg-pink-100';
    const labelColor = isSubmission ? 'text-blue-700' : 'text-pink-700';
    const headerFrom = isSubmission
        ? 'from-blue-50/80 hover:from-blue-100/70'
        : 'from-pink-50/80 hover:from-pink-100/70';

    return (
        <motion.div {...fadeUp(index * 0.06)} className="relative flex gap-3.5">
            {/* Connector */}
            {!isLast && (
                <div className="absolute left-[13px] top-[30px] bottom-0 w-px bg-slate-100" />
            )}

            {/* Dot */}
            <div className={`relative z-10 mt-1 flex-shrink-0 w-7 h-7 rounded-full ${dotRing} ring-4 ring-white flex items-center justify-center shadow-sm`}>
                <div className={`w-2 h-2 rounded-full ${dotBg}`} />
            </div>

            {/* Card */}
            <div className="flex-1 mb-5">
                <Card className="overflow-hidden">
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className={`w-full flex items-center justify-between px-5 py-3.5 text-left bg-gradient-to-r ${headerFrom} to-white transition-all`}
                    >
                        <div className="flex items-center gap-2">
                            {isSubmission
                                ? <Package className={`h-3.5 w-3.5 ${labelColor}`} />
                                : <RefreshCw className={`h-3.5 w-3.5 ${labelColor}`} />
                            }
                            <span className={`text-sm font-bold ${labelColor}`}>
                                {isSubmission ? t('timeline.submissionTitle') : t('timeline.changeRequestTitle')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[11px] text-slate-400 tabular-nums">{formatDateTime(item.createdAt)}</span>
                            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
                                <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
                            </motion.div>
                        </div>
                    </button>

                    <AnimatePresence initial={false}>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 py-4 space-y-3 bg-white">
                                    {item.message && (
                                        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                                            {item.message}
                                        </p>
                                    )}
                                    {item.files?.length > 0 && (
                                        <div className="pt-1">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                <Paperclip className="h-3 w-3" />
                                                {t('timeline.attachments')} · {item.files.length}
                                            </p>
                                            <AttachmentList attachments={item.files} variant="list" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </motion.div>
    );
}


// ─────────────────────────────────────────────
// Sidebar: Order Details
// ─────────────────────────────────────────────
function OrderSidebarDetails({ order, invoice, buyerView, t }) {
    const sellerNetPay = invoice
        ? Number(invoice.subtotal) - (Number(invoice.subtotal) * (Number(invoice.sellerServiceFee) / 100))
        : 0;

    const dateRows = [
        { label: t('sidebar.ordered'), val: order.createdAt },
        { label: t('sidebar.accepted'), val: order.acceptedAt },
        { label: t('sidebar.delivered'), val: order.deliveredAt },
        { label: t('sidebar.completed'), val: order.completedAt },
    ].filter(d => d.val);

    return (
        <div className="space-y-3">

            {/* Parties */}
            <Card className="p-4">
                <SectionLabel>{t('sidebar.parties')}</SectionLabel>
                <div className="space-y-3">
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1.5">{t('sidebar.buyer')}</p>
                        {order.buyer
                            ? <UserMini user={order.buyer} href={`/profile/${order.buyer.id}`} />
                            : <span className="text-sm text-slate-300">—</span>}
                    </div>
                    <Hr />
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1.5">{t('sidebar.seller')}</p>
                        {order.seller
                            ? <UserMini user={order.seller} href={`/profile/${order.seller.id}`} />
                            : <span className="text-sm text-slate-300">—</span>}
                    </div>
                </div>
            </Card>

            {/* Order meta */}
            <Card className="p-4">
                <SectionLabel>{t('sidebar.dates')}</SectionLabel>
                <div className="space-y-2">
                    {dateRows.map(d => (
                        <div key={d.label} className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{d.label}</span>
                            <span className="text-xs font-semibold text-slate-700 tabular-nums">{formatDate(d.val)}</span>
                        </div>
                    ))}

                    {(order.packageType || order.quantity) && <Hr />}

                    {order.packageType && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{t('sidebar.packageType')}</span>
                            <span className="text-xs font-semibold text-slate-700 capitalize">{order.packageType}</span>
                        </div>
                    )}
                    {order.quantity && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{t('sidebar.quantity')}</span>
                            <span className="text-xs font-semibold text-slate-700">{order.quantity}</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Invoice */}
            {invoice && (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <SectionLabel>{t('sidebar.invoice')}</SectionLabel>
                        <span className={`-mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${invoice.paymentStatus === 'paid' ? 'bg-main-100 text-main-700' : 'bg-amber-100 text-amber-700'}`}>
                            {invoice.paymentStatus}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 -mt-1 mb-3">#{invoice.invoiceNumber}</p>

                    {invoice.payOnDelivery && (
                        <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold uppercase tracking-wide">
                            <Truck className="h-3 w-3" />
                            {t('sidebar.payOnDelivery')}
                        </div>
                    )}

                    {/* Breakdown */}
                    <div className="space-y-2">
                        {buyerView ? (
                            <>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">{t('sidebar.servicePrice')}</span>
                                    <span className="font-semibold text-slate-700 flex items-center gap-0.5">
                                        <Currency size={10} /> {fmtMoney(invoice.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">{t('sidebar.platformFee')}</span>
                                    <span className="font-semibold text-slate-700 flex items-center gap-0.5">
                                        <Currency size={10} /> {fmtMoney(Number(invoice.totalAmount) - Number(invoice.subtotal))}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between">
                                    <span className="text-xs font-bold text-slate-700">{t('sidebar.total')}</span>
                                    <span className="text-sm font-black text-slate-900 flex items-center gap-0.5">
                                        <Currency size={11} /> {fmtMoney(invoice.totalAmount)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">{t('sidebar.subtotal')}</span>
                                    <span className="font-semibold text-slate-700 flex items-center gap-0.5">
                                        <Currency size={10} /> {fmtMoney(invoice.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">{t('sidebar.commission')} ({invoice.sellerServiceFee}%)</span>
                                    <span className="font-semibold text-rose-500 flex items-center gap-0.5">
                                        − <Currency size={10} /> {fmtMoney(Number(invoice.subtotal) * (Number(invoice.sellerServiceFee) / 100))}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between">
                                    <span className="text-xs font-bold text-slate-700">{t('sidebar.netEarnings')}</span>
                                    <span className="text-sm font-black text-teal-700 flex items-center gap-0.5">
                                        <Currency size={11} /> {fmtMoney(sellerNetPay)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pay On Delivery Contract block */}
                    {invoice.payOnDelivery && order?.offlineContract && (
                        <div className="relative overflow-hidden mt-4 rounded-xl border border-dashed border-teal-300 bg-gradient-to-br from-teal-50 to-white p-4">
                            <div className="pointer-events-none absolute -right-3 -bottom-3 opacity-[0.07]">
                                <HandCoins size={80} />
                            </div>
                            <div className="flex items-center gap-2 mb-2 text-teal-800">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('sidebar.deliveryContract')}</span>
                            </div>
                            <div className="flex items-baseline gap-0.5 text-teal-900">
                                <span className="text-xs font-bold">$</span>
                                <span className="text-2xl font-black tracking-tight">{fmtMoney(order.offlineContract.amountToPayAtDoor)}</span>
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1 text-teal-600">
                                <Banknote size={11} />
                                <span className="text-[10px] font-bold uppercase tracking-wide">{t('sidebar.cashOnDelivery')}</span>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Special instructions */}
            {order.notes && (
                <Card className="p-4">
                    <SectionLabel>{t('sidebar.specialInstructions')}</SectionLabel>
                    <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">{order.notes}</p>
                </Card>
            )}
        </div>
    );
}


// ─────────────────────────────────────────────
// Actions Panel
// ─────────────────────────────────────────────
function ActionsPanel({ order, isSeller, isBuyer, t, onOpenModal, actionLoading }) {
    const s = order?.status;
    if (!s) return null;

    const hasOpenDispute = !!(s === OrderStatus.DISPUTED || s === 'in_review');
    const canSellerDeliver = isSeller && [OrderStatus.ACCEPTED, OrderStatus.CHANGES_REQUESTED].includes(s) && !hasOpenDispute;
    const canBuyerReceive = isBuyer && s === OrderStatus.DELIVERED && !hasOpenDispute;
    const canRequestChanges = isBuyer && s === OrderStatus.DELIVERED && !hasOpenDispute;
    const isChangesRequested = s === OrderStatus.CHANGES_REQUESTED;

    const completedDate = order.completedAt ? new Date(order.completedAt) : null;
    const diffDays = completedDate ? (Date.now() - completedDate.getTime()) / 86_400_000 : 0;
    const isExpired = diffDays > 14;
    const isPublic = order.rating?.isPublic;
    const userHasRated = isBuyer ? !!order?.rating?.buyer_rated_at : !!order?.rating?.seller_rated_at;
    const canRate = s === OrderStatus.COMPLETED && !isPublic && !isExpired;

    const showPanel = canSellerDeliver || canBuyerReceive || canRequestChanges || isChangesRequested || canRate || hasOpenDispute;
    if (!showPanel) return null;

    return (
        <Card className="p-4">
            <SectionLabel>{t('actions.title')}</SectionLabel>

            <div className="space-y-2">
                {/* Seller → submit work (primary) */}
                {canSellerDeliver && (
                    <ActionBtn
                        onClick={() => onOpenModal('deliver')}
                        disabled={!!actionLoading}
                        loading={actionLoading === 'deliver'}
                        icon={<Send className="h-4 w-4" />}
                        variant="primary"
                    >
                        {t('actions.submitWork')}
                    </ActionBtn>
                )}

                {/* Buyer → accept delivery (primary) */}
                {canBuyerReceive && (
                    <ActionBtn
                        onClick={() => onOpenModal('receive')}
                        disabled={!!actionLoading}
                        loading={actionLoading === 'receive'}
                        icon={<CheckCircle className="h-4 w-4" />}
                        variant="primary"
                    >
                        {t('actions.acceptDelivery')}
                    </ActionBtn>
                )}

                {/* Buyer → request changes (outline-danger) */}
                {canRequestChanges && (
                    <ActionBtn
                        onClick={() => onOpenModal('requestChanges')}
                        disabled={!!actionLoading}
                        icon={<RefreshCw className="h-4 w-4" />}
                        variant="danger"
                    >
                        {t('actions.requestChanges')}
                    </ActionBtn>
                )}

                {/* Seller → changes-requested info banner */}
                {isChangesRequested && isSeller && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-pink-50 border border-pink-100 px-3.5 py-3 text-xs text-pink-700 leading-relaxed">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {t('actions.changesRequestedNote')}
                    </div>
                )}

                {/* Rate */}
                {canRate && (
                    <ActionBtn
                        onClick={() => onOpenModal('give-feedback')}
                        icon={<Star className="h-4 w-4" />}
                        variant="ghost-amber"
                    >
                        {userHasRated ? t('actions.editFeedback') : t('actions.leaveFeedback')}
                    </ActionBtn>
                )}

                {/* View dispute */}
                {hasOpenDispute && order.disputeId && (
                    <Link
                        href={`/my-disputes?dispute=${order.disputeId}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-200 text-violet-600 text-sm font-semibold transition-all"
                    >
                        <FileWarning className="h-4 w-4" />
                        {t('actions.viewDispute')}
                    </Link>
                )}
            </div>

            {/* Chat — always */}
            <Hr />
            <Link
                href={isBuyer ? `/chat?userId=${order.sellerId}` : `/chat?userId=${order.buyerId}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 hover:text-slate-700 text-sm font-medium transition-all"
            >
                <MessageCircle className="h-4 w-4" />
                {t('actions.message')}
            </Link>
        </Card>
    );
}

const VARIANT_CLASSES = {
    primary: 'bg-main-600 hover:bg-main-700 text-white shadow-sm shadow-main-200/60',
    danger: 'bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600',
    'ghost-amber': 'bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-amber-600',
};

function ActionBtn({ children, icon, loading, disabled, onClick, variant = 'primary' }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]}`}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            {children}
        </button>
    );
}


// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function ContractPage() {
    const { id: orderId } = useParams();
    const t = useTranslations('ContractPage');
    const { role } = useAuth();
    const router = useRouter();
    const isSeller = role === 'seller';
    const isBuyer = role === 'buyer';

    const [order, setOrder] = useState(null);
    const [orderLoading, setOrderLoading] = useState(true);
    const [orderError, setOrderError] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [openModal, setOpenModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // ── Fetch Order ──
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            setOrderLoading(true);
            setOrderError(null);
            try {
                const { data } = await api.get(`/orders/${orderId}`);
                setOrder(data);
            } catch (err) {
                setOrderError(err?.response?.data?.message || t('errors.fetchFailed'));
            } finally {
                setOrderLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, t]);

    // ── Fetch Timeline ──
    const fetchTimeline = useCallback(async (cursor = null, append = false) => {
        if (!orderId) return;
        append ? setLoadingMore(true) : setTimelineLoading(true);
        try {
            const params = new URLSearchParams({ limit: 20 });
            if (cursor) params.set('cursor', cursor);
            const { data } = await api.get(`/orders/${orderId}/timeline?${params}`);
            setTimeline(prev => append ? [...prev, ...(data.data ?? [])] : (data.data ?? []));
            setHasMore(data.meta?.hasMore ?? false);
            setNextCursor(data.meta?.nextCursor ?? null);
        } catch { /* silent */ } finally {
            append ? setLoadingMore(false) : setTimelineLoading(false);
        }
    }, [orderId]);

    useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

    // ── Helpers ──
    const patchOrderRow = useCallback((id, updater) => {
        setOrder(prev => (!prev || prev.id !== id) ? prev : updater(prev));
    }, []);

    const setRowLoading = useCallback((_id, val) => setActionLoading(val), []);

    const handleAfterAction = useCallback(() => { fetchTimeline(); }, [fetchTimeline]);

    const selectedRow = order ? { id: order.id, status: order.status, _raw: order } : null;

    const statusCfg = getStatusCfg(order?.status);
    const invoice = order?.invoices?.[0];

    // ── Early returns ──
    if (orderLoading) return <PageSkeleton />;

    if (orderError) return (
        <div className="container mx-auto px-4 !mt-8 !mb-4 min-h-[60vh] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto">
                    <XCircle className="h-7 w-7 text-rose-400" />
                </div>
                <p className="text-slate-700 font-semibold">{orderError}</p>
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> {t('errors.goBack')}
                </button>
            </div>
        </div>
    );

    if (!order) return null;

    return (
        <div className="container mx-auto px-4 !mt-8 !mb-4 space-y-5">

            {/* ══ HEADER ══ */}
            <motion.div {...fadeUp(0)}>
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-main-600 via-main-500 to-main-700 px-6 pt-5 pb-6 shadow-lg shadow-main-900/10">
                    {/* Decorative radial glow */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(255,255,255,0.13),transparent)]" />

                    {/* Back */}
                    <button
                        onClick={() => router.push('/my-orders')}
                        className="relative inline-flex items-center gap-1.5 text-white/55 hover:text-white/90 text-xs font-medium transition-colors mb-4"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {t('header.backToOrders')}
                    </button>

                    {/* Title + status + ID */}
                    <div className="relative flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                            <h1 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                                {order.title}
                            </h1>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                    {order.status}
                                </span>
                                {order.jobId && (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/10 text-white/65 uppercase tracking-wide">
                                        {t('header.fromJob')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t('header.orderId')}</p>
                            <p className="text-[11px] font-mono text-white/55 mt-0.5 max-w-[180px] truncate">{order.id}</p>
                        </div>
                    </div>

                    {/* Money stats */}
                    <MoneyStatsBar order={order} invoice={invoice} buyerView={isBuyer} t={t} />
                </div>
            </motion.div>

            {/* ══ DELIVERY TIMER ══ */}
            {/* {[OrderStatus.ACCEPTED, OrderStatus.CHANGES_REQUESTED, OrderStatus.DELIVERED].includes(order.status) && (
                <motion.div {...fadeUp(0.05)}>
                    <OrderDeliveryTimer order={order} />
                </motion.div>
            )} */}

            {/* ══ BODY ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

                {/* ── Timeline column ── */}
                <motion.div {...fadeUp(0.1)}>
                    {/* Section heading */}
                    <div className="flex items-center justify-between mb-4 px-0.5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1 h-5 rounded-full bg-main-500" />
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">{t('timeline.title')}</h2>
                        </div>
                        <button
                            onClick={() => fetchTimeline()}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <RefreshCw className="h-3 w-3" />
                            {t('timeline.refresh')}
                        </button>
                    </div>

                    {timelineLoading ? (
                        <TimelineSkeleton />
                    ) : timeline.length === 0 ? (
                        <Card className="py-14 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                                <Clock className="h-5 w-5 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                                {t('timeline.empty')}
                            </p>
                        </Card>
                    ) : (
                        <div>
                            {timeline.map((item, i) => (
                                <TimelineItem
                                    key={item.id}
                                    item={item}
                                    isLast={i === timeline.length - 1 && !hasMore}
                                    t={t}
                                    index={i}
                                />
                            ))}

                            {hasMore && (
                                <div className="flex justify-center pt-1 pb-4">
                                    <button
                                        onClick={() => fetchTimeline(nextCursor, true)}
                                        disabled={loadingMore}
                                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {loadingMore
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <ChevronDown className="h-3.5 w-3.5" />
                                        }
                                        {t('timeline.loadMore')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* ── Sidebar column ── */}
                <motion.div {...fadeUp(0.15)} className="lg:sticky lg:top-6 space-y-3">
                    <ActionsPanel
                        order={order}
                        isSeller={isSeller}
                        isBuyer={isBuyer}
                        t={t}
                        onOpenModal={setOpenModal}
                        actionLoading={actionLoading}
                    />
                    <OrderSidebarDetails
                        order={order}
                        invoice={invoice}
                        buyerView={isBuyer}
                        t={t}
                    />
                </motion.div>
            </div>

            {/* ══ MODALS ══ */}
            <DeliverModel
                open={openModal === 'deliver'}
                onClose={() => { setOpenModal(null); handleAfterAction(); }}
                selectedRow={selectedRow}
                patchOrderRow={patchOrderRow}
                setRowLoading={setRowLoading}
            />
            <ReviewSubmissionModel
                open={openModal === 'receive'}
                readOnly={false}
                showCongratulations={() => setOpenModal('congratulation')}
                onClose={() => { setOpenModal(null); handleAfterAction(); }}
                selectedRow={selectedRow}
                patchOrderRow={patchOrderRow}
                setRowLoading={setRowLoading}
            />
            <CongratulationsModal
                open={openModal === 'congratulation'}
                onClose={() => setOpenModal('give-feedback')}
                selectedRow={selectedRow}
            />
            <RequestChangesModel
                open={openModal === 'requestChanges'}
                onClose={() => { setOpenModal(null); handleAfterAction(); }}
                onSend={() => { setOpenModal(null); handleAfterAction(); }}
                selectedRow={selectedRow}
                patchOrderRow={patchOrderRow}
            />
        </div>
    );
}


// ─────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────
function PageSkeleton() {
    return (
        <div className="container mx-auto px-4 !mt-8 !mb-4 space-y-5 animate-pulse">
            <div className="h-52 rounded-2xl bg-main-200/50" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3.5">
                            <div className="w-7 h-7 mt-1 rounded-full bg-slate-200 flex-shrink-0" />
                            <div className="flex-1 h-28 rounded-2xl bg-slate-200" />
                        </div>
                    ))}
                </div>
                <div className="space-y-3">
                    <div className="h-40 rounded-2xl bg-slate-200" />
                    <div className="h-56 rounded-2xl bg-slate-200" />
                    <div className="h-32 rounded-2xl bg-slate-200" />
                </div>
            </div>
        </div>
    );
}

function TimelineSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
                <div key={i} className="flex gap-3.5">
                    <div className="w-7 h-7 mt-1 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 h-28 rounded-2xl bg-slate-200" />
                </div>
            ))}
        </div>
    );
}