import React from 'react';

type Props = {
  children: React.ReactNode;
  containerStyle?: React.CSSProperties;
};

export const Container: React.FC<Props> = ({ children, containerStyle }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--white-color)',
        padding: '15px',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #C8CDD9',
        ...containerStyle,
      }}
    >
      {children}
    </div>
  );
};
