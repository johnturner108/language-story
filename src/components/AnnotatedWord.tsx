'use client';

import React, { useState } from 'react';

interface AnnotatedWordProps {
    word: string;
    annotation: string;
}

const AnnotatedWord: React.FC<AnnotatedWordProps> = ({ word, annotation }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <span
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span className="text-blue-600 hover:underline">
                {word}
            </span>
            {showTooltip && (
                <div
                    className="absolute z-10 w-max max-w-xs p-2 bg-gray-900 text-white text-sm rounded-md shadow-lg -top-2 left-1/2 -translate-x-1/2 -translate-y-full"
                    style={{ whiteSpace: 'normal' }}
                >
                    {annotation}
                </div>
            )}
        </span>
    );
};

export default AnnotatedWord;
