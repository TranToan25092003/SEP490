import LinkDropdown from "./LinksDropdown";

const Navbar = () => {
  // Initialize coin balance from user data when loaded

  return (
    <div className="border-b w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:justify-between lg:items-center flex-wrap gap-4 py-2">
        <div className="flex gap-4 items-end ml-auto">
          {/* Dropdown menu */}
          <LinkDropdown />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
