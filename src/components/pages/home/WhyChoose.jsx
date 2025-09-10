const { useTranslations } = require("next-intl");
const { default: Image } = require("next/image");

const WHY_CHOOSE_ITEMS = [
  {
    key: 'categories',
    icon: '/icons/why-choose/categories.svg',
  },
  {
    key: 'pricing',
    icon: '/icons/why-choose/pricing.svg',
  },
  {
    key: 'quality',
    icon: '/icons/why-choose/quality.svg',
  },
  {
    key: 'support',
    icon: '/icons/why-choose/support.svg',
  },
];

export function WhyChoose() {
  const t = useTranslations('home');

  return (
    <section className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <h2 className='text-3xl md:text-4xl font-semibold mb-10'>{t('whyChoose.title')}</h2>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {WHY_CHOOSE_ITEMS.map(item => (
          <div key={item.key} className='flex flex-col bg-white px-6 py-8 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.08)] hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] transition'>
            <div className='w-12 h-12 mb-4'>
              <Image src={item.icon} alt={t(`whyChoose.items.${item.key}.title`)} width={56} height={56} className='mx-auto' />
            </div>
            <h3 className='text-lg font-medium mb-2'>{t(`whyChoose.items.${item.key}.title`)}</h3>
            <p className='text-base text-gray-800'>{t(`whyChoose.items.${item.key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}