import { createContext, useContext } from "react";

const ServiceOrderContext = createContext(undefined);

export const useServiceOrder = () => {
  const context = useContext(ServiceOrderContext);
  if (!context) {
    throw new Error(
      "useServiceOrder must be used within a ServiceOrderProvider"
    );
  }
  return context;
};

export const ServiceOrderProvider = ({ children, value }) => {
  return (
    <ServiceOrderContext.Provider value={value}>
      {children}
    </ServiceOrderContext.Provider>
  );
};

export default ServiceOrderContext;
