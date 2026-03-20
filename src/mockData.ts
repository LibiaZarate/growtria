export const MOCK_DOCTOR = {
    name: 'Dra. Ana López',
    title: 'Pediatra · Neonatóloga',
    cedula: 'Cédula Prof: 8976543 | Esp: 1234567',
    certifications: ['Certificada por el Consejo Mexicano de Pediatría', 'Subespecialidad en Neonatología INP'],
    specialty: 'Pediatría',
    location: 'Hospital Ángeles, CDMX',
    bio: 'Especialista en cuidado neonatal y desarrollo temprano. Mi misión es empoderar a los padres con información médica actualizada y fácil de entender. Egresada del Hospital Infantil de México Federico Gómez.',
    rating: 4.9,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop', // Dra image
    whatsapp: '+525555555555',
    animalito: {
        type: 'jirafa',
        name: 'Jiro',
        emoji: '🦒',
        color: 'bg-amber-100',
        textColor: 'text-amber-800'
    },
    videos: [
        { id: 1, title: '¿Qué hacer en caso de fiebre? Primeros pasos', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', tag: 'Emergencias Comunes' },
        { id: 2, title: 'Alimentación complementaria', duration: '5:20', thumbnail: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80', tag: 'Nutrición' },
        { id: 3, title: 'Señales de alarma en recién nacidos', duration: '4:15', thumbnail: 'https://images.unsplash.com/photo-1555243896-771a814a0cb7?w=800&q=80', tag: 'Desarrollo' }
    ],
    products: [
        { id: 1, title: 'Guía de Inicio a la Alimentación Complementaria', type: 'Guía PDF', tag: '0-2 años', price: 0, image: 'https://images.unsplash.com/photo-1555243896-771a814a0cb7?w=800&q=80', description: 'Descubre los cortes seguros, alimentos prohibidos y cómo iniciar a tu bebé en los sólidos paso a paso.', downloads: 145 },
        { id: 2, title: 'Checklist: Botiquín Básico en Casa', type: 'Checklist', tag: 'Emergencias', price: 0, image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&q=80', description: 'Asegúrate de tener todo lo necesario para emergencias menores.', downloads: 89 }
    ]
};
