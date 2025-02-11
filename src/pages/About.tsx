import React from 'react';
import { Award, Users, Shield, Heart, Clock, Globe } from 'lucide-react';

const About = () => {
  const stats = [
    { icon: <Users className="h-6 w-6" />, value: '10,000+', label: 'Active Patients' },
    { icon: <Award className="h-6 w-6" />, value: '500+', label: 'Certified Doctors' },
    { icon: <Clock className="h-6 w-6" />, value: '24/7', label: 'Support' },
    { icon: <Globe className="h-6 w-6" />, value: '50+', label: 'Locations' }
  ];

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Head of Research',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Director of Operations',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-emerald-500 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Revolutionizing Healthcare Through Technology
            </h1>
            <p className="text-xl opacity-90">
              MedChain combines blockchain technology with artificial intelligence to create
              a secure and efficient healthcare ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-indigo-100 text-indigo-500 rounded-full">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-slate-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 mb-6">
                At MedChain, we're committed to transforming healthcare delivery through
                innovative technology. Our platform connects patients with healthcare
                providers while ensuring data security and accessibility.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-emerald-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold mb-1">Secure Health Records</h3>
                    <p className="text-slate-600">
                      Your medical data is protected by advanced blockchain technology.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Heart className="h-6 w-6 text-emerald-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold mb-1">Patient-Centered Care</h3>
                    <p className="text-slate-600">
                      We prioritize patient experience and accessibility in healthcare.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600"
                alt="Medical Technology"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-indigo-500 rounded-lg opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-4 inline-block">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-48 h-48 rounded-full object-cover mx-auto"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-indigo-500/20 to-transparent"></div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-slate-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;