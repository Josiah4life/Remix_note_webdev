import { type Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme.js'
import animatePlugin from 'tailwindcss-animate'

export default {
	content: ['./app/**/*.{ts,tsx,jsx,js}'],
	darkMode: ['class', 'class'],
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		fontFamily: {
    			sans: [
    				'var(--font-sans)',
                    ...defaultTheme.fontFamily.sans
                ]
    		},
    		fontSize: {
    			mega: [
    				'5rem',
    				{
    					lineHeight: '5.25rem',
    					fontWeight: '700'
    				}
    			],
    			h1: [
    				'3.5rem',
    				{
    					lineHeight: '3.875rem',
    					fontWeight: '700'
    				}
    			],
    			h2: [
    				'2.5rem',
    				{
    					lineHeight: '3rem',
    					fontWeight: '700'
    				}
    			],
    			h3: [
    				'2rem',
    				{
    					lineHeight: '2.25rem',
    					fontWeight: '700'
    				}
    			],
    			h4: [
    				'1.75rem',
    				{
    					lineHeight: '2.25rem',
    					fontWeight: '700'
    				}
    			],
    			h5: [
    				'1.5rem',
    				{
    					lineHeight: '2rem',
    					fontWeight: '700'
    				}
    			],
    			h6: [
    				'1rem',
    				{
    					lineHeight: '1.25rem',
    					fontWeight: '700'
    				}
    			],
    			'body-2xl': [
    				'2rem',
    				{
    					lineHeight: '2.25rem'
    				}
    			],
    			'body-xl': [
    				'1.75rem',
    				{
    					lineHeight: '2.25rem'
    				}
    			],
    			'body-lg': [
    				'1.5rem',
    				{
    					lineHeight: '2rem'
    				}
    			],
    			'body-md': [
    				'1.25rem',
    				{
    					lineHeight: '1.75rem'
    				}
    			],
    			'body-sm': [
    				'1rem',
    				{
    					lineHeight: '1.25rem'
    				}
    			],
    			'body-xs': [
    				'0.875rem',
    				{
    					lineHeight: '1.125rem'
    				}
    			],
    			'body-2xs': [
    				'0.75rem',
    				{
    					lineHeight: '1rem'
    				}
    			],
    			caption: [
    				'1.125rem',
    				{
    					lineHeight: '1.5rem',
    					fontWeight: '600'
    				}
    			],
    			button: [
    				'0.75rem',
    				{
    					lineHeight: '1rem',
    					fontWeight: '700'
    				}
    			]
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
	plugins: [animatePlugin, require("tailwindcss-animate")],
} satisfies Config
