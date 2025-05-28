import React from 'react';

const Hero: React.FC = () => {
  return (
    <section
      id="main"
      className="w-full h-auto bg-cover flex flex-col items-center justify-center py-12 max-w-7xl mx-auto text-center"
    >
      <p className="font-heeboo mt-8 text-3xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-[#516578]">
       Let's Play Music Together with JaMoveo
      </p>
      <p className="font-assistant mt-6 text-xl sm:text-2xl md:text-3xl lg:text-3xl font-semibold text-[#728291] max-w-3xl">
        Collaborate on chord progressions and lyrics in real-time. Turn your musical ideas into finished songs with friends and bandmates.
      </p>
    </section>
  );
};

export default Hero;