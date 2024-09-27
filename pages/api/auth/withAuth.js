import { useEffect } from 'react';
import { useRouter } from 'next/router';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem('token');

      // Si no hay token, redirigir al login
      if (!token) {
        router.replace('/login');
      }
    }, []);

    // Mientras no hay redirección, renderizar la página
    return <WrappedComponent {...props} />;
  };
};

export default withAuth;