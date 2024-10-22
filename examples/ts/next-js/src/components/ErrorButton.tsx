// This button component is designed to throw an example error when clicked.
// It can be used to test the BugSnag integration in your application.

import React from 'react';

const ErrorButton: React.FC = () => {
    const handleClick = () => {
        throw new Error('This is a test error for BugSnag integration.');
    };

    return (
        <button onClick={handleClick}>
            Trigger Error
        </button>
    );
};

export default ErrorButton;