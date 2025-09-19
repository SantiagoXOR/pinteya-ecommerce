import type { Config } from "tailwindcss";

const defaultTheme = require("tailwindcss/defaultTheme");

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "class"],
  theme: {
  	fontFamily: {
  		'euclid-circular-a': [
  			'Euclid Circular A'
  		]
  	},
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			sm: '2rem',
  			xl: '0'
  		}
  	},
  	screens: {
  		xsm: '375px',
  		lsm: '425px',
  		'3xl': '2000px',
            ...defaultTheme.screens
  	},
  	extend: {
  		fontSize: {
  			'2xs': [
  				'10px',
  				'17px'
  			],
  			'heading-1': [
  				'60px',
  				'72px'
  			],
  			'heading-2': [
  				'48px',
  				'64px'
  			],
  			'heading-3': [
  				'40px',
  				'48px'
  			],
  			'heading-4': [
  				'30px',
  				'38px'
  			],
  			'heading-5': [
  				'28px',
  				'40px'
  			],
  			'heading-6': [
  				'24px',
  				'30px'
  			],
  			'custom-xl': [
  				'20px',
  				'24px'
  			],
  			'custom-lg': [
  				'18px',
  				'24px'
  			],
  			'custom-sm': [
  				'14px',
  				'22px'
  			],
  			'custom-xs': [
  				'12px',
  				'20px'
  			],
  			'custom-2xl': [
  				'24px',
  				'34px'
  			],
  			'custom-4xl': [
  				'36px',
  				'48px'
  			],
  			'custom-1': [
  				'22px',
  				'30px'
  			],
  			'custom-2': [
  				'32px',
  				'38px'
  			],
  			'custom-3': [
  				'35px',
  				'45px'
  			]
  		},
  		colors: {
  			'blaze-orange': {
  				'50': '#fef7ee',
  				'100': '#feeed6',
  				'200': '#fcd9ac',
  				'300': '#f9be78',
  				'400': '#f59842',
  				'500': '#f27a1d',
  				'600': '#eb6313',
  				'700': '#bd4811',
  				'800': '#963a16',
  				'900': '#793115',
  				'950': '#411709',
  				DEFAULT: '#f27a1d',
  				dark: '#bd4811',
  				light: '#f9be78',
  				hover: '#eb6313',
  				active: '#bd4811'
  			},
  			'fun-green': {
  				'50': '#ecfff5',
  				'100': '#d3ffe8',
  				'200': '#aaffd3',
  				'300': '#69ffb2',
  				'400': '#21ff8a',
  				'500': '#00f269',
  				'600': '#00ca53',
  				'700': '#009e44',
  				'800': '#007638',
  				'900': '#026532',
  				'950': '#003919',
  				DEFAULT: '#00f269',
  				dark: '#009e44',
  				light: '#69ffb2',
  				hover: '#00ca53',
  				active: '#009e44'
  			},
  			'bright-sun': {
  				'50': '#fffbeb',
  				'100': '#fff4c6',
  				'200': '#ffe788',
  				'300': '#ffd549',
  				'400': '#ffc220',
  				'500': '#f9a007',
  				'600': '#dd7802',
  				'700': '#b75406',
  				'800': '#943f0c',
  				'900': '#7a350d',
  				'950': '#461a02',
  				DEFAULT: '#f9a007',
  				dark: '#b75406',
  				light: '#ffd549',
  				hover: '#dd7802',
  				active: '#b75406'
  			},
  			primary: {
  				'50': '#fef7ee',
  				'100': '#feeed6',
  				'200': '#fcd9ac',
  				'300': '#f9be78',
  				'400': '#f59842',
  				'500': '#f27a1d',
  				'600': '#eb6313',
  				'700': '#bd4811',
  				'800': '#963a16',
  				'900': '#793115',
  				'950': '#411709',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#ecfff5',
  				'100': '#d3ffe8',
  				'200': '#aaffd3',
  				'300': '#69ffb2',
  				'400': '#21ff8a',
  				'500': '#00f269',
  				'600': '#00ca53',
  				'700': '#009e44',
  				'800': '#007638',
  				'900': '#026532',
  				'950': '#003919',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': '#fffbeb',
  				'100': '#fff4c6',
  				'200': '#ffe788',
  				'300': '#ffd549',
  				'400': '#ffc220',
  				'500': '#f9a007',
  				'600': '#dd7802',
  				'700': '#b75406',
  				'800': '#943f0c',
  				'900': '#7a350d',
  				'950': '#461a02',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: {
  				DEFAULT: '#00f269',
  				light: '#d3ffe8'
  			},
  			error: {
  				DEFAULT: '#f23030',
  				light: '#feebeb'
  			},
  			warning: {
  				DEFAULT: '#f9a007',
  				light: '#fff4c6'
  			},
  			info: {
  				DEFAULT: '#3b82f6',
  				light: '#dbeafe'
  			},
  			body: '#6C6F93',
  			meta: {
  				'2': '#495270',
  				'3': '#606882',
  				'4': '#8D93A5',
  				'5': '#BBBEC9',
  				DEFAULT: '#F7F9FC'
  			},
  			dark: {
  				'2': '#495270',
  				'3': '#606882',
  				'4': '#8D93A5',
  				'5': '#BBBEC9',
  				DEFAULT: '#1C274C'
  			},
  			gray: {
  				'1': '#F9FAFB',
  				'2': '#F3F4F6',
  				'3': '#E5E7EB',
  				'4': '#D1D5DB',
  				'5': '#9CA3AF',
  				'6': '#6B7280',
  				'7': '#374151',
  				DEFAULT: '#F3F5F6'
  			},
  			yellow: {
  				'400': '#FACC15',
  				'500': '#EAB308',
  				DEFAULT: '#FBBF24',
  				dark: '#F59E0B',
  				'dark-2': '#D97706',
  				light: '#FCD34D',
  				'light-1': '#FDE68A',
  				'light-2': '#FEF3C7',
  				'light-4': '#FFFBEB'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		spacing: {
  			'11': '2.75rem',
  			'13': '3.25rem',
  			'14': '3.5rem',
  			'15': '3.75rem',
  			'16': '4rem',
  			'17': '4.25rem',
  			'18': '4.5rem',
  			'19': '4.75rem',
  			'21': '5.25rem',
  			'22': '5.5rem',
  			'25': '6.25rem',
  			'26': '6.5rem',
  			'27': '6.75rem',
  			'29': '7.25rem',
  			'30': '7.5rem',
  			'31': '7.75rem',
  			'33': '8.25rem',
  			'34': '8.5rem',
  			'35': '8.75rem',
  			'37': '9.25rem',
  			'39': '9.75rem',
  			'40': '10rem',
  			'45': '11.25rem',
  			'46': '11.5rem',
  			'49': '12.25rem',
  			'50': '12.5rem',
  			'51': '12.75rem',
  			'52': '13rem',
  			'54': '13.5rem',
  			'55': '13.75rem',
  			'59': '14.75rem',
  			'60': '15rem',
  			'65': '16.25rem',
  			'67': '16.75rem',
  			'70': '17.5rem',
  			'75': '18.75rem',
  			'90': '22.5rem',
  			'94': '23.5rem',
  			'100': '25rem',
  			'110': '27.5rem',
  			'115': '28.75rem',
  			'125': '31.25rem',
  			'150': '37.5rem',
  			'180': '45rem',
  			'203': '50.75rem',
  			'230': '57.5rem',
  			'4.5': '1.125rem',
  			'5.5': '1.375rem',
  			'6.5': '1.625rem',
  			'7.5': '1.875rem',
  			'8.5': '2.125rem',
  			'9.5': '2.375rem',
  			'10.5': '2.625rem',
  			'11.5': '2.875rem',
  			'12.5': '3.125rem',
  			'13.5': '3.375rem',
  			'14.5': '3.625rem',
  			'15.5': '3.875rem',
  			'16.5': '4.125rem',
  			'17.5': '4.375rem',
  			'18.5': '4.625rem',
  			'19.5': '4.875rem',
  			'21.5': '5.375rem',
  			'22.5': '5.625rem',
  			'24.5': '6.125rem',
  			'25.5': '6.375rem',
  			'27.5': '6.875rem',
  			'29.5': '7.375rem',
  			'31.5': '7.875rem',
  			'32.5': '8.125rem',
  			'34.5': '8.625rem',
  			'36.5': '9.125rem',
  			'37.5': '9.375rem',
  			'39.5': '9.875rem',
  			'42.5': '10.625rem',
  			'47.5': '11.875rem',
  			'51.5': '12.875rem',
  			'52.5': '13.125rem',
  			'54.5': '13.625rem',
  			'55.5': '13.875rem',
  			'57.5': '14.375rem',
  			'62.5': '15.625rem',
  			'67.5': '16.875rem',
  			'72.5': '18.125rem',
  			'92.5': '23.125rem',
  			'122.5': '30.625rem',
  			'127.5': '31.875rem',
  			'132.5': '33.125rem',
  			'142.5': '35.625rem',
  			'166.5': '41.625rem',
  			'171.5': '42.875rem',
  			'187.5': '46.875rem',
  			'192.5': '48.125rem'
  		},
  		maxWidth: {
  			'30': '7.5rem',
  			'40': '10rem',
  			'50': '12.5rem'
  		},
  		zIndex: {
  			'1': '1',
  			'99': '99',
  			'999': '999',
  			'9999': '9999',
  			'99999': '99999',
  			'999999': '999999',
  			base: '1',
  			raised: '10',
  			floating: '100',
  			badge: '200',
  			'tooltip-simple': '300',
  			topbar: '1000',
  			header: '1100',
  			navigation: '1200',
  			'bottom-nav': '1300',
  			dropdown: '2000',
  			popover: '2500',
  			tooltip: '3000',
  			'context-menu': '3500',
  			'modal-backdrop': '5000',
  			modal: '5100',
  			dialog: '5200',
  			'sidebar-modal': '5300',
  			'quick-view': '5400',
  			notification: '8000',
  			toast: '8100',
  			alert: '8200',
  			loader: '9000',
  			'overlay-critical': '9100',
  			'error-critical': '9200',
  			gallery: '10000',
  			debug: '10100',
  			maximum: '10200'
  		},
  		boxShadow: {
  			'1': '0px 1px 2px 0px rgba(166, 175, 195, 0.25)',
  			'2': '0px 6px 24px 0px rgba(235, 238, 251, 0.40), 0px 2px 4px 0px rgba(148, 163, 184, 0.05)',
  			'3': '0px 2px 16px 0px rgba(13, 10, 44, 0.12)',
  			testimonial: '0px 0px 4px 0px rgba(148, 163, 184, 0.10), 0px 6px 12px 0px rgba(224, 227, 238, 0.45)',
  			breadcrumb: '0px 1px 0px 0px #E5E7EB, 0px -1px 0px 0px #E5E7EB',
  			range: '0px 0px 1px 0px rgba(33, 37, 41, 0.08), 0px 2px 2px 0px rgba(33, 37, 41, 0.06)',
  			filter: '0px 1px 0px 0px #E5E7EB',
  			list: '1px 0px 0px 0px #E5E7EB',
  			input: 'inset 0 0 0 2px #fc9d04'
  		},
  		borderRadius: {
  			button: '5px',
  			card: '10px',
  			modal: '12px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		transitionDuration: {
  			'150': '150ms',
  			'250': '250ms',
  			'350': '350ms'
  		},
  		keyframes: {
  			'fade-in': {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			'slide-up': {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'slide-down': {
  				'0%': {
  					transform: 'translateY(-100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'scale-in': {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'bounce-in': {
  				'0%': {
  					transform: 'scale(0.3)',
  					opacity: '0'
  				},
  				'50%': {
  					transform: 'scale(1.05)'
  				},
  				'70%': {
  					transform: 'scale(0.9)'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'search-suggestions-slide-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(-10px) scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0) scale(1)'
  				}
  			},
  			'dropdown-slide-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(-10px) scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0) scale(1)'
  				}
  			},
  			'dropdown-slide-out': {
  				'0%': {
  					opacity: '1',
  					transform: 'translateY(0) scale(1)'
  				},
  				'100%': {
  					opacity: '0',
  					transform: 'translateY(-10px) scale(0.95)'
  				}
  			},
  			'dropdown-item-stagger': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(-10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'icon-bounce': {
  				'0%, 20%, 50%, 80%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'40%': {
  					transform: 'translateY(-4px)'
  				},
  				'60%': {
  					transform: 'translateY(-2px)'
  				}
  			},
  			'cart-badge-bounce': {
  				'0%, 20%, 53%, 80%, 100%': {
  					transform: 'translate3d(0, 0, 0)'
  				},
  				'40%, 43%': {
  					transform: 'translate3d(0, -8px, 0)'
  				},
  				'70%': {
  					transform: 'translate3d(0, -4px, 0)'
  				},
  				'90%': {
  					transform: 'translate3d(0, -2px, 0)'
  				}
  			},
  			marquee: {
  				'0%': {
  					transform: 'translateX(100%)'
  				},
  				'100%': {
  					transform: 'translateX(-100%)'
  				}
  			},
  			'badge-pulse': {
  				'0%, 100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'50%': {
  					transform: 'scale(1.1)',
  					opacity: '0.8'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			'pulse-enhanced': {
  				'0%, 100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				},
  				'50%': {
  					opacity: '0.5',
  					transform: 'scale(0.95)'
  				}
  			},
  			'slide-in-right': {
  				'0%': {
  					transform: 'translateX(100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			'cart-shake': {
  				'0%, 100%': {
  					transform: 'translateX(0)'
  				},
  				'10%, 30%, 50%, 70%, 90%': {
  					transform: 'translateX(-2px)'
  				},
  				'20%, 40%, 60%, 80%': {
  					transform: 'translateX(2px)'
  				}
  			},
  			'float-up': {
  				'0%': {
  					transform: 'translateY(0) scale(1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateY(-20px) scale(0.8)',
  					opacity: '0'
  				}
  			},
  			'success-pulse': {
  				'0%': {
  					transform: 'scale(1)',
  					boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)'
  				},
  				'70%': {
  					transform: 'scale(1.05)',
  					boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)'
  				}
  			},
  			'error-shake': {
  				'0%, 100%': {
  					transform: 'translateX(0)'
  				},
  				'10%, 30%, 50%, 70%, 90%': {
  					transform: 'translateX(-3px)'
  				},
  				'20%, 40%, 60%, 80%': {
  					transform: 'translateX(3px)'
  				}
  			},
  			'slide-in-from-right': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(100px) scale(0.9)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0) scale(1)'
  				}
  			},
  			'slide-in-from-left': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(-100px) scale(0.9)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0) scale(1)'
  				}
  			}
  		},
  		animation: {
  			'fade-in': 'fade-in 0.2s ease-out',
  			'slide-up': 'slide-up 0.3s ease-out',
  			'slide-down': 'slide-down 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			'bounce-in': 'bounce-in 0.6s ease-out',
  			'search-suggestions-slide-in': 'search-suggestions-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'dropdown-slide-in': 'dropdown-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'dropdown-slide-out': 'dropdown-slide-out 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  			'dropdown-item-stagger': 'dropdown-item-stagger 0.3s ease-out',
  			'icon-bounce': 'icon-bounce 0.6s ease-in-out',
  			'cart-badge-bounce': 'cart-badge-bounce 0.6s ease-in-out',
  			marquee: 'marquee 8s linear infinite',
  			'badge-pulse': 'badge-pulse 2s infinite',
  			shimmer: 'shimmer 1.5s infinite',
  			'pulse-enhanced': 'pulse-enhanced 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'slide-in-right': 'slide-in-right 0.3s ease-out',
  			'cart-shake': 'cart-shake 0.5s ease-in-out',
  			'float-up': 'float-up 0.8s ease-out forwards',
  			'success-pulse': 'success-pulse 0.6s ease-out',
  			'error-shake': 'error-shake 0.5s ease-in-out',
  			'slide-in-from-right': 'slide-in-from-right 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
  			'slide-in-from-left': 'slide-in-from-left 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
