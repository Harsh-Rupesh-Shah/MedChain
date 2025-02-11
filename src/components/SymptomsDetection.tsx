import React, { useState } from 'react';
import { Stethoscope, Search, AlertCircle, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Define types for our symptom analysis
interface AnalysisResult {
  possibleConditions: {
    condition: string;
    probability: number;
    description: string;
    specialists: string[];
  }[];
  recommendedSpecialist: string;
  urgencyLevel: 'low' | 'medium' | 'high';
}

// Medical knowledge base (in a real app, this would come from a medical API)
const medicalKnowledge = {
  headache: {
    conditions: [
      {
        condition: 'Tension Headache',
        probability: 0.7,
        description: 'Common headache characterized by mild to moderate pain',
        specialists: ['Neurologist', 'General Physician']
      },
      {
        condition: 'Migraine',
        probability: 0.5,
        description: 'Severe headache often accompanied by sensitivity to light and sound',
        specialists: ['Neurologist', 'Headache Specialist']
      }
    ],
    urgencyLevel: 'low'
  },
  fever: {
    conditions: [
      {
        condition: 'Viral Infection',
        probability: 0.8,
        description: 'Common viral infection with elevated body temperature',
        specialists: ['General Physician', 'Internal Medicine']
      },
      {
        condition: 'Bacterial Infection',
        probability: 0.4,
        description: 'Infection that may require antibiotics',
        specialists: ['Infectious Disease Specialist', 'General Physician']
      }
    ],
    urgencyLevel: 'medium'
  },
  chestPain: {
    conditions: [
      {
        condition: 'Angina',
        probability: 0.6,
        description: 'Chest pain due to reduced blood flow to the heart',
        specialists: ['Cardiologist', 'Internal Medicine']
      },
      {
        condition: 'Heart Attack',
        probability: 0.3,
        description: 'EMERGENCY: Severe chest pain with possible heart damage',
        specialists: ['Emergency Medicine', 'Cardiologist']
      }
    ],
    urgencyLevel: 'high'
  },
  // Add more symptoms and conditions as needed
};

const SymptomsDetection: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simple symptom matching logic (in a real app, use ML/AI)
      const symptomsLower = symptoms.toLowerCase();
      let matchedConditions: AnalysisResult['possibleConditions'] = [];
      let highestProbability = 0;
      let recommendedSpecialist = '';
      let urgencyLevel: 'low' | 'medium' | 'high' = 'low';

      Object.entries(medicalKnowledge).forEach(([symptom, data]) => {
        if (symptomsLower.includes(symptom)) {
          matchedConditions = [...matchedConditions, ...data.conditions];
          if (data.urgencyLevel === 'high') urgencyLevel = 'high';
          else if (data.urgencyLevel === 'medium' && urgencyLevel !== 'high') {
            urgencyLevel = 'medium';
          }

          // Find the specialist for the highest probability condition
          data.conditions.forEach(condition => {
            if (condition.probability > highestProbability) {
              highestProbability = condition.probability;
              recommendedSpecialist = condition.specialists[0];
            }
          });
        }
      });

      if (matchedConditions.length === 0) {
        toast.error('No matching conditions found. Please consult a healthcare professional.');
        return;
      }

      setAnalysis({
        possibleConditions: matchedConditions,
        recommendedSpecialist,
        urgencyLevel
      });

      toast.success('Symptoms analyzed successfully');
    } catch (error) {
      toast.error('Failed to analyze symptoms');
      console.error('Symptom analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Stethoscope className="h-8 w-8 text-indigo-500 mr-3" />
          <h2 className="text-2xl font-bold">Symptoms Detection</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe your symptoms
          </label>
          <div className="relative">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full h-32 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Example: I have a severe headache with sensitivity to light..."
            />
            <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
          </div>
        </div>

        <button
          onClick={analyzeSymptoms}
          disabled={isAnalyzing}
          className="btn-primary w-full mb-6"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing Symptoms...
            </span>
          ) : (
            'Analyze Symptoms'
          )}
        </button>

        {analysis && (
          <div className="space-y-6">
            {/* Urgency Level */}
            <div className={`p-4 rounded-lg ${
              analysis.urgencyLevel === 'high'
                ? 'bg-red-50 text-red-700'
                : analysis.urgencyLevel === 'medium'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-green-50 text-green-700'
            }`}>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  {analysis.urgencyLevel === 'high'
                    ? 'Urgent: Seek immediate medical attention'
                    : analysis.urgencyLevel === 'medium'
                    ? 'Moderate: Consult a doctor soon'
                    : 'Low: Monitor symptoms'
                  }
                </span>
              </div>
            </div>

            {/* Recommended Specialist */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-indigo-500 mr-2" />
                <h3 className="font-semibold">Recommended Specialist</h3>
              </div>
              <p className="text-indigo-700">{analysis.recommendedSpecialist}</p>
            </div>

            {/* Possible Conditions */}
            <div>
              <h3 className="font-semibold mb-3">Possible Conditions</h3>
              <div className="space-y-4">
                {analysis.possibleConditions.map((condition, index) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{condition.condition}</h4>
                      <span className="text-sm bg-slate-200 px-2 py-1 rounded">
                        {Math.round(condition.probability * 100)}% match
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{condition.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {condition.specialists.map((specialist, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white px-2 py-1 rounded border border-slate-200"
                        >
                          {specialist}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-slate-500 mt-4">
              <p className="font-medium">Important Note:</p>
              <p>This is an AI-powered preliminary analysis. Always consult with a qualified healthcare professional for accurate diagnosis and treatment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomsDetection;