import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';
import Navbar from './components/Navbar';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <Toaster position="top-right" />
          <Navbar />
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider } from './hooks/useAuth';
// import { Toaster } from 'react-hot-toast';
// import Navbar from './components/Navbar';
// import Home from './pages/Home';
// import About from './pages/About';
// import Shop from './pages/Shop';
// import Contact from './pages/Contact';
// import Login from './pages/auth/Login';
// import PatientRegister from './pages/auth/PatientRegister';
// import DoctorRegister from './pages/auth/DoctorRegister';
// import SymptomsDetection from './components/SymptomsDetection';
// import DoctorDashboard from './pages/dashboard/DoctorDashboard';
// import PatientDashboard from './pages/dashboard/PatientDashboard';
// import AdminDashboard from './pages/dashboard/AdminDashboard';
// import PrivateRoute from './components/PrivateRoute';
// import './styles/globals.css';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <div className="min-h-screen">
//           <Toaster position="top-right" />
//           <Navbar />
//           <Routes>
//             {/* Public Routes */}
//             <Route path="/" element={<Home />} />
//             <Route path="/about" element={<About />} />
//             <Route path="/shop" element={<Shop />} />
//             <Route path="/contact" element={<Contact />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/patient/register" element={<PatientRegister />} />
//             <Route path="/doctor/register" element={<DoctorRegister />} />
//             <Route path="/symptoms" element={<SymptomsDetection />} />

//             {/* Doctor Routes */}
//             <Route path="/doctor/*" element={
//               <PrivateRoute allowedRoles={['doctor']}>
//                 <DoctorDashboard />
//               </PrivateRoute>
//             } />

//             {/* Patient Routes */}
//             <Route path="/patient/*" element={
//               <PrivateRoute allowedRoles={['patient']}>
//                 <PatientDashboard />
//               </PrivateRoute>
//             } />

//             {/* Admin Routes */}
//             <Route path="/admin/*" element={
//               <PrivateRoute allowedRoles={['admin']}>
//                 <AdminDashboard />
//               </PrivateRoute>
//             } />

//             {/* Fallback Route */}
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </div>
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;