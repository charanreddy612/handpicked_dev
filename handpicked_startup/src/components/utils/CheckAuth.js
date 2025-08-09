export function requireAuth() {
  if (typeof window !== 'undefined') {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      window.location.href = '/login';
    }
  }
}