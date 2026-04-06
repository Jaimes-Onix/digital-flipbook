import React from 'react';
import './Loader.css';

interface FullScreenLoaderProps {
    dark?: boolean;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ dark = true }) => {
    return (
        <div className={dark ? 'theme-dark' : 'theme-light'}>
            <div className="loader">
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
                <div className="text"><span>Loading</span></div>
            </div>
        </div>
    );
};

export default FullScreenLoader;
