import React from 'react';
import Link from 'next/link';
//import "./globals.css";

const Footer: React.FC = () => {
    return (
        <footer style={footerStyle}>
               
                    

                    <ul style={navListStyle}>
                        <li style={navItemStyle}><Link href="https://www.bugsnag.com">BugSnag</Link></li>
                        <li style={navItemStyle}><Link href="https://docs.bugsnag.com">Docs</Link></li>
                        <li style={navItemStyle}><Link href="https://github.com/bugsnag">GitHub</Link></li>
                    </ul>
        
        </footer>
    );
};

const footerStyle: React.CSSProperties = {
    backgroundColor: '#333',
    color: '#fff',
    padding: '1rem 0',
    textAlign: 'center',
};

const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
};

const navListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
};

const navItemStyle: React.CSSProperties = {
    margin: 0,
};

export default Footer;