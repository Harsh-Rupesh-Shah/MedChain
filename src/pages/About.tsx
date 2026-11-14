import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Award,
  Users,
  CheckCircle2,
  FileText,
  Lock,
  Building2,
  ArrowRight,
  HeartHandshake,
  Activity,
  Globe2,
  PhoneCall
} from 'lucide-react';

const About: React.FC = () => {
  const leadership = [
    {
      name: 'Dr. Sarah Johnson, MD, FACC',
      title: 'Chief Medical Officer',
      bio: 'Former Associate Professor of Medicine at Harvard Medical School and Attending Cardiologist at Brigham and Women’s Hospital. Specializes in cardiovascular preventative protocols and clinical quality assurance.',
      credentials: ['Harvard Medical School, MD', 'Brigham & Women’s Hospital Residency', 'ABIM Board Certified in Cardiology'],
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
    },
    {
      name: 'Dr. Michael Chen, MD, PhD',
      title: 'Head of Clinical Informatics & Safety',
      bio: 'Dual-degree physician-informaticist trained at Stanford. Former NIH Postdoctoral Fellow in Biomedical Informatics, focused on validating clinical safety algorithms and ethical AI decision support.',
      credentials: ['Stanford School of Medicine, MD', 'Stanford University, PhD in Biomedical Informatics', 'Fellow of the American College of Medical Informatics'],
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
    },
    {
      name: 'Dr. Emily Rodriguez, MD, FAAP',
      title: 'Director of Clinical Operations & Patient Safety',
      bio: '20-year pediatric clinician and former Quality Director at Johns Hopkins Children’s Center. Leads continuous clinical peer-review, patient rights enforcement, and multi-state telehealth licensing.',
      credentials: ['Johns Hopkins School of Medicine, MD', 'Johns Hopkins Hospital Residency in Pediatrics', 'American Board of Pediatrics Certified'],
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400'
    },
    {
      name: 'Dr. Arthur Bennett, MD, FACP',
      title: 'Chair of Clinical Ethics & Data Sovereignty',
      bio: 'Distinguished internist and bioethicist. Former member of the AMA Council on Ethical and Judicial Affairs. Spearheaded MedChain’s zero-knowledge patient data privacy framework.',
      credentials: ['Columbia University Vagelos College of Physicians, MD', 'Columbia Presbyterian Hospital Residency', 'Master of Bioethics (MBE)'],
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400'
    }
  ];

  const standards = [
    {
      title: 'HIPAA & HITECH Security',
      desc: 'All Protected Health Information (PHI) is encrypted at rest using AES-256 and in transit using TLS 1.3 with cryptographic audit logs.'
    },
    {
      title: 'Joint Commission (JCAHO) Standards',
      desc: 'Our physician clinical guidelines align directly with Joint Commission ambulatory healthcare standards and patient safety metrics.'
    },
    {
      title: 'HL7 & FHIR Interoperability',
      desc: 'Patient health records are structured according to Fast Healthcare Interoperability Resources (FHIR) for seamless data transfer with hospital systems.'
    },
    {
      title: 'Multi-Tier Physician Credentialing',
      desc: 'Every clinician undergoes National Practitioner Data Bank (NPDB) reviews, state license checks, and ABMS board verification prior to appointment.'
    }
  ];

  const institutionalStats = [
    { label: 'Licensed Clinicians', value: '140+' },
    { label: 'States with Telehealth Licensure', value: '48' },
    { label: 'Average Emergency Triage Wait', value: '14 Min' },
    { label: 'Cryptographic Audit Integrity', value: '100%' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Hero / Institutional Mission */}
      <section className="bg-gradient-to-b from-[#0B192C] via-[#0F2238] to-[#122A46] text-white py-20 border-b border-slate-700">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Institutional Governance & Medical Leadership</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
              Clinical Rigor, Physician Integrity, and Patient Sovereignty.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              MedChain was founded by practicing physicians and biomedical informaticists to resolve healthcare’s critical paradox: delivering seamless, rapid digital clinical encounters without compromising patient privacy or evidence-based clinical standards.
            </p>
          </div>
        </div>
      </section>

      {/* Institutional Stats */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {institutionalStats.map((stat, i) => (
              <div key={i} className="text-center md:text-left border-l-2 border-[#0D9488] pl-4">
                <div className="text-3xl font-bold text-[#0B192C] font-mono">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & The MedChain Charter */}
      <section className="py-20 container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-2">
              Our Clinical Philosophy
            </div>
            <h2 className="text-3xl font-bold text-[#0B192C] mb-6">
              Why We Replaced Centralized Medical Databases
            </h2>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                In conventional digital healthcare, patient records are monetized, shared with third-party data aggregators, and siloed inside closed electronic medical record systems. Patients are rarely given genuine custody of their medical history.
              </p>
              <p>
                MedChain was architected on a different principle: <strong>You own your health data.</strong> Using zero-knowledge cryptographic vaults, your records are accessible only when you grant explicit authorization to your attending doctor.
              </p>
              <p>
                Simultaneously, our artificial intelligence modules act solely as decision-support instruments for licensed physicians—enhancing triage speed and diagnostic thoroughness, while preserving physician empathy and judgment at the center of clinical care.
              </p>
            </div>

            <div className="mt-8 flex gap-4">
              <Link
                to="/patient/register"
                className="px-5 py-2.5 rounded-lg bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Join as Patient
              </Link>
              <Link
                to="/contact"
                className="px-5 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Inquire with Quality Committee
              </Link>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-[#0B192C] mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0D9488]" />
              The MedChain Patient Bill of Rights
            </h3>
            <ul className="space-y-4 text-xs text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block mb-0.5">Absolute Cryptographic Custody:</strong>
                  Your personal health data cannot be viewed, sold, or shared without your explicit cryptographic authorization.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block mb-0.5">Transparent Physician Credentials:</strong>
                  You have the right to inspect board certifications, medical school training, malpractice status, and specialty tenure of any clinician.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block mb-0.5">Instant FHIR Medical Record Portability:</strong>
                  Export your full consultation transcripts, laboratory test results, and imaging studies to any external hospital system anytime.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block mb-0.5">Upfront Clinical Pricing:</strong>
                  Zero surprise medical bills. Clear out-of-pocket costs and accepted insurance plan lists before every appointment.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Medical Executive Committee */}
      <section className="py-20 bg-slate-100/60 border-y border-slate-200">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Clinical Governance</div>
            <h2 className="text-3xl font-bold text-[#0B192C] mt-2 mb-4">
              Medical Executive Committee
            </h2>
            <p className="text-sm text-slate-600">
              Our clinical policies, treatment pathways, and physician credentialing standards are directed by distinguished leaders in academic and hospital medicine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {leadership.map((leader, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 shadow-xs">
                <img
                  src={leader.image}
                  alt={leader.name}
                  className="w-28 h-28 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                />
                <div>
                  <div className="text-xs font-semibold text-[#0D9488]">{leader.title}</div>
                  <h3 className="text-lg font-bold text-[#0B192C] mt-0.5 mb-2">{leader.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{leader.bio}</p>
                  
                  <div className="space-y-1">
                    {leader.credentials.map((cred, j) => (
                      <div key={j} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Award className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                        <span>{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory & Accreditations Framework */}
      <section className="py-20 container-custom">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Quality & Compliance</div>
          <h2 className="text-3xl font-bold text-[#0B192C] mt-2 mb-4">
            Institutional Regulatory Standards
          </h2>
          <p className="text-sm text-slate-600">
            MedChain operates under continuous compliance oversight from clinical, data protection, and pharmaceutical regulatory bodies.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {standards.map((std, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <div className="p-2.5 w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 mb-4 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-[#0B192C] mb-2">{std.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{std.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical Footer */}
      <footer className="bg-[#0B192C] text-slate-300 py-12 border-t border-slate-800 text-xs">
        <div className="container-custom flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} MedChain Health System Inc. Accredited Clinical Platform.
          </div>
          <div className="flex gap-6 text-slate-400">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/contact" className="hover:text-white">Clinical Locations</Link>
            <Link to="/symptoms" className="hover:text-white">Diagnostic Triage</Link>
            <Link to="/login" className="hover:text-white">Patient Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
