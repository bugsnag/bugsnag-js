import React from 'react';
import Link from 'next/link';
import Image from 'next/image';


const Header: React.FC = () => {
    return (
        <header>
            <nav className=" bg-neutral-100 ">
            <Link href="https://www.bugsnag.com" className="text-zinc-900 px-10">
                    <Image src="/images/bugsnag.png" alt="BugSnag Logo" width={200} height={60} className="px-5"/>
            
            </Link>
        
            </nav>
        </header>
    );
};

export default Header;