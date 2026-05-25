import React, { useEffect, useState } from 'react'

export default function App() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((j) => setStatus(j.status))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={{fontFamily:'Arial, sans-serif', padding:20}}>
      <h1>FastAPI + React</h1>
      <p>API status: <strong>{status}</strong></p>
    </div>
  )
}
