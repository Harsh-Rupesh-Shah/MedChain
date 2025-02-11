import React, { useState } from 'react';
import { Pill, Truck, RefreshCw, AlertTriangle } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  refillsLeft: number;
  lastRefill: string;
  nextRefill: string;
  status: 'active' | 'completed' | 'pending';
}

const PharmacyServices = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  
  const requestRefill = (id: string) => {
    // Handle refill request
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pharmacy Services</h2>
        <button className="btn-primary flex items-center">
          <Pill className="h-5 w-5 mr-2" />
          New Prescription
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">Active Medications</h3>
          <div className="space-y-4">
            {medications.map((med) => (
              <div key={med.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{med.name}</h4>
                    <p className="text-sm text-slate-600">
                      {med.dosage} • {med.frequency}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    med.status === 'active' ? 'bg-green-100 text-green-700' :
                    med.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {med.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Refills left: {med.refillsLeft}
                  </div>
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => requestRefill(med.id)}
                    disabled={med.refillsLeft === 0}
                  >
                    Request Refill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Delivery Tracking</h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Truck className="h-5 w-5 text-indigo-500 mr-2" />
              <span className="font-medium">Active Deliveries</span>
            </div>
            {/* Delivery tracking content */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyServices;