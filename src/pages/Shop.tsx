import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Star,
  Filter,
  Shield,
  Pill,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  category: 'prescription' | 'monitoring' | 'supplies' | 'wellness';
  price: number;
  rating: number;
  reviews: number;
  requiresPrescription: boolean;
  manufacturer: string;
  dosageForm: string;
  image: string;
  description: string;
  inStock: boolean;
}

const Shop: React.FC = () => {
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const products: Product[] = [
    {
      id: 1,
      name: 'Omron Platinum Upper Arm Blood Pressure Monitor',
      category: 'monitoring',
      price: 69.99,
      rating: 4.9,
      reviews: 512,
      requiresPrescription: false,
      manufacturer: 'Omron Healthcare Inc.',
      dosageForm: 'Medical Device (FDA Cleared)',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=350',
      description: 'Clinical-grade dual display blood pressure monitor with irregular heartbeat detection and Bluetooth synchronization.',
      inStock: true
    },
    {
      id: 2,
      name: 'Accu-Chek Guide Blood Glucose Monitoring Kit',
      category: 'monitoring',
      price: 39.50,
      rating: 4.8,
      reviews: 320,
      requiresPrescription: false,
      manufacturer: 'Roche Diabetes Care',
      dosageForm: 'Diagnostic Kit (Includes 50 strips)',
      image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=350',
      description: 'Accurate spill-resistant vial glucose monitoring system delivering readings in under 4 seconds with companion tracking.',
      inStock: true
    },
    {
      id: 3,
      name: 'Amoxicillin & Clavulanate 875mg / 125mg',
      category: 'prescription',
      price: 18.25,
      rating: 4.9,
      reviews: 142,
      requiresPrescription: true,
      manufacturer: 'Sandoz / Novartis Generics',
      dosageForm: '20 Film-Coated Oral Tablets',
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=350',
      description: 'Broad-spectrum beta-lactamase inhibitor antibiotic indicated for acute bacterial sinusitis and lower respiratory tract infections.',
      inStock: true
    },
    {
      id: 4,
      name: 'Atorvastatin Calcium 20mg (USP)',
      category: 'prescription',
      price: 14.00,
      rating: 4.9,
      reviews: 288,
      requiresPrescription: true,
      manufacturer: 'Pfizer / Greenstone',
      dosageForm: '30 Daily Tablets',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=350',
      description: 'HMG-CoA reductase inhibitor for dyslipidemia management and primary prevention of cardiovascular atherosclerotic disease.',
      inStock: true
    },
    {
      id: 5,
      name: 'Curad Hospital-Grade Sterile Trauma & Surgical Dressing Kit',
      category: 'supplies',
      price: 28.50,
      rating: 4.8,
      reviews: 94,
      requiresPrescription: false,
      manufacturer: 'Medline Industries Inc.',
      dosageForm: 'Pack of 15 Sterile Dressings',
      image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=350',
      description: 'Non-adherent border wound sponges and antimicrobial dressings for post-operative surgical wound recovery.',
      inStock: true
    },
    {
      id: 6,
      name: 'Pure Encapsulations Liposomal Vitamin D3 + K2',
      category: 'wellness',
      price: 32.80,
      rating: 4.9,
      reviews: 418,
      requiresPrescription: false,
      manufacturer: 'Pure Encapsulations',
      dosageForm: '60 Liquid Softgels',
      image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&q=80&w=350',
      description: 'Hypoallergenic bioavailable cholecalciferol (5,000 IU) and Menaquinone-7 for bone mineral density and cardiovascular arterial support.',
      inStock: true
    }
  ];

  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    if (product.requiresPrescription) {
      toast('Prescription required: This medication will be linked to your doctor consultation or verified Rx on file.', {
        icon: '📋'
      });
    }
    setCartCount((c) => c + 1);
    toast.success(`Added ${product.name} to cart.`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Top Clinical Compliance Bar */}
      <div className="bg-[#0B192C] text-slate-300 text-xs py-2 px-4 border-b border-slate-700">
        <div className="container-custom flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              NABP / VIPPS ACCREDITED
            </span>
            <span>All medications dispensed by verified US state-licensed pharmacies. Cold-chain storage guaranteed.</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Truck className="h-3.5 w-3.5 text-emerald-400" /> Fast 24-48hr Temperature-Controlled Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Pharmacy Header & Search */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-1">
                Integrated Clinical Dispensary
              </div>
              <h1 className="text-3xl font-bold text-[#0B192C]">MedChain Clinical Pharmacy</h1>
              <p className="text-xs text-slate-500 mt-1">
                Prescription medications, diagnostic monitoring devices, and sterile hospital supplies.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search medications, devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <button
                type="button"
                className="relative p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                onClick={() => toast(`Your cart contains ${cartCount} items.`)}
              >
                <ShoppingCart className="h-5 w-5 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0D9488] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1 mr-2 flex-shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filter by:
            </span>
            {[
              { id: 'all', label: 'All Products' },
              { id: 'prescription', label: 'Prescription Therapeutics (Rx)' },
              { id: 'monitoring', label: 'Diagnostics & Monitoring Devices' },
              { id: 'supplies', label: 'Sterile Wound & Surgical Supplies' },
              { id: 'wellness', label: 'Clinical Nutrition & Vitamins' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-[#0B192C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Catalog */}
      <section className="container-custom py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-44 overflow-hidden relative bg-slate-50">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  {prod.requiresPrescription ? (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Rx Required
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                      OTC / Direct
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {prod.manufacturer}
                  </div>
                  <h3 className="font-bold text-sm text-[#0B192C] mb-1.5 line-clamp-1">{prod.name}</h3>
                  <div className="text-xs text-[#0D9488] font-medium mb-2">{prod.dosageForm}</div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-2">
                    {prod.description}
                  </p>

                  <div className="flex items-center gap-1 text-amber-500 text-xs mb-3">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="font-semibold">{prod.rating}</span>
                    <span className="text-slate-400 font-normal">({prod.reviews} clinical reviews)</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">Unit Price</span>
                    <span className="text-lg font-bold text-[#0B192C] font-mono">
                      ${prod.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(prod)}
                    className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical Footer */}
      <footer className="bg-[#0B192C] text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="container-custom flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} MedChain Health System Inc. Licensed Digital Pharmacy #NABP-849201.
          </div>
          <div className="flex gap-4 text-slate-300">
            <span>Prescription Drug Monitoring Program (PDMP) Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Shop;
