//API has a top-of-module Promise that rejects, but its result is not awaited.
import React from 'react';

const Scenario1Page: React.FC = () => {
    // Top-of-module Promise that rejects, but its result is not awaited.
    new Promise((_, reject) => reject(new Error('Promise rejected')));

    return (
        <div>
            <h3 className="text-slate-600">API has a top-of-module Promise that rejects, but its result is not awaited.</h3>
        </div>
    );
};

export default Scenario1Page;

