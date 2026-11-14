import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Stethoscope,
  Heart,
  CheckCircle2,
  Award,
  Clock,
  ArrowRight,
  Star,
  Lock,
  FileCheck,
  Search,
  MapPin,
  Users,
  ChevronRight,
  AlertTriangle,
  Pill,
  Sparkles,
  PhoneCall,
  Activity,
  Calendar
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  const specialties = [
    {
      name: 'Cardiology',
      description: 'Arrhythmia, hypertension, coronary care & heart failure management.',
      doctorsCount: '34 Specialists',
      icon: Heart,
      wait: '< 20 min'
    },
    {
      name: 'Internal & Family Medicine',
      description: 'Comprehensive adult health, preventative screenings & chronic disease control.',
      doctorsCount: '82 Physicians',
      icon: Stethoscope,
      wait: 'Immediate'
    },
    {
      name: 'Neurology',
      description: 'Migraines, neurological disorders, cognitive assessment & EEG analysis.',
      doctorsCount: '19 Specialists',
      icon: Activity,
      wait: 'Today'
    },
    {
      name: 'Pediatrics',
      description: 'Well-child checks, pediatric triage, immunizations & developmental milestones.',
      doctorsCount: '45 Pediatricians',
      icon: Users,
      wait: 'Immediate'
    },
    {
      name: 'Orthopedics & Sports Medicine',
      description: 'Joint preservation, spinal care, fracture management & rehabilitation.',
      doctorsCount: '27 Surgeons',
      icon: Activity,
      wait: '< 1 hour'
    },
    {
      name: 'Clinical Pharmacy & Therapeutics',
      description: 'Prescription reviews, medication therapy management & home delivery.',
      doctorsCount: '15 Pharmacists',
      icon: Pill,
      wait: 'Automated'
    }
  ];

  const doctors = [
    {
      name: 'Dr. Eleanor Vance, MD, FACC',
      role: 'Attending Cardiologist',
      institution: 'Formerly Harvard Medical School / Mass General',
      experience: '18 Years Clinical Practice',
      rating: 4.98,
      reviews: 342,
      specialty: 'Cardiovascular Disease & Echocardiography',
      availability: 'Available Today',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350',
      board: 'ABIM Board Certified in Cardiovascular Disease'
    },
    {
      name: 'Dr. Marcus Thorne, MD, FACS',
      role: 'Senior Orthopedic Surgeon',
      institution: 'Johns Hopkins Medicine Alumnus',
      experience: '15 Years Surgical Practice',
      rating: 4.95,
      reviews: 289,
      specialty: 'Joint Reconstruction & Sports Medicine',
      availability: 'Next slot: Tomorrow 10:00 AM',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=350',
      board: 'American Board of Orthopaedic Surgery'
    },
    {
      name: 'Dr. Priya Nair, MD, FAAP',
      role: 'Pediatric Specialist & Clinical Director',
      institution: 'Stanford Health Care Clinical Fellow',
      experience: '12 Years Pediatric Care',
      rating: 4.99,
      reviews: 412,
      specialty: 'Pediatric Medicine & Preventive Wellness',
      availability: 'Available for Telehealth Now',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=350',
      board: 'American Board of Pediatrics'
    }
  ];

  const clinicalMetrics = [
    { value: '99.4%', label: 'Clinical Diagnostic Accuracy', subtext: 'Validated against peer-reviewed hospital benchmarks' },
    { value: '14 Min', label: 'Average Triage Turnaround', subtext: 'From symptom intake to active physician review' },
    { value: '100%', label: 'Zero-Knowledge Privacy', subtext: 'Patient records encrypted with client-side keys' },
    { value: '4.96 / 5', label: 'Verified Patient Rating', subtext: 'Over 18,500 independently verified encounters' }
  ];

  const faqs = [
    {
      q: 'How does MedChain protect my personal health records (PHI)?',
      a: 'MedChain utilizes end-to-end cryptographic vaults compliant with HIPAA (Health Insurance Portability and Accountability Act) and ISO 27001 standards. Your medical history, lab results, and consultation transcripts are encrypted at rest with AES-256 and accessible only to you and clinicians you explicitly authorize.'
    },
    {
      q: 'Are MedChain physicians board-certified?',
      a: 'Yes. Every clinician practicing on MedChain undergoes multi-tier credentialing: state medical license verification, National Practitioner Data Bank (NPDB) checks, specialty board certification (ABMS), and active malpractice insurance validation before treating patients.'
    },
    {
      q: 'Do you accept health insurance for visits and prescriptions?',
      a: 'MedChain works directly with major national insurance plans (including Aetna, BlueCross BlueShield, Cigna, UnitedHealthcare, and Medicare Advantage) for covered appointments and e-prescriptions. Transparent out-of-pocket pricing is clearly displayed upfront for non-covered care.'
    },
    {
      q: 'How does the AI Symptoms Detection feature work with real physicians?',
      a: 'Our symptom assessment system provides structured triage using clinical algorithms developed in accordance with American College of Emergency Physicians guidelines. It organizes your chief complaint, vital indicators, and symptom timeline to match you with the appropriate specialty doctor, who conducts the formal clinical diagnosis.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Clinical Advisory Banner */}
      <div className="bg-[#0B192C] text-slate-200 text-xs sm:text-sm py-2 px-4 border-b border-slate-700">
        <div className="container-custom flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              CLINICAL TRIAGE
            </span>
            <span className="text-slate-300">
              Experiencing a life-threatening emergency? Please call <strong className="text-white font-semibold">911</strong> or visit the nearest emergency department immediately.
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-300">
            <span className="hidden sm:inline">Clinical Support Hotline:</span>
            <a href="tel:18005550199" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
              <PhoneCall className="h-3.5 w-3.5" /> 1-800-555-0199
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0B192C] via-[#0F2238] to-[#122A46] text-white pt-16 pb-24 overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>HIPAA Compliant &bull; JCAHO Accredited Clinical Network</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-white mb-6">
              Accredited Clinical Care with Patient-Owned Medical Records.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
              Connect directly with board-certified physicians, obtain real-time AI clinical triage, and manage encrypted medical records through our decentralized healthcare network.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/symptoms"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Start AI Symptom Triage
              </Link>
              <Link
                to="/patient/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white hover:bg-slate-100 text-[#0B192C] font-semibold text-sm transition-colors shadow-sm"
              >
                Create Patient Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/doctor/register"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-sm font-medium transition-colors"
              >
                <Stethoscope className="h-4 w-4 text-emerald-400" />
                Join as Physician
              </Link>
            </div>

            {/* Accreditation trust seals */}
            <div className="pt-6 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>256-Bit Encrypted Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Verified MD Specialists</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>HIPAA & SOC 2 Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>E-Prescribe Certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Search & Intake Quick-Bar */}
      <section className="-mt-10 relative z-20 container-custom">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 p-4 sm:p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Medical Specialty or Concern
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="">Select Clinical Department...</option>
                  <option value="cardiology">Cardiovascular & Heart Health</option>
                  <option value="internal">Internal & Primary Medicine</option>
                  <option value="neurology">Neurology & Cognitive Health</option>
                  <option value="pediatrics">Pediatrics & Adolescent Care</option>
                  <option value="orthopedics">Orthopedic Surgery & Sports</option>
                  <option value="pharmacy">Prescription & Medication Review</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Consultation Location / Telehealth
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="City, Zip Code, or 'Virtual Visit'"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            <div className="md:pt-5">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Search className="h-4 w-4" />
                Search Available Physicians
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Clinical Metrics Strip */}
      <section className="py-16 bg-white border-b border-slate-200/60 mt-10">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {clinicalMetrics.map((metric, i) => (
              <div key={i} className="text-center md:text-left border-l-2 border-emerald-500 pl-4">
                <div className="text-3xl font-bold text-[#0B192C] font-mono">{metric.value}</div>
                <div className="text-sm font-semibold text-slate-900 mt-1">{metric.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{metric.subtext}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Departments & Specialties */}
      <section className="py-20 container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-2">
              Comprehensive Outpatient & Telemedicine Services
            </div>
            <h2 className="text-3xl font-bold text-[#0B192C]">
              Clinical Specialties & Care Pathways
            </h2>
          </div>
          <p className="text-slate-600 text-sm max-w-md mt-3 md:mt-0">
            All clinical pathways adhere to evidence-based protocols established by certified national medical boards.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((spec, idx) => {
            const Icon = spec.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-slate-50 text-[#0D9488] border border-slate-100 group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {spec.doctorsCount}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0B192C] mb-2">{spec.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{spec.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Wait time: <strong className="text-emerald-700">{spec.wait}</strong></span>
                  <Link
                    to="/login"
                    className="text-[#0D9488] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Consult <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* The MedChain Standard of Care (How it Works) */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Standard of Care</span>
            <h2 className="text-3xl font-bold text-[#0B192C] mt-2 mb-4">
              How Care is Delivered on MedChain
            </h2>
            <p className="text-slate-600 text-sm">
              Our clinical workflow bridges instant AI-assisted triage with board-certified clinical judgment and cryptographic health sovereignty.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200 relative">
              <div className="text-2xl font-bold text-[#0D9488] mb-3">01</div>
              <h3 className="font-bold text-[#0B192C] mb-2">Clinical Symptom Triage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter symptoms or upload clinical reports. The AI triage engine evaluates acuity and routes you to the exact clinical specialty.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 relative">
              <div className="text-2xl font-bold text-[#0D9488] mb-3">02</div>
              <h3 className="font-bold text-[#0B192C] mb-2">Physician Encounter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Meet your board-certified physician through encrypted WebRTC high-definition video or book an in-person clinic visit.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 relative">
              <div className="text-2xl font-bold text-[#0D9488] mb-3">03</div>
              <h3 className="font-bold text-[#0B192C] mb-2">Encrypted Health Vault</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consultation notes, lab requisitions, and diagnosis summaries are encrypted directly into your portable patient vault.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 relative">
              <div className="text-2xl font-bold text-[#0D9488] mb-3">04</div>
              <h3 className="font-bold text-[#0B192C] mb-2">Pharmacy Fulfillment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                E-prescriptions are sent automatically to our integrated digital pharmacy for same-day home dispatch or local pick-up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Physicians Section */}
      <section className="py-20 container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-2">
              Verified Clinical Faculty
            </div>
            <h2 className="text-3xl font-bold text-[#0B192C]">
              Featured Board-Certified Specialists
            </h2>
          </div>
          <Link
            to="/login"
            className="text-sm font-semibold text-[#0B192C] hover:text-[#0D9488] inline-flex items-center gap-1 mt-3 md:mt-0"
          >
            Browse all verified physicians <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {doctors.map((doc, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden relative bg-slate-100">
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-700 flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Credentials
                </div>
              </div>

              <div className="p-6">
                <div className="text-xs font-semibold text-[#0D9488] mb-1">{doc.role}</div>
                <h3 className="text-lg font-bold text-[#0B192C] mb-1">{doc.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{doc.institution}</p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-4 text-xs">
                  <div className="font-semibold text-slate-800">{doc.board}</div>
                  <div className="text-slate-500 mt-0.5">{doc.experience}</div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100 mb-4">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{doc.rating}</span>
                    <span className="text-slate-400 font-normal">({doc.reviews} reviews)</span>
                  </div>
                  <span className="text-emerald-700 font-medium">{doc.availability}</span>
                </div>

                <Link
                  to="/login"
                  className="w-full block text-center py-2.5 px-4 rounded-lg bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors"
                >
                  Book Consultation
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical Governance & Security Standards */}
      <section className="py-16 bg-[#0B192C] text-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Institutional Governance</span>
              <h2 className="text-3xl font-bold mt-2 mb-4">
                Clinical Security Built for Regulated Healthcare.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Unlike legacy telemedicine applications where patient health records reside in centralized commercial databases, MedChain leverages decentralized audit trails, zero-knowledge proofs, and client-side encryption keys.
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">HIPAA & HITECH Act Certified</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Full compliance with Business Associate Agreements (BAA) and cryptographic access logs.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Interoperability (HL7 / FHIR Standards)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Export and share records seamlessly with your hospital system or primary care clinic.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Board-Level Clinical Quality Oversight</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Quarterly peer-review of diagnostic accuracy and prescription guideline adherence.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#122A46] rounded-2xl p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Immediate Clinical Access</h3>
              <p className="text-slate-300 text-xs mb-6 leading-relaxed">
                Whether you need urgent triage for seasonal illness, a chronic disease management follow-up, or verified prescription fulfillment, our care team is online.
              </p>

              <div className="space-y-3">
                <Link
                  to="/symptoms"
                  className="w-full flex items-center justify-between p-3.5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white text-sm font-semibold transition-colors"
                >
                  <span>Launch Diagnostic Triage Assistant</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/patient/register"
                  className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-colors"
                >
                  <span>Register as New Patient</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  to="/shop"
                  className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-colors"
                >
                  <span>Access Clinical Pharmacy</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical FAQ */}
      <section className="py-20 container-custom">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Patient Information</span>
            <h2 className="text-3xl font-bold text-[#0B192C] mt-2 mb-3">
              Frequently Asked Clinical & Platform Questions
            </h2>
            <p className="text-sm text-slate-600">
              Straightforward answers regarding our medical standards, records privacy, and clinical encounters.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-[#0B192C] mb-2 flex items-start gap-2">
                  <span className="text-[#0D9488] font-mono">Q:</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Clinical Footer */}
      <footer className="bg-[#0B192C] text-slate-300 pt-16 pb-12 border-t border-slate-800 text-sm">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded bg-[#0D9488] text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">MedChain</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                MedChain is an accredited decentralized healthcare network delivering board-certified clinical encounters, AI diagnostic assistance, and zero-knowledge electronic health record management.
              </p>
              <div className="text-xs text-slate-400">
                <div>National Provider Identifier (NPI): <strong className="text-slate-300">#1942093104</strong></div>
                <div>CLIA Laboratory Certification: <strong className="text-slate-300">#36D2094112</strong></div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Clinical Portals</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Patient Portal Sign In</Link></li>
                <li><Link to="/patient/register" className="hover:text-emerald-400 transition-colors">Register as Patient</Link></li>
                <li><Link to="/doctor/register" className="hover:text-emerald-400 transition-colors">Physician Credentialing Intake</Link></li>
                <li><Link to="/symptoms" className="hover:text-emerald-400 transition-colors">AI Symptoms Detection & Triage</Link></li>
                <li><Link to="/shop" className="hover:text-emerald-400 transition-colors">MedChain Certified Pharmacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Hospital Network & Care</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Our Medical Governance</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Clinic Locations & Support</Link></li>
                <li><span className="text-slate-500">Emergency & Critical Care: Dial 911</span></li>
                <li><span className="text-slate-500">Crisis & Suicide Lifeline: Dial 988</span></li>
                <li><span className="text-slate-500">HIPAA Compliance Office</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Accredited Health Centers</h4>
              <div className="text-xs text-slate-400 space-y-3">
                <div>
                  <strong className="text-slate-200 block">Boston Clinical Center</strong>
                  <span>650 Albany Street, BioSquare Suite 400, Boston, MA 02118</span>
                </div>
                <div>
                  <strong className="text-slate-200 block">New York Medical Pavilion</strong>
                  <span>425 E 61st St, New York, NY 10065</span>
                </div>
                <div className="pt-2 text-emerald-400 font-semibold">
                  Toll-Free Patient Line: (800) 555-0199
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              &copy; {new Date().getFullYear()} MedChain Health System Inc. All rights reserved. HIPAA Compliant.
            </div>
            <div className="flex gap-6">
              <Link to="/about" className="hover:text-slate-300">Notice of Privacy Practices</Link>
              <Link to="/contact" className="hover:text-slate-300">Patient Rights & Responsibilities</Link>
              <Link to="/about" className="hover:text-slate-300">Terms of Clinical Telehealth</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
