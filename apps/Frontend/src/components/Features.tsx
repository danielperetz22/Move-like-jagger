import React from 'react';
import { Users, Music2, FileText } from 'lucide-react';

const features = [
  {
    title: 'Real-time Collaboration',
    icon: Users,
    description: 'Jam together in sync from anywhere',
  },
  {
    title: 'Chord & Lyric Display',
    icon: Music2,
    description: 'View chords and lyrics live, tailored to your instrument',
  },
  {
    title: 'Admin-Controlled Playback',
    icon: FileText,
    description: 'Admins control what is shown and when, in real time',
  }
  
];

const Features: React.FC = () => (
  <section id="features" className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map(({ title, icon: Icon, description }) => (
        <div key={title} className="flex flex-col items-center text-center p-6">
          <Icon className="w-12 h-12 text-[#e68c3a]" />
          <h3 className="mt-4 text-xl font-semibold text-[#60212e]">{title}</h3>
          <p className="mt-2 text-[#60212e]">{description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Features;