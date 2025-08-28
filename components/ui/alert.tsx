import * as React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export const Alert: React.FC<AlertProps> = ({ children, type = 'info', ...props }) => {
  let bgColor = 'bg-blue-100 text-blue-800';
  if (type === 'success') bgColor = 'bg-green-100 text-green-800';
  if (type === 'error') bgColor = 'bg-red-100 text-red-800';
  if (type === 'warning') bgColor = 'bg-yellow-100 text-yellow-800';

  return (
    <div className={`p-4 rounded-md ${bgColor}`} {...props}>
      {children}
    </div>
  );
};

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, ...props }) => {
  return <div className="text-sm opacity-90" {...props}>{children}</div>;
};
