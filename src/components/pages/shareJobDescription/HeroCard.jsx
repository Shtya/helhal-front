const { default: Button } = require('@/components/atoms/Button');

export default function HeroCard({ currentStep, className = '' }) {
  const stepContent = [
    {
      title: 'Let the matching begin..',
      subtitle: 'This is where you fill us in on the big picture.',
    },
    {
      title: 'Now let’s talk budget and timing',
      subtitle: 'This is where you provide us with the full picture.',
    },
    {
      title: 'Ready to review your job?',
      subtitle: 'This is where you start making final decisions.',
    },
  ];

  const { title, subtitle, ctaLabel } = stepContent[currentStep] || stepContent[0];

  return (
    <section className={`w-full h-fit p-6 py-12 rounded-2xl shadow-inner border border-slate-200 ${className}`} aria-label='matching-hero' data-aos='zoom-in'>
      <div className='space-y-6 md:space-y-7'>
        <h1 className='font-extrabold tracking-tight leading-[1.05] text-4xl md:text-[44px] text-black'>{title}</h1>
        <p className='text-gray-700 text-xl md:text-2xl leading-snug'>{subtitle}</p>
      </div>
    </section>
  );
}
