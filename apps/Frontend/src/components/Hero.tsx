import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import logo from '../assets/logoJaMoveo.png';


const Hero: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section
    id="main"
    className="w-full h-auto py-40 bg-[#f4f2ef] bg-cover bg-center relative"
  >
        <div>
      <img
        src={logo}
        alt="JaMoveo Logo"
        className="mx-auto mb-6 h-24 md:h-56"
        />
    </div>
    <div className="absolute inset-0" />
    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="font-heeboo mt-8 text-4xl md:text-6xl font-bold text-[#60212e]">
        Let's sing dance and play some  music!
      </h1>
      <p className="font-assistant mt-6 text-lg md:text-2xl font-semibold text-[#60212e] max-w-3xl">
      Follow chord progressions and lyrics in real time, controlled by the admin. Stay in sync with your bandmates during live rehearsals.      </p>
      <Button
        variant="primary"
        onClick={() => navigate('/register')}
        className="group mt-8 px-6 py-3 text-lg md:text-xl font-semibold bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
      >
        <span>Join now</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Button>
    </div>
  </section>
  );
};

export default Hero;