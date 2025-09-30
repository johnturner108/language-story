'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AnnotatedWordProps {
    word: string;
    annotation: string;
}

const AnnotatedWord: React.FC<AnnotatedWordProps> = ({ word, annotation }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);

    const handleClick = () => {
        setShowTooltip(prev => !prev);
    };

    // Click outside to close tooltip
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowTooltip(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <span className="relative inline-block" ref={wrapperRef}>
            <span
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={handleClick}
            >
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
