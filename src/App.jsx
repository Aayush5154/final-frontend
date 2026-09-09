import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/common/Header';

function App() {
  return (
    <div className="w-full h-full flex flex-col text-text-primary">
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}

export default App;