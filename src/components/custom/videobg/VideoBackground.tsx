import React from 'react';
import video from '@/assets/background.mp4';

const VideoBackground = () => {
    return (
        <video
            autoPlay
            loop
            muted
            className="absolute inset-0 h-full w-full object-cover z-[-1]"
        >
            <source src={video} type="video/mp4" />
            Browser does not support video tag.
        </video>
    );
};

export default VideoBackground;
