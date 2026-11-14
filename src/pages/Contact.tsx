import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Building2,
  Send,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'patient-care',
    patientId: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      toast.error('Please complete all required fields.');
      return;
    }
    setSubmitted(true);
    toast.success('Your inquiry has been routed to the appropriate clinical department.');
  };

  const departments = [
    {
      name: 'Patient Care & Appointment Scheduling',
      phone: '(800) 555-0199',
      email: 'patientcare@medchain.health',
      hours: 'Mon – Sun: 24/7 Virtual Triage Available',
      desc: 'Immediate consultation assistance, physician matching, and insurance pre-authorization.'
    },
    {
      name: 'Clinical Pharmacy & Prescription Desk',
      phone: '(800) 555-0188',
      email: 'pharmacy@medchain.health',
      hours: 'Mon – Fri: 8:00 AM – 8:00 PM EST | Sat: 9:00 AM – 5:00 PM EST',
      desc: 'Medication synchronization, home fulfillment dispatch, and drug interaction queries.'
    },
    {
      name: 'Physician Credentialing & Medical Staff',
      phone: '(800) 555-0177',
      email: 'credentialing@medchain.health',
      hours: 'Mon – Fri: 9:00 AM – 5:00 PM EST',
      desc: 'Board license verification, institutional affiliations, and clinical peer-review committee.'
    },
    {
      name: 'HIPAA Compliance & Records Office',
      phone: '(800) 555-0166',
      email: 'compliance@medchain.health',
      hours: 'Mon – Fri: 9:00 AM – 5:00 PM EST',
      desc: 'Cryptographic vault inquiries, FHIR export assistance, and Privacy Rule disclosures.'
    }
  ];

  const clinicLocations = [
    {
      city: 'Boston Clinical Center',
      address: '650 Albany Street, BioSquare Suite 400',
      stateZip: 'Boston, MA 02118',
      tel: '(617) 555-0120',
      director: 'Dr. Sarah Johnson, MD'
    },
    {
      city: 'New York Medical Pavilion',
      address: '425 East 61st Street, Floor 8',
      stateZip: 'New York, NY 10065',
      tel: '(212) 555-0144',
      director: 'Dr. Eleanor Vance, MD'
    },
    {
      city: 'San Francisco Health Center',
      address: '1500 Owens Street, Mission Bay Suite 250',
      stateZip: 'San Francisco, CA 94158',
      tel: '(415) 555-0182',
      director: 'Dr. Michael Chen, MD, PhD'
    },
    {
      city: 'Chicago Loop Outpatient Center',
      address: '122 South Michigan Avenue, Suite 1100',
      stateZip: 'Chicago, IL 60603',
      tel: '(312) 555-0195',
      director: 'Dr. Arthur Bennett, MD'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Emergency Advisory Strip */}
      <div className="bg-[#0B192C] text-slate-200 text-xs py-2.5 px-4 border-b border-slate-700">
        <div className="container-custom flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              URGENT NOTICE
            </span>
            <span>
              If you have severe chest pain, acute respiratory distress, or severe bleeding, please call <strong>911</strong> immediately.
            </span>
          </div>
          <div className="text-slate-300">
            National Suicide & Crisis Lifeline: <strong className="text-emerald-400">Dial 988</strong>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-b from-[#0B192C] via-[#0F2238] to-[#122A46] text-white py-16">
        <div className="container-custom">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Direct Clinical Communications</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
              Clinical Support & Hospital Network
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              Connect directly with our care coordinators, clinical pharmacy team, or medical records governance office.
            </p>
          </div>
        </div>
      </section>

      {/* Department Cards Grid */}
      <section className="container-custom py-16">
        <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-2">
          Specialized Helpdesks
        </div>
        <h2 className="text-2xl font-bold text-[#0B192C] mb-8">
          Direct Department Directory
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {departments.map((dept, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <h3 className="font-bold text-base text-[#0B192C] mb-2">{dept.name}</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">{dept.desc}</p>
              
              <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-[#0D9488] flex-shrink-0" />
                  <strong className="text-[#0B192C] font-mono">{dept.phone}</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4 text-[#0D9488] flex-shrink-0" />
                  <span className="font-mono">{dept.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span>{dept.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Contact Form & Regional Pavilions */}
      <section className="container-custom pb-20">
        <div className="grid lg:grid-cols-3 gap-10 items-start">
          {/* Inquiry Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-[#0B192C] mb-2">Send a Secure Clinical Inquiry</h2>
            <p className="text-xs text-slate-500 mb-6">
              Messages submitted through this portal are encrypted and routed directly to clinical triage staff. Average response time is under 2 business hours.
            </p>

            {submitted ? (
              <div className="p-8 text-center rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 mb-3">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 mb-2">Message Dispatched Successfully</h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto mb-4">
                  Your reference ID is <strong>#MC-{Math.floor(100000 + Math.random() * 900000)}</strong>. A triage coordinator has received your message and will respond via your registered email.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: '', email: '', phone: '', department: 'patient-care', patientId: '', message: '' });
                  }}
                  className="px-4 py-2 bg-[#0B192C] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3A8A] transition-colors"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Jonathan R. Miller"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. jmiller@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Telephone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. (555) 012-3456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Destination Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    >
                      <option value="patient-care">Patient Care & Triage Scheduling</option>
                      <option value="pharmacy">Clinical Pharmacy & Prescriptions</option>
                      <option value="credentialing">Physician Credentialing Intake</option>
                      <option value="compliance">HIPAA & Medical Records Vault</option>
                      <option value="billing">Insurance & Outpatient Billing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    MedChain Patient ID or NPI (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    placeholder="e.g. MC-98421 or Provider NPI #1942093104"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inquiry Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please summarize your inquiry or clinical question clearly. Do not transmit credit card details."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                    Transmit Encrypted Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Regional Pavilions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-[#0B192C] mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#0D9488]" />
                Regional Outpatient Centers
              </h3>

              <div className="space-y-5 text-xs">
                {clinicLocations.map((loc, i) => (
                  <div key={i} className="pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div className="font-bold text-slate-900">{loc.city}</div>
                    <div className="text-slate-600 mt-0.5">{loc.address}</div>
                    <div className="text-slate-600">{loc.stateZip}</div>
                    <div className="flex items-center justify-between mt-1.5 text-slate-500">
                      <span>Tel: <strong className="text-slate-700">{loc.tel}</strong></span>
                      <span className="text-[11px] text-emerald-700 font-medium">{loc.director}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B192C] text-white rounded-2xl p-6 border border-slate-700 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                <Shield className="h-4 w-4" />
                <span>Patient Health Privacy Notice</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Communications transmitted through this website are protected under HIPAA Security Rule protocols. For confidential medical record access, please log in directly via the encrypted Patient Portal.
              </p>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-block px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold transition-colors"
                >
                  Access Patient Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B192C] text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="container-custom flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} MedChain Health System Inc. All clinical inquiries logged in compliance with HIPAA §164.312.
          </div>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/about" className="hover:text-white">About Governance</Link>
            <Link to="/symptoms" className="hover:text-white">AI Triage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
