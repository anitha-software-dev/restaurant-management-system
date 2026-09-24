import React, { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

type Props = {
  to?: string;
  text?: string;
  containerStyle?: CSSProperties;
  className?: string;
  colorScheme?: 'primary' | 'secondary' | 'orange';
  variant?: 'default' | 'inverse';
  disabled?: boolean;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement, MouseEvent>,
  ) => void;
};

export const Button: React.FC<Props> = ({
  to,
  onClick,
  containerStyle,
  className,
  text = 'Button',
  colorScheme = 'primary',
  variant = 'default',
  disabled = false,
}) => {
  const navigate = useNavigate();

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    if (to === 'back') {
      event.preventDefault();
      navigate(-1);
    } else if (onClick) {
      onClick(event);
    }
  };

  const style: CSSProperties = {
    height: 54, // Standardized to 54px for better touch target

    backgroundColor:
      variant === 'inverse'
        ? '#000'
        : colorScheme === 'primary'
          ? '#fff'
          : colorScheme === 'secondary'
            ? '#ffdec6'
            : colorScheme === 'orange'
              ? '#f9791d'
              : '#000',
    color:
      variant === 'inverse'
        ? '#fff'
        : colorScheme === 'orange' && text === 'Guests'
          ? '#fff'
          : colorScheme === 'orange' && text === 'Place Order'
            ? '#000'
            : colorScheme === 'primary' || colorScheme === 'secondary'
              ? '#000'
              : '#fff',

    borderRadius: 12, // More modern rounded corners

    border: `1px solid ${colorScheme === 'orange'
      ? '#f9791d'
      : colorScheme === 'secondary'
        ? '#f9791d'
        : '#000'
      }`,


    fontFamily: 'Poppins',
    fontWeight: colorScheme === 'secondary' || colorScheme === 'orange' && text === 'Place Order' ? 600 : 700,
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    margin: '0 auto',
    textAlign: 'center',
    textTransform: 'none', // Removed capitalization for modern feel unless required
    width: colorScheme === 'orange' && text === 'Place Order' ? '65%' : '100%',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    ...containerStyle,
  };

  if (to) {
    const Component = motion(Link);
    return (
      <Component
        to={to}
        style={{ ...style }}
        onClick={handleClick as any}
        className={className}
        whileTap={disabled ? {} : { scale: 0.97 }}
      >
        {text}
      </Component>
    );
  }

  return (
    <motion.button
      style={{ ...style }}
      onClick={onClick}
      className={className}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {text}
    </motion.button>
  );
};
