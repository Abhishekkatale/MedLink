import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Will be created
import { UserRole } from '@shared/schema'; // Import UserRole for dropdown

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Values.patient); // Default role
  const [name, setName] = useState(''); // Add other fields as needed by your backend
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Basic frontend validation (more comprehensive validation on backend)
    if (!username || !password || !name || !role) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          role,
          name,
          // Include other fields required by your /api/auth/signup endpoint
          // e.g., title, organization, specialty, location, initials if they are mandatory
          // For now, assuming backend handles missing optional fields or they are not strictly needed for basic signup
          title: "",
          organization: "",
          specialty: "",
          location: "",
          initials: ""
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to signup');
      }
      signup(data.token, data.user); // data.user should be the user object from backend
      navigate('/dashboard'); // Or your desired redirect path
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          >
            {UserRole.options.map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>
        {/* Add other input fields here if your signup process requires them immediately,
            e.g., title, organization, specialty, location, initials.
            For simplicity, they are defaulted to empty strings in the fetch call for now. */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 15px' }}>Signup</button>
      </form>
    </div>
  );
};

export default SignupPage;
