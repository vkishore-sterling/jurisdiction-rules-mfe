import React from 'react';
import './App.css';
import PageOne from './components/One/One';

const ROOT_CLASSNAME = 'flex flex-col h-full mx-6 my-2';

function DefaultPage() {
  return <h2>Default Page</h2>;
}

function App() {
  return (
    <div className={ROOT_CLASSNAME}>
      <PageOne />
    </div>
  );
}

export default App;