import React from 'react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard de Criminalidade</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/unit/AISP 10"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">AISP 10</h3>
          <p className="text-gray-600">Barra do Piraí, Rio das Flores, Valença</p>
        </Link>

        <Link
          to="/unit/AISP 28"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">AISP 28</h3>
          <p className="text-gray-600">Volta Redonda, Pinheiral, Barra Mansa</p>
        </Link>

        <Link
          to="/unit/AISP 33"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">AISP 33</h3>
          <p className="text-gray-600">Angra dos Reis, Mangaratiba</p>
        </Link>

        <Link
          to="/unit/AISP 37"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">AISP 37</h3>
          <p className="text-gray-600">Resende, Itatiaia, Porto Real, Quatis</p>
        </Link>

        <Link
          to="/unit/AISP 43"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">AISP 43</h3>
          <p className="text-gray-600">Paraty</p>
        </Link>
      </div>
    </div>
  );
};
