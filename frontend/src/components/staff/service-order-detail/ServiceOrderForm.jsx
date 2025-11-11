import { useState, useMemo } from "react";
import { ServiceOrderHeader, ServiceOrderServices, ServiceOrderTotal } from ".";
import { ServiceOrderProvider } from "./ServiceOrderContext";
import { FormProvider } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * @typedef {import("./index").ServiceOrderEditFormProps} ServiceOrderEditFormProps
 */

const basePartShema = z.object({
  price: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z
      .number({
        invalid_type_error: "Phải là một số",
        required_error: "Không được để trống",
      })
      .min(0, "Phải >= 0")
  ),
  quantity: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z
      .number({
        invalid_type_error: "Phải là một số",
        required_error: "Không được để trống",
      })
      .min(1, "Phải >= 1")
  ),
});

const partItemSchema = basePartShema.extend({
  type: z.literal("part"),
  partId: z.string().min(1, "Không được để trống"),
});

const serviceItemSchema = basePartShema.extend({
  type: z.literal("service"),
  serviceId: z.string().optional(),
  name: z.string().min(1, "Không được để trống"),
});

const formSchema = z.object({
  services: z.array(serviceItemSchema),
  parts: z.array(partItemSchema)
});

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
  onCancelServiceOrder,
  onStartServiceOrder,
  onSendInvoice,
  getTotalPrice
}) => {
  const [disabled, setDisabled] = useState(false);
  const initialItems = useMemo(() => {
    const parts = [];
    const services = [];
    const customs = [];
    const items = serviceOrder?.items || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === "part") {
        parts.push({ ...item });
      } else if (item.type === "service") {
        services.push({ ...item });
      } else if (item.type === "custom") {
        customs.push({ ...item });
      }
    }

    return {
      parts,
      services,
      customs,
    };
  }, []);

  const methods = useForm({
    defaultValues: initialItems,
    resolver: zodResolver(formSchema),
    mode: "onChange",
    disabled
  });

  const handleUpdateServiceOrder = (serviceOrder, items) => {
    methods.handleSubmit(async () => {
      try {
        setDisabled(true);
        await onUpdateServiceOrder(serviceOrder, items);
      } finally {
        setDisabled(false);
      }
    })();
  };

  const handleCancelServiceOrder = async (serviceOrder) => {
    try {
      setDisabled(true);
      await onCancelServiceOrder(serviceOrder);
    } finally {
      setDisabled(false);
    }
  };

  const handleStartServiceOrder = async (serviceOrder) => {
    try {
      setDisabled(true);
      await onStartServiceOrder(serviceOrder);
    } finally {
      setDisabled(false);
    }
  }

  const handleSendInvoice = (serviceOrder, items) => {
    methods.handleSubmit(async () => {
      try {
        methods.handleSubmit(() => {})();
        setDisabled(true);
        await onSendInvoice(serviceOrder, items);
      } finally {
        setDisabled(false);
      }
    })();
  };

  const contextValue = {
    serviceOrder,
    handleUpdateServiceOrder,
    handleStartServiceOrder,
    handleCancelServiceOrder,
    handleSendInvoice,
    disabled: disabled || (serviceOrder.status === "completed" || serviceOrder.status === "cancelled"),
    getTotalPrice,
  };

  return (
    <ServiceOrderProvider value={contextValue}>
      <FormProvider {...methods}>
        <div
          className="grid grid-cols-1 lg:grid-cols-4 gap-3"
        >
          <ServiceOrderHeader className="lg:col-span-4" />
          <ServiceOrderServices className="lg:col-span-3" />
          <ServiceOrderTotal className="lg:col-span-1" />
        </div>
      </FormProvider>
    </ServiceOrderProvider>
  );
};

export default ServiceOrderEditForm;
