import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCalendarAlt,
  FaSearch,
  FaArrowRight,
  FaChair,
  FaUsers,
  FaDollarSign,
  FaStar,
  FaSpinner,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEllipsisV,
  FaFilter,
  FaSort,
  FaCheckCircle,
  FaTimesCircle,
  FaClock as FaClockIcon,
  FaTicketAlt
} from "react-icons/fa";
import { BsFillStarFill, BsStarHalf } from "react-icons/bs";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { fetchUserData } from "../../Components/titan.js";

const AdminTrips = () => {
  const navigate = useNavigate();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    availableTrips: 0,
    scheduledTrips: 0,
    totalRevenue: 0,
    totalBookings: 0,
    activeTrips: 0
  });

  // Fetch trips from API
  useEffect(() => {
    const token = access_token || localStorage.getItem('access_token');
    if (token) {
      fetchTrips(token);
    } else {
      setLoading(false);
      setError("Please login to view trips");
    }
  }, [access_token]);

  const fetchTrips = async (token) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchUserData(token, "trip");
      console.log("API Response:", response);
      
      if (response && response.data) {
        const tripsData = response.data;
        setTrips(tripsData);
        
        // Calculate stats
        const availableTrips = tripsData.filter(t => t.available_seats > 0).length;
        const scheduledTrips = tripsData.filter(t => t.status === 'SCHEDULED').length;
        const activeTrips = tripsData.filter(t => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS').length;
        
        setStats({
          totalTrips: response.totalTrips || tripsData.length,
          availableTrips: availableTrips,
          scheduledTrips: scheduledTrips,
          totalRevenue: 0, // Will be calculated from bookings
          totalBookings: 0, // Will be calculated from bookings
          activeTrips: activeTrips
        });
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError(err.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
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

  // Helper function to format duration
  const getDuration = (departure, arrival) => {
    if (!departure || !arrival) return "N/A";
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr - dep;
    if (diff < 0) return "N/A";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'SCHEDULED': return '#1976d2';
      case 'IN_PROGRESS': return '#f57c00';
      case 'COMPLETED': return '#388e3c';
      case 'CANCELLED': return '#d32f2f';
      default: return '#718096';
    }
  };

  // Helper function to get status background
  const getStatusBackground = (status) => {
    switch(status) {
      case 'SCHEDULED': return '#dbeafe';
      case 'IN_PROGRESS': return '#fef3c7';
      case 'COMPLETED': return '#dcfce7';
      case 'CANCELLED': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'SCHEDULED':
        return <FaClockIcon />;
      case 'IN_PROGRESS':
        return <FaClockIcon />;
      case 'COMPLETED':
        return <FaCheckCircle />;
      case 'CANCELLED':
        return <FaTimesCircle />;
      default:
        return <FaClockIcon />;
    }
  };

  // Helper function to get initials from operator name
  const getInitials = (operatorName) => {
    if (!operatorName) return "BUS";
    const words = operatorName.split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.map(word => word[0]).join('').toUpperCase().substring(0, 2);
  };

  // Helper function to get a consistent color based on operator name
  const getOperatorColor = (operatorName) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f',
      '#00838f', '#2e7d32', '#c62828', '#1565c0', '#6a1b9a',
      '#e65100', '#004d40', '#1a237e', '#4a148c', '#bf360c'
    ];
    
    if (!operatorName) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < operatorName.length; i++) {
      hash = operatorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "KSh 0";
    return `KSh ${parseFloat(amount).toLocaleString()}`;
  };

  // Filter trips
  const filteredTrips = trips.filter(trip => {
    const matchesFilter = filter === 'all' || trip.status === filter.toUpperCase();
    const matchesSearch = 
      (trip.departure_location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.arrival_location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.vehicle?.operator_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.vehicle?.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle view trip
  const handleViewTrip = (tripId) => {
    navigate(`/trips/view?id=${tripId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className={style.loadingContainer}>
          <FaSpinner className={style.loadingSpinner} />
          <p>Loading trips...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={style.errorContainer}>
          <div className={style.errorContent}>
            <h3>Failed to load trips</h3>
            <p>{error}</p>
            <button className={style.retryBtn} onClick={() => {
              const token = access_token || localStorage.getItem('access_token');
              if (token) fetchTrips(token);
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
      <div className={style.trips}>
        <div className={style.tripsContent}>
          {/* Header */}
          <div className={style.header}>
            <div>
              <h1>Trip Management</h1>
              <p>Manage all your bus trips and routes</p>
            </div>
            <div className={style.headerActions}>
              <button className={style.addTripBtn} onClick={() => navigate("/trips/new")}>
                <FaPlus /> Add New Trip
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={style.statsRow}>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#e3f2fd' }}>
                <FaBus className={style.statIcon} style={{ color: '#1976d2' }} />
              </div>
              <div className={style.statInfo}>
                <h3 className={style.statNumber}>{stats.totalTrips}</h3>
                <p className={style.statLabel}>Total Trips</p>
                <span className={style.statSub}>{stats.activeTrips} active</span>
              </div>
            </div>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#e8f5e9' }}>
                <FaChair className={style.statIcon} style={{ color: '#388e3c' }} />
              </div>
              <div className={style.statInfo}>
                <h3 className={style.statNumber}>{stats.availableTrips}</h3>
                <p className={style.statLabel}>Available Trips</p>
                <span className={style.statSub}>With seats available</span>
              </div>
            </div>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#fff3e0' }}>
                <FaDollarSign className={style.statIcon} style={{ color: '#f57c00' }} />
              </div>
              <div className={style.statInfo}>
                <h3 className={style.statNumber}>{formatCurrency(stats.totalRevenue)}</h3>
                <p className={style.statLabel}>Total Revenue</p>
                <span className={style.statSub}>From {stats.totalBookings} bookings</span>
              </div>
            </div>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#f3e5f5' }}>
                <FaCalendarAlt className={style.statIcon} style={{ color: '#7b1fa2' }} />
              </div>
              <div className={style.statInfo}>
                <h3 className={style.statNumber}>{stats.scheduledTrips}</h3>
                <p className={style.statLabel}>Scheduled</p>
                <span className={style.statSub}>Upcoming trips</span>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className={style.filterSection}>
            <div className={style.filterTabs}>
              <button 
                className={`${style.filterTab} ${filter === 'all' ? style.active : ''}`}
                onClick={() => setFilter('all')}
              >
                All Trips
              </button>
              <button 
                className={`${style.filterTab} ${filter === 'scheduled' ? style.active : ''}`}
                onClick={() => setFilter('scheduled')}
              >
                Scheduled
              </button>
              <button 
                className={`${style.filterTab} ${filter === 'in_progress' ? style.active : ''}`}
                onClick={() => setFilter('in_progress')}
              >
                In Progress
              </button>
              <button 
                className={`${style.filterTab} ${filter === 'completed' ? style.active : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
              <button 
                className={`${style.filterTab} ${filter === 'cancelled' ? style.active : ''}`}
                onClick={() => setFilter('cancelled')}
              >
                Cancelled
              </button>
            </div>

            <div className={style.searchBar}>
              <FaSearch className={style.searchIcon} />
              <input
                type="text"
                placeholder="Search by route, operator or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={style.searchInput}
              />
              <button className={style.filterBtn} onClick={() => setShowFilters(!showFilters)}>
                <FaFilter />
              </button>
            </div>
          </div>

          {/* Trips Grid/List */}
          {filteredTrips.length === 0 ? (
            <div className={style.emptyState}>
              <FaBus className={style.emptyIcon} />
              <h4>No trips found</h4>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={style.tripsGrid}>
              {filteredTrips.map((trip) => {
                const operatorName = trip.vehicle?.operator_name || "Bus";
                const initials = getInitials(operatorName);
                const bgColor = getOperatorColor(operatorName);
                const hasImage = trip.vehicle?.vehicle_image && trip.vehicle.vehicle_image !== "" && !trip.vehicle.vehicle_image.includes("example.com");
                
                return (
                  <div key={trip.id} className={style.tripCard}>
                    <div className={style.tripImage}>
                      {hasImage ? (
                        <img 
                          src={trip.vehicle.vehicle_image} 
                          alt={operatorName} 
                        />
                      ) : (
                        <div 
                          className={style.defaultImage}
                          style={{ backgroundColor: bgColor }}
                        >
                          <span className={style.initialsText}>{initials}</span>
                          <FaBus className={style.busIcon} />
                        </div>
                      )}
                      <span className={style.statusBadge} style={{ background: getStatusColor(trip.status) }}>
                        {getStatusIcon(trip.status)}
                        {trip.status || "SCHEDULED"}
                      </span>
                      <span className={style.availableBadge}>
                        {trip.available_seats || 0} seats left
                      </span>
                    </div>
                    <div className={style.tripBody}>
                      <div className={style.tripHeader}>
                        <div className={style.operatorInfo}>
                          <span className={style.operatorName}>{operatorName}</span>
                          <span className={style.vehicleType}>
                            {trip.vehicle?.vehicle_type || "Bus"} • {trip.vehicle?.service_class || "Standard"}
                          </span>
                          <span className={style.registrationNumber}>
                            {trip.vehicle?.registration_number || ""}
                          </span>
                        </div>
                      </div>

                      <div className={style.routeInfo}>
                        <div className={style.locationGroup}>
                          <div className={style.locationPoint}>
                            <div className={style.pointDot} style={{ background: '#1976d2' }}></div>
                            <div>
                              <span className={style.timeLabel}>{formatTime(trip.departure_time)}</span>
                              <span className={style.locationName}>{trip.departure_location || "N/A"}</span>
                            </div>
                          </div>
                          <div className={style.routeLine}>
                            <span className={style.duration}>{getDuration(trip.departure_time, trip.arrival_time)}</span>
                          </div>
                          <div className={style.locationPoint}>
                            <div className={style.pointDot} style={{ background: '#d32f2f' }}></div>
                            <div>
                              <span className={style.timeLabel}>{formatTime(trip.arrival_time)}</span>
                              <span className={style.locationName}>{trip.arrival_location || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className={style.dateInfo}>
                          <FaCalendarAlt className={style.calendarIcon} />
                          <span>{formatDate(trip.departure_time)}</span>
                        </div>
                      </div>

                      <div className={style.tripMeta}>
                        <div className={style.metaItem}>
                          <FaChair className={style.metaIcon} />
                          <span>{trip.available_seats || 0} seats left</span>
                        </div>
                        <div className={style.metaItem}>
                          <FaUsers className={style.metaIcon} />
                          <span>{trip.vehicle?.total_seats || 0} total</span>
                        </div>
                        <div className={style.metaItem}>
                          <FaDollarSign className={style.metaIcon} />
                          <span>{formatCurrency(trip.base_price || 0)}</span>
                        </div>
                      </div>

                      <div className={style.tripActions}>
                        <button className={style.actionBtn} onClick={() => handleViewTrip(trip.id)}>
                          <FaEye /> View
                        </button>
                        <button className={style.actionBtn} onClick={() => navigate(`/trips/edit/${trip.id}`)}>
                          <FaEdit /> Edit
                        </button>
                        <button className={`${style.actionBtn} ${style.dangerBtn}`}>
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={style.tripsList}>
              <table className={style.tripsTable}>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Operator</th>
                    <th>Date/Time</th>
                    <th>Seats</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <div className={style.routeCell}>
                          <span className={style.departureCell}>{trip.departure_location}</span>
                          <FaArrowRight className={style.routeArrowSmall} />
                          <span className={style.arrivalCell}>{trip.arrival_location}</span>
                        </div>
                      </td>
                      <td>
                        <div className={style.operatorCell}>
                          <span className={style.operatorNameCell}>{trip.vehicle?.operator_name}</span>
                          <span className={style.regNumber}>{trip.vehicle?.registration_number}</span>
                        </div>
                      </td>
                      <td>
                        <div className={style.dateTimeCell}>
                          <span>{formatDate(trip.departure_time)}</span>
                          <span className={style.timeText}>{formatTime(trip.departure_time)}</span>
                        </div>
                      </td>
                      <td className={style.seatsCell}>
                        <span>{trip.available_seats || 0} / {trip.vehicle?.total_seats || 0}</span>
                      </td>
                      <td className={style.priceCell}>{formatCurrency(trip.base_price || 0)}</td>
                      <td>
                        <span 
                          className={style.statusBadge}
                          style={{
                            backgroundColor: getStatusBackground(trip.status),
                            color: getStatusColor(trip.status)
                          }}
                        >
                          {getStatusIcon(trip.status)}
                          {trip.status || "SCHEDULED"}
                        </span>
                      </td>
                      <td>
                        <div className={style.actionButtons}>
                          <button className={style.iconBtn} onClick={() => handleViewTrip(trip.id)}>
                            <FaEye />
                          </button>
                          <button className={style.iconBtn} onClick={() => navigate(`/trips/edit/${trip.id}`)}>
                            <FaEdit />
                          </button>
                          <button className={`${style.iconBtn} ${style.dangerIcon}`}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminTrips;