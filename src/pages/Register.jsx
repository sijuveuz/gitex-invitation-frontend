// Registration page: Form with email, password, confirm password.
// Validation: required, email format, password min 8, match.

import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Register = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const navigate = useNavigate();
  const password = watch('password'); // For match validation

  const onSubmit = async (data) => {
    try {
      // POST to DRF /api/register/ (assume endpoint creates user and returns token)
      const res = await axios.post('/api/accounts/register/', { email: data.email, password: data.password }); 
      localStorage.setItem('token', res.data.token);
      MySwal.fire('Registered!', 'Account created.', 'success');
      navigate('/');
    } catch (err) {
      MySwal.fire('Error', err.response?.data?.error || 'Registration failed', 'error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
              className="border p-2 w-full rounded"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
              className="border p-2 w-full rounded"
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirm password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                validate: (val) => val === password || 'Passwords do not match'
              })}
              className="border p-2 w-full rounded"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" className="bg-primary text-white p-2 w-full rounded">Register</button>
        </form>
        <p className="text-center mt-4 text-sm">
          Already have an account? <a href="/login" className="text-primary">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;