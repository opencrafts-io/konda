import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaTicketAlt, 
  FaCalendarAlt,
  FaBus,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaUsers,
  FaDollarSign,
  FaRoute,
  FaBuilding,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaDownload,
  FaPrint,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEllipsisV,
  FaCheckCircle,
  FaTimesCircle,
  FaClock as FaClockIcon,
  FaSpinner
} from "react-icons/fa";
import { MdHistory, MdLocationOn, MdDashboard } from "react-icons/md";
import { BsFillStarFill, BsFillCircleFill } from "react-icons/bs";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { fetchUserData } from "../../Components/titan.js";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("today");
  
  // State for API data
  const [adminStats, setAdminStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalTrips: 0,
    activeVehicles: 0,
    totalUsers: 0,
    pendingBookings: 0,
    completionRate: 0,
    averageRating: 0
  });
  
  const [revenueData, setRevenueData] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    growth: 0
  });
  
  const [recentBookings, setRecentBookings] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);
  const [fleetStatus, setFleetStatus] = useState([]);

  // Fetch admin data
  useEffect(() => {
    const token = access_token || localStorage.getItem('access_token');
    if (token) {
      fetchAdminData(token);
    } else {
      setLoading(false);
      setError("Please login to view admin dashboard");
    }
  }, [access_token]);

  const fetchAdminData = async (token) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all admin data in parallel
      const [
        summaryResponse,
        statsResponse,
        revenueResponse,
        recentBookingsResponse,
        topRoutesResponse,
        fleetStatusResponse
      ] = await Promise.all([
        fetchUserData(token, "admin/summary"),
        fetchUserData(token, "admin/stats"),
        fetchUserData(token, "admin/revenue"),
        fetchUserData(token, "admin/recent-bookings"),
        fetchUserData(token, "admin/top-routes"),
        fetchUserData(token, "admin/fleet-status")
      ]);

      // Process Stats
      if (statsResponse?.data) {
        setAdminStats({
          totalRevenue: statsResponse.data.totalRevenue || 0,
          totalBookings: statsResponse.data.totalBookings || 0,
          totalTrips: statsResponse.data.totalTrips || 0,
          activeVehicles: statsResponse.data.activeVehicles || 0,
          totalUsers: statsResponse.data.totalUsers || 0,
          pendingBookings: statsResponse.data.pendingBookings || 0,
          completionRate: statsResponse.data.completionRate || 0,
          averageRating: statsResponse.data.averageRating || 0
        });
      }

      // Process Revenue
      if (revenueResponse?.data) {
        setRevenueData({
          today: revenueResponse.data.today || 0,
          thisWeek: revenueResponse.data.thisWeek || 0,
          thisMonth: revenueResponse.data.thisMonth || 0,
          lastMonth: revenueResponse.data.lastMonth || 0,
          growth: revenueResponse.data.growth || 0
        });
      }

      // Process Recent Bookings
      if (recentBookingsResponse?.data) {
        setRecentBookings(recentBookingsResponse.data);
      }

      // Process Top Routes
      if (topRoutesResponse?.data) {
        setTopRoutes(topRoutesResponse.data);
      }

      // Process Fleet Status
      if (fleetStatusResponse?.data) {
        setFleetStatus(fleetStatusResponse.data);
      }

    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(err.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "KSh 0";
    return `KSh ${Number(amount).toLocaleString()}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'active':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
      case 'inactive':
        return '#ef4444';
      case 'maintenance':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  // Helper function to get status background
  const getStatusBackground = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'active':
        return '#dcfce7';
      case 'pending':
        return '#fef3c7';
      case 'cancelled':
      case 'inactive':
        return '#fee2e2';
      case 'maintenance':
        return '#f3e8ff';
      default:
        return '#f3f4f6';
    }
  };

  // Helper function to get payment status color
  const getPaymentColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'refunded':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'active':
        return <FaCheckCircle />;
      case 'pending':
        return <FaClockIcon />;
      case 'cancelled':
      case 'inactive':
        return <FaTimesCircle />;
      default:
        return <FaClockIcon />;
    }
  };

  // Helper function to get booking reference
  const getBookingRef = (booking) => {
    return booking.id?.substring(0, 8) || `BK-${Date.now()}`;
  };

  // Helper function to get seat numbers
  const getSeatNumbers = (booking) => {
    return booking.seats?.map(s => s.seat_number).join(', ') || 'N/A';
  };

  if (loading) {
    return (
      <Layout>
        <div className={style.loadingContainer}>
          <FaSpinner className={style.loadingSpinner} />
          <p>Loading admin dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={style.errorContainer}>
          <div className={style.errorContent}>
            <h3>Failed to load dashboard</h3>
            <p>{error}</p>
            <button className={style.retryBtn} onClick={() => {
              const token = access_token || localStorage.getItem('access_token');
              if (token) fetchAdminData(token);
            }}>
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={style.adminDashboard}>
        <div className={style.dashboardContent}>
          {/* Header */}
          <div className={style.header}>
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage your bus operations and bookings</p>
            </div>
            <div className={style.headerActions}>
              <div className={style.dateSelector}>
                <button 
                  className={`${style.dateBtn} ${dateRange === 'today' ? style.active : ''}`}
                  onClick={() => setDateRange('today')}
                >
                  Today
                </button>
                <button 
                  className={`${style.dateBtn} ${dateRange === 'week' ? style.active : ''}`}
                  onClick={() => setDateRange('week')}
                >
                  This Week
                </button>
                <button 
                  className={`${style.dateBtn} ${dateRange === 'month' ? style.active : ''}`}
                  onClick={() => setDateRange('month')}
                >
                  This Month
                </button>
              </div>
              <button className={style.exportBtn}>
                <FaDownload /> Export
              </button>
              <button className={style.addBtn} onClick={() => navigate("/trips/new")}>
                <FaPlus /> Add Trip
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={style.statsGrid}>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#e3f2fd' }}>
                <FaDollarSign className={style.statIcon} style={{ color: '#1976d2' }} />
              </div>
              <div className={style.statInfo}>
                <span className={style.statNumber}>{formatCurrency(adminStats.totalRevenue)}</span>
                <span className={style.statLabel}>Total Revenue</span>
                <span className={`${style.statTrend} ${revenueData.growth >= 0 ? style.up : style.down}`}>
                  {revenueData.growth >= 0 ? <FaArrowUp /> : <FaArrowDown />} 
                  {Math.abs(revenueData.growth)}%
                </span>
              </div>
            </div>

            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#e8f5e9' }}>
                <FaTicketAlt className={style.statIcon} style={{ color: '#388e3c' }} />
              </div>
              <div className={style.statInfo}>
                <span className={style.statNumber}>{adminStats.totalBookings}</span>
                <span className={style.statLabel}>Total Bookings</span>
                <span className={style.statSub}>{adminStats.pendingBookings} pending</span>
              </div>
            </div>

            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#fff3e0' }}>
                <FaBus className={style.statIcon} style={{ color: '#f57c00' }} />
              </div>
              <div className={style.statInfo}>
                <span className={style.statNumber}>{adminStats.activeVehicles}</span>
                <span className={style.statLabel}>Active Vehicles</span>
                <span className={style.statSub}>{adminStats.totalTrips} total trips</span>
              </div>
            </div>

            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#f3e5f5' }}>
                <FaUsers className={style.statIcon} style={{ color: '#7b1fa2' }} />
              </div>
              <div className={style.statInfo}>
                <span className={style.statNumber}>{adminStats.totalUsers}</span>
                <span className={style.statLabel}>Total Users</span>
                <span className={style.statSub}>{adminStats.completionRate}% completion rate</span>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className={style.secondaryStats}>
            <div className={style.secondaryStat}>
              <span className={style.secondaryLabel}>Completion Rate</span>
              <span className={style.secondaryValue}>{adminStats.completionRate}%</span>
            </div>
            <div className={style.secondaryStat}>
              <span className={style.secondaryLabel}>Average Rating</span>
              <span className={style.secondaryValue}>
                {adminStats.averageRating} <BsFillStarFill className={style.starIcon} />
              </span>
            </div>
            <div className={style.secondaryStat}>
              <span className={style.secondaryLabel}>Revenue Growth</span>
              <span className={`${style.secondaryValue} ${revenueData.growth >= 0 ? style.green : style.red}`}>
                {revenueData.growth >= 0 ? '+' : ''}{revenueData.growth}%
              </span>
            </div>
            <div className={style.secondaryStat}>
              <span className={style.secondaryLabel}>Active Bookings</span>
              <span className={style.secondaryValue}>
                {adminStats.totalBookings - adminStats.pendingBookings}
              </span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className={style.mainGrid}>
            {/* Left Column */}
            <div className={style.leftColumn}>
              {/* Recent Bookings */}
              <div className={style.sectionCard}>
                <div className={style.sectionHeader}>
                  <h4>Recent Bookings</h4>
                  <div className={style.sectionActions}>
                    <button className={style.iconBtn}><FaSearch /></button>
                    <button className={style.iconBtn}><FaFilter /></button>
                    <button className={style.viewAllBtn} onClick={() => navigate("/bookings")}>View All</button>
                  </div>
                </div>

                <div className={style.tableWrapper}>
                  <table className={style.bookingsTable}>
                    <thead>
                      <tr>
                        <th>Booking Ref</th>
                        <th>Passenger</th>
                        <th>Route</th>
                        <th>Date</th>
                        <th>Seats</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id}>
                          <td className={style.refCell}>{getBookingRef(booking)}</td>
                          <td>{booking.user?.name || "N/A"}</td>
                          <td className={style.routeCell}>
                            <span className={style.routeText}>
                              {booking.trip?.departure_location || "N/A"} → {booking.trip?.arrival_location || "N/A"}
                            </span>
                            <span className={style.operatorTag}>{booking.trip?.vehicle?.operator_name || "N/A"}</span>
                          </td>
                          <td>
                            <div>{formatDate(booking.booking_date)}</div>
                            <div className={style.timeText}>{formatTime(booking.booking_date)}</div>
                          </td>
                          <td className={style.seatsCell}>{booking.seats?.length || 0}</td>
                          <td className={style.amountCell}>{formatCurrency(booking.total_amount)}</td>
                          <td>
                            <span 
                              className={style.statusBadge}
                              style={{
                                backgroundColor: getStatusBackground(booking.status),
                                color: getStatusColor(booking.status)
                              }}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status || "PENDING"}
                            </span>
                            <span 
                              className={style.paymentBadge}
                              style={{
                                backgroundColor: getStatusBackground(booking.payment_status),
                                color: getPaymentColor(booking.payment_status)
                              }}
                            >
                              {booking.payment_status || "PENDING"}
                            </span>
                          </td>
                          <td>
                            <button className={style.actionBtn} onClick={() => navigate(`/bookings/${booking.id}`)}>
                              <FaEye />
                            </button>
                            <button className={style.actionBtn}>
                              <FaEllipsisV />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {recentBookings.length === 0 && (
                        <tr>
                          <td colSpan="8" className={style.noData}>No recent bookings</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Routes */}
              {topRoutes.length > 0 && (
                <div className={style.sectionCard}>
                  <h4>Top Routes</h4>
                  <div className={style.routesList}>
                    {topRoutes.map((route, index) => (
                      <div key={index} className={style.routeItem}>
                        <div className={style.routeInfo}>
                          <span className={style.routeRank}>{index + 1}</span>
                          <div>
                            <span className={style.routeName}>{route.route}</span>
                            <span className={style.routeBookings}>{route.bookings} bookings</span>
                          </div>
                        </div>
                        <div className={style.routeStats}>
                          <span className={style.routeRevenue}>{formatCurrency(route.revenue)}</span>
                          <div className={style.progressBar}>
                            <div 
                              className={style.progressFill} 
                              style={{ width: `${route.percentage || 0}%` }}
                            />
                          </div>
                          <span className={style.routePercentage}>{route.percentage || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className={style.rightColumn}>
              {/* Fleet Status */}
              {fleetStatus.length > 0 && (
                <div className={style.sectionCard}>
                  <h4>Fleet Status</h4>
                  {fleetStatus.map((vehicle, index) => (
                    <div key={index} className={style.fleetItem}>
                      <div className={style.fleetInfo}>
                        <span className={style.vehicleReg}>{vehicle.vehicle}</span>
                        <span className={style.fleetOperator}>{vehicle.operator}</span>
                        <span className={style.fleetRoute}>{vehicle.route || "No route assigned"}</span>
                      </div>
                      <div className={style.fleetStatus}>
                        <span 
                          className={style.fleetBadge}
                          style={{
                            backgroundColor: getStatusBackground(vehicle.status),
                            color: getStatusColor(vehicle.status)
                          }}
                        >
                          <BsFillCircleFill className={style.statusDot} />
                          {vehicle.status || "INACTIVE"}
                        </span>
                        {vehicle.status === 'active' && vehicle.occupancy > 0 && (
                          <span className={style.occupancy}>
                            {vehicle.occupancy}% full
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className={style.sectionCard}>
                <h4>Quick Actions</h4>
                <div className={style.quickActions}>
                  <button className={style.quickActionBtn} onClick={() => navigate("/vehicles")}>
                    <FaBus /> Manage Fleet
                  </button>
                  <button className={style.quickActionBtn} onClick={() => navigate("/bookings")}>
                    <FaTicketAlt /> View Bookings
                  </button>
                  <button className={style.quickActionBtn} onClick={() => navigate("/users")}>
                    <FaUsers /> Manage Users
                  </button>
                  <button className={style.quickActionBtn} onClick={() => navigate("/reports")}>
                    <FaChartLine /> View Reports
                  </button>
                </div>
              </div>

              {/* Revenue Summary */}
              <div className={style.sectionCard}>
                <h4>Revenue Summary</h4>
                <div className={style.revenueSummary}>
                  <div className={style.revenueItem}>
                    <span className={style.revenueLabel}>Today</span>
                    <span className={style.revenueValue}>{formatCurrency(revenueData.today)}</span>
                  </div>
                  <div className={style.revenueItem}>
                    <span className={style.revenueLabel}>This Week</span>
                    <span className={style.revenueValue}>{formatCurrency(revenueData.thisWeek)}</span>
                  </div>
                  <div className={style.revenueItem}>
                    <span className={style.revenueLabel}>This Month</span>
                    <span className={style.revenueValue}>{formatCurrency(revenueData.thisMonth)}</span>
                  </div>
                  <div className={style.revenueItem}>
                    <span className={style.revenueLabel}>Last Month</span>
                    <span className={style.revenueValue}>{formatCurrency(revenueData.lastMonth)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;