import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCalendarAlt,
  FaArrowLeft,
  FaChair,
  FaUsers,
  FaDollarSign,
  FaEdit,
  FaTrash,
  FaDownload,
  FaShare,
  FaCheckCircle,
  FaTimesCircle,
  FaClock as FaClockIcon,
  FaInfoCircle,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaTimes,
  FaSpinner,
  FaUserCircle,
  FaIdCard,
  FaCreditCard
} from "react-icons/fa";
import { MdLocationOn, MdDateRange, MdPeople } from "react-icons/md";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { fetchUserData } from "../../Components/titan.js";

const TripView = () => {
  const navigate = useNavigate();
  const { id: pathId } = useParams();
  const [searchParams] = useSearchParams();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trip, setTrip] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState(null);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [loadingSeatDetails, setLoadingSeatDetails] = useState(false);

  // Get trip ID from path param or query string
  const tripId = pathId || searchParams.get('id');

  // Fetch trip data
  useEffect(() => {
    const token = access_token || localStorage.getItem('access_token');
    if (token && tripId) {
      fetchTripData(token);
    } else if (!tripId) {
      setError("No trip ID provided. Please go back and select a trip.");
      setLoading(false);
    } else {
      setError("Please login to view trip details");
      setLoading(false);
    }
  }, [tripId, access_token]);

  const fetchTripData = async (token) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchUserData(token, `trip/id/${tripId}`);
      
      if (response) {
        setTrip(response);
      } else {
        setError("Failed to load trip data");
      }
    } catch (err) {
      setError(err.message || "Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch seat details when a booked seat is clicked
  const fetchSeatDetails = async (seatId) => {
    try {
      setLoadingSeatDetails(true);
      const token = access_token || localStorage.getItem('access_token');
      const response = await fetchUserData(token, `trip_seat/${seatId}`);
      setSelectedSeatDetails(response);
    } catch (err) {
      setSelectedSeatDetails(null);
    } finally {
      setLoadingSeatDetails(false);
    }
  };

  // Helper functions
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

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "KSh 0.00";
    return `KSh ${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'SCHEDULED': return '#1976d2';
      case 'IN_PROGRESS': return '#f57c00';
      case 'COMPLETED': return '#388e3c';
      case 'CANCELLED': return '#d32f2f';
      default: return '#718096';
    }
  };

  const getStatusBackground = (status) => {
    switch(status) {
      case 'SCHEDULED': return '#dbeafe';
      case 'IN_PROGRESS': return '#fef3c7';
      case 'COMPLETED': return '#dcfce7';
      case 'CANCELLED': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'SCHEDULED': return <FaClockIcon />;
      case 'IN_PROGRESS': return <FaClockIcon />;
      case 'COMPLETED': return <FaCheckCircle />;
      case 'CANCELLED': return <FaTimesCircle />;
      default: return <FaInfoCircle />;
    }
  };

  const handleSeatClick = async (seat) => {
    if (!seat.is_available && seat.id) {
      setSelectedSeat(seat);
      setShowSeatModal(true);
      // Fetch seat details
      await fetchSeatDetails(seat.id);
    }
  };

  const closeModal = () => {
    setShowSeatModal(false);
    setSelectedSeat(null);
    setSelectedSeatDetails(null);
  };

  // Seat Details Modal Component
  const SeatDetailsModal = () => {
    if (!selectedSeat) return null;
    
    const seatDetail = selectedSeatDetails;
    const booking = seatDetail?.booking;
    const tripInfo = seatDetail?.trip;
    const passenger = seatDetail?.passenger;
    const user = booking?.user;

    return (
      <div className={style.modalOverlay} onClick={closeModal}>
        <div className={style.modalContent} onClick={(e) => e.stopPropagation()}>
          <button className={style.modalCloseBtn} onClick={closeModal}>
            <FaTimes />
          </button>
          
          <div className={style.modalHeader}>
            <h3>Seat Details</h3>
            <span className={style.seatNumberBadge}>{selectedSeat.seat_number}</span>
          </div>

          {loadingSeatDetails ? (
            <div className={style.loadingSeatContainer}>
              <FaSpinner className={style.loadingSpinner} />
              <p>Loading seat details...</p>
            </div>
          ) : (
            <div className={style.modalBody}>
              {/* Seat Information */}
              <div className={style.modalSection}>
                <h4>Seat Information</h4>
                <div className={style.modalInfoGrid}>
                  <div className={style.modalInfoItem}>
                    <span className={style.modalInfoLabel}>Seat Number</span>
                    <span className={style.modalInfoValue}>{selectedSeat.seat_number}</span>
                  </div>
                  <div className={style.modalInfoItem}>
                    <span className={style.modalInfoLabel}>Row</span>
                    <span className={style.modalInfoValue}>{selectedSeat.seat_row}</span>
                  </div>
                  <div className={style.modalInfoItem}>
                    <span className={style.modalInfoLabel}>Type</span>
                    <span className={style.modalInfoValue}>{selectedSeat.seat_type}</span>
                  </div>
                  <div className={style.modalInfoItem}>
                    <span className={style.modalInfoLabel}>Price</span>
                    <span className={style.modalInfoValue}>{formatCurrency(selectedSeat.price)}</span>
                  </div>
                </div>
              </div>

              {/* Passenger Information (Who is sitting there) */}
              {passenger && (
                <div className={style.modalSection}>
                  <h4><FaUser className={style.sectionIcon} /> Passenger Details</h4>
                  <div className={style.modalInfoGrid}>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>
                        <FaUserCircle className={style.infoIcon} /> Name
                      </span>
                      <span className={style.modalInfoValue}>{passenger.passenger_name || "N/A"}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>
                        <FaIdCard className={style.infoIcon} /> Gender
                      </span>
                      <span className={style.modalInfoValue}>{passenger.passenger_gender || "N/A"}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>
                        <FaPhone className={style.infoIcon} /> Contact
                      </span>
                      <span className={style.modalInfoValue}>{passenger.passenger_contact || "N/A"}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>
                        <FaChair className={style.infoIcon} /> Seat Number
                      </span>
                      <span className={style.modalInfoValue}>{passenger.seat_number || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* User Information (Who paid) */}
              {user && (
                <div className={style.modalSection}>
                  <h4><FaCreditCard className={style.sectionIcon} /> Payment & Booking Details</h4>
                  <div className={style.modalInfoGrid}>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>
                        <FaUserCircle className={style.infoIcon} /> Paid By
                      </span>
                      <span className={style.modalInfoValue}>{user.name || "N/A"}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>
                        <FaEnvelope className={style.infoIcon} /> Email
                      </span>
                      <span className={style.modalInfoValue}>{user.email || "N/A"}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>
                        <FaPhone className={style.infoIcon} /> Phone
                      </span>
                      <span className={style.modalInfoValue}>{user.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Information */}
              {booking && (
                <div className={style.modalSection}>
                  <h4>Booking Information</h4>
                  <div className={style.modalInfoGrid}>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Booking ID</span>
                      <span className={style.modalInfoValue}>{booking.id?.substring(0, 8)}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Status</span>
                      <span className={style.modalInfoValue}>
                        <span className={style.bookingStatusChip} style={{
                          backgroundColor: booking.status === 'CONFIRMED' ? '#dcfce7' : '#fef3c7',
                          color: booking.status === 'CONFIRMED' ? '#16a34a' : '#f59e0b'
                        }}>
                          {booking.status}
                        </span>
                      </span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Payment Method</span>
                      <span className={style.modalInfoValue}>{booking.payment_method || "N/A"}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Booking Date</span>
                      <span className={style.modalInfoValue}>{formatDate(booking.booking_date)}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Special Requests</span>
                      <span className={style.modalInfoValue}>{booking.special_requests || "None"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Trip Information */}
              {tripInfo && (
                <div className={style.modalSection}>
                  <h4>Trip Information</h4>
                  <div className={style.modalInfoGrid}>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Route</span>
                      <span className={style.modalInfoValue}>
                        {tripInfo.departure_location} → {tripInfo.arrival_location}
                      </span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Departure</span>
                      <span className={style.modalInfoValue}>{formatDate(tripInfo.departure_time)} at {formatTime(tripInfo.departure_time)}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Operator</span>
                      <span className={style.modalInfoValue}>{tripInfo.vehicle?.operator_name || "N/A"}</span>
                    </div>
                    <div className={style.modalInfoItem}>
                      <span className={style.modalInfoLabel}>Vehicle</span>
                      <span className={style.modalInfoValue}>
                        {tripInfo.vehicle?.vehicle_type || "N/A"} • {tripInfo.vehicle?.registration_number || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!passenger && !booking && !loadingSeatDetails && (
                <div className={style.modalSection}>
                  <div className={style.noPassengerInfo}>
                    <FaInfoCircle className={style.noPassengerIcon} />
                    <p>No passenger or booking information available for this seat.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={style.modalFooter}>
            <button className={style.modalCloseFooterBtn} onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className={style.loadingContainer}>
          <FaSpinner className={style.loadingSpinner} />
          <p>Loading trip details...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={style.errorContainer}>
          <div className={style.errorContent}>
            <h3>Failed to load trip</h3>
            <p>{error}</p>
            <button className={style.retryBtn} onClick={() => {
              const token = access_token || localStorage.getItem('access_token');
              if (token && tripId) fetchTripData(token);
            }}>
              Try Again
            </button>
            <button className={style.backBtn} onClick={() => navigate("/trips")} style={{ marginTop: '12px', marginLeft: '12px' }}>
              Back to Trips
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout>
        <div className={style.errorContainer}>
          <div className={style.errorContent}>
            <h3>Trip not found</h3>
            <p>The trip you're looking for doesn't exist.</p>
            <button className={style.retryBtn} onClick={() => navigate("/trips")}>
              Back to Trips
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={style.tripView}>
        <div className={style.tripViewContent}>
          {/* Header */}
          <div className={style.header}>
            <button className={style.backButton} onClick={() => navigate("/trips")}>
              <FaArrowLeft /> Back to Trips
            </button>
            <div className={style.headerActions}>
              <button className={style.actionBtn} onClick={() => navigate(`/trips/edit/${trip.id}`)}>
                <FaEdit /> Edit
              </button>
              <button className={`${style.actionBtn} ${style.dangerBtn}`}>
                <FaTrash /> Delete
              </button>
            </div>
          </div>

          {/* Trip Overview Card */}
          <div className={style.overviewCard}>
            <div className={style.overviewHeader}>
              <div className={style.routeDisplay}>
                <div className={style.routePoint}>
                  <span className={style.pointLabel}>DEPARTURE</span>
                  <span className={style.pointLocation}>{trip.departure_location}</span>
                  <span className={style.pointTime}>
                    <FaClock className={style.timeIcon} />
                    {formatDate(trip.departure_time)} at {formatTime(trip.departure_time)}
                  </span>
                </div>
                <div className={style.routeArrow}>
                  <FaArrowLeft className={style.arrowIcon} />
                  <span className={style.routeDuration}>
                    {trip.departure_location?.substring(0, 3) || 'N/A'} → {trip.arrival_location?.substring(0, 3) || 'N/A'}
                  </span>
                </div>
                <div className={style.routePoint}>
                  <span className={style.pointLabel}>ARRIVAL</span>
                  <span className={style.pointLocation}>{trip.arrival_location}</span>
                  <span className={style.pointTime}>
                    <FaClock className={style.timeIcon} />
                    {formatDate(trip.arrival_time)} at {formatTime(trip.arrival_time)}
                  </span>
                </div>
              </div>
              <div className={style.statusBadge} style={{ backgroundColor: getStatusBackground(trip.status), color: getStatusColor(trip.status) }}>
                {getStatusIcon(trip.status)}
                {trip.status || "SCHEDULED"}
              </div>
            </div>

            <div className={style.overviewStats}>
              <div className={style.statItem}>
                <span className={style.statValue}>{formatCurrency(trip.base_price)}</span>
                <span className={style.statLabel}>Base Price</span>
              </div>
              <div className={style.statItem}>
                <span className={style.statValue}>{trip.available_seats} / {trip.vehicle?.total_seats || 0}</span>
                <span className={style.statLabel}>Available Seats</span>
              </div>
              <div className={style.statItem}>
                <span className={style.statValue}>{trip.bookings?.length || 0}</span>
                <span className={style.statLabel}>Total Bookings</span>
              </div>
              <div className={style.statItem}>
                <span className={style.statValue}>
                  {formatCurrency(trip.bookings?.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0) || 0)}
                </span>
                <span className={style.statLabel}>Total Revenue</span>
              </div>
            </div>

            <div className={style.overviewMeta}>
              <div className={style.metaItem}>
                <FaBus className={style.metaIcon} />
                <div>
                  <span className={style.metaLabel}>Operator</span>
                  <span className={style.metaValue}>{trip.vehicle?.operator_name || "N/A"}</span>
                </div>
              </div>
              <div className={style.metaItem}>
                <FaChair className={style.metaIcon} />
                <div>
                  <span className={style.metaLabel}>Vehicle Type</span>
                  <span className={style.metaValue}>{trip.vehicle?.vehicle_type || "N/A"} • {trip.vehicle?.service_class || "N/A"}</span>
                </div>
              </div>
              <div className={style.metaItem}>
                <FaCalendarAlt className={style.metaIcon} />
                <div>
                  <span className={style.metaLabel}>Registration</span>
                  <span className={style.metaValue}>{trip.vehicle?.registration_number || "N/A"}</span>
                </div>
              </div>
              <div className={style.metaItem}>
                <div className={style.ratingDisplay}>
                  <span className={style.ratingCount}>{trip.seats?.filter(s => !s.is_available).length || 0} seats booked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={style.tabsContainer}>
            <button 
              className={`${style.tab} ${activeTab === 'overview' ? style.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FaInfoCircle /> Overview
            </button>
            <button 
              className={`${style.tab} ${activeTab === 'seats' ? style.active : ''}`}
              onClick={() => setActiveTab('seats')}
            >
              <FaChair /> Seat Layout
            </button>
          </div>

          {/* Tab Content */}
          <div className={style.tabContent}>
            {activeTab === 'overview' && (
              <div className={style.overviewTab}>
                <div className={style.detailsCard}>
                  <h4>Trip Details</h4>
                  <div className={style.detailsGrid}>
                    <div className={style.detailItem}>
                      <span className={style.detailLabel}>Trip ID</span>
                      <span className={style.detailValue}>{trip.id}</span>
                    </div>
                    <div className={style.detailItem}>
                      <span className={style.detailLabel}>Status</span>
                      <span className={style.detailValue}>{trip.status}</span>
                    </div>
                    <div className={style.detailItem}>
                      <span className={style.detailLabel}>Base Price</span>
                      <span className={style.detailValue}>{formatCurrency(trip.base_price)}</span>
                    </div>
                    <div className={style.detailItem}>
                      <span className={style.detailLabel}>Available Seats</span>
                      <span className={style.detailValue}>{trip.available_seats}</span>
                    </div>
                  </div>
                </div>

                <div className={style.seatStatsCard}>
                  <h4>Seat Statistics</h4>
                  <div className={style.seatStatsGrid}>
                    <div className={style.seatStat}>
                      <span className={style.seatStatValue}>{trip.seats?.filter(s => s.is_available).length || 0}</span>
                      <span className={style.seatStatLabel}>Available</span>
                      <div className={style.seatStatBar}>
                        <div 
                          className={style.seatStatFill} 
                          style={{ 
                            width: `${((trip.seats?.filter(s => s.is_available).length || 0) / (trip.seats?.length || 1)) * 100}%`,
                            background: '#10b981'
                          }}
                        />
                      </div>
                    </div>
                    <div className={style.seatStat}>
                      <span className={style.seatStatValue}>{trip.seats?.filter(s => !s.is_available).length || 0}</span>
                      <span className={style.seatStatLabel}>Booked</span>
                      <div className={style.seatStatBar}>
                        <div 
                          className={style.seatStatFill} 
                          style={{ 
                            width: `${((trip.seats?.filter(s => !s.is_available).length || 0) / (trip.seats?.length || 1)) * 100}%`,
                            background: '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                    <div className={style.seatStat}>
                      <span className={style.seatStatValue}>{trip.seats?.length || 0}</span>
                      <span className={style.seatStatLabel}>Total Seats</span>
                      <div className={style.seatStatBar}>
                        <div 
                          className={style.seatStatFill} 
                          style={{ width: '100%', background: '#1976d2' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seats' && (
              <div className={style.seatsTab}>
                <div className={style.seatLayoutCard}>
                  <h4>Seat Layout</h4>
                  <div className={style.seatLegend}>
                    <span className={style.legendItem}>
                      <span className={`${style.legendBox} ${style.legendAvailable}`}></span>
                      Available
                    </span>
                    <span className={style.legendItem}>
                      <span className={`${style.legendBox} ${style.legendBooked}`}></span>
                      Booked (Click for details)
                    </span>
                  </div>

                  <div className={style.seatLayoutGrid}>
                    <div className={style.seatLayoutHeader}>
                      <span>Row</span>
                      <span>A</span>
                      <span>B</span>
                      <span>C</span>
                    </div>
                    {Array.from({ length: 11 }, (_, i) => i + 1).map(row => {
                      const rowSeats = trip.seats?.filter(s => s.seat_row === row) || [];
                      return (
                        <div key={row} className={style.seatLayoutRow}>
                          <span className={style.rowLabel}>R{row}</span>
                          {['A', 'B', 'C'].map(col => {
                            const seat = rowSeats.find(s => s.seat_column === col);
                            const isVip = row === 1;
                            const isBooked = seat && !seat.is_available;
                            const isAvailable = seat && seat.is_available;
                            return (
                              <div 
                                key={col} 
                                className={`${style.seatLayoutSeat} ${isVip ? style.vipSeat : ''} ${isBooked ? style.bookedSeat : ''} ${!seat ? style.emptySeat : ''} ${isBooked ? style.clickableSeat : ''}`}
                                onClick={() => isBooked && handleSeatClick(seat)}
                                title={isBooked ? `Click to view details for Seat ${seat.seat_number}` : seat ? `Seat ${seat.seat_number} - Available` : 'No seat'}
                              >
                                {seat ? (
                                  <>
                                    <FaChair />
                                    <span>{seat.seat_number}</span>
                                    {isBooked && <span className={style.seatBookedBadge}>📋</span>}
                                  </>
                                ) : (
                                  <span className={style.emptySeat}>-</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  <div className={style.seatInfo}>
                    <div className={style.seatInfoItem}>
                      <span className={style.seatInfoLabel}>Total Seats</span>
                      <span className={style.seatInfoValue}>{trip.seats?.length || 0}</span>
                    </div>
                    <div className={style.seatInfoItem}>
                      <span className={style.seatInfoLabel}>Available</span>
                      <span className={style.seatInfoValue} style={{ color: '#10b981' }}>
                        {trip.seats?.filter(s => s.is_available).length || 0}
                      </span>
                    </div>
                    <div className={style.seatInfoItem}>
                      <span className={style.seatInfoLabel}>Booked</span>
                      <span className={style.seatInfoValue} style={{ color: '#ef4444' }}>
                        {trip.seats?.filter(s => !s.is_available).length || 0}
                      </span>
                    </div>
                    <div className={style.seatInfoItem}>
                      <span className={style.seatInfoLabel}>Seat Types</span>
                      <span className={style.seatInfoValue}>
                        {[...new Set(trip.seats?.map(s => s.seat_type) || [])].join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seat Details Modal */}
      {showSeatModal && <SeatDetailsModal />}
    </Layout>
  );
};

export default TripView;