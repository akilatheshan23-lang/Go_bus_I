import React from 'react';
import AdminNavbar from '../components/AdminNavbar';
import Footer from '../components/Footer';

export default function AdminLayout({ children }){
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNavbar />
      <main className="flex-1 p-6">{children}</main>
      <Footer />
    </div>
  );
}
