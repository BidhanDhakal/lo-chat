import React from 'react'
import DesktopNav from './nav/DesktopNav';
import MobileNav from './nav/MobileNav';

interface SidebarWrapperProps {
    children: React.ReactNode;
}

const SidebarWrapper = ({ children }: SidebarWrapperProps) => {
    return (
        <div className="min-h-screen h-full w-full p-4 lg:p-0 flex flex-col lg:flex-row gap-4 lg:gap-0">
            <MobileNav />
            <DesktopNav />
            <main className="h-full w-full flex gap-4 lg:gap-0">
                {children}
            </main>
        </div>
    );
};

export default SidebarWrapper;