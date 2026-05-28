export function validateRegister(body) {
  const { full_name, email, phone_e164, password, role_key } = body || {};
  if (!password || password.length < 6) return 'Password must be at least 6 chars';
  if (!email && !phone_e164) return 'Provide email or phone';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email';
  if (role_key && !['admin','driver','customer','support'].includes(role_key)) return 'Invalid role_key';
  return null;
}

export function validateLogin(body) {
  const { email, password } = body || {};
  if (!email || !password) return 'Email and password are required';
  return null;
}
