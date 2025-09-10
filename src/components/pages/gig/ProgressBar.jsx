'use client';

export default function ProgressBar({ step }) {
  const stepLabels = ['Overview', 'Pricing', 'Description & FAQ', 'Requirements', 'Gallery', 'Publish'];
  const steps = [
    { title: 'Create Your Gig', description: "Let's start by choosing a category for your service" },
    { title: 'Packages & Pricing', description: 'Set up your service packages and pricing options' },
    { title: 'Frequently Asked Questions.', description: 'Provide the answer frequently asked questions.' },
    { title: 'Buyer Requirements', description: 'Specify what information you need from buyers to get started' },
    { title: 'Gallery & Media', description: 'Showcase your previous work to attract new buyers.' },
    { title: 'Publish', description: 'Finalize and publish your project.' },
  ];
  return (
    <div className=' relative w-fit  overflow-auto mb-8 '>
      <div className=' w-full relative z-[1] flex justify-start items-center border border-slate-200 overflow-hidden rounded-sm '>
        {stepLabels.map((label, index) => {
          const stepNum = index + 1;
          return (
            <div key={stepNum} className=' px-2 py-2 rounded-full  flex items-center relative gap-[5px] w-fit'>
              <div className={` shadow-inner border !border-slate-50/70 w-6 h-6 text-xs rounded-full flex items-center justify-center transition-all duration-300 ${stepNum < step ? 'gradient text-white ring-white ' : stepNum === step ? 'gradient shadow-inner text-white' : 'bg-gray-200 text-gray-500'}`}>{stepNum}</div>
              <span className={`flex items-center text-nowrap text-sm font-[600] text-gray-600 text-lett  ${stepNum < step ? 'text-white' : stepNum === step ? 'text-white' : 'text-gray-500'}`}>{label}</span>
              <div className=' w-full h-full bg-gray-100 absolute left-0 top-0 z-[-1] '>
                <div style={{ width: stepNum <= step ? '100%' : '0px' }} className={`  bg-[#00d08f]  h-full w-full   transition-all duration-500 ease-out`}></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className=' mb-6 mt-6 '>
        <h1 className='text-3xl font-bold text-gray-900'> {steps[step - 1].title}</h1>
        <p className='text-gray-600 mt-1 '>{steps[step - 1].description}</p>
      </div>
    </div>
  );
}
