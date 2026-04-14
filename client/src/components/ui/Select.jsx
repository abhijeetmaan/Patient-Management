const Select = ({ className = "", children, ...props }) => {
  return (
    <select className={`saas-input ${className}`.trim()} {...props}>
      {children}
    </select>
  );
};

export default Select;
