import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100  pt-6 lg:justify-center sm:pt-0">
            

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md max-w-7xl mx-auto sm:px-6 lg:px-8 sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
