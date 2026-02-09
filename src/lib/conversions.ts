/**
 * Canonical Color Conversions
 * consolidated to prevent logic drift across the application.
 */

import { converter, formatHex, Color } from 'culori';
import { RGB, HSL } from './types';

const toRgb = converter('rgb');
const toHsl = converter('hsl');

/**
 * Converts any color format to RGB (0-255)
 */
export function colorsToRgb(color: string | Color): RGB | null {
    const rgb = toRgb(color);
    if (!rgb) return null;
    return {
        r: Math.round(rgb.r * 255),
        g: Math.round(rgb.g * 255),
        b: Math.round(rgb.b * 255)
    };
}

/**
 * Converts RGB (0-255) to Hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return formatHex({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 }) || '#000000';
}

/**
 * Converts RGB (0-255) to HSL (0-360, 0-100, 0-100)
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
    const hsl = toHsl({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
    return {
        h: Math.round((hsl?.h ?? 0)),
        s: Math.round((hsl?.s ?? 0) * 100),
        l: Math.round((hsl?.l ?? 0) * 100)
    };
}

/**
 * Converts Hex string to RGB (0-255)
 */
export function hexToRgb(hex: string): RGB | null {
    return colorsToRgb(hex);
}

/**
 * Safe conversion from any color to HSL
 */
export function colorToHsl(color: string | Color): HSL {
    const hsl = toHsl(color);
    return {
        h: Math.round(hsl?.h ?? 0),
        s: Math.round((hsl?.s ?? 0) * 100),
        l: Math.round((hsl?.l ?? 0) * 100)
    };
}

/**
 * Converts RGB (0-255) to Lab
 */
export function rgbToLab(r: number, g: number, b: number): import('./types').Lab {
    const lab = converter('lab')({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
    return {
        l: (lab?.l ?? 0),
        a: (lab?.a ?? 0),
        b: (lab?.b ?? 0),
        alpha: lab?.alpha
    };
}

/**
 * Calculates relative luminance (0-1)
 * Using standard formula for relative luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;

    const R = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const G = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const B = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
