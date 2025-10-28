import { FormProvider, useForm } from "react-hook-form";
import { useState } from "react";
import { ServiceOrderHeader, ServiceOrderServices, ServiceOrderTotal } from ".";
import { ServiceOrderProvider } from "./ServiceOrderContext";

/**
 * ServiceOrderEditForm Component
 * A form component for editing and managing service order details including services, comments, and confirmation.
 *
 * @typedef {import("./index").ServiceOrderEditFormProps} ServiceOrderEditFormProps
 */

/**
 * Renders a service order edit form with service management and service order confirmation capabilities.
 *
 * @component
 * @param {ServiceOrderEditFormProps} props - The component props
 * @returns {JSX.Element} The rendered service order edit form
 */
const ServiceOrderEditForm = ({
  serviceOrder,
  onUpdateServiceOrder,
  onConfirmServiceOrder,
  onSendInvoice,
  getTotalPrice
}) => {
  const [updateServiceOrderLoading, setUpdateServiceOrderLoading] = useState(false);
  const [confirmServiceOrderLoading, setConfirmServiceOrderLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const methods = useForm({
    defaultValues: {
      ...serviceOrder
    }
  });

  /**
   * Handle updating service order
   * @async
   * @param {Object} data - Updated service order data
   * @returns {Promise<void>}
   */
  const handleUpdateServiceOrder = async (data) => {
    try {
      setUpdateServiceOrderLoading(true);
      setDisabled(true);
      await onUpdateServiceOrder(data);
    } finally {
      setDisabled(false);
      setUpdateServiceOrderLoading(false);
    }
  };

  /**
   * Handle confirming service order
   * @async
   * @param {Object} data - Service order data to confirm
   * @returns {Promise<void>}
   */
  const handleConfirmServiceOrder = async (data) => {
    try {
      setConfirmServiceOrderLoading(true);
      setDisabled(true);
      await onConfirmServiceOrder(data);
    } finally {
      setDisabled(false);
      setConfirmServiceOrderLoading(false);
    }
  };

  /**
   * Handle sending invoice
   * @async
   * @param {Object} data - Service order data
   * @returns {Promise<void>}
   */
  const handleSendInvoice = async (data) => {
    try {
      setUpdateServiceOrderLoading(true);
      setDisabled(true);
      await onSendInvoice(data);
    } finally {
      setDisabled(false);
      setUpdateServiceOrderLoading(false);
    }
  };

  const contextValue = {
    serviceOrder,
    confirmServiceOrderLoading,
    updateServiceOrderLoading,
    disabled,
    getTotalPrice,
    methods,
    handleUpdateServiceOrder,
    handleConfirmServiceOrder,
    handleSendInvoice,
  };

  return (
    <ServiceOrderProvider value={contextValue}>
      <FormProvider {...methods}>
        <form
          className="grid grid-cols-1 lg:grid-cols-4 gap-3"
          onSubmit={methods.handleSubmit(handleConfirmServiceOrder)}
        >
          <ServiceOrderHeader className="lg:col-span-4" />
          <ServiceOrderServices className="lg:col-span-2" />
          <ServiceOrderTotal className="lg:col-span-2" />
        </form>
      </FormProvider>
    </ServiceOrderProvider>
  );
};

export default ServiceOrderEditForm;
