import React from 'react';

export const CustomLogo = ({ className }: { className?: string }) => (
    <img src="/logo.png" className={`${className || ''} rounded-full object-cover mix-blend-multiply`} alt="Growvia Logo" />
);
