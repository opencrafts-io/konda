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
  FaSave,
  FaTimes,
  FaSpinner,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaInfoCircle,
  FaSync,
  FaWifi,
  FaPlug,
  FaTv,
  FaCoffee,
  FaSnowflake,
  FaUtensils
} from "react-icons/fa";
import { MdLocationOn, MdDateRange, MdPeople } from "react-icons/md";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { fetchUserData, PosthData, PatchData } from "../../Components/titan.js";

const EditTrip = () => {
  const navigate = useNavigate();
  const { id: pathId } = useParams();
  const [searchParams] = useSearchParams();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [trip, setTrip] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  // Get trip ID from path param or query string
  const tripId = pathId || searchParams.get('id');

  // Form state
  const [formData, setFormData] = useState({
    departure_location: "",
    arrival_location: "",
    departure_time: "",
    arrival_time: "",
    base_price: "",
    status: "SCHEDULED"
  });

  const [vehicleData, setVehicleData] = useState({
    operator_name: "",
    total_seats: "",
    vehicle_type: "MATATU",
    service_class: "AC",
    registration_number: ""
  });

  // Seat availability toggle
  const [seatUpdates, setSeatUpdates] = useState({});
  const [updatingSeat, setUpdatingSeat] = useState(null);

  // Fetch trip data
  useEffect(() => {
    const token = access_token || localStorage.getItem('access_token');
    if (token && tripId) {
      fetchTripData(token);
    } else if (!tripId) {
      setError("No trip ID provided");
      setLoading(false);
    } else {
      setError("Please login to edit trip");
      setLoading(false);
    }
  }, [tripId, access_token]);

  const fetchTripData = async (token) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchUserData(token, `trip/id/${tripId}`);
      console.log("Trip data:", response);
      
      if (response) {
        setTrip(response);
        // Populate form data
        setFormData({
          departure_location: response.departure_location || "",
          arrival_location: response.arrival_location || "",
          departure_time: response.departure_time ? response.departure_time.slice(0, 16) : "",
          arrival_time: response.arrival_time ? response.arrival_time.slice(0, 16) : "",
          base_price: response.base_price || "",
          status: response.status || "SCHEDULED"
        });
        setVehicleData({
          operator_name: response.vehicle?.operator_name || "",
          total_seats: response.vehicle?.total_seats || "",
          vehicle_type: response.vehicle?.vehicle_type || "MATATU",
          service_class: response.vehicle?.service_class || "AC",
          registration_number: response.vehicle?.registration_number || ""
        });
      } else {
        setError("Failed to load trip data");
      }
    } catch (err) {
      console.error("Error fetching trip:", err);
      setError(err.message || "Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehicleData(prev => ({ ...prev, [name]: value }));
  };

  // Handle trip update
  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = access_token || localStorage.getItem('access_token');
      
      // Prepare update data
      const updateData = {
        departure_location: formData.departure_location,
        arrival_location: formData.arrival_location,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        base_price: formData.base_price,
        status: formData.status
      };

      console.log("Updating trip with:", updateData);
      
      // Use PatchData for partial update
      const response = await PatchData(
        token,
        `trip/${tripId}`,
        updateData
      );
      
      console.log("Update response:", response);
      
      setSuccess("Trip updated successfully!");
      
      // Refresh trip data
      await fetchTripData(token);
      
    } catch (err) {
      console.error("Error updating trip:", err);
      setError(err.message || "Failed to update trip");
    } finally {
      setSaving(false);
    }
  };

  // Handle seat availability toggle
  const handleToggleSeatAvailability = async (seatId, currentStatus) => {
    try {
      setUpdatingSeat(seatId);
      setError(null);
      setSuccess(null);

      const token = access_token || localStorage.getItem('access_token');
      const newStatus = !currentStatus;
      
      const response = await PatchData(
        token,
        `trip_seat/${seatId}/availability`,
        { is_available: newStatus }
      );
      
      console.log("Seat update response:", response);
      
      // Update local seat state
      setTrip(prev => ({
        ...prev,
        seats: prev.seats.map(seat => 
          seat.id === seatId ? { ...seat, is_available: newStatus } : seat
        )
      }));
      
      setSuccess(`Seat ${seatId} ${newStatus ? 'available' : 'booked'} successfully!`);
      
    } catch (err) {
      console.error("Error updating seat:", err);
      setError(err.message || "Failed to update seat");
    } finally {
      setUpdatingSeat(null);
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

  // Vehicle types
  const vehicleTypes = ["COACH", "BUS", "MINIBUS", "MATATU"];
  const serviceClasses = ["STANDARD", "AC", "VIP", "SEMI_SLEEPER", "SLEEPER"];
  const statusOptions = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

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

  if (error && !trip) {
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
      <div className={style.editTrip}>
        <div className={style.editTripContent}>
          {/* Header */}
          <div className={style.header}>
            <button className={style.backButton} onClick={() => navigate("/trips")}>
              <FaArrowLeft /> Back to Trips
            </button>
            <div className={style.headerActions}>
              <button 
                className={`${style.tabBtn} ${activeTab === 'details' ? style.active : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <FaEdit /> Edit Details
              </button>
              <button 
                className={`${style.tabBtn} ${activeTab === 'seats' ? style.active : ''}`}
                onClick={() => setActiveTab('seats')}
              >
                <FaChair /> Manage Seats
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className={style.successMessage}>
              <FaCheckCircle className={style.successIcon} />
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className={style.closeMsgBtn}>
                <FaTimes />
              </button>
            </div>
          )}
          {error && (
            <div className={style.errorMessage}>
              <FaInfoCircle className={style.errorIcon} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className={style.closeMsgBtn}>
                <FaTimes />
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className={style.tabContent}>
            {activeTab === 'details' && (
              <div className={style.detailsTab}>
                <form onSubmit={handleUpdateTrip} className={style.editForm}>
                  <div className={style.formGrid}>
                    {/* Route Information */}
                    <div className={style.formSection}>
                      <h3><FaMapMarkerAlt /> Route Information</h3>
                      <div className={style.formGroup}>
                        <label>Departure Location</label>
                        <input
                          type="text"
                          name="departure_location"
                          value={formData.departure_location}
                          onChange={handleFormChange}
                          placeholder="e.g. Nairobi (CBD - Tea Room)"
                          required
                        />
                      </div>
                      <div className={style.formGroup}>
                        <label>Arrival Location</label>
                        <input
                          type="text"
                          name="arrival_location"
                          value={formData.arrival_location}
                          onChange={handleFormChange}
                          placeholder="e.g. Nakuru (Main Stage)"
                          required
                        />
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className={style.formSection}>
                      <h3><FaClock /> Schedule</h3>
                      <div className={style.formGroup}>
                        <label>Departure Time</label>
                        <input
                          type="datetime-local"
                          name="departure_time"
                          value={formData.departure_time}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className={style.formGroup}>
                        <label>Arrival Time</label>
                        <input
                          type="datetime-local"
                          name="arrival_time"
                          value={formData.arrival_time}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className={style.formSection}>
                      <h3><FaBus /> Vehicle Information</h3>
                      <div className={style.formGroup}>
                        <label>Operator Name</label>
                        <input
                          type="text"
                          name="operator_name"
                          value={vehicleData.operator_name}
                          onChange={handleVehicleChange}
                          placeholder="e.g. Super Metro"
                        />
                      </div>
                      <div className={style.formRow}>
                        <div className={style.formGroup}>
                          <label>Vehicle Type</label>
                          <select
                            name="vehicle_type"
                            value={vehicleData.vehicle_type}
                            onChange={handleVehicleChange}
                          >
                            {vehicleTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className={style.formGroup}>
                          <label>Service Class</label>
                          <select
                            name="service_class"
                            value={vehicleData.service_class}
                            onChange={handleVehicleChange}
                          >
                            {serviceClasses.map(cls => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className={style.formGroup}>
                        <label>Registration Number</label>
                        <input
                          type="text"
                          name="registration_number"
                          value={vehicleData.registration_number}
                          onChange={handleVehicleChange}
                          placeholder="e.g. KDE 789Y"
                        />
                      </div>
                      <div className={style.formGroup}>
                        <label>Total Seats</label>
                        <input
                          type="number"
                          name="total_seats"
                          value={vehicleData.total_seats}
                          onChange={handleVehicleChange}
                          placeholder="e.g. 33"
                        />
                      </div>
                    </div>

                    {/* Pricing & Status */}
                    <div className={style.formSection}>
                      <h3><FaDollarSign /> Pricing & Status</h3>
                      <div className={style.formGroup}>
                        <label>Base Price (KSh)</label>
                        <input
                          type="number"
                          name="base_price"
                          value={formData.base_price}
                          onChange={handleFormChange}
                          placeholder="e.g. 1200"
                          required
                        />
                      </div>
                      <div className={style.formGroup}>
                        <label>Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={style.formActions}>
                    <button type="button" className={style.cancelBtn} onClick={() => navigate("/trips")}>
                      Cancel
                    </button>
                    <button type="submit" className={style.saveBtn} disabled={saving}>
                      {saving ? (
                        <>
                          <FaSpinner className={style.spinner} /> Saving...
                        </>
                      ) : (
                        <>
                          <FaSave /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'seats' && (
              <div className={style.seatsTab}>
                <div className={style.seatManagementCard}>
                  <h4>Manage Seat Availability</h4>
                  <p className={style.seatHint}>Click on a seat to toggle its availability</p>
                  
                  <div className={style.seatLegend}>
                    <span className={style.legendItem}>
                      <span className={`${style.legendBox} ${style.legendAvailable}`}></span>
                      Available (Click to book)
                    </span>
                    <span className={style.legendItem}>
                      <span className={`${style.legendBox} ${style.legendBooked}`}></span>
                      Booked (Click to make available)
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
                                className={`${style.seatLayoutSeat} ${isVip ? style.vipSeat : ''} ${isBooked ? style.bookedSeat : ''} ${!seat ? style.emptySeat : ''} ${style.clickableSeat}`}
                                onClick={() => seat && handleToggleSeatAvailability(seat.id, seat.is_available)}
                                title={seat ? `Seat ${seat.seat_number} - ${seat.is_available ? 'Available' : 'Booked'} - Click to toggle` : 'No seat'}
                              >
                                {seat ? (
                                  <>
                                    <FaChair />
                                    <span>{seat.seat_number}</span>
                                    {updatingSeat === seat.id && (
                                      <FaSpinner className={style.seatSpinner} />
                                    )}
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

                  <div className={style.seatStats}>
                    <div className={style.seatStat}>
                      <span className={style.seatStatValue}>{trip.seats?.filter(s => s.is_available).length || 0}</span>
                      <span className={style.seatStatLabel}>Available</span>
                    </div>
                    <div className={style.seatStat}>
                      <span className={style.seatStatValue}>{trip.seats?.filter(s => !s.is_available).length || 0}</span>
                      <span className={style.seatStatLabel}>Booked</span>
                    </div>
                    <div className={style.seatStat}>
                      <span className={style.seatStatValue}>{trip.seats?.length || 0}</span>
                      <span className={style.seatStatLabel}>Total Seats</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditTrip;