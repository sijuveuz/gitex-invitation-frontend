// Login page: Form with email, password.

import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL;
const Login = ({ setIsAuthenticated }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      console.log("DDDD", data); 
      const res = await axios.post(`${API_URL}/api/accounts/login/`, data);
      console.log("LLLL", res);
      localStorage.setItem('token', res.data.data.tokens.access); 
      setIsAuthenticated(true);
      MySwal.fire('Logged in!', 'Welcome back.', 'success');

      navigate('/invitation');
    } catch (err) {
      console.log("EEEE", err.response?.data);
      MySwal.fire('Error', err.response?.data?.error || 'Invalid credentials ', 'error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>
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
              {...register('password', { required: 'Password is required' })}
              className="border p-2 w-full rounded"
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>
          <button type="submit" className="bg-primary text-white p-2 w-full rounded">Login</button>
        </form>
        {/* <p className="text-center mt-4 text-sm">
          No account? <a href="/register" className="text-primary">Register</a>
        </p> */}
      </div>
    </div>
  );
};

export default Login;

