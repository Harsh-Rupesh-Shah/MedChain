import React, { useState } from 'react';
import { Search, ShoppingCart, Star, Filter } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  description: string;
}

const Shop = () => {
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'all',
    'medical supplies',
    'wellness',
    'personal care',
    'equipment'
  ];

  const products: Product[] = [
    {
      id: 1,
      name: 'Digital Blood Pressure Monitor',
      category: 'medical supplies',
      price: 49.99,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=300',
      description: 'Accurate and easy-to-use blood pressure monitoring device.'
    },
    {
      id: 2,
      name: 'Premium First Aid Kit',
      category: 'medical supplies',
      price: 29.99,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=300',
      description: 'Comprehensive first aid kit for emergency situations.'
    },
    {
      id: 3,
      name: 'Wellness Vitamin Pack',
      category: 'wellness',
      price: 34.99,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=300',
      description: 'Monthly supply of essential vitamins and minerals.'
    },
    // Add more products as needed
  ];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shop Header */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Medical Shop</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
              <button className="relative p-2">
                <ShoppingCart className="h-6 w-6 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Categories */}
        <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-4">
          <Filter className="h-5 w-5 text-slate-400" />
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-slate-600 ml-1">{product.rating}</span>
                  </div>
                  <span className="font-bold">${product.price}</span>
                </div>
                <button
                  onClick={addToCart}
                  className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;