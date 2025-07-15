import {
  faBed,
  faBookBookmark,
  faCalendarCheck,
  faConciergeBell,
  faGauge,
  faUsers,
  faUsersSlash,
} from "@fortawesome/free-solid-svg-icons";

export const menuItems = [
  {
    icon: faGauge,
    label: "Dashboard",
    link: "/admin",
  },
  {
    icon: faBookBookmark,
    label: "Manage Bookings",
    link: "/admin/bookings",
  },
  {
    icon: faCalendarCheck,
    label: "Manage Areas",
    link: "/admin/areas",
  },
  {
    icon: faBed,
    label: "Manage Rooms",
    link: "/admin/rooms",
  },
  {
    icon: faConciergeBell,
    label: "Manage Amenities",
    link: "/admin/amenities",
  },
  {
    icon: faUsers,
    label: "Manage Users",
    link: "/admin/users",
  },
  {
    icon: faUsersSlash,
    label: "Archived Users",
    link: "/admin/archive",
  },
];
