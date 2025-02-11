import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, Shield, MessageSquare, BarChart2, UserCheck } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-indigo-500" />,
      title: "AI Symptoms Detection",
      description: "Get instant specialist recommendations and illness detection powered by AI."
    },
    {
      icon: <Calendar className="h-8 w-8 text-indigo-500" />,
      title: "Smart Scheduling",
      description: "Book appointments with the nearest available doctor instantly."
    },
    {
      icon: <Shield className="h-8 w-8 text-indigo-500" />,
      title: "Blockchain Records",
      description: "Your medical records are secure and accessible with blockchain technology."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-indigo-500" />,
      title: "Community Forum",
      description: "Connect with others and get insights from our AI-powered forum."
    },
    {
      icon: <BarChart2 className="h-8 w-8 text-indigo-500" />,
      title: "Real-time Analytics",
      description: "Comprehensive reports and insights at your fingertips."
    },
    {
      icon: <UserCheck className="h-8 w-8 text-indigo-500" />,
      title: "Advanced Authentication",
      description: "Secure access with facial recognition and ID verification."
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Healthcare Reimagined with Blockchain</h1>
            <p className="text-xl mb-8">
              Experience the future of healthcare with MedChain's AI-powered platform and secure blockchain technology.
            </p>
            <Link to="/login" className="btn-secondary text-lg">
              Connect with Doctors
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50/50 backdrop-blur-sm">
        <div className="container-custom">
          <h2 className="section-title text-center">Why Choose MedChain?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-emerald-500 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">Transform Your Healthcare Experience</h2>
          <p className="text-xl mb-8">Join the future of healthcare with blockchain security and AI assistance.</p>
          <Link to="/register" className="btn-secondary text-lg">
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;