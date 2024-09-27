import { Button } from "@mui/material";
import { useState } from 'react';
import LoginStyles from '../../src/styles/login';
import '../../src/app/globals.css';
import InputLog from "@/components/inputLog";
import InputLogPass from "@/components/inputLogPass";
import InacarLogo from '../../public/logo-INACAR.png';
import Image from 'next/image';
import { useRouter } from 'next/router';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('first_name', data.first_name);
          localStorage.setItem('last_name', data.last_name);
          localStorage.setItem('token', data.token);
        }

        if (data.userType === 'admin') {
          router.push('/inicio');
        } else if (data.userType === 'user') {
          router.push('/control');
        } else {
          setError('Tipo de usuario desconocido.');
        }
      } else {
        setError(data.message || 'Error desconocido.');
      }
    } catch (error) {
      setError('¡Hubo un error! Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Previene el comportamiento por defecto del enter en formularios
      handleLogin();
    }
  };

  return (
    <>
      <div className="background">
      </div>
      <div className="login-container">
        <Image src={InacarLogo} height={80} width={160} alt="Inacar Logo" priority />
        <InputLog
          name="username"
          value={formData.username}
          onChange={handleChange}
          onKeyDown={handleKeyDown} 
          children={'Username'}
        />
        <InputLogPass
          name="password"
          value={formData.password}
          onChange={handleChange}
          onKeyDown={handleKeyDown} 
          children={'Password'}
        />
        <Button
          onClick={handleLogin}
          variant="contained"
          disabled={loading}
          sx={LoginStyles.buttom}
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesion'}
        </Button>
        {error && <p className="error-message">{error}</p>}
      </div>
    </>
  );
};

export default Login;
