import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, MessageSquare, BarChart2, UserCheck, Mail } from 'lucide-react';

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
      icon: <MessageSquare className="h-8 w-8 text-indigo-500" />,
      title: "Secure Communication",
      description: "Communicate securely with your doctors through our encrypted messaging platform."
    },
    {
      icon: <BarChart2 className="h-8 w-8 text-indigo-500" />,
      title: "Real-time Analytics",
      description: "Access real-time analytics and reports on appointment trends, patient demographics, and doctor performance."
    },
    {
      icon: <UserCheck className="h-8 w-8 text-indigo-500" />,
      title: "Advanced Authentication",
      description: "Secure access with facial recognition and ID verification."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="hero py-20 bg-gradient-to-br from-indigo-600 to-emerald-500 text-white">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to MedChain</h1>
          <p className="text-xl mb-8">
            Experience the future of healthcare with our AI-powered platform and secure communication.
          </p>
          <Link to="/login" className="btn-secondary text-lg">
            Connect with Doctors
          </Link>
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
          <p className="text-xl mb-8">Join the future of healthcare with AI assistance and secure communication.</p>
          <Link to="/register" className="btn-secondary text-lg">
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white p-4">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">MedChain</h3>
              <p className="text-slate-300">Experience the future of healthcare with MedChain.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Navigation</h3>
              <ul>
                <li><Link to="/" className="text-slate-300 hover:text-white">Home</Link></li>
                <li><Link to="/appointments" className="text-slate-300 hover:text-white">Appointments</Link></li>
                <li><Link to="/patients" className="text-slate-300 hover:text-white">Patients</Link></li>
                <li><Link to="/doctors" className="text-slate-300 hover:text-white">Doctors</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
              <p className="text-slate-300">Email: contact@medchain.com</p>
              <p className="text-slate-300">Phone: +1 (123) 456-7890</p>
              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
                <form className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="input-field flex-grow mr-2"
                  />
                  <button type="submit" className="btn-primary">Subscribe</button>
                </form>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} MedChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
