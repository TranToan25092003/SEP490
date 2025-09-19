import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FiLoader } from "react-icons/fi";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useState } from "react";
import { FaFacebook } from "react-icons/fa";
import { useLoaderData } from "react-router-dom";
import { customFetch } from "@/utils/customAxios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { contactSchema } from "@/utils/schema";

// Loader
export const contactLoader = async () => {
  try {
    const response = await customFetch("/admin/contact");
    return {
      data: response.data.data,
    };
  } catch (error) {
    return {
      message: "Something wrong",
    };
  }
};

// page
function EditContact() {
  const { data } = useLoaderData();

  // Khởi tạo form với defaultValues từ data
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      address: data?.address || "",
      phone: data?.phone || "",
      email: data?.email || "",
      facebook: data?.facebook || "",
      zalo: data?.zalo || "",
      iframe: data?.iframe || "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khởi tạo state map với giá trị iframe từ data
  const [map, setMap] = useState(data?.iframe || "");

  const onSubmit = async (formData) => {
    try {
      const response = await customFetch.patch("/admin/contact", {
        ...formData,
      });

      setIsSubmitting(false);
      if (response.status != 200) {
        toast.error("Update contact information failed");
        return;
      }

      toast.success("Contact information updated successfully!");
    } catch (error) {
      toast.error("Failed to update contact information.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter phone number (e.g., +84912345678)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <FaFacebook size={18} color="blue" /> Facebook URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Facebook URL (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zalo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/2048px-Icon_of_Zalo.svg.png"
                          alt="Zalo Icon"
                          width={18}
                          height={18}
                        />{" "}
                        Zalo URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Zalo URL (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center justify-between w-full">
                <FormField
                  control={form.control}
                  name="iframe"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Iframe</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Iframe google map"
                          {...field}
                          value={map}
                          onChange={(e) => {
                            setMap(e.target.value);
                            field.onChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div
                  className="ml-4"
                  dangerouslySetInnerHTML={{
                    __html: map,
                  }}
                ></div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                  }}
                >
                  Cancel
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="primary"
                      className={
                        "bg-green-500 text-white hover:bg-green-300 cursor-pointer"
                      }
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <FiLoader className="animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "save changes"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setIsSubmitting(true);
                          form.handleSubmit(onSubmit)();
                        }}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EditContact;
