import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

console.log('main.tsx executing...')
try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('main.tsx rendered')
} catch (e) {
  console.error('main.tsx crashed:', e)
}
