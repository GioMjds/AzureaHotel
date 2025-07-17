export enum ViewType {
  MONTH = "month",
  WEEK = "week",
  DAY = "day",
}

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    type: string;
    value: number;
    bookings: number;
    cancellations: number;
    noShows: number;
    rejected: number;
  };
};

export type EventResource = {
  type: string;
  value: number;
  bookings: number;
  cancellations: number;
  noShows: number;
  rejected: number;
};

export type EventComponentProps = {
  event: {
    title: string;
    resource: EventResource;
  };
};

export interface StatCardProps {
    title: string;
    value: string | number;
    borderColor: string;
    tooltip?: string;
}