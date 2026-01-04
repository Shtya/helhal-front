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
				tone: 'emerald',
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
				tone: 'emerald',
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
				tone: 'emerald',
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

	console.log(cards)
	return (
		<section
			className={[
				'relative my-10 overflow-hidden rounded-2xl border',
				'border-slate-200/70 bg-white',
				'shadow-[0_1px_0_rgba(15,23,42,0.04)]',
				' ',
			].join(' ')}
			dir={isArabic ? 'rtl' : 'ltr'}
		>
			{/* Decorative background */}
			<div className="pointer-events-none absolute inset-0">
				{/* Soft glow blobs */}
				<div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl  " />
				<div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl  " />

				{/* Subtle grid pattern */}
				<div
					className="absolute inset-0 opacity-[0.10]  "
					style={{
						backgroundImage:
							'linear-gradient(to right, rgba(15,23,42,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.14) 1px, transparent 1px)',
						backgroundSize: '28px 28px',
						maskImage: 'radial-gradient(circle at 35% 20%, black 0%, transparent 60%)',
						WebkitMaskImage: 'radial-gradient(circle at 35% 20%, black 0%, transparent 60%)',
					}}
				/>

				{/* Gradient border sheen */}
				<div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-emerald-500/10  " />
			</div>

			<div className="relative z-10 px-6 py-10 md:px-10 md:py-14">
				<motion.div variants={container} initial="hidden" animate="show">
					{/* Top label */}
					<motion.div variants={item} className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs text-slate-600 backdrop-blur  /50 ">
						<Sparkles className="h-4 w-4 text-emerald-600  " />
						<span>{t('hero.quickActions')}</span>
					</motion.div>

					{/* Headline */}
					<motion.h1
						variants={item}
						className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl "
					>
						{t('hero.welcomeBack')}{' '}
						<span className="bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-500 bg-clip-text text-transparent  ">
							{user?.username}
						</span>
					</motion.h1>

					{/* Subtitle */}
					<motion.p
						variants={item}
						className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600 md:text-base "
					>
						{t('hero.subtitle')}
					</motion.p>

					{/* Cards */}
					<motion.div
						variants={item}
						className="mt-8 flex flex-row gap-5  flex-wrap w-full "
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
	tone = 'emerald',
	isArabic,
	reduceMotion,
	delay = 0,
}) {
	const t = useTranslations('Explore');
	const displayChip = chip || t('hero.defaultChip');
	const Arrow = isArabic ? ArrowLeft : ArrowRight;

	console.log(mainButtonLabel, href)

	const toneStyles =
		tone === 'emerald'
			? {
				ring: 'ring-emerald-500/15  ',
				iconBg: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70  ',
				chip: 'border-emerald-200/70 bg-emerald-50 text-emerald-700  ',
				glow: 'bg-emerald-400/20',
			}
			: {
				ring: 'ring-slate-500/10 ',
				iconBg: 'bg-slate-50 text-slate-700 ring-slate-200/70  ',
				chip: 'border-slate-200/70 bg-slate-50 text-slate-700  ',
				glow: 'bg-slate-400/15',
			};

	return (
		<motion.article
			initial={{ opacity: 0, y: 14, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.5, ease: 'easeOut', delay }}
			whileHover={reduceMotion ? undefined : { y: -3 }}
			className={[
				'w-full md:max-w-[540px] group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5',
				'shadow-sm transition-all',
				'hover:shadow-md hover:border-slate-200',
				'focus-within:ring-2 focus-within:ring-emerald-500/30',
				' ',
				' ',
			].join(' ')}
		>
			{/* Hover sheen + ring */}
			<div className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${toneStyles.ring}`} />
			<div className="pointer-events-none absolute -inset-24 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
				<div className={`absolute left-8 top-10 h-44 w-44 rounded-full blur-3xl ${toneStyles.glow}`} />
			</div>
			<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
				<div
					className="absolute -left-20 top-0 h-full w-56 rotate-12 bg-gradient-to-r from-transparent via-white/60 to-transparent "
					style={{ filter: 'blur(1px)' }}
				/>
			</div>

			<div className="relative flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div
						className={[
							'grid h-12 w-12 place-items-center rounded-2xl ring-1',
							toneStyles.iconBg,
						].join(' ')}
						aria-hidden="true"
					>
						<Icon className="h-6 w-6" />
					</div>

					<div className="flex flex-col">
						<div
							className={[
								'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium',
								toneStyles.chip,
							].join(' ')}
						>
							{displayChip}
						</div>
					</div>
				</div>

				<Arrow className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600  " />
			</div>

			<h3 className="relative mt-4 text-lg font-semibold text-slate-900 md:text-xl ">
				{title}
			</h3>

			<ul className="relative mt-2 space-y-2 text-slate-600  ">
				{lines.map((line, i) => (
					<li key={i} className="flex gap-2 text-sm leading-6">
						<span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-slate-300 " />
						<span className="text-pretty">{line}</span>
					</li>
				))}
			</ul>

			<div className="relative mt-6 flex flex-col sm:flex-row gap-3">
				{/* Primary CTA */}
				{mainButtonLabel && href && (
					<Link
						href={href}
						className="
        w-full sm:flex-1
        inline-flex items-center justify-center gap-1
        h-12 px-6 rounded-xl
        bg-emerald-600 text-white
        text-sm md:text-base font-medium
        hover:shadow-lg hover:bg-emerald-700
        transition-all
      "
					>
						{mainButtonLabel}
						<Arrow className="h-4 w-4 " />
					</Link>
				)}

				{/* Secondary CTA */}
				{secondaryButtonLabel && secondaryHref && (
					<Link
						href={secondaryHref}
						className="
        w-full sm:flex-1
        inline-flex items-center justify-center
        h-12 px-6 rounded-xl
        border border-emerald-700
        text-emerald-700
        text-sm md:text-base font-medium
        bg-emerald-50 hover:bg-emerald-100
        transition-all
      "
					>
						{secondaryButtonLabel}
					</Link>
				)}
			</div>


		</motion.article>
	);
}
