import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaTicketAlt, 
  FaCalendarAlt,
  FaChair,
  FaDownload,
  FaBus,
  FaMapMarkerAlt,
  FaClock,
  FaSearch,
  FaFilter,
  FaArrowRight,
  FaEye,
  FaShare,
  FaCheckCircle,
  FaTimesCircle,
  FaClock as FaClockIcon,
  FaInfoCircle,
  FaSpinner
} from "react-icons/fa";
import { MdHistory, MdLocationOn, MdDateRange } from "react-icons/md";
import { BsFillStarFill } from "react-icons/bs";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { fetchUserData } from "../../Components/titan.js";
import { generateTicketPDF, buildTicketHTML } from "../../Components/ticketPdfGenerator.js";
import BookingDetailsModal from "./components/BookingDetailsModal.jsx";

const Bookings = () => {
  const navigate = useNavigate();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [exportingBookingId, setExportingBookingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch bookings from API
  useEffect(() => {
    const token = access_token || localStorage.getItem('access_token');
    if (token) {
      fetchBookings(token);
    } else {
      setLoading(false);
      setError("Please login to view your bookings");
    }
  }, [access_token]);

  const fetchBookings = async (token) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchUserData(token, "booking/user");

      if (response && response.data) {
        setBookings(response.data);
        setStats({
          total: response.totalBookings || response.data.length,
          active: response.data.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length,
          pending: response.data.filter(b => b.status === 'PENDING').length
        });
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
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

  const handleViewDetails = (booking) => {
  setSelectedBooking(booking);
  setShowDetailsModal(true);
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

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return <FaCheckCircle />;
      case 'CANCELLED':
        return <FaTimesCircle />;
      case 'PENDING':
        return <FaClockIcon />;
      default:
        return <FaInfoCircle />;
    }
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    return style[status?.toLowerCase() || 'pending'];
  };

  // Helper function to get payment status class
  const getPaymentStatusClass = (status) => {
    return style[status?.toLowerCase() || 'pending'];
  };

  // Helper function to generate booking reference if not provided
  const getBookingReference = (booking) => {
    return booking.id || `BK-${booking.id?.substring(0, 8) || Date.now()}`;
  };

  // Handle download ticket
  const handleDownloadTicket = async (booking) => {
    try {
      setExportingBookingId(booking.id);

      // Prepare passenger details from the booking data
      const passengerDetails = (booking.passengers || []).map((passenger, index) => {
        const seat = (booking.seats || [])[index] || {};
        return {
          seat_number: passenger.seat_number || seat.seat_number || `S${index + 1}`,
          passenger_name: passenger.passenger_name || passenger.name || "Passenger",
          gender: passenger.passenger_gender || passenger.gender || "N/A",
          contact: passenger.passenger_contact || passenger.contact || "N/A"
        };
      });

      // If no passengers data, use seat data
      if (passengerDetails.length === 0 && booking.seats) {
        booking.seats.forEach((seat, index) => {
          passengerDetails.push({
            seat_number: seat.seat_number || `S${index + 1}`,
            passenger_name: `Passenger ${index + 1}`,
            gender: "N/A",
            contact: "N/A"
          });
        });
      }

      // Prepare trip data
      const tripData = {
        departure_location: booking.trip?.departure_location || "N/A",
        arrival_location: booking.trip?.arrival_location || "N/A",
        departure_time: booking.trip?.departure_time || new Date().toISOString(),
        arrival_time: booking.trip?.arrival_time || new Date().toISOString(),
        vehicle: {
          operator_name: booking.trip?.vehicle?.operator_name || "N/A",
          vehicle_type: booking.trip?.vehicle?.vehicle_type || "Bus",
          registration_number: booking.trip?.vehicle?.registration_number || "N/A"
        }
      };


      const bookingRef = getBookingReference(booking);
      const totalAmount = parseFloat(booking.total_amount || 0);

      const htmlContent = buildTicketHTML({
        bookingReference: bookingRef,
        passengerDetails: passengerDetails,
        trip: tripData,
        totalAmount: totalAmount,
        formatDate: formatDate
      });

      await generateTicketPDF({
        htmlContent: htmlContent,
        filename: `Ticket-${bookingRef}-${new Date().toISOString().split('T')[0]}.pdf`,
        options: {
          scale: 2.5,
          backgroundColor: '#ffffff'
        }
      });

    } catch (error) {
      alert('Failed to generate ticket. Please try again.');
    } finally {
      setExportingBookingId(null);
    }
  };

  // Filter bookings based on status and search
  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter.toUpperCase();
    const matchesSearch = 
      (booking.trip?.departure_location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.trip?.arrival_location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBookingReference(booking).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <Layout>
        <div className={style.loadingContainer}>
          <FaSpinner className={style.loadingSpinner} />
          <p>Loading your bookings...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={style.errorContainer}>
          <div className={style.errorContent}>
            <h3>Failed to load bookings</h3>
            <p>{error}</p>
            <button className={style.retryBtn} onClick={() => {
              const token = access_token || localStorage.getItem('access_token');
              if (token) fetchBookings(token);
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
      <div className={style.bookings}>
        <div className={style.bookingsContent}>
          {/* Header */}
          <div className={style.header}>
            <div>
              <h1>My Bookings</h1>
              <p>View and manage all your bus bookings</p>
            </div>
            <button className={style.bookNowBtn} onClick={() => navigate("/trips")}>
              <FaBus className={style.btnIcon} />
              Book New Trip
            </button>
          </div>

          {/* Stats Cards */}
          <div className={style.statsRow}>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#e3f2fd' }}>
                <FaTicketAlt className={style.statIcon} style={{ color: '#1976d2' }} />
              </div>
              <div className={style.statInfo}>
                <h3 className={style.statNumber}>{stats.total}</h3>
                <p className={style.statLabel}>Total Bookings</p>
              </div>
            </div>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#e8f5e9' }}>
                <FaCheckCircle className={style.statIcon} style={{ color: '#388e3c' }} />
              </div>
              <div className={style.statInfo}>
                <h3 className={style.statNumber}>{stats.active}</h3>
                <p className={style.statLabel}>Active Bookings</p>
              </div>
            </div>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#fff3e0' }}>
                <FaClockIcon className={style.statIcon} style={{ color: '#f57c00' }} />
              </div>
              <div className={style.statInfo}>
                <h3 className={style.statNumber}>{stats.pending}</h3>
                <p className={style.statLabel}>Pending Bookings</p>
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
                All
              </button>
              <button 
                className={`${style.filterTab} ${filter === 'confirmed' ? style.active : ''}`}
                onClick={() => setFilter('confirmed')}
              >
                Confirmed
              </button>
              <button 
                className={`${style.filterTab} ${filter === 'pending' ? style.active : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending
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
                placeholder="Search by route or booking reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={style.searchInput}
              />
            </div>
          </div>

          {/* Bookings List */}
          <div className={style.bookingsList}>
            {filteredBookings.length === 0 ? (
              <div className={style.emptyState}>
                <FaTicketAlt className={style.emptyIcon} />
                <h4>No bookings found</h4>
                <p>Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className={style.bookingCard}>
                  <div className={style.bookingHeader}>
                    <div className={style.bookingInfo}>
                      <div className={style.bookingRef}>
                        <span className={style.refLabel}>Booking Reference</span>
                        <span className={style.refValue}>{getBookingReference(booking)}</span>
                      </div>
                      <div className={style.bookingDate}>
                        <FaCalendarAlt className={style.dateIcon} />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                    </div>
                    <div className={style.bookingStatus}>
                      <span className={`${style.statusBadge} ${getStatusBadgeClass(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status || "PENDING"}
                      </span>
                      <span className={`${style.paymentStatus} ${getPaymentStatusClass(booking.payment_status)}`}>
                        {booking.payment_status || "PENDING"}
                      </span>
                    </div>
                  </div>

                  <div className={style.bookingDetails}>
                    <div className={style.routeInfo}>
                      <div className={style.locationInfo}>
                        <div className={style.location}>
                          <FaMapMarkerAlt className={style.markerIcon} style={{ color: '#1976d2' }} />
                          <div>
                            <span className={style.locationLabel}>Departure</span>
                            <span className={style.locationValue}>{booking.trip?.departure_location || "N/A"}</span>
                          </div>
                        </div>
                        <div className={style.routeArrow}>
                          <FaArrowRight />
                        </div>
                        <div className={style.location}>
                          <FaMapMarkerAlt className={style.markerIcon} style={{ color: '#d32f2f' }} />
                          <div>
                            <span className={style.locationLabel}>Arrival</span>
                            <span className={style.locationValue}>{booking.trip?.arrival_location || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className={style.timeInfo}>
                        <div className={style.timeItem}>
                          <FaClock className={style.timeIcon} />
                          <div>
                            <span className={style.timeLabel}>Departure</span>
                            <span className={style.timeValue}>{formatTime(booking.trip?.departure_time)}</span>
                          </div>
                        </div>
                        <div className={style.timeItem}>
                          <FaClock className={style.timeIcon} />
                          <div>
                            <span className={style.timeLabel}>Arrival</span>
                            <span className={style.timeValue}>{formatTime(booking.trip?.arrival_time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={style.bookingMeta}>
                      <div className={style.metaItem}>
                        <FaBus className={style.metaIcon} />
                        <span>{booking.trip?.vehicle?.operator_name || "N/A"}</span>
                      </div>
                      <div className={style.metaItem}>
                        <FaChair className={style.metaIcon} />
                        <span>{booking.seats?.length || 0} seats</span>
                      </div>
                      <div className={style.metaItem}>
                        <FaTicketAlt className={style.metaIcon} />
                        <span>{booking.passenger_count || 0} passengers</span>
                      </div>
                      <div className={style.metaItem}>
                        <span className={style.totalAmount}>KSh {parseFloat(booking.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className={style.specialRequests}>
                        <FaInfoCircle className={style.infoIcon} />
                        <span>Special Request: {booking.special_requests}</span>
                      </div>
                    )}

                    {booking.seats && booking.seats.length > 0 && (
                      <div className={style.seatInfo}>
                        <span className={style.seatLabel}>Seats:</span>
                        {booking.seats.map((seat, index) => (
                          <span key={seat.id || index} className={style.seatTag}>
                            {seat.seat_number || seat.seatNumber || "N/A"} 
                            {seat.seat_type ? ` (${seat.seat_type})` : ''}
                            {index < booking.seats.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}

                    {booking.passengers && booking.passengers.length > 0 && (
                      <div className={style.passengerInfo}>
                        <span className={style.passengerLabel}>Passengers:</span>
                        {booking.passengers.map((passenger, index) => (
                          <span key={passenger.id || index} className={style.passengerTag}>
                            {passenger.passenger_name || passenger.name || "N/A"}
                            {index < booking.passengers.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={style.bookingActions}>
                    <button 
  className={style.actionBtn} 
  onClick={() => handleViewDetails(booking)}
>
  <FaEye className={style.actionIcon} />
  View Details
</button>

                    <button 
                      className={style.actionBtn} 
                      onClick={() => handleDownloadTicket(booking)}
                      disabled={exportingBookingId === booking.id}
                    >
                      {exportingBookingId === booking.id ? (
                        <>
                          <FaSpinner className={`${style.actionIcon} ${style.spinner}`} />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaDownload className={style.actionIcon} />
                          Download Ticket
                        </>
                      )}
                    </button>
                    <button className={style.actionBtn}>
                      <FaShare className={style.actionIcon} />
                      Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showDetailsModal && (
  <BookingDetailsModal
    booking={selectedBooking}
    onClose={() => {
      setShowDetailsModal(false);
      setSelectedBooking(null);
    }}
    formatDate={formatDate}
    formatTime={formatTime}
    getStatusIcon={getStatusIcon}
  />
)}
    </Layout>
  );
};

export default Bookings;