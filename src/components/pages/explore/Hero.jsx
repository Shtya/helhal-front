'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/atoms/Button';
import { MailPlus, UserRoundCog, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from '@/i18n/navigation';

const container = {
	hidden: { opacity: 0, y: 10 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.45, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.08 },
	},
};

const item = {
	hidden: { opacity: 0, y: 10 },
	show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function Hero() {
	const t = useTranslations('Explore');
	const { user, role } = useAuth();
	const locale = useLocale();
	const isArabic = locale === 'ar';
	const reduceMotion = useReducedMotion();

	const cards = useMemo(() => {
		const out = [];

		if (role === 'guest') {
			const cardData = t.raw('hero.cards.guest');
			out.push({
				id: 'create-account',
				icon: UserRoundCog,
				title: cardData.title,
				lines: cardData.lines,
				mainButtonLabel: cardData.mainButtonLabel,
				secondaryButtonLabel: cardData.secondaryButtonLabel,
				href: '/auth?tab=register',
				secondaryHref: '/auth?tab=login',
				chip: cardData.chip,
				tone: 'main',
			});
		} else if (role === 'buyer') {
			const cardData = t.raw('hero.cards.buyer');
			out.push({
				id: 'recommended',
				icon: MailPlus,
				title: cardData.title,
				lines: cardData.lines,
				mainButtonLabel: cardData.mainButtonLabel,
				secondaryButtonLabel: cardData.secondaryButtonLabel,
				href: '/share-job-description',
				secondaryHref: '/services/all',
				chip: cardData.chip,
				tone: 'main',
			});
		} else if (role === 'seller') {
			const cardData = t.raw('hero.cards.seller');
			out.push({
				id: 'create-service',
				icon: MailPlus,
				title: cardData.title,
				lines: cardData.lines,
				mainButtonLabel: cardData.mainButtonLabel,
				href: '/create-gig',

				chip: cardData.chip,
				tone: 'main',
			});
		}

		// if (role !== 'guest') {
		// 	const cardData = t.raw('hero.cards.completeProfile');
		// 	out.push({
		// 		id: 'complete-profile',
		// 		icon: UserRoundCog,
		// 		title: cardData.title,
		// 		lines: cardData.lines,
		// 		mainButtonLabel: cardData.mainButtonLabel,
		// 		secondaryButtonLabel: cardData.secondaryButtonLabel,
		// 		href: '/profile',
		// 		chip: cardData.chip,
		// 		tone: 'slate',
		// 	});
		// }

		return out;
	}, [role, t]);

	return (
		<section
			className={[
				'relative my-6 overflow-hidden rounded-2xl border transition-colors duration-200',
				'border-slate-200/70 bg-white dark:bg-dark-bg-card dark:border-dark-border',
				'shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:shadow-none',
			].join(' ')}
			dir={isArabic ? 'rtl' : 'ltr'}
		>
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-28 -left-24 h-60 w-60 rounded-full bg-main-400/15 dark:bg-main-500/10 blur-3xl" />
				<div className="absolute -bottom-28 -right-24 h-60 w-60 rounded-full bg-main-400/10 dark:bg-main-600/5 blur-3xl" />
				<div
					className="absolute inset-0 opacity-[0.07] dark:opacity-[0.03]"
					style={{
						backgroundImage:
							'linear-gradient(to right, rgba(15,23,42,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.14) 1px, transparent 1px)',
						backgroundSize: '24px 24px',
						maskImage: 'radial-gradient(circle at 35% 20%, black 0%, transparent 60%)',
						WebkitMaskImage: 'radial-gradient(circle at 35% 20%, black 0%, transparent 60%)',
					}}
				/>
			</div>

			<div className="relative z-10 px-6 py-6 md:px-8 md:py-8">
				<motion.div variants={container} initial="hidden" animate="show">
					<motion.div variants={item} className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-2.5 py-0.5 text-[11px] text-slate-600 backdrop-blur/50 dark:bg-dark-bg-input/50 dark:border-dark-border dark:text-dark-text-secondary">
						<Sparkles className="h-3.5 w-3.5 text-main-600 dark:text-main-400" />
						<span>{t('hero.quickActions')}</span>
					</motion.div>

					<motion.h1
						variants={item}
						className="text-balance text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-dark-text-primary"
					>
						{t('hero.welcomeBack')}{' '}
						<span className="bg-gradient-to-r from-main-800 via-main-600 to-main-500 dark:from-main-400 dark:to-main-600 bg-clip-text text-transparent">
							{user?.username?.trim()}
						</span>
					</motion.h1>

					<motion.p
						variants={item}
						className="mt-2 max-w-xl text-pretty text-xs leading-5 text-slate-600 md:text-sm dark:text-dark-text-secondary"
					>
						{t('hero.subtitle')}
					</motion.p>

					<motion.div
						variants={item}
						className="mt-5 flex flex-row gap-4 flex-wrap w-full"
					>
						{cards.map((c, idx) => (
							<ActionCard
								key={c.id}
								{...c}
								isArabic={isArabic}
								reduceMotion={reduceMotion}
								delay={0.08 * (idx + 1)}
							/>
						))}
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}

function ActionCard({
	icon: Icon,
	title,
	lines,
	mainButtonLabel,
	secondaryButtonLabel,
	href,
	secondaryHref,
	chip,
	tone = 'main',
	isArabic,
	reduceMotion,
	delay = 0,
}) {
	const t = useTranslations('Explore');
	const displayChip = chip || t('hero.defaultChip');
	const Arrow = isArabic ? ArrowLeft : ArrowRight;

	const toneStyles =
		tone === 'main'
			? {
				ring: 'ring-main-500/15 dark:ring-main-400/10',
				iconBg: 'bg-main-50 text-main-700 ring-main-200/70 dark:bg-main-900/20 dark:text-main-400 dark:ring-main-800/50',
				chip: 'border-main-200/70 bg-main-50 text-main-700 dark:border-main-800/50 dark:bg-main-900/30 dark:text-main-400',
				glow: 'bg-main-400/20 dark:bg-main-500/10',
			}
			: {
				ring: 'ring-slate-500/10 dark:ring-dark-border',
				iconBg: 'bg-slate-50 text-slate-700 ring-slate-200/70 dark:bg-dark-bg-input dark:text-dark-text-secondary dark:ring-dark-border',
				chip: 'border-slate-200/70 bg-slate-50 text-slate-700 dark:border-dark-border dark:bg-dark-bg-input dark:text-dark-text-secondary',
				glow: 'bg-slate-400/15 dark:bg-dark-bg-input/50',
			};

	return (
		<motion.article
			initial={{ opacity: 0, y: 14, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.5, ease: 'easeOut', delay }}
			whileHover={reduceMotion ? undefined : { y: -3 }}
			className={[
				'w-full md:max-w-[540px] group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200',
				'border-slate-200/70 bg-white dark:bg-dark-bg-card dark:border-dark-border',
				'shadow-sm hover:shadow-md dark:hover:border-dark-text-secondary/20',
				'focus-within:ring-2 focus-within:ring-main-500/30',
			].join(' ')}
		>
			{/* Hover sheen + ring */}
			<div className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${toneStyles.ring}`} />
			<div className="pointer-events-none absolute -inset-24 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
				<div className={`absolute left-8 top-10 h-44 w-44 rounded-full blur-3xl ${toneStyles.glow}`} />
			</div>

			<div className="relative flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className={['grid h-12 w-12 place-items-center rounded-2xl ring-1', toneStyles.iconBg].join(' ')}>
						<Icon className="h-6 w-6" />
					</div>
					<div className={['inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium', toneStyles.chip].join(' ')}>
						{displayChip}
					</div>
				</div>
				<Arrow className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-dark-text-primary" />
			</div>

			<h3 className="relative mt-4 text-lg font-semibold text-slate-900 md:text-xl dark:text-dark-text-primary">
				{title}
			</h3>

			<ul className="relative mt-2 space-y-2 text-slate-600 dark:text-dark-text-secondary">
				{lines.map((line, i) => (
					<li key={i} className="flex gap-2 text-sm leading-6">
						<span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-slate-300 dark:bg-dark-border" />
						<span className="text-pretty">{line}</span>
					</li>
				))}
			</ul>

			<div className="relative mt-6 flex flex-col sm:flex-row gap-3">
				{mainButtonLabel && href && (
					<Link
						href={href}
						className="w-full sm:flex-1 inline-flex items-center justify-center gap-1 h-12 px-6 rounded-xl bg-main-600 text-white text-sm md:text-base font-medium hover:bg-main-700 transition-all shadow-main-900/10"
					>
						{mainButtonLabel}
						<Arrow className="h-4 w-4" />
					</Link>
				)}

				{secondaryButtonLabel && secondaryHref && (
					<Link
						href={secondaryHref}
						className="w-full sm:flex-1 inline-flex items-center justify-center h-12 px-6 rounded-xl border border-main-700/50 text-main-700 dark:text-main-400 dark:border-main-800 bg-main-50 dark:bg-main-900/20 hover:bg-main-100 dark:hover:bg-main-900/40 transition-all"
					>
						{secondaryButtonLabel}
					</Link>
				)}
			</div>
		</motion.article>
	);
}