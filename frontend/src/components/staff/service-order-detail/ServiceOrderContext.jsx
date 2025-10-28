import { createContext, useContext } from "react";

/**
 * ServiceOrderContext
 * Provides centralized access to service order data and functions without props drilling
 */
const ServiceOrderContext = createContext(undefined);

/**
 * Custom hook to use ServiceOrderContext
 * @returns {Object} Context value containing service order data and handlers
 * @throws {Error} If used outside ServiceOrderProvider
 */
export const useServiceOrder = () => {
  const context = useContext(ServiceOrderContext);
  if (!context) {
    throw new Error(
      "useServiceOrder must be used within a ServiceOrderProvider"
    );
  }
  return context;
};

/**
 * ServiceOrderProvider Component
 * Wraps child components and provides service order context
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.value - Context value
 * @returns {JSX.Element}
 */
export const ServiceOrderProvider = ({ children, value }) => {
  return (
    <ServiceOrderContext.Provider value={value}>
      {children}
    </ServiceOrderContext.Provider>
  );
};

export default ServiceOrderContext;
