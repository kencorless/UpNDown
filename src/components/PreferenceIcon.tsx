import React from 'react';
import { PreferenceLevel } from '../types/game.types';
import './PreferenceIcon.css';

interface PreferenceIconProps {
    level: PreferenceLevel;
    size?: 'small' | 'medium' | 'large';
}

export const PreferenceIcon: React.FC<PreferenceIconProps> = ({ level, size = 'medium' }) => {
    const getIcon = (level: PreferenceLevel): string => {
        switch (level) {
            case 'HIGH':
                return '⭐⭐⭐';
            case 'MEDIUM':
                return '⭐⭐';
            case 'LOW':
                return '⭐';
            default:
                return '○';
        }
    };

    const getColor = (level: PreferenceLevel): string => {
        switch (level) {
            case 'HIGH':
                return '#FF4136';
            case 'MEDIUM':
                return '#FF851B';
            case 'LOW':
                return '#2ECC40';
            default:
                return '#AAAAAA';
        }
    };

    return (
        <span
            className={`preference-icon ${size}`}
            style={{ color: getColor(level) }}
            title={`Preference Level: ${level}`}
        >
            {getIcon(level)}
        </span>
    );
};
