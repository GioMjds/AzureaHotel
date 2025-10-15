import { Ban, Calendar, Home, User } from "lucide-react";
import { FC } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserContext } from "../../contexts/AuthContext";

const menuItems = [
  { icon: <User size={23} />, label: "My Profile", link: "/guest/:id" },
  { icon: <Calendar size={23} />, label: "Bookings", link: "/guest/bookings" },
  { icon: <Ban size={23} />, label: "Cancellations", link: "/guest/cancellations" },
  // { icon: <Beef size={23} />, label: "Food Orders", link: "/guest/food-orders" },
];

const GuestSidebar: FC = () => {
  const navigate = useNavigate();
  const { userDetails } = useUserContext();

  return (
    <aside className="w-64 h-screen bg-white shadow-md border-r border-gray-200 overflow-hidden z-50">
      <div className="px-3 py-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center space-x-2 p-2 rounded-md text-purple-600 hover:bg-purple-100 cursor-pointer hover:text-purple-600 transition-colors duration-200"
        >
          <Home size={32} className="mr-2" />
          <span className="text-xl">Go To Homepage</span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-grow overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.link.replace(':id', userDetails?.id?.toString() || '')}
                end={item.link.includes(':id')}
                className={({ isActive }) => `
                  block w-full
                  ${isActive ? 'text-purple-700 font-bold' : ''}
                `}
              >
                {({ isActive }) => (
                  <div className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${isActive
                    ? "border-r-4 border-purple-600 bg-purple-100/80 text-purple-700 font-bold"
                    : "hover:bg-purple-100/80"
                    }`}>
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xl">{item.label}</span>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default GuestSidebar;