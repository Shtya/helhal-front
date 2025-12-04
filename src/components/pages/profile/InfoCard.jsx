import FormErrorMessage from "@/components/atoms/FormErrorMessage";
import { Input } from "../auth/Input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import Textarea from "@/components/atoms/Textarea";
import { Modal } from '@/components/common/Modal';
import Select from "@/components/atoms/Select";
import { Card, Divider, SkeletonLine } from "@/components/UI/ui";
import Image from "next/image";
import { Trash2, X } from "lucide-react";
import Button from "@/components/atoms/Button";
import { usernameSchema } from "@/utils/profile";
import api from "@/lib/axios";
import { allLanguages } from "@/constants/languages";
import { showWarningToast } from "@/utils/notifications";
import { useValues } from "@/context/GlobalContext";


function SectionHeader({ title, iconSrc, actionAria, onAction, disabled }) {

    return (
        <div className='mt-1 flex items-center justify-between'>
            <h3 className='text-[20px] font-semibold tracking-tight text-[#111827]'>{title}</h3>
            {iconSrc && (
                <button onClick={() => {
                    onAction?.();
                }} disabled={disabled} aria-label={actionAria} title={actionAria} className='cursor-pointer  h-9 w-9 items-center justify-center rounded-xl  hover:scale-[1.1] active:scale-95 transition'>
                    <Image src={iconSrc} alt={title} width={36} height={36} />
                </button>
            )}
        </div>
    );
}

function PillEditor({ items, onAdd, onRemove, placeholder, showInput, setShowInput, maxOneSkilllength = 50 }) {
    const t = useTranslations('Profile.infoCard');
    const [input, setInput] = useState('');

    return (
        <>
            {/* Pills */}
            <div className='mt-2 flex flex-wrap gap-2'>
                {items.length > 0 ? (
                    items.map((t, i) => (
                        <span key={`${t}-${i}`} className='group overflow-hidden relative inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-[#111827] shadow-[0_4px_14px_rgba(0,0,0,0.04)] border border-[#EDEDED]'>
                            {t || '—'}
                            <button
                                onClick={() => onRemove?.(i)}
                                className='cursor-pointer absolute inset-0 flex items-center justify-center bg-red-500/70 opacity-0 group-hover:opacity-100 transition-opacity'>
                                <X size={18} className='text-white' />
                            </button>
                        </span>
                    ))
                ) : (
                    <div className='text-sm text-[#6B7280]'>{t('noItemsAdded')}</div>
                )}
            </div>

            {/* Controlled by SectionHeader */}
            {showInput && (
                <div className='mt-3 flex items-center gap-2'>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value.slice(0, maxOneSkilllength))}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && input.trim()) {
                                onAdd?.(input.trim());
                                setInput('');
                                setShowInput(false);
                            }
                        }}
                        autoFocus
                        placeholder={placeholder || t('addItem')}
                        className='flex-1 min-w-0 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600'
                    />
                    <button
                        onClick={() => {
                            if (!input.trim()) return;
                            onAdd?.(input.trim());
                            setInput('');
                            setShowInput(false);
                        }}
                        className='rounded-xl border border-emerald-600 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50' disabled={!input}>
                        {t('save')}
                    </button>
                </div>
            )}
        </>
    );
}



/* ------------------------------ Small sub-forms ----------------------------- */
const DATE_AVARAGE = 100; //years
const MAX_DEGREE_LENGTH = 150;
const MAX_INSTITUTION_LENGTH = 200;
const currentYear = new Date().getFullYear();
const minYear = currentYear - DATE_AVARAGE;

function createEducationSchema(t) {
    return z.object({
        degree: z
            .string().trim()
            .min(1, t('degreeRequired'))
            .max(MAX_DEGREE_LENGTH, t('degreeMaxLength', { max: MAX_DEGREE_LENGTH })),
        institution: z
            .string().trim()
            .min(1, t('institutionRequired'))
            .max(MAX_INSTITUTION_LENGTH, t('institutionMaxLength', { max: MAX_INSTITUTION_LENGTH })),
        year: z
            .number({ invalid_type_error: t('yearRequired') })
            .min(minYear, t('yearRange', { min: minYear, max: currentYear }))
            .max(currentYear, t('yearRange', { min: minYear, max: currentYear })),
    });
}


function EducationForm({ onSubmit }) {
    const t = useTranslations('Profile.infoCard');
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(createEducationSchema(t)),
        defaultValues: {
            degree: '',
            institution: '',
            year: currentYear,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='grid grid-cols-1 gap-3'>
            <div>
                <Input label={t('degree')} required {...register('degree')} />
                <FormErrorMessage message={errors.degree?.message} />
            </div>

            <div>
                <Input label={t('institution')} required {...register('institution')} />
                <FormErrorMessage message={errors.institution?.message} />
            </div>

            <div>
                <Input
                    label={t('year')}
                    type='number'
                    required
                    {...register('year', { valueAsNumber: true })}
                />
                <FormErrorMessage message={errors.year?.message} />
            </div>

            <Button type='submit' name={t('saveItem')} color='green' />
        </form>
    );
}

const MAX_NAME_LENGTH = 250;
const MAX_ISSUER_LENGTH = 250;

function createCertificationSchema(t) {
    return z.object({
        name: z
            .string().trim()
            .min(1, t('nameRequired'))
            .max(MAX_NAME_LENGTH, t('nameMaxLength', { max: MAX_NAME_LENGTH })),
        issuingOrganization: z
            .string().trim()
            .min(1, t('issuingOrganizationRequired'))
            .max(MAX_ISSUER_LENGTH, t('issuingOrganizationMaxLength', { max: MAX_ISSUER_LENGTH })),
        year: z
            .number({ invalid_type_error: t('yearRequired') })
            .min(minYear, t('yearRange', { min: minYear, max: currentYear }))
            .max(currentYear, t('yearRange', { min: minYear, max: currentYear })),
    });
}


function CertificationForm({ onSubmit }) {
    const t = useTranslations('Profile.infoCard');
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(createCertificationSchema(t)),
        defaultValues: {
            name: '',
            issuingOrganization: '',
            year: currentYear,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='grid grid-cols-1 gap-3'>
            <div>
                <Input label={t('name')} required {...register('name')} />
                <FormErrorMessage message={errors.name?.message} />
            </div>

            <div>
                <Input label={t('issuingOrganization')} required {...register('issuingOrganization')} />
                <FormErrorMessage message={errors.issuingOrganization?.message} />
            </div>

            <div>
                <Input label={t('year')} type='number' required {...register('year', { valueAsNumber: true })} />
                <FormErrorMessage message={errors.year?.message} />
            </div>

            <Button type='submit' name={t('saveItem')} color='green' />
        </form>
    );
}


const MAX_SKILLS = 15;
const MAX_EDUCATIONS = 2;
const MAX_CERTIFICATIONS = 2;

const aboutSchema = z.object({
    username: usernameSchema,
    description: z.string().trim().max(1000, 'Max 1000 characters'),
    languages: z.array(z.string()).optional(),
    skills: z
        .array(z.string().trim().max(50, 'Skill name must be 50 characters or fewer'))
        .max(MAX_SKILLS, `You can add up to ${MAX_SKILLS} skills only`)
        .optional(),

    education: z
        .array(
            z.object({
                degree: z.string(),
                institution: z.string(),
                year: z.string(),
            })
        )
        .max(MAX_EDUCATIONS, `You can add up to ${MAX_EDUCATIONS} education entries only`)
        .optional(),

    certifications: z
        .array(
            z.object({
                name: z.string(),
                issuingOrganization: z.string().optional(),
                year: z.string().optional(),
            })
        )
        .max(MAX_CERTIFICATIONS, `You can add up to ${MAX_CERTIFICATIONS} certifications only`)
        .optional(),

    country: z.string().optional(),
    type: z.string().optional(),
});



export default function InfoCard({ loading, about, setAbout, onRemoveEducation, onRemoveCertification, onCountryChange, accountTypeOptions = [], onTypeChange, className }) {
    const t = useTranslations('Profile.infoCard');
    const [internalDesc, setInternalDesc] = useState(about?.description || '');
    const { countries: countriesOptions, countryLoading, } = useValues();
    useEffect(() => {
        setInternalDesc(about?.description || '');
    }, [about?.description]);

    const handleDescBlur = () => {
        setAbout(prev => ({ ...prev, description: internalDesc }));
    };


    const {
        register,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(aboutSchema),
        defaultValues: about,
    });

    // Sync form when about changes
    useEffect(() => {
        if (about) {
            reset(about);
        }
    }, [about, reset]);


    // Sync about when form changes
    useEffect(() => {
        const subscription = watch((values) => {
            setAbout(prev => ({ ...prev, ...values }));
        });
        return () => subscription.unsubscribe();
    }, [watch, setAbout]);

    const [editingDesc, setEditingDesc] = useState(false);
    const [showSkillInput, setShowSkillInput] = useState(false);
    const [eduOpen, setEduOpen] = useState(false);
    const [certOpen, setCertOpen] = useState(false);

    const skills = watch('skills') || [];
    const educations = watch('education') || [];
    const certifications = watch('certifications') || [];

    if (loading) return <SkeletonInfoCard />;

    return (
        <Card className={` p-4 sm:p-5 ${className}`}>
            <SectionHeader title={t('description')} iconSrc={'/icons/edit-green.svg'} actionAria={editingDesc ? t('finishEditingDescription') : t('editDescription')} onAction={() => setEditingDesc(v => !v)} />
            <Divider className='!my-2' />
            {editingDesc ? (
                <>
                    <Textarea
                        {...register('description')}
                        value={internalDesc}
                        onChange={e => {
                            const val = e.target.value.slice(0, 1000);
                            setInternalDesc(val);
                        }}
                        onBlur={handleDescBlur}
                        rows={4} placeholder={t('tellBuyers')} />
                    <div className='flex justify-between items-center'>
                        <p className='mt-1 text-xs text-[#6B7280]'>{t('useClearSummary')}</p>
                        <p className='mt-1 text-xs text-[#6B7280]'>{internalDesc?.trim()?.length}/1000 {t('characters')}</p>
                    </div>
                    {errors.description && <p className='text-red-500 text-xs'>{errors.description.message}</p>}
                </>
            ) : (
                <p className='mt-1 text-sm leading-7 text-[#292D32]/80'>{internalDesc?.trim() || '—'}</p>
            )}

            <Divider className='!mt-6 !mb-2 ' />

            {/* Languages */}
            <LanguageSelector value={watch('languages') || []} setValue={val => setValue('languages', val)} />

            <Divider className='!mt-6 !mb-2 ' />

            {/* Skills */}
            <SectionHeader title={t('skills')} iconSrc='/icons/add-green.svg' actionAria={t('addSkill')} onAction={() => setShowSkillInput(true)} disabled={skills.length >= MAX_SKILLS} />

            <PillEditor
                items={skills}
                maxSkills={MAX_SKILLS}
                placeholder='e.g., React'
                showInput={showSkillInput}
                setShowInput={setShowSkillInput}
                onAdd={val => {
                    const current = skills;
                    const normalized = val.trim().toLowerCase();
                    const alreadyExists = current.some(skill => skill.trim().toLowerCase() === normalized);

                    if (alreadyExists) {
                        showWarningToast(t('skillAlreadyAdded'));
                        return;
                    }

                    setValue('skills', [...current, val]);
                }}

                onRemove={i => {
                    const current = skills;
                    setValue('skills', current.filter((_, idx) => idx !== i));
                }}
            />


            <Divider className='!mt-6 !mb-2 ' />

            {/* Education */}
            <SectionHeader title={t('education')} iconSrc='/icons/add-green.svg' actionAria={t('addEducation')} onAction={() => setEduOpen(true)} disabled={educations.length >= MAX_EDUCATIONS} />
            <div className='mt-2 space-y-2'>
                {(educations).length > 0 ? (
                    educations.map((e, idx) => (
                        <div key={idx} className='flex items-center justify-between rounded-2xl border border-[#EDEDED] bg-white p-3 text-sm'>
                            <div className='min-w-0'>
                                <div className='font-semibold truncate'>
                                    {e?.degree || '—'} — {e?.institution || '—'}
                                </div>
                                <div className='text-[#6B7280]'>{e?.year || '—'}</div>
                            </div>
                            <button onClick={() => onRemoveEducation?.(idx)} className='text-rose-600 hover:text-rose-700' aria-label='Remove education' title='Remove'>
                                <Trash2 className='h-4 w-4' />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className='text-sm text-[#6B7280]'>{t('noEducationAdded')}</div>
                )}
            </div>

            {/* Add Education */}
            {eduOpen && (
                <Modal title={t('addEducationModal')} onClose={() => setEduOpen(false)}>
                    <EducationForm
                        onSubmit={item => {

                            const alreadyHas = educations.some(e => e.degree === item.degree && e.institution === item.institution && e.year === item.year)
                            if (alreadyHas) {
                                showWarningToast(t('educationAlreadyAdded'));
                                return;
                            }
                            setValue('education', [...educations, item]);

                            setEduOpen(false);
                        }}
                    />
                </Modal>
            )}


            <Divider />

            {/* Certifications */}
            <SectionHeader title={t('certification')} iconSrc='/icons/add-green.svg' actionAria={t('addCertification')} onAction={() => setCertOpen(true)} disabled={certifications.length >= MAX_CERTIFICATIONS} />
            <div className='mt-2 space-y-2'>
                {(certifications).length > 0 ? (
                    certifications.map((c, idx) => (
                        <div key={idx} className='flex items-center justify-between rounded-2xl border border-[#EDEDED] bg-white p-3 text-sm'>
                            <div className='min-w-0'>
                                <div className='font-semibold truncate'>{c?.name || '—'}</div>
                                <div className='text-[#6B7280]'>
                                    {c?.issuingOrganization || c?.issuer || '—'} • {c?.year || '—'}
                                </div>
                            </div>
                            <button onClick={() => onRemoveCertification?.(idx)} className='text-rose-600 hover:text-rose-700' aria-label='Remove certification' title='Remove'>
                                <Trash2 className='h-4 w-4' />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className='text-sm text-[#6B7280]'>{t('noCertificationsAdded')}</div>
                )}
            </div>

            {/* Add Certification */}
            {certOpen && (
                <Modal title={t('addCertificationModal')} onClose={() => setCertOpen(false)}>
                    <CertificationForm
                        onSubmit={item => {

                            const alreadyHas = certifications.some(c => c.name === item.name && c.issuingOrganization === item.issuingOrganization && c.year === item.year)
                            if (alreadyHas) {
                                showWarningToast(t('certificationAlreadyAdded'));
                                return;
                            }
                            setValue('certifications', [...certifications, item]);

                            setCertOpen(false);
                        }}
                    />
                </Modal>
            )}
            <Divider />
            {/* Top selects row */}
            <div className=' mt-4 grid grid-cols-1 gap-3 md:grid-cols-2'>
                <Select key={`${countryLoading} ${countriesOptions?.length}`} label={t('country')} options={countriesOptions} value={about?.countryId} onChange={opt => onCountryChange?.(opt?.id)} placeholder={t('selectCountry')} isLoading={countryLoading} showSearch={true} />
                <Select label={t('accountType')} options={accountTypeOptions} value={about?.type} onChange={opt => onTypeChange?.(opt?.id)} placeholder={t('selectType')} />
            </div>
        </Card>
    );
}


function SkeletonInfoCard() {
    return (
        <div className='rounded-[28px] border border-[#E8ECEF] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-5 sm:p-6 animate-pulse'>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <SkeletonLine className='h-5 w-40' />
                <SkeletonLine className='h-5 w-40' />
                <SkeletonBox className='h-10' />
                <SkeletonBox className='h-10' />
            </div>

            <Divider />

            <div className='flex items-center justify-between'>
                <SkeletonLine className='h-6 w-36' />
                <SkeletonCircle className='h-8 w-8' />
            </div>
            <div className='mt-3 space-y-2'>
                <SkeletonLine className='h-4 w-full' />
                <SkeletonLine className='h-4 w-[90%]' />
                <SkeletonLine className='h-4 w-[80%]' />
            </div>

            <Divider />

            <div className='flex items-center justify-between'>
                <SkeletonLine className='h-6 w-28' />
                <SkeletonCircle className='h-8 w-8' />
            </div>
            <SkeletonLine className='mt-2 h-4 w-32' />

            <Divider />

            <div className='flex items-center justify-between'>
                <SkeletonLine className='h-6 w-16' />
                <SkeletonCircle className='h-8 w-8' />
            </div>
            <div className='mt-2 flex flex-wrap gap-2'>
                <SkeletonPill />
                <SkeletonPill />
            </div>

            <Divider />

            <div className='flex items-center justify-between'>
                <SkeletonLine className='h-6 w-24' />
                <SkeletonCircle className='h-8 w-8' />
            </div>
            <SkeletonBox className='mt-2 h-14' />

            <Divider />

            <div className='flex items-center justify-between'>
                <SkeletonLine className='h-6 w-32' />
                <SkeletonCircle className='h-8 w-8' />
            </div>
            <SkeletonBox className='mt-2 h-14' />
        </div>
    );
}

/* ---- Skeleton atoms ---- */

function SkeletonBox({ className = '' }) {
    return <div className={`rounded-xl bg-slate-200 ${className}`} />;
}
function SkeletonCircle({ className = '' }) {
    return <div className={`rounded-full bg-slate-200 ${className}`} />;
}
function SkeletonPill() {
    return <div className='h-8 w-28 rounded-full bg-slate-200 shadow' />;
}


function LanguageSelector({ value = [], setValue }) {
    const t = useTranslations('Profile.infoCard');
    const [languageOptions, setLanguageOptions] = useState(allLanguages || []);
    const [langLoading, setLangLoading] = useState(false);
    const [langError, setLangError] = useState(null);
    const [selectedLang, setSelectedLang] = useState(null);
    const [showLangInput, setShowLangInput] = useState(false);

    const filteredLanguageOptions = useMemo(() => {
        return languageOptions.filter(opt => !value.includes(opt.name));
    }, [languageOptions, value]);

    // useEffect(() => {
    //     const fetchLanguages = async () => {
    //         setLangLoading(true);
    //         setLangError(null);
    //         try {
    //             const res = await api.get(`/languages`);
    //             const data = res?.data?.records || [];
    //             setLanguageOptions(data.map(lang => ({ id: lang.id, name: lang.name })));
    //         } catch (err) {
    //             //set temp for development
    //             if (process.env.NODE_ENV === 'development') {
    //                 setLanguageOptions([
    //                     { id: 'en', name: 'English' },
    //                     { id: 'ar', name: 'Arabic' },
    //                     { id: 'fr', name: 'French' },
    //                     { id: 'de', name: 'German' },
    //                     { id: 'es', name: 'Spanish' },
    //                 ]);
    //             }
    //             else {

    //                 setLangError('Failed to load languages');
    //             }
    //         } finally {
    //             setLangLoading(false);
    //         }
    //     };

    //     fetchLanguages();
    // }, []);

    return (
        <>
            <SectionHeader title={t('languages')} iconSrc='/icons/add-green.svg' actionAria={t('addLanguage')} onAction={() => setShowLangInput(true)} />
            <div className='mt-1 flex flex-wrap items-center gap-2'>
                {value.map((lang, idx) => (
                    <div key={idx} className='group relative inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-[#111827] border border-[#EDEDED] shadow'>
                        <span>{lang}</span>
                        <button
                            onClick={() => setValue(value.filter((_, i) => i !== idx))}
                            className='absolute inset-0 flex items-center justify-center bg-red-500/70 opacity-0 group-hover:opacity-100 transition-opacity'
                            aria-label='Remove language'>
                            <X size={20} className='text-white' />
                        </button>
                    </div>
                ))}
            </div>

            {showLangInput && (
                <div>

                    <div className='mt-3 flex items-end gap-2'>
                        <Select
                            label={t('selectLanguage')}
                            isLoading={langLoading}
                            options={filteredLanguageOptions}
                            placeholder={t('chooseLanguage')}
                            showSearch
                            onChange={opt => setSelectedLang(opt)}
                            name='languageSelect'
                        />
                        <button
                            onClick={() => {
                                if (!selectedLang?.name) return;
                                setValue([...value, selectedLang.name]);
                                setSelectedLang(null);
                                setShowLangInput(false);
                            }}
                            disabled={!selectedLang}
                            className={`rounded-xl border px-3 py-2 text-sm border-emerald-600 text-emerald-600 hover:bg-emerald-50`}>
                            {t('add')}
                        </button>
                    </div>
                    <FormErrorMessage message={langError} />
                </div>
            )}

        </>
    );
}