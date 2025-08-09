import { useState } from 'react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Astro doesn't use SPA navigation like useNavigate, so we use this
  const navigate = (path) => (window.location.href = path);

  function handleSubmit(e) {
    e.preventDefault();

    // Mock login logic
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('auth', JSON.stringify({ username }));
      document.cookie = `admin_user=${username}; path=/`;
      navigate('/dashboard');
    } else {
      alert('Invalid credentials. Try "admin" / "admin123".');
    }
  }

  return (
    <main>
      <section
        aria-labelledby="login-heading"
        style={{ display: 'flex', justifyContent: 'center', marginTop: '10vh' }}
      >
        <form
          onSubmit={handleSubmit}
          role="form"
          aria-label="Admin login form"
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: '2rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: '#fdfdfd'
          }}
        >
          <h1 id="login-heading" style={{ textAlign: 'center' }}>Admin Login</h1>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-required="true"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#0077cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            aria-label="Login button"
          >
            Login
          </button>
        </form>
      </section>
    </main>
  );
}