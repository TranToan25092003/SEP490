/**
 * @typedef {import("react").ComponentPropsWithRef<typeof import("@/components/ui/card").Card> & {
 *   bookingId: string;
 *   customerName: string;
 *   status: string;
 *   licensePlate: string;
 *   technicianName: string;
 *   creationDate: Date;
 *   serviceOrderStatus?: string | null;
 *   estimatedTime?: Date;
 * }} BookingStatusHeaderProps
 */

/**
 * @typedef {object} Step
 * @property {number} id - Identifier of the timeline step.
 * @property {string} label - Display label for the step.
 * @property {string} time - Time string displayed with the step.
 * @property {string[]} imageUrls - Images associated with this step.
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<typeof import("@/components/ui/card").Card> & {
 *   steps: Step[];
 *   currentStep?: number;
 * }} BookingStatusTimelineProps
 */

export { default as BookingStatusHeader } from "./BookingStatusHeader";
export { default as BookingStatusTimeline } from "./BookingStatusTimeline";
export { default as EmptyImageState } from "./EmptyImageState";
