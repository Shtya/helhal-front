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
		<section className={`w-full mx-auto max-w-4xl ${className}`}>
			{/* Title */}
			{showTitle && (
				<div className="mb-8 text-center">
					<p className="inline-flex items-center gap-2 rounded-full bg-main-50 px-3 py-1 text-xs font-semibold text-main-800 ring-1 ring-main-200/70">
						<Sparkles className="h-4 w-4" />
						{t("kicker")}
					</p>
					<h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
						{t("title")}
					</h1>
					<p className="mt-3 text-sm md:text-base text-slate-600">
						{t("subtitle")}
					</p>
				</div>
			)}

			{/* list style (not boxy): thin dividers + soft hover, like Apple/Notion */}
			<div className="rounded-[28px] overflow-hidden bg-white/40 ring-1 ring-main-200/50">
				{loading ? (
					<div className="divide-y divide-main-100/60">
						{skeletons.map((_, idx) => (
							<div key={idx} className="p-5 md:p-6 animate-pulse">
								<div className="h-4 bg-slate-200/80 rounded w-2/3 mb-3" />
								<div className="h-3 bg-slate-200/70 rounded w-1/2" />
							</div>
						))}
					</div>
				) : (
					<div className="divide-y divide-main-100/60">
						{faqs.map((faq, idx) => {
							const isOpen = openIndex === idx;

							return (
								<div key={idx} className="relative">
									{/* Row */}
									<button
										type="button"
										onClick={() => toggleFAQ(idx)}
										className={[
											"w-full text-left p-5 md:p-6",
											"flex items-start gap-4",
											"transition",
											isOpen ? "bg-main-50/60" : "hover:bg-slate-50/70"
										].join(" ")}
									>
										{/* icon */}
										<div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-main-200/60">
											<HelpCircle className="h-5 w-5 text-main-700" />
										</div>

										{/* question */}
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-3">
												<h3 className="text-base md:text-lg font-extrabold tracking-tight text-slate-900">
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
															className="hidden md:inline-flex items-center justify-center rounded-xl p-2 hover:bg-white/70 transition text-red-500"
															whileTap={{ scale: 0.95 }}
														>
															<Trash2 className="h-5 w-5" />
														</motion.button>
													)}

													<motion.div
														animate={{ rotate: isOpen ? 180 : 0 }}
														transition={{ duration: 0.2 }}
														className={[
															"grid place-items-center rounded-xl p-2 ring-1 transition",
															isOpen
																? "bg-white/70 ring-main-200 text-main-700"
																: "bg-white/50 ring-slate-200 text-slate-500"
														].join(" ")}
													>
														<ChevronDown className="h-5 w-5" />
													</motion.div>
												</div>
											</div>

											{/* Answer */}
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
															{/* minimal answer surface, not a box */}
															<p className="text-sm text-start md:text-base leading-relaxed text-slate-600">
																{faq.answer}
															</p>

															{/* NEW: small hint line (translation) */}
															<p className="mt-3 text-start text-xs text-slate-500">
																{t("hint")}
															</p>
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									</button>

									{/* active left indicator */}
									{isOpen && (
										<div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-main-400 to-teal-400" />
									)}
								</div>
							);
						})}

						{/* empty state */}
						{faqs.length === 0 && (
							<div className="p-8 text-center">
								<p className="text-sm text-slate-600">{t("noFaqs")}</p>
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
