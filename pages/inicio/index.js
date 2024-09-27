import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from "@/components/sidebar";
import withAuth from '../api/auth/withAuth';

const Inicio = () => {
    return (
        <div style={{ display: "flex", flexDirection: 'row' }}>
            <Sidebar />
        </div>
    );
};

export default withAuth(Inicio);
