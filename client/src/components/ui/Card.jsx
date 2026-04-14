const Card = ({ as: Component = "section", className = "", children }) => {
  return (
    <Component
      className={`saas-surface transform-gpu hover:-translate-y-1 hover:shadow-xl ${className}`.trim()}
    >
      {children}
    </Component>
  );
};

export default Card;
