// pages/api/authenticate.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (!response.ok) {
        res.status(response.status).json(data);
        return;
      }

      res.status(response.status).json(data);
    } catch (error) {
      console.error('Error en el servidor:', error);
      res.status(500).json({ message: 'Error en el servidor.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} No Permitido`);
  }
}
