import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Filter,
  Plus,
  Minus,
  Pill,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Package,
  X,
  CreditCard,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  requiresPrescription: boolean;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface PharmacyOrder {
  _id: string;
  items: CartItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  estimatedDelivery: string;
}

const PharmacySystem: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [hasVerifiedRx, setHasVerifiedRx] = useState(true);

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'prescription', label: 'Prescription Therapeutics' },
    { id: 'otc', label: 'Over-the-Counter' },
    { id: 'equipment', label: 'Medical Equipment & Devices' },
    { id: 'wellness', label: 'Clinical Wellness & Vitamins' }
  ];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`/pharmacy/products?${params.toString()}`);
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.warn('Products endpoint fallback:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/pharmacy/orders');
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      }
    } catch (e) {
      console.warn('Orders load notice:', e);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    toast.success(`Added ${product.name} to cart.`);
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart((prevCart) => {
      const newCart = prevCart.map((item) => {
        if (item._id === productId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      });
      return newCart.filter(Boolean) as CartItem[];
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const hasPrescriptionItems = cart.some((item) => item.requiresPrescription);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setPlacingOrder(true);
      const res = await api.post('/pharmacy/orders', {
        items: cart,
        totalAmount: getTotalPrice(),
        shippingAddress: 'Primary Patient Address on File'
      });

      toast.success('Order dispatched successfully! Temperature-controlled shipping assigned.');
      setCart([]);
      setShowCart(false);
      setActiveTab('orders');
      loadOrders();
    } catch (error) {
      toast.error('Failed to submit order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-6xl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Digital Dispensary</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> State Licensed &amp; NABP Verified
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#0B192C]">Clinical Pharmacy &amp; Therapeutics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescription medications, diagnostic monitors, and medical supplies with cold-chain fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="p-1 rounded-lg bg-slate-100 flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'catalog' ? 'bg-white text-[#0B192C] shadow-xs' : 'text-slate-600'
              }`}
            >
              Medication Catalog
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'orders' ? 'bg-white text-[#0B192C] shadow-xs' : 'text-slate-600'
              }`}
            >
              Order History
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCart(true)}
            className="relative px-3.5 py-2 rounded-lg bg-[#0B192C] text-white hover:bg-[#1E3A8A] transition-colors flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="pt-6 space-y-6">
          {/* Search & Category Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search medications by brand name, generic formulation, or medical condition..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
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

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0D9488] border-t-transparent"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
              <Pill className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-semibold text-sm text-slate-800">No medications matching your query</h3>
              <p className="text-xs text-slate-400 mt-1 mb-3">Try adjusting your category filter or search keywords.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const inCartItem = cart.find((i) => i._id === product._id);

                return (
                  <div
                    key={product._id}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between bg-white"
                  >
                    <div>
                      {/* Product Thumbnail */}
                      <div className="h-40 relative bg-slate-50 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                          {product.requiresPrescription ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white flex items-center gap-1 shadow-xs">
                              <AlertCircle className="h-3 w-3" /> Rx Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white shadow-xs">
                              OTC / Direct
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Content */}
                      <div className="p-4">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
                          {product.manufacturer || 'Certified Pharma'}
                        </div>
                        <h4 className="font-bold text-sm text-[#0B192C] line-clamp-1">{product.name}</h4>
                        <div className="text-xs text-[#0D9488] font-medium mt-0.5 mb-2">
                          {product.dosageForm} &bull; {product.strength} &bull; {product.packSize}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Patient Price</span>
                          <span className="text-base font-bold text-[#0B192C] font-mono">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>

                        {inCartItem ? (
                          <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product._id, -1)}
                              className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 px-1 font-mono">
                              {inCartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product._id, 1)}
                              className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="px-3.5 py-1.5 bg-[#0B192C] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Orders History View */
        <div className="pt-6 space-y-4">
          <h3 className="font-bold text-sm text-[#0B192C]">Your Medication Dispatch History</h3>

          {orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No previous orders found</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                Items ordered through the clinical dispensary will show fulfillment status and tracking here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 bg-[#0B192C] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3A8A] transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">Order #{ord._id.slice(-6).toUpperCase()}</span>
                      <span className="text-slate-400 ml-2">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {ord.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>
                          {item.quantity}x {item.name} ({item.dosageForm})
                        </span>
                        <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <Truck className="h-3.5 w-3.5" /> Est. Delivery: {ord.estimatedDelivery}
                    </span>
                    <span className="font-bold text-[#0B192C] font-mono text-sm">
                      Total: ${ord.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl text-xs">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#0D9488]" />
                  <h3 className="font-bold text-base text-[#0B192C]">Prescription &amp; Cart Review</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-semibold">Your dispensary cart is empty</p>
                  <p className="text-slate-400 text-[11px] mt-1">Select items from the catalog to proceed.</p>
                </div>
              ) : (
                <div className="py-4 space-y-3 max-h-[55vh] overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                          <div className="text-[11px] text-slate-500">
                            ${item.price.toFixed(2)} each &bull; {item.dosageForm}
                          </div>
                          {item.requiresPrescription && (
                            <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                              <AlertCircle className="h-3 w-3" /> Rx Required
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, -1)}
                          className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold border border-slate-200 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-bold text-slate-900 font-mono">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, 1)}
                          className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold border border-slate-200 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Prescription verification alert */}
                  {hasPrescriptionItems && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Prescription Verification Attached
                      </div>
                      <p>
                        Prescription medications in your order will be verified against your active doctor consultations and medical records vault before dispatch.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-800">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Temperature-Controlled Cold-Chain Shipping</span>
                    <span className="font-mono text-emerald-600 font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#0B192C] pt-2 border-t border-slate-100">
                    <span>Total Amount</span>
                    <span className="font-mono">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={placingOrder}
                  onClick={handleCheckout}
                  className="w-full py-3 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  {placingOrder ? 'Processing Clinical Order...' : 'Confirm & Place Dispensary Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacySystem;
