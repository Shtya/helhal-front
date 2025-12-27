"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useLayoutEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ImProfile } from "react-icons/im";
import { RiMenuSearchLine } from "react-icons/ri";
import { LuChartNetwork } from "react-icons/lu";
import { FiCheckCircle } from "react-icons/fi";

import { useLocale, useTranslations } from "next-intl";
import { useValues } from "@/context/GlobalContext";
import FAQSection from "@/components/common/Faqs";

import { motion, useInView, AnimatePresence } from "framer-motion";
import {
	Users,
	Briefcase,
	Star,
	Headphones,
	Sparkles,
	ShieldCheck,
	Wallet,
	CalendarClock,
	TrendingUp,
	MousePointerClick,
	CheckCircle2,
	UserCheck,
	ArrowRight
} from "lucide-react";

/* ---------------------------------- Page ---------------------------------- */

const Page = () => {
	return (
		<div className="bg-white">
			<Hero />
			<StatsStrip />
			<WhyChoose />
			<CustomFeatures />
			<BannerCTA />
			<FAQs />
		</div>
	);
};

export default Page;

/* ---------------------------- Shared UI helpers ---------------------------- */

/**
 * ✅ New: Unified section "band" system
 * - Every section can be "tint" or "plain"
 * - Adds consistent divider & background accents
 */
function Section({
	eyebrow,
	title,
	description,
	children,
	className = "",
	variant = "plain", // "plain" | "tint"
	withDividerTop = false
}) {
	const isTint = variant === "tint";

	return (
		<section
			className={[
				"relative overflow-hidden",
				withDividerTop ? "border-t border-emerald-100/70" : "",
				isTint ? "bg-gradient-to-b from-emerald-50/70 via-white to-white" : "bg-white",
				className
			].join(" ")}
		>
			{/* unified background accents */}
			<div className="pointer-events-none absolute inset-0">
				{isTint ? (
					<>
						<div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/14 blur-3xl" />
						<div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-teal-400/12 blur-3xl" />
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_55%)]" />
					</>
				) : (
					<>
						<div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-emerald-400/8 blur-3xl" />
						<div className="absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-teal-400/8 blur-3xl" />
					</>
				)}
			</div>

			<div className="relative container !px-4 sm:!px-6 lg:!px-8 !py-12 md:!py-16">
				<div className="mx-auto max-w-6xl">
					<div className="mb-10 text-center">
						{eyebrow ? (
							<div className="mx-auto mb-3 inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-900/90">
								{eyebrow}
							</div>
						) : null}

						<h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
							{title}
						</h2>

						{description ? (
							<p className="mx-auto mt-3 max-w-2xl text-base md:text-lg text-slate-600">
								{description}
							</p>
						) : null}
					</div>

					{children}
				</div>
			</div>
		</section>
	);
}

function Card({ children, className = "" }) {
	return (
		<div
			className={[
				"group rounded-3xl border border-emerald-100/70 bg-white/80 backdrop-blur",
				"shadow-[0_10px_35px_-25px_rgba(2,6,23,0.35)] hover:shadow-[0_25px_60px_-40px_rgba(2,6,23,0.55)]",
				"transition-all duration-200 hover:-translate-y-0.5",
				className
			].join(" ")}
		>
			{children}
		</div>
	);
}

/* ---------------------------------- Hero ---------------------------------- */

export function Hero() {
	const t = useTranslations("freelance");
	const locale = useLocale();
	const isRTL = locale === "ar";

	return (
		<section className="relative overflow-hidden">
			<div className="relative h-[calc(100vh-64px)] md:h-[calc(100vh-88px)] w-full">
				<Image
					loading="eager"
					src="/images/hero-background.jpg"
					alt="Hero background"
					fill
					priority
					className="object-cover object-center"
				/>

				<div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/70" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.30),transparent_55%)]" />

				<div className="relative z-10 flex h-full items-center">
					<div className="container !px-4 sm:!px-6 lg:!px-8">
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
							{/* Left content */}
							<div className="lg:col-span-7 text-white">
								<h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
									{t("title")}
								</h1>

								<p className="mt-5 max-w-xl text-base md:text-lg text-white/85">
									{t("subTitle")}
								</p>

								<div className={`mt-8 flex flex-wrap gap-3 ${isRTL ? "lg:justify-start" : ""}`}>
									<Link
										href="/auth?tab=register&type=seller"
										className="inline-flex items-center justify-center h-12 px-12 max-md:px-4 rounded-lg bg-emerald-500 text-white text-sm md:text-base font-semibold hover:bg-emerald-600 transition shadow-md hover:shadow-lg"
									>
										{t("getStarted")}
									</Link>
								</div>

								<div className="mt-10 flex flex-wrap items-center gap-6 text-white/80">
									<div className="flex items-center gap-2">
										<FiCheckCircle className="text-emerald-300" />
										<span className="text-sm">{t("whyChoose.items.securePayments.title")}</span>
									</div>
									<div className="flex items-center gap-2">
										<FiCheckCircle className="text-emerald-300" />
										<span className="text-sm">{t("whyChoose.items.userFriendlyPlatform.title")}</span>
									</div>
									<div className="flex items-center gap-2">
										<FiCheckCircle className="text-emerald-300" />
										<span className="text-sm">{t("whyChoose.items.supportiveCommunity.title")}</span>
									</div>
								</div>
							</div>

							{/* Right “glass” card */}
							<div className="lg:col-span-5">
								<div className="rounded-3xl border border-white/15 bg-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/20">
									<div className="flex items-center gap-3">
										<div className="flex-none h-12 w-12 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center">
											<LuChartNetwork className="text-emerald-200 text-2xl" />
										</div>
										<div>
											<p className="text-white font-bold text-lg">{t("howStart.title")}</p>
											<p className="text-white/70 text-sm">{t("subTitle")}</p>
										</div>
									</div>

									<div className="mt-6 space-y-3">
										<div className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/10 p-4">
											<ImProfile className="text-emerald-200 text-2xl mt-0.5" />
											<div>
												<p className="text-white font-semibold">{t("howStart.steps.createProfile.title")}</p>
												<p className="text-white/70 text-sm">{t("howStart.steps.createProfile.description")}</p>
											</div>
										</div>

										<div className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/10 p-4">
											<RiMenuSearchLine className="text-emerald-200 text-2xl mt-0.5" />
											<div>
												<p className="text-white font-semibold">{t("howStart.steps.browseProjects.title")}</p>
												<p className="text-white/70 text-sm">{t("howStart.steps.browseProjects.description")}</p>
											</div>
										</div>

										<div className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/10 p-4">
											<LuChartNetwork className="text-emerald-200 text-2xl mt-0.5" />
											<div>
												<p className="text-white font-semibold">{t("howStart.steps.submitProposals.title")}</p>
												<p className="text-white/70 text-sm">{t("howStart.steps.submitProposals.description")}</p>
											</div>
										</div>
									</div>

									<div className="mt-6">
										<Link
											href="/auth?tab=register&type=seller"
											className="w-full inline-flex items-center justify-center h-12 rounded-full bg-white text-emerald-800 font-semibold hover:bg-emerald-50 transition"
										>
											{t("getStarted")}
										</Link>
									</div>
								</div>
							</div>
							{/* end glass card */}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ---------------------------- Stats strip (nice) ---------------------------- */

function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function easeOutCubic(t) {
	return 1 - Math.pow(1 - t, 3);
}

function parseStat(display) {
	const raw = String(display).trim();

	const ratingMatch = raw.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
	if (ratingMatch) {
		return {
			type: "fraction",
			target: parseFloat(ratingMatch[1]),
			denom: ratingMatch[2],
			decimals: ratingMatch[1].includes(".") ? ratingMatch[1].split(".")[1].length : 0,
			raw
		};
	}

	const supportMatch = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
	if (supportMatch) {
		return {
			type: "fraction",
			target: parseFloat(supportMatch[1]),
			denom: supportMatch[2],
			decimals: 0,
			raw
		};
	}

	const m = raw.match(/^([\d.]+)\s*([KMB])?\s*(\+)?$/i);
	if (m) {
		const base = parseFloat(m[1]);
		const unit = (m[2] || "").toUpperCase();
		const plus = m[3] ? "+" : "";
		return {
			type: "unit",
			target: base,
			unit,
			plus,
			decimals: m[1].includes(".") ? m[1].split(".")[1].length : 0,
			raw
		};
	}

	const n = parseFloat(raw.replace(/[^\d.]/g, ""));
	return {
		type: "plain",
		target: Number.isFinite(n) ? n : 0,
		decimals: raw.includes(".") ? raw.split(".")[1]?.length ?? 0 : 0,
		suffix: raw.replace(/[\d.\s]/g, ""),
		raw
	};
}

function formatStat(parsed, value) {
	const v = parsed.decimals > 0 ? value.toFixed(parsed.decimals) : Math.round(value).toString();
	if (parsed.type === "fraction") return `${v} / ${parsed.denom}`;
	if (parsed.type === "unit") return `${v}${parsed.unit}${parsed.plus}`;
	return `${v}${parsed.suffix ?? ""}`;
}

function useCountUp({ target, duration = 1100, decimals = 0, startWhen }) {
	const raf = useRef(null);
	const start = useRef(null);
	const [val, setVal] = useState(0);

	useEffect(() => {
		if (!startWhen) return;

		setVal(0);
		start.current = null;

		const step = (ts) => {
			if (!start.current) start.current = ts;

			const t = clamp((ts - start.current) / duration, 0, 1);
			const eased = easeOutCubic(t);
			const next = target * eased;

			const rounded = decimals > 0 ? Number(next.toFixed(decimals)) : Math.round(next);
			setVal(rounded);

			if (t < 1) raf.current = requestAnimationFrame(step);
		};

		raf.current = requestAnimationFrame(step);
		return () => raf.current && cancelAnimationFrame(raf.current);
	}, [target, duration, decimals, startWhen]);

	return val;
}

function StatCard({ item, index, start }) {
	const t = useTranslations("freelance.statsStrip");

	const parsed = useMemo(() => parseStat(item.value), [item.value]);
	const current = useCountUp({
		target: parsed.target,
		duration: 1200 + index * 120,
		decimals: parsed.decimals,
		startWhen: start
	});

	const Icon = item.icon;
	const display = start ? formatStat(parsed, current) : item.value;

	return (
		<motion.div
			initial={{ opacity: 0, y: 18, scale: 0.98 }}
			whileInView={{ opacity: 1, y: 0, scale: 1 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ delay: index * 0.06, duration: 0.5, ease: "easeOut" }}
			className="group relative rounded-3xl p-[1px]"
		>
			<div className="absolute inset-0 rounded-3xl bg-[linear-gradient(120deg,rgba(16,185,129,0.55),rgba(45,212,191,0.45),rgba(59,130,246,0.35))] opacity-70 blur-[0.2px] transition-opacity group-hover:opacity-100" />
			<div className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_55%)] opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

			<div className="relative rounded-3xl bg-white/70 backdrop-blur-xl px-6 py-7 shadow-[0_10px_30px_-18px_rgba(2,6,23,0.35)] ring-1 ring-emerald-100/70">
				<div className="absolute rtl:left-5 ltr:right-5 top-5 opacity-0 transition-opacity group-hover:opacity-100">
					<Sparkles className="h-5 w-5 text-emerald-500/80" />
				</div>

				<div className="flex items-center gap-4">
					<div className="relative">
						<div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl" />
						<div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-200/70">
							<Icon className="h-6 w-6 text-emerald-700" />
						</div>
					</div>

					<div className="min-w-0">
						<div className="flex items-baseline gap-2">
							<div className=" text-nowrap text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
								{display}
							</div>
							<span className="hidden md:inline text-xs font-semibold text-emerald-700/80 bg-emerald-50 px-2 py-1 rounded-full ring-1 ring-emerald-200/70">
								{t("verified")}
							</span>
						</div>

						<div className="mt-1 text-sm font-medium text-slate-600">
							{t(`items.${item.key}.label`)}
						</div>
					</div>
				</div>

				<div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent" />
			</div>
		</motion.div>
	);
}

export function StatsStrip() {
	const t = useTranslations("freelance.statsStrip");

	const items = useMemo(
		() => [
			{ key: "freelancers", value: "10K+", icon: Users },
			{ key: "projects", value: "25K+", icon: Briefcase },
			{ key: "rating", value: "4.8/5", icon: Star },
			{ key: "support", value: "24/7", icon: Headphones }
		],
		[]
	);

	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-120px" });

	return (
		<Section
			eyebrow={t("badge")}
			title={t("title")}
			description={t("description")}
			variant="tint"
			withDividerTop
			className="!py-0"
		>
			<div ref={ref} className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{items.map((it, i) => (
					<StatCard key={it.key} item={it} index={i} start={inView} />
				))}
			</div>
		</Section>
	);
}

/* -------------------------------- WhyChoose -------------------------------- */

export function WhyChoose() {
	const t = useTranslations("freelance");

	const WHY_CHOOSE_ITEMS = [
		{ key: "wideReach", icon: Users },
		{ key: "securePayments", icon: Wallet },
		{ key: "flexibleWork", icon: CalendarClock },
		{ key: "supportiveCommunity", icon: Sparkles },
		{ key: "growthOpportunities", icon: TrendingUp },
		{ key: "userFriendlyPlatform", icon: MousePointerClick }
	];

	return (
		<Section
			eyebrow={t("whyChoose.eyebrow")}
			title={t("whyChoose.title")}
			description={t("whyChoose.description")}
			variant="plain"
			withDividerTop
		>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{WHY_CHOOSE_ITEMS.map((item, i) => {
					const Icon = item.icon;
					return (
						<motion.div
							key={item.key}
							initial={{ opacity: 0, y: 14 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-80px" }}
							transition={{ delay: i * 0.06, duration: 0.45, ease: "easeOut" }}
							className="group"
						>
							<Card className="relative overflow-hidden p-6">
								<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
									<div className="absolute -inset-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_55%)] blur-2xl" />
								</div>

								<div className="relative flex items-start gap-4">
									<div className="relative">
										<div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl" />
										<div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-200/70">
											<Icon className="h-6 w-6 text-emerald-700" />
										</div>
									</div>

									<div className="min-w-0">
										<h3 className="text-base md:text-lg font-extrabold tracking-tight text-slate-900">
											{t(`whyChoose.items.${item.key}.title`)}
										</h3>
										<p className="mt-2 text-sm text-slate-600 leading-relaxed">
											{t(`whyChoose.items.${item.key}.description`)}
										</p>
									</div>
								</div>
							</Card>
						</motion.div>
					);
				})}
			</div>
		</Section>
	);
}

/* ------------------------------ CustomFeatures ------------------------------ */
 
function getTooltipPlacement(pos) {
	// pos.top/left are strings like "25%" -> parse number
	const top = parseFloat(pos.top);
	const left = parseFloat(pos.left);

	// Determine quadrant-ish
	const isTop = top <= 22;
	const isBottom = top >= 78;
	const isLeft = left <= 25;
	const isRight = left >= 75;

	// Default: below
	let cls = "top-full mt-3 left-1/2 -translate-x-1/2";

	// If near top -> put below (already)
	if (isTop) cls = "top-full mt-3 left-1/2 -translate-x-1/2";

	// If near bottom -> put above
	if (isBottom) cls = "bottom-full mb-3 left-1/2 -translate-x-1/2";

	// If strong left -> put right side
	if (isLeft) cls = "left-full ms-3 top-1/2 -translate-y-1/2";

	// If strong right -> put left side
	if (isRight) cls = "right-full me-3 top-1/2 -translate-y-1/2";

	// Handle corners: prefer vertical placement to avoid going offscreen
	if (isTop && isLeft) cls = "top-full mt-3 left-1/2 -translate-x-1/2";
	if (isTop && isRight) cls = "top-full mt-3 left-1/2 -translate-x-1/2";
	if (isBottom && isLeft) cls = "bottom-full mb-3 left-1/2 -translate-x-1/2";
	if (isBottom && isRight) cls = "bottom-full mb-3 left-1/2 -translate-x-1/2";

	return cls;
}

function getTooltipArrow(pos) {
	const top = parseFloat(pos.top);
	const left = parseFloat(pos.left);

	const isTop = top <= 22;
	const isBottom = top >= 78;
	const isLeft = left <= 25;
	const isRight = left >= 75;

	// arrow is a small rotated square
	// Default arrow (pointing up from tooltip to node): place at top center
	let arrow = "left-1/2 -translate-x-1/2 -top-1";

	if (isTop) arrow = "left-1/2 -translate-x-1/2 -top-1"; // tooltip below node
	if (isBottom) arrow = "left-1/2 -translate-x-1/2 -bottom-1"; // tooltip above node
	if (isLeft) arrow = "-left-1 top-1/2 -translate-y-1/2"; // tooltip right of node
	if (isRight) arrow = "-right-1 top-1/2 -translate-y-1/2"; // tooltip left of node

	// corners -> vertical arrow
	if ((isTop && isLeft) || (isTop && isRight)) arrow = "left-1/2 -translate-x-1/2 -top-1";
	if ((isBottom && isLeft) || (isBottom && isRight)) arrow = "left-1/2 -translate-x-1/2 -bottom-1";

	return arrow;
}


export function CustomFeatures() {
	const t = useTranslations("freelance.customFeatures");

	const FEATURES = useMemo(
		() => [
			{ key: "qualityProjects", icon: CheckCircle2 },
			{ key: "securePayments", icon: ShieldCheck },
			{ key: "profileShowcase", icon: UserCheck },
			{ key: "support", icon: Headphones },
			{ key: "growth", icon: TrendingUp },
			{ key: "community", icon: Users }
		],
		[]
	);

	const [active, setActive] = useState(FEATURES[0].key);
	const activeItem = FEATURES.find((f) => f.key === active) ?? FEATURES[0];
	const ActiveIcon = activeItem.icon;

	// orbit positions (percent-based so it scales responsively)
	const POS = [
		{ top: "3%", left: "50%", cn: "top-[0] left-[50%] translate-x-[-50%] " },   // top
		{ top: "25%", left: "86%", cn: "top-[25%] left-[86%] " },  // top-right
		{ top: "68%", left: "88%", cn: "top-[68%] left-[85%] " },  // bottom-right
		{ top: "92%", left: "50%", cn: "top-[90%] left-[50%] translate-x-[-50%] " },  // bottom
		{ top: "68%", left: "12%", cn: "top-[68%] left-[20px] " },  // bottom-left
		{ top: "25%", left: "14%", cn: "top-[25%] left-[10px] " }   // top-left
	];

	return (
		<Section
			eyebrow={t("eyebrow")}
			title={t("title")}
			description={t("subtitle")}
			className=" relative bg-gradient-to-b from-white via-white to-emerald-50/40"
		>
			{/* background blobs */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
				<div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
			</div>

			<div className="relative mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
				{/* LEFT: orbit */}
				<div className="lg:col-span-7">
					<div className="relative mx-auto aspect-square w-full max-w-[520px]">
						{/* orbit rings */}
						<div className="pointer-events-none absolute inset-0 grid place-items-center">
							<div className="h-[92%] w-[92%] rounded-full border border-emerald-200/60" />
							<div className="absolute h-[72%] w-[72%] rounded-full border border-emerald-200/40" />
							<div className="absolute h-[48%] w-[48%] rounded-full border border-emerald-200/30" />
							<div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.10),transparent_60%)] blur-2xl" />
						</div>

						{/* hub (center) */}
						<div className="absolute inset-0 grid place-items-center">
							<div className="relative w-[78%] rounded-[32px] bg-white/70 backdrop-blur-xl ring-1 ring-emerald-200/60 shadow-[0_30px_80px_-55px_rgba(2,6,23,0.55)] overflow-hidden">
								<div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 opacity-80" />

								<div className="relative p-7 md:p-9">
									{/* glow */}
									<div className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
									<div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-teal-400/15 blur-3xl" />

									<div className="flex items-start gap-4">
										<div className="relative shrink-0">
											<div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl" />
											<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-200/70">
												<ActiveIcon className="h-7 w-7 text-emerald-700" />
											</div>
										</div>

										<div className="min-w-0">
											<AnimatePresence mode="wait">
												<motion.div
													key={active}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -10 }}
													transition={{ duration: 0.22, ease: "easeOut" }}
												>
													<p className="text-xs font-semibold text-emerald-800/80">
														{t("orbit.label")}
													</p>

													<h3 className="mt-1 text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
														{t(`features.${active}.title`)}
													</h3>

													<p className="mt-3 text-sm leading-relaxed text-slate-600">
														{t(`features.${active}.description`)}
													</p>

													<div className="mt-5 flex flex-wrap items-center gap-2">
														<span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
															{t("orbit.pill1")}
														</span>
														<span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
															{t("orbit.pill2")}
														</span>
													</div>

													<button
														type="button"
														className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
													>
														{t("orbit.cta")}
														<ArrowRight className="h-4 w-4" />
													</button>
												</motion.div>
											</AnimatePresence>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* orbit nodes */}
						{FEATURES.map((item, idx) => {
							const Icon = item.icon;
							const isActive = item.key === active;
							const pos = POS[idx] ?? POS[0];

							return (
								<motion.button
									key={item.key}
									type="button"
									onMouseEnter={() => setActive(item.key)}
									onFocus={() => setActive(item.key)}
									onClick={() => setActive(item.key)}
									initial={false}
									animate={{ scale: isActive ? 1.06 : 1 }}
									transition={{ type: "spring", stiffness: 400, damping: 22 }}
									// style={{
									// 	top: pos.top,
									// 	left: pos.left,
									// 	transform: "translate(-50%, -50%)"
									// }}
									className={[
										pos?.cn,
										"absolute group grid place-items-center rounded-full",
										"w-14 h-14 md:w-16 md:h-16",
										"ring-1 transition shadow-sm",
										isActive
											? "bg-white ring-emerald-300"
											: "bg-white/70 ring-emerald-200 hover:bg-white"
									].join(" ")}
									aria-label={t(`features.${item.key}.title`)}
								>
									{/* active ping */}
									{isActive && (
										<span className="pointer-events-none absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />
									)}

									<div className="relative grid place-items-center">
										<Icon
											className={[
												"h-6 w-6 md:h-7 md:w-7 transition",
												isActive ? "text-emerald-700" : "text-emerald-700/80"
											].join(" ")}
										/>
									</div>

									{/* tooltip label */}
									<span
										className={[
											"pointer-events-none absolute z-20 whitespace-nowrap",
											"rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white",
											"opacity-0 scale-95 transition",
											"transform-gpu will-change-transform",
											"group-hover:opacity-100 group-hover:scale-100",
											getTooltipPlacement(pos)
										].join(" ")}
									>
										{/* arrow */}
										<span
											aria-hidden
											className={[
												"absolute h-2 w-2 rotate-45 bg-slate-900",
												getTooltipArrow(pos)
											].join(" ")}
										/>
										{t(`features.${item.key}.title`)}
									</span>
								</motion.button>
							);
						})}
					</div>
				</div>

				{/* RIGHT: short supporting copy (no boxes) */}
				<div className="lg:col-span-5">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.45, ease: "easeOut" }}
						className="max-w-lg"
					>
						<p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
							{t("side.kicker")}
						</p>

						<h4 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
							{t("side.title")}
						</h4>

						<p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600">
							{t("side.desc")}
						</p>

						<p className="mt-6 text-xs text-slate-500">
							{t("side.helper")}
						</p>
					</motion.div>
				</div>
			</div>
		</Section>
	);
}

/* -------------------------------- Banner CTA ------------------------------- */

export function BannerCTA() {
	const t = useTranslations("freelance.banner");

	return (
		<section className="relative overflow-hidden py-14 md:py-20">
			<div className="absolute inset-0 bg-[linear-gradient(90deg,#059669,#10b981,#047857)]" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.22),transparent_45%)]" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.18),transparent_55%)]" />
			<div className="absolute inset-0 opacity-[0.08] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><filter id=%22n%22 x=%220%22 y=%220%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.35%22/></svg>')]" />

			<div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-teal-200/10 blur-3xl" />

			<div className="relative z-10 container !px-4 sm:!px-6 lg:!px-8">
				<motion.div
					initial={{ opacity: 0, y: 18, scale: 0.99 }}
					whileInView={{ opacity: 1, y: 0, scale: 1 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="mx-auto max-w-6xl rounded-[32px] p-[1px] bg-[linear-gradient(120deg,rgba(255,255,255,0.28),rgba(255,255,255,0.10),rgba(255,255,255,0.20))] shadow-[0_30px_80px_-45px_rgba(0,0,0,0.6)]"
				>
					<div className="relative overflow-hidden rounded-[31px] border border-white/15 bg-white/10 backdrop-blur-xl">
						<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.20),transparent_55%)]" />
						<div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

						<div className="relative p-7 md:p-10">
							<div className="flex flex-col lg:flex-row items-center justify-between gap-8">
								<div className="text-center lg:text-start">
									<div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20">
										<Sparkles className="h-4 w-4" />
										{t("badge")}
									</div>

									<h3 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
										{t("title")}
									</h3>

									<p className="mt-3 text-white/85 text-base md:text-lg max-w-2xl">
										{t("subtitle")}
									</p>
								</div>

								<div className="flex flex-col sm:flex-row items-center gap-3">
									<Link
										href="/services"
										className="inline-flex items-center justify-center h-12 px-7 rounded-lg bg-white/10 text-white font-semibold ring-1 ring-white/25 hover:bg-white/15 transition"
									>
										{t("secondaryCta")}
									</Link>

									<Link
										href="/auth?tab=register&type=seller"
										className="group inline-flex items-center justify-center h-12 px-8 rounded-lg bg-white text-emerald-800 font-extrabold shadow-lg hover:shadow-xl transition hover:bg-emerald-50"
									>
										<span>{t("cta")}</span>
										<ArrowRight className="rtl:scale-x-[-1] ms-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
									</Link>
								</div>
							</div>

							<div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs text-white/75">
								<span className="inline-flex items-center gap-2">
									<span className="h-1.5 w-1.5 rounded-full bg-white/70" />
									{t("foot1")}
								</span>
								<span className="inline-flex items-center gap-2">
									<span className="h-1.5 w-1.5 rounded-full bg-white/70" />
									{t("foot2")}
								</span>
								<span className="inline-flex items-center gap-2">
									<span className="h-1.5 w-1.5 rounded-full bg-white/70" />
									{t("foot3")}
								</span>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}

/* ---------------------------------- FAQs ---------------------------------- */

export function FAQs() {
	const { settings, loadingSettings } = useValues();
	const locale = useLocale();
	const t = useTranslations("BecomeSeller.faqs");

	const faqs = locale === "ar" ? settings?.sellerFaqs_ar : settings?.sellerFaqs_en;

	return (
		<Section
			eyebrow={t("eyebrow")}
			title={t("title")}
			description={t("subtitle")}
			variant="plain"
			withDividerTop
		>
			<div className="relative mx-auto max-w-5xl">
				<div className="rounded-[32px] bg-white/60 backdrop-blur-xl ring-1 ring-emerald-200/60 shadow-[0_30px_90px_-60px_rgba(2,6,23,0.55)] overflow-hidden">
					<div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 opacity-80" />
					<div className="p-5 md:p-8">
						<FAQSection faqs={faqs} loading={loadingSettings} showTitle={false} />
					</div>
				</div>
			</div>
		</Section>
	);
}























































