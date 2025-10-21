import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL;

const Register = ({ setIsAuthenticated }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
    watch,
  } = useForm({
    mode: 'onChange', // ✅ live validation
  });

  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
      };

      const res = await axios.post(`${API_URL}/api/accounts/register/`, payload);
      localStorage.setItem('token', res.data.data.tokens.access);
  setIsAuthenticated(true);

  MySwal.fire('Registered!', 'Account created successfully.', 'success');
  
  // Redirect to dashboard (invitation)
  navigate('/invitation');
    } catch (err) {
      console.log(err.response?.data);

      if (err.response?.data?.errors) {
        // Handle field-specific backend validation
        const fieldErrors = err.response.data.errors;
        Object.keys(fieldErrors).forEach((field) => {
          setError(field, {
            type: 'server',
            message: fieldErrors[field][0],
          });
        });
      } else {
        MySwal.fire('Error', 'Registration failed. Try again.', 'error');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">Register</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* First Name */}
          <div className="mb-4">
            <label className="block text-sm mb-1">First Name</label>
            <input
              type="text"
              {...register('first_name', {
                required: 'First name is required',
                minLength: { value: 2, message: 'At least 2 characters' },
                pattern: {
                  value: /^[A-Za-z]+$/,
                  message: 'Only letters allowed',
                },
              })}
              className={`border p-2 w-full rounded ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Last Name</label>
            <input
              type="text"
              {...register('last_name', {
                required: 'Last name is required',
                minLength: { value: 1, message: 'At least 1 characters' },
                pattern: {
                  value: /^[A-Za-z]+$/,
                  message: 'Only letters allowed',
                },
              })}
              className={`border p-2 w-full rounded ${
                errors.last_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.last_name && (
              <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' },
              })}
              className={`border p-2 w-full rounded ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
              className={`border p-2 w-full rounded ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirm password is required',
                validate: (val) => val === password || 'Passwords do not match',
              })}
              className={`border p-2 w-full rounded ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className={`p-2 w-full rounded text-white ${
              isValid ? 'bg-primary hover:bg-primary/90' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Register
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;



// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Swal from 'sweetalert2';
// import withReactContent from 'sweetalert2-react-content';

// const MySwal = withReactContent(Swal);
// const API_URL = process.env.REACT_APP_API_URL;

// const Register = () => {
//   const {
//     register,
//     handleSubmit,
//     setError,
//     formState: { errors },
//     watch,
//   } = useForm({
//     mode: 'onChange', // ✅ validate on every change
//   });

//   const navigate = useNavigate();
//   const password = watch('password'); // For matching validation

//   const onSubmit = async (data) => {
//     try {
//       const res = await axios.post(`${API_URL}/api/accounts/register/`, {
//         email: data.email,
//         password: data.password,
//       });
//       localStorage.setItem('token', res.data.token);
//       MySwal.fire('Registered!', 'Account created.', 'success');
//       navigate('/');
//     } catch (err) {
//       console.log(err.response?.data);

//       // ✅ Handle specific API field errors
//       if (err.response?.data?.errors) {
//         const fieldErrors = err.response.data.errors;
//         Object.keys(fieldErrors).forEach((field) => {
//           setError(field, {
//             type: 'server',
//             message: fieldErrors[field][0],
//           });
//         });
//       } else {
//         // fallback error (non-field or unknown)
//         MySwal.fire('Error', 'Registration failed', 'error');
//       }
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-8 rounded shadow-md w-96">
//         <h2 className="text-2xl font-semibold mb-6 text-center">Register</h2>

//         <form onSubmit={handleSubmit(onSubmit)}>
//           {/* Email */}
//           <div className="mb-4">
//             <label className="block text-sm mb-1">Email</label>
//             <input
//               type="email"
//               {...register('email', {
//                 required: 'Email is required',
//                 pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' },
//               })}
//               className={`border p-2 w-full rounded ${
//                 errors.email ? 'border-red-500' : 'border-gray-300'
//               }`}
//             />
//             {errors.email && (
//               <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
//             )}
//           </div>

//           {/* Password */}
//           <div className="mb-4">
//             <label className="block text-sm mb-1">Password</label>
//             <input
//               type="password"
//               {...register('password', {
//                 required: 'Password is required',
//                 minLength: { value: 8, message: 'At least 8 characters' },
//               })}
//               className={`border p-2 w-full rounded ${
//                 errors.password ? 'border-red-500' : 'border-gray-300'
//               }`}
//             />
//             {errors.password && (
//               <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
//             )}
//           </div>

//           {/* Confirm Password */}
//           <div className="mb-4">
//             <label className="block text-sm mb-1">Confirm Password</label>
//             <input
//               type="password"
//               {...register('confirmPassword', {
//                 required: 'Confirm password is required',
//                 minLength: { value: 8, message: 'At least 8 characters' },
//                 validate: (val) => val === password || 'Passwords do not match',
//               })}
//               className={`border p-2 w-full rounded ${
//                 errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
//               }`}
//             />
//             {errors.confirmPassword && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.confirmPassword.message}
//               </p>
//             )}
//           </div>

//           <button
//             type="submit"
//             className="bg-primary text-white p-2 w-full rounded hover:bg-primary/90"
//           >
//             Register
//           </button>
//         </form>

//         <p className="text-center mt-4 text-sm">
//           Already have an account?{' '}
//           <a href="/login" className="text-primary">
//             Login
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;








// // // Registration page: Form with email, password, confirm password.
// // // Validation: required, email format, password min 8, match.

// // import React from 'react';
// // import { useForm } from 'react-hook-form';
// // import { useNavigate } from 'react-router-dom';
// // import axios from 'axios';
// // import Swal from 'sweetalert2';
// // import withReactContent from 'sweetalert2-react-content';

// // const MySwal = withReactContent(Swal);

// // const API_URL = process.env.REACT_APP_API_URL;
// // const Register = () => {
// //   const { register, handleSubmit, formState: { errors }, watch } = useForm();
// //   const navigate = useNavigate();
// //   const password = watch('password'); // For match validation

// //   const onSubmit = async (data) => {
// //     try {
// //       // POST to DRF /api/register/ (assume endpoint creates user and returns token)
// //       const res = await axios.post(`${API_URL}/api/accounts/register/`, { email: data.email, password: data.password }); 
// //       localStorage.setItem('token', res.data.token)
// //       console.log(res.data)
// //       MySwal.fire('Registered!', 'Account created.', 'success');
// //       navigate('/');
// //     } catch (err) {
// //       console.log(err.response)
// //       MySwal.fire('Error', err.response?.data?.error || 'Registration failed', 'error');
// //     }
// //   };

// //   return (
// //     <div className="flex items-center justify-center min-h-screen bg-gray-100">
// //       <div className="bg-white p-8 rounded shadow-md w-96">
// //         <h2 className="text-2xl font-semibold mb-6 text-center">Register</h2>
// //         <form onSubmit={handleSubmit(onSubmit)}>
// //           <div className="mb-4">
// //             <label className="block text-sm mb-1">Email</label>
// //             <input
// //               type="email"
// //               {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
// //               className="border p-2 w-full rounded"
// //             />
// //             {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
// //           </div>
// //           <div className="mb-4">
// //             <label className="block text-sm mb-1">Password</label>
// //             <input
// //               type="password"
// //               {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
// //               className="border p-2 w-full rounded"
// //             />
// //             {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
// //           </div>
// //           <div className="mb-4">
// //             <label className="block text-sm mb-1">Confirm Password</label>
// //             <input
// //               type="password"
// //               {...register('confirmPassword', {
// //                 required: 'Confirm password is required',
// //                 minLength: { value: 8, message: 'At least 8 characters' },
// //                 validate: (val) => val === password || 'Passwords do not match'
// //               })}
// //               className="border p-2 w-full rounded"
// //             />
// //             {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
// //           </div>
// //           <button type="submit" className="bg-primary text-white p-2 w-full rounded">Register</button>
// //         </form>
// //         <p className="text-center mt-4 text-sm">
// //           Already have an account? <a href="/login" className="text-primary">Login</a>
// //         </p>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Register;