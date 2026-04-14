const Input = ({ className = "", ...props }) => {
  return <input className={`saas-input ${className}`.trim()} {...props} />;
};

export default Input;
