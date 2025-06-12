"use client";

import { useState } from "react";

interface SearchBoxProps {
  onSearch: (searchTerm: string) => void;
  currentSearch?: string;
}

const SearchBox = ({ onSearch, currentSearch = "" }: SearchBoxProps) => {
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className="bg-white shadow-1 rounded-lg py-4 px-5">
      <div className="mb-3">
        <p className="text-dark font-medium">Buscar Productos</p>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar pinturas, herramientas..."
            className="w-full px-4 py-2.5 pr-20 border border-gray-3 rounded-lg focus:outline-none focus:border-blue transition-colors text-custom-sm"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-4 hover:text-red transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            
            <button
              type="submit"
              className="p-1 text-gray-4 hover:text-blue transition-colors"
              aria-label="Buscar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 14L11.1 11.1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {currentSearch && (
        <div className="mt-3 text-custom-xs text-gray-4">
          Buscando: <span className="text-dark font-medium">&quot;{currentSearch}&quot;</span>
          <button
            onClick={handleClear}
            className="ml-2 text-blue hover:text-blue-dark transition-colors"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBox;
