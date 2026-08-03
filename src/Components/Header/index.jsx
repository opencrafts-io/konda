// src/components/Header/index.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import style from "./index.module.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaTicketAlt, 
  FaBus, 
  FaSearch,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaBookmark,
} from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { BsFillPersonFill } from "react-icons/bs";
import { LoginContext } from "../../loginContext";
import authService from "../../services/auth.service";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginContext = useContext(LoginContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  // Get user data from context
  const user = {
    name: loginContext.userName || "User",
    email: loginContext.email || "user@email.com",
    avatar: loginContext.profile_pic || null,
    id: loginContext.user_id || null,
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name || name === "User") return "U";
    const nameParts = name.trim().split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Navigation items
  const navItems = [
    { path: "/dashboard", label: "Home", icon: <FaHome /> },
    { path: "/trips", label: "Trips", icon: <FaBus /> },
    { path: "/bookings", label: "Bookings", icon: <FaTicketAlt /> },
  ];

  // Dropdown menu items
  const dropdownItems = [
    { path: "/profile", label: "My Profile", icon: <BsFillPersonFill /> },
  ];

  // Mobile menu items (includes everything)
  const mobileItems = [
    { path: "/dashboard", label: "Home", icon: <FaHome /> },
    { path: "/trips", label: "Trips", icon: <FaBus /> },
    { path: "/bookings", label: "Bookings", icon: <FaTicketAlt /> },
    { path: "/profile", label: "My Profile", icon: <BsFillPersonFill /> },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      
      loginContext.setUserName('');
      loginContext.setEmail('');
      loginContext.setUser_id('');
      loginContext.setProfile_pic('');
      loginContext.setToken('');
      
      navigate('/login');
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('email');
      localStorage.removeItem('user_id');
      localStorage.removeItem('profile_pic');
      navigate('/login');
    }
  };

  return (
    <header className={style.header}>
      <div className={style.headerContainer}>
        {/* Logo */}
        <Link to="/dashboard" className={style.logo}>
          <FaBus className={style.logoIcon} />
          <span className={style.logoText}>BusBooking</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={style.desktopNav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${style.navLink} ${
                location.pathname === item.path ? style.active : ""
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className={style.rightActions}>
          {/* Search Toggle - Always visible */}
          <button
            className={style.iconBtn}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search"
          >
            <FaSearch />
          </button>

          {/* User Dropdown - Desktop only */}
          <div className={style.userDropdown} ref={dropdownRef}>
            <button
              className={style.userBtn}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={style.userAvatar} />
              ) : (
                <div className={style.userAvatarPlaceholder}>
                  {getInitials(user.name)}
                </div>
              )}
              <span className={style.userName}>{user.name}</span>
              <FaChevronDown
                className={`${style.dropdownArrow} ${
                  isDropdownOpen ? style.rotated : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className={style.dropdownMenu}>
                <div className={style.dropdownHeader}>
                  <div className={style.dropdownUserInfo}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className={style.dropdownAvatar} />
                    ) : (
                      <div className={style.dropdownAvatarPlaceholder}>
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div>
                      <div className={style.dropdownUserName}>{user.name}</div>
                      <div className={style.dropdownUserEmail}>{user.email}</div>
                    </div>
                  </div>
                </div>

                <div className={style.dropdownDivider}></div>

                {dropdownItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={style.dropdownItem}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}

                <div className={style.dropdownDivider}></div>

                <button className={style.dropdownItem} onClick={handleLogout}>
                  <MdLogout />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle - Mobile only */}
          <button
            className={style.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className={style.searchOverlay}>
          <form onSubmit={handleSearch} className={style.searchForm}>
            <FaSearch className={style.searchIcon} />
            <input
              type="text"
              placeholder="Search destinations, buses, or trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={style.searchInput}
              autoFocus
            />
            <button type="button" onClick={() => setIsSearchOpen(false)} className={style.closeSearch}>
              <FaTimes />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={style.mobileMenu} ref={mobileMenuRef}>
          <div className={style.mobileMenuHeader}>
            <div className={style.mobileUserInfo}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={style.mobileAvatar} />
              ) : (
                <div className={style.mobileAvatarPlaceholder}>
                  {getInitials(user.name)}
                </div>
              )}
              <div>
                <div className={style.mobileUserName}>{user.name}</div>
                <div className={style.mobileUserEmail}>{user.email}</div>
              </div>
            </div>
          </div>

          <div className={style.mobileNavLinks}>
            {mobileItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${style.mobileNavLink} ${
                  location.pathname === item.path ? style.mobileActive : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button className={style.mobileNavLink} onClick={handleLogout}>
              <MdLogout />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;