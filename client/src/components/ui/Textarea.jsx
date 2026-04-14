const Textarea = ({ className = "", ...props }) => {
  return <textarea className={`saas-input ${className}`.trim()} {...props} />;
};

export default Textarea;
