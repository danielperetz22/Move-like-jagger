import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outline2' | 'ghost' | 'danger' | 'underlined';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'inline-block bg-[#6F9FF9] text-md text-white font-orienta font-semibold ' +
      'px-1.5 py-1 border border-[#6F9FF9] rounded-full ' +
      'hover:bg-[#5A87D6] transition-colors',
    secondary:
      'inline-block px-1.5 py-1 border border-[#6F9FF9] bg-white text-black rounded-full text-md ' +
      'hover:bg-[#6F9FF9]/10 transition-colors font-orienta',
    outline:
      'w-full bg-white text-black text-xl sm:text-lg py-2 px-10 rounded border border-gray-300 ' +
      'hover:bg-[#f8f8f8] flex items-center justify-center gap-2',
    outline2:
      ' bg-white text-black text-md py-2 px-4 rounded border border-gray-300 ' +
      'hover:bg-[#f8f8f8] flex items-center justify-center gap-2',
    underlined:
      'inline-block text-md text-[#6F9FF9] font-orienta font-semibold ' ,
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={
        `${variantClasses[variant]} ` +
        `${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''} ` +
        `${className}`
      }
      {...props}
    >
      {isLoading ? (
        <div className='flex items-center justify-center'>
          <svg
            className='animate-spin -ml-1 mr-2 h-4 w-4 text-current'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;