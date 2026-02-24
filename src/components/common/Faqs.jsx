"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, HelpCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FAQSection({
	loading,
	className = "",
	faqs = [],
	showTitle = true,
	removeFaq
}) {
	const [openIndex, setOpenIndex] = useState(0);
	const t = useTranslations("BecomeSeller.faqs");

	const toggleFAQ = (index) => setOpenIndex(openIndex === index ? null : index);

	const skeletons = useMemo(() => Array.from({ length: 5 }), []);

	return (
		<section className={`w-full mx-auto max-w-4xl transition-colors duration-300 ${className}`}>
			{/* Title */}
			{showTitle && (
				<div className="mb-8 text-center">
					<p className="inline-flex items-center gap-2 rounded-full bg-main-50 dark:bg-main-900/20 px-3 py-1 text-xs font-semibold text-main-800 dark:text-main-400 ring-1 ring-main-200/70 dark:ring-main-800/50">
						<Sparkles className="h-4 w-4" />
						{t("kicker")}
					</p>
					<h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-dark-text-primary">
						{t("title")}
					</h1>
					<p className="mt-3 text-sm md:text-base text-slate-600 dark:text-dark-text-secondary">
						{t("subtitle")}
					</p>
				</div>
			)}

			{/* List Container */}
			<div className="rounded-[28px] overflow-hidden bg-white/40 dark:bg-dark-bg-card/40 ring-1 ring-main-200/50 dark:ring-dark-border backdrop-blur-sm transition-all">
				{loading ? (
					<div className="divide-y divide-main-100/60 dark:divide-dark-border">
						{skeletons.map((_, idx) => (
							<div key={idx} className="p-5 md:p-6 animate-pulse">
								<div className="h-4 bg-slate-200/80 dark:bg-dark-border rounded w-2/3 mb-3" />
								<div className="h-3 bg-slate-200/70 dark:bg-dark-border/60 rounded w-1/2" />
							</div>
						))}
					</div>
				) : (
					<div className="divide-y divide-main-100/60 dark:divide-dark-border">
						{faqs.map((faq, idx) => {
							const isOpen = openIndex === idx;

							return (
								<div key={idx} className="relative group">
									{/* Row Button */}
									<button
										type="button"
										onClick={() => toggleFAQ(idx)}
										className={[
											"w-full text-left p-5 md:p-6 flex items-start gap-4 transition-all duration-300",
											isOpen
												? "bg-main-50/60 dark:bg-main-900/10"
												: "hover:bg-slate-50/70 dark:hover:bg-dark-bg-input/50"
										].join(" ")}
									>
										{/* Icon Container */}
										<div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 dark:bg-dark-bg-card ring-1 ring-main-200/60 dark:ring-dark-border shadow-sm transition-colors">
											<HelpCircle className="h-5 w-5 text-main-700 dark:text-main-400" />
										</div>

										{/* Question Area */}
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-3">
												<h3 className="text-base md:text-lg font-extrabold tracking-tight text-slate-900 dark:text-dark-text-primary">
													{faq.question}
												</h3>

												<div className="flex items-center gap-2 shrink-0">
													{typeof removeFaq === "function" && (
														<motion.button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																removeFaq(idx);
															}}
															title={t("remove")}
															className="hidden md:inline-flex items-center justify-center rounded-xl p-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-500"
															whileTap={{ scale: 0.95 }}
														>
															<Trash2 className="h-5 w-5" />
														</motion.button>
													)}

													<motion.div
														animate={{ rotate: isOpen ? 180 : 0 }}
														transition={{ duration: 0.2 }}
														className={[
															"grid place-items-center rounded-xl p-2 ring-1 transition-all duration-300",
															isOpen
																? "bg-white/70 dark:bg-dark-bg-card ring-main-200 dark:ring-main-800 text-main-700 dark:text-main-400"
																: "bg-white/50 dark:bg-dark-bg-input ring-slate-200 dark:ring-dark-border text-slate-500 dark:text-dark-text-secondary"
														].join(" ")}
													>
														<ChevronDown className="h-5 w-5" />
													</motion.div>
												</div>
											</div>

											{/* Answer Content */}
											<AnimatePresence initial={false}>
												{isOpen && (
													<motion.div
														key="content"
														initial={{ height: 0, opacity: 0 }}
														animate={{ height: "auto", opacity: 1 }}
														exit={{ height: 0, opacity: 0 }}
														transition={{ duration: 0.22, ease: "easeInOut" }}
														className="overflow-hidden"
													>
														<div className="mt-4 pe-2">
															<p className="text-sm text-start md:text-base leading-relaxed text-slate-600 dark:text-dark-text-secondary">
																{faq.answer}
															</p>
															<p className="mt-3 text-start text-xs text-slate-400 dark:text-dark-text-tertiary">
																{t("hint")}
															</p>
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									</button>

									{/* Active Left Indicator Gradient */}
									{isOpen && (
										<div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-main-400 dark:from-main-500 to-teal-400 dark:to-teal-600" />
									)}
								</div>
							);
						})}

						{/* Empty State */}
						{faqs.length === 0 && (
							<div className="p-12 text-center">
								<p className="text-sm text-slate-600 dark:text-dark-text-secondary italic">
									{t("noFaqs")}
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
