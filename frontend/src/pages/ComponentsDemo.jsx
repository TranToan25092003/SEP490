import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ComponentsDemo = () => {
  const [date, setDate] = useState(new Date());
  const [sliderValue, setSliderValue] = useState([50]);
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen p-8 text-foreground">
      <div className="max-w-7xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Shadcn/UI Components Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            A comprehensive showcase of all installed components with full dark mode support
          </p>
        </div>

        <Separator />

        {/* Theme Colors Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Theme Colors</h2>
          <p className="text-sm text-muted-foreground">
            These colors automatically adapt to light/dark mode
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Primary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary text-primary-foreground p-4 rounded-md text-center font-medium">
                  Primary Color
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Secondary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary text-secondary-foreground p-4 rounded-md text-center font-medium">
                  Secondary Color
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-accent text-accent-foreground p-4 rounded-md text-center font-medium">
                  Accent Color
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Muted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted text-muted-foreground p-4 rounded-md text-center font-medium">
                  Muted Color
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Destructive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive text-destructive-foreground p-4 rounded-md text-center font-medium">
                  Destructive Color
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-card text-card-foreground border p-4 rounded-md text-center font-medium">
                  Card Background
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Accordion */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Accordion</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that matches the other components&apos; aesthetic.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is it animated?</AccordionTrigger>
              <AccordionContent>
                Yes. It&apos;s animated by default, but you can disable it if you prefer.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        {/* Alert Dialog */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Alert Dialog</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        <Separator />

        {/* Avatar */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Avatar</h2>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
          </div>
        </section>

        <Separator />

        {/* Badge */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Badge</h2>
          <div className="flex gap-2 flex-wrap">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <Separator />

        {/* Breadcrumb */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Breadcrumb</h2>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Demo</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>

        <Separator />

        {/* Button */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Button</h2>
          <div className="flex gap-2 flex-wrap">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <Separator />

        {/* Calendar */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Calendar</h2>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>
        </section>

        <Separator />

        {/* Card */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content area.</p>
              </CardContent>
              <CardFooter>
                <Button>Action</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
                <CardDescription>With different content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Cards can contain any content you need.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Third Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Simple card without description or footer.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Carousel */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Carousel</h2>
          <Carousel className="w-full max-w-xs">
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6">
                        <span className="text-4xl font-semibold">{index + 1}</span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>

        <Separator />

        {/* Checkbox */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Checkbox</h2>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        </section>

        <Separator />

        {/* Dialog */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Dialog</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a dialog description. You can add any content here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <Separator />

        {/* Dropdown Menu */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Dropdown Menu</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>

        <Separator />

        {/* Input */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Input</h2>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
          </div>
        </section>

        <Separator />

        {/* Navigation Menu */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Navigation Menu</h2>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[400px] p-4">
                    <h4 className="text-sm font-medium mb-2">Welcome</h4>
                    <p className="text-sm text-muted-foreground">
                      Get started with our components
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[400px] p-4">
                    <h4 className="text-sm font-medium mb-2">UI Components</h4>
                    <p className="text-sm text-muted-foreground">
                      Browse all available components
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </section>

        <Separator />

        {/* Pagination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Pagination</h2>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </section>

        <Separator />

        {/* Popover */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Popover</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <h4 className="font-medium">Popover Title</h4>
                <p className="text-sm text-muted-foreground">
                  This is popover content. You can add any content here.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </section>

        <Separator />

        {/* Select */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Select</h2>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="grape">Grape</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <Separator />

        {/* Sheet */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Sheet</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
                <SheetDescription>
                  This is a sheet component. It slides in from the side.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <p className="text-sm">Sheet content goes here.</p>
              </div>
            </SheetContent>
          </Sheet>
        </section>

        <Separator />

        {/* Skeleton */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Skeleton</h2>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </section>

        <Separator />

        {/* Slider */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Slider</h2>
          <div className="space-y-2">
            <Label>Value: {sliderValue[0]}</Label>
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={100}
              step={1}
              className="w-full max-w-md"
            />
          </div>
        </section>

        <Separator />

        {/* Sonner (Toast) */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Sonner (Toast)</h2>
          <div className="flex gap-2">
            <Button onClick={() => toast('Default toast notification')}>
              Default Toast
            </Button>
            <Button
              onClick={() =>
                toast.success('Success toast notification', {
                  description: 'Your action was completed successfully',
                })
              }
            >
              Success Toast
            </Button>
            <Button
              onClick={() =>
                toast.error('Error toast notification', {
                  description: 'Something went wrong',
                })
              }
            >
              Error Toast
            </Button>
          </div>
        </section>

        <Separator />

        {/* Table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Table</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">John Doe</TableCell>
                  <TableCell>
                    <Badge>Active</Badge>
                  </TableCell>
                  <TableCell>john@example.com</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Jane Smith</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Pending</Badge>
                  </TableCell>
                  <TableCell>jane@example.com</TableCell>
                  <TableCell className="text-right">$150.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bob Johnson</TableCell>
                  <TableCell>
                    <Badge variant="destructive">Inactive</Badge>
                  </TableCell>
                  <TableCell>bob@example.com</TableCell>
                  <TableCell className="text-right">$350.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        <Separator />

        {/* Tabs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Tabs</h2>
          <Tabs defaultValue="account" className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Make changes to your account here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="John Doe" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your password here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type="password" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Configure your settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Settings content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* Textarea */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Textarea</h2>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              rows={4}
            />
          </div>
        </section>

        <Separator />

        {/* Tooltip */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Tooltip</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </section>

        <Separator />

        {/* Footer */}
        <div className="text-center text-muted-foreground py-8">
          <p>End of Components Demo</p>
        </div>
      </div>
    </div>
  );
};

export default ComponentsDemo;
