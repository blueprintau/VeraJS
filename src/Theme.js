class Theme {

    constructor(props) {

        (props.pallets ?? []).forEach((pallet) => {
            this._generateCSSPalette(pallet.color,pallet.name).forEach((color)=>{
                document.documentElement.style.setProperty("--"+color.name, color.color);
            });
        });

        if(props.font !== undefined){
            const style = document.createElement('style');
            style.textContent = `
                    * {
                        color: ${props.font.color};
                    }
                `;
            document.head.appendChild(style);
        }
    }

    _generateCSSPalette(baseColor, colorName = 'primary') {
        // Convert hex to HSL once
        const hsl = this._hexToHsl(baseColor);

        // Define lighter and darker variations
        const variations = {
            // Lighter variations (l-10, l-20, etc.)
            'l-10': Math.min(95, hsl.l + 10),
            'l-20': Math.min(95, hsl.l + 20),
            'l-30': Math.min(95, hsl.l + 30),
            'l-40': Math.min(95, hsl.l + 40),
            'l-50': Math.min(95, hsl.l + 50),
            'l-60': Math.min(95, hsl.l + 60),
            'l-70': Math.min(95, hsl.l + 70),
            'l-80': Math.min(95, hsl.l + 80),

            // Base color (no suffix)
            '': hsl.l,

            // Darker variations (d-10, d-20, etc.)
            'd-10': Math.max(5, hsl.l - 10),
            'd-20': Math.max(5, hsl.l - 20),
            'd-30': Math.max(5, hsl.l - 30),
            'd-40': Math.max(5, hsl.l - 40),
            'd-50': Math.max(5, hsl.l - 50),
            'd-60': Math.max(5, hsl.l - 50),
            'd-70': Math.max(5, hsl.l - 50),
            'd-80': Math.max(5, hsl.l - 50)
        };

        // Generate CSS variables using HSL directly
        const palette = [];

        Object.entries(variations).forEach(([suffix, lightness]) => {
            let color = {};
            color.name = suffix === '' ? colorName : `${colorName}-${suffix}`;
            color.color =`hsl(${hsl.h}, ${hsl.s}%, ${lightness}%)`;
            palette.push(color);
        });

        return palette;
    }

    _hexToHsl(hex) {
        // Clean and validate hex input
        hex = hex.replace('#', '');

        if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
            console.error('Invalid hex color:', hex);
            return { h: 0, s: 0, l: 50 }; // Return gray as fallback
        }

        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }
}
