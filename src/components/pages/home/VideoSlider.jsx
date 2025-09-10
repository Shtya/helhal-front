import { Swiper, SwiperSlide } from 'swiper/react';
import {  Navigation } from 'swiper/modules';
import ReactPlayer from "react-player";
import React from 'react';

import 'swiper/css';
import 'swiper/css/navigation';


const VIDEO_SLIDER_ITEMS = [
  {
    id: 'video-3',
    url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490550/video-3.mp4',
  },
  {
    id: 'video-1',
    url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490553/video-1.mp4',
  },
  {
    id: 'video-2',
    url: 'https://res.cloudinary.com/drru4lsys/video/upload/v1752490552/video-2.mp4',
  },
];

export function VideoSlider() {
  const swiperRef = React.useRef(null);
  const sectionRef = React.useRef(null);
  const [isSectionInView, setIsSectionInView] = React.useState(false);
  const userExplicitlyPaused = React.useRef(new Set());
  const [activeVideoIndex, setActiveVideoIndex] = React.useState(0);
  const playerRefs = React.useRef(new Map());

  const handleSlideChange = React.useCallback(swiperInstance => {
    setActiveVideoIndex(swiperInstance.activeIndex);
  }, []);

  React.useEffect(() => {
    const currentSectionRef = sectionRef.current;
    if (!currentSectionRef) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isSectionInView) {
            setIsSectionInView(true);
            setActiveVideoIndex(0);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(currentSectionRef);

    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, [isSectionInView]);

  return (
    <section ref={sectionRef} className='container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12'>
      <Swiper ref={swiperRef} slidesPerView={1} spaceBetween={24} navigation modules={[Navigation]} onSlideChange={handleSlideChange} className='video-slider'>
        {VIDEO_SLIDER_ITEMS.map((video, index) => (
          <SwiperSlide key={video.id}>
            <div className='w-full mx-auto aspect-video relative'>
              <ReactPlayer
                ref={player => {
                  playerRefs.current.set(index, player);
                }}
                src={video.url}
                controls={true}
                playing={isSectionInView && index === activeVideoIndex && !userExplicitlyPaused.current.has(index)}
                muted={true}
                loop={true}
                width='100%'
                height='100%'
                onPlay={() => {
                  userExplicitlyPaused.current.delete(index);
                }}
                onPause={() => {
                  if (index === activeVideoIndex && isSectionInView && !userExplicitlyPaused.current.has(index)) {
                    userExplicitlyPaused.current.add(index);
                  }
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
