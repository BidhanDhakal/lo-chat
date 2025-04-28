import React from 'react'
import DesktopNav from './nav/DesktopNav';
import MobileNav from './nav/MobileNav';

// Using a more specific type definition
interface SidebarWrapperProps {
    children: React.ReactNode;
}

const SidebarWrapper = ({ children }: SidebarWrapperProps) => {
    return (
        <div className="min-h-screen h-full w-full p-4 flex flex-col lg:flex-row gap-4">
            <MobileNav />
            <DesktopNav />
            <main className="h-full w-full flex gap-4">
                {children}
            </main>
        </div>
    );
};

export default SidebarWrapper;