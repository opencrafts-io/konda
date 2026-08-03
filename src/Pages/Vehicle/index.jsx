import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaBus, 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaFilter,
  FaTimes,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaInfoCircle,
  FaArrowLeft,
  FaCamera,
  FaImage,
  FaCar,
  FaIdCard,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt
} from "react-icons/fa";
import { MdLocationOn, MdDateRange, MdPeople } from "react-icons/md";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { fetchUserData, PosthData, PatchData, DeleteData } from "../../Components/titan.js";

const VehicleManagement = () => {
  const navigate = useNavigate();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchType, setSearchType] = useState("");
  const [searchRegistration, setSearchRegistration] = useState("");
  const [searchOperator, setSearchOperator] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    operator_name: "",
    total_seats: "",
    vehicle_type: "MATATU",
    service_class: "AC",
    registration_number: "",
    vehicle_image: ""
  });

  const vehicleTypes = ["MATATU", "MINIBUS", "BUS", "COACH"];
  const serviceClasses = ["STANDARD", "AC", "VIP", "SEMI_SLEEPER", "SLEEPER"];

  // Fetch all vehicles
  useEffect(() => {
    const token = access_token || localStorage.getItem('access_token');
    if (token) {
      fetchVehicles(token);
    } else {
      setLoading(false);
      setError("Please login to view vehicles");
    }
  }, [access_token]);

  const fetchVehicles = async (token) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchUserData(token, "vehicle");
      console.log("Vehicles:", response);
      
      if (response && response.data) {
        setVehicles(response.data);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  // Search vehicles by type
  const searchByType = async () => {
    if (!searchType.trim()) {
      setError("Please enter a vehicle type");
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      const token = access_token || localStorage.getItem('access_token');
      const response = await fetchUserData(token, `vehicle/type/${searchType.toUpperCase()}`);
      console.log("Search by type:", response);
      
      if (response && response.data) {
        setSearchResults(response.data);
        setVehicles(response.data);
      } else {
        setSearchResults([]);
        setVehicles([]);
        setError("No vehicles found for this type");
      }
    } catch (err) {
      console.error("Error searching vehicles:", err);
      setError(err.message || "Failed to search vehicles");
    } finally {
      setIsSearching(false);
    }
  };

  // Search vehicles by registration
  const searchByRegistration = async () => {
    if (!searchRegistration.trim()) {
      setError("Please enter a registration number");
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      const token = access_token || localStorage.getItem('access_token');
      const response = await fetchUserData(token, `vehicle/registration/${encodeURIComponent(searchRegistration)}`);
      console.log("Search by registration:", response);
      
      if (response) {
        setSearchResults([response]);
        setVehicles([response]);
      } else {
        setSearchResults([]);
        setVehicles([]);
        setError("No vehicle found with this registration");
      }
    } catch (err) {
      console.error("Error searching vehicles:", err);
      setError(err.message || "Failed to search vehicles");
    } finally {
      setIsSearching(false);
    }
  };

  // Search vehicles by operator
  const searchByOperator = async () => {
    if (!searchOperator.trim()) {
      setError("Please enter an operator name");
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      const token = access_token || localStorage.getItem('access_token');
      const response = await fetchUserData(token, `vehicle/operator?operator=${encodeURIComponent(searchOperator)}`);
      console.log("Search by operator:", response);
      
      if (response && response.data) {
        setSearchResults(response.data);
        setVehicles(response.data);
      } else {
        setSearchResults([]);
        setVehicles([]);
        setError("No vehicles found for this operator");
      }
    } catch (err) {
      console.error("Error searching vehicles:", err);
      setError(err.message || "Failed to search vehicles");
    } finally {
      setIsSearching(false);
    }
  };

  // Reset search
  const resetSearch = () => {
    setSearchType("");
    setSearchRegistration("");
    setSearchOperator("");
    setSearchResults(null);
    const token = access_token || localStorage.getItem('access_token');
    if (token) fetchVehicles(token);
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      operator_name: "",
      total_seats: "",
      vehicle_type: "MATATU",
      service_class: "AC",
      registration_number: "",
      vehicle_image: ""
    });
  };

  // Create vehicle
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = access_token || localStorage.getItem('access_token');
      const payload = {
        operator_name: formData.operator_name,
        total_seats: parseInt(formData.total_seats),
        vehicle_type: formData.vehicle_type,
        service_class: formData.service_class,
        registration_number: formData.registration_number,
        vehicle_image: formData.vehicle_image || "https://example.com/images/default.jpg"
      };
      
      console.log("Creating vehicle:", payload);
      const response = await PosthData(token, "vehicle", payload);
      console.log("Create response:", response);
      
      setSuccess("Vehicle created successfully!");
      resetForm();
      setShowCreateModal(false);
      
      // Refresh vehicle list
      await fetchVehicles(token);
      
    } catch (err) {
      console.error("Error creating vehicle:", err);
      setError(err.message || "Failed to create vehicle");
    } finally {
      setLoading(false);
    }
  };

  // Edit vehicle
  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      operator_name: vehicle.operator_name || "",
      total_seats: vehicle.total_seats || "",
      vehicle_type: vehicle.vehicle_type || "MATATU",
      service_class: vehicle.service_class || "AC",
      registration_number: vehicle.registration_number || "",
      vehicle_image: vehicle.vehicle_image || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = access_token || localStorage.getItem('access_token');
      const payload = {
        operator_name: formData.operator_name,
        total_seats: parseInt(formData.total_seats),
        vehicle_type: formData.vehicle_type,
        service_class: formData.service_class,
        registration_number: formData.registration_number,
        vehicle_image: formData.vehicle_image || "https://example.com/images/default.jpg"
      };
      
      console.log("Updating vehicle:", payload);
      const response = await PatchData(token, `vehicle/${selectedVehicle.id}`, payload);
      console.log("Update response:", response);
      
      setSuccess("Vehicle updated successfully!");
      setShowEditModal(false);
      resetForm();
      
      // Refresh vehicle list
      await fetchVehicles(token);
      
    } catch (err) {
      console.error("Error updating vehicle:", err);
      setError(err.message || "Failed to update vehicle");
    } finally {
      setLoading(false);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = access_token || localStorage.getItem('access_token');
      await DeleteData(token, `vehicle/${vehicleId}`, {});
      
      setSuccess("Vehicle deleted successfully!");
      
      // Refresh vehicle list
      await fetchVehicles(token);
      
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError(err.message || "Failed to delete vehicle");
    } finally {
      setLoading(false);
    }
  };

  if (loading && vehicles.length === 0) {
    return (
      <Layout>
        <div className={style.loadingContainer}>
          <FaSpinner className={style.loadingSpinner} />
          <p>Loading vehicles...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={style.vehicleManagement}>
        <div className={style.content}>
          {/* Header */}
          <div className={style.header}>
            <div>
              <h1>Vehicle Management</h1>
              <p>Manage your fleet of vehicles</p>
            </div>
            <button className={style.createBtn} onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}>
              <FaPlus /> Add Vehicle
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className={style.successMessage}>
              <FaCheckCircle className={style.messageIcon} />
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className={style.closeMsgBtn}>
                <FaTimes />
              </button>
            </div>
          )}
          {error && (
            <div className={style.errorMessage}>
              <FaInfoCircle className={style.messageIcon} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className={style.closeMsgBtn}>
                <FaTimes />
              </button>
            </div>
          )}

          {/* Search Section */}
          <div className={style.searchSection}>
            <div className={style.searchGroup}>
              <div className={style.searchInputGroup}>
                <input
                  type="text"
                  placeholder="Search by type (e.g., MATATU)"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className={style.searchInput}
                />
                <button onClick={searchByType} className={style.searchBtn} disabled={isSearching}>
                  {isSearching ? <FaSpinner className={style.spinner} /> : <FaSearch />}
                </button>
              </div>
              <div className={style.searchInputGroup}>
                <input
                  type="text"
                  placeholder="Search by registration"
                  value={searchRegistration}
                  onChange={(e) => setSearchRegistration(e.target.value)}
                  className={style.searchInput}
                />
                <button onClick={searchByRegistration} className={style.searchBtn} disabled={isSearching}>
                  {isSearching ? <FaSpinner className={style.spinner} /> : <FaSearch />}
                </button>
              </div>
              <div className={style.searchInputGroup}>
                <input
                  type="text"
                  placeholder="Search by operator"
                  value={searchOperator}
                  onChange={(e) => setSearchOperator(e.target.value)}
                  className={style.searchInput}
                />
                <button onClick={searchByOperator} className={style.searchBtn} disabled={isSearching}>
                  {isSearching ? <FaSpinner className={style.spinner} /> : <FaSearch />}
                </button>
              </div>
              <button onClick={resetSearch} className={style.resetBtn}>
                <FaTimes /> Reset
              </button>
            </div>
          </div>

          {/* Vehicle Count */}
          <div className={style.vehicleCount}>
            <span>{vehicles.length} vehicle(s) found</span>
          </div>

          {/* Vehicle Grid */}
          <div className={style.vehicleGrid}>
            {vehicles.length === 0 ? (
              <div className={style.emptyState}>
                <FaBus className={style.emptyIcon} />
                <h4>No vehicles found</h4>
                <p>Add your first vehicle to get started</p>
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <div key={vehicle.id} className={style.vehicleCard}>
                  <div className={style.vehicleImage}>
                    {vehicle.vehicle_image ? (
                      <img src={vehicle.vehicle_image} alt={vehicle.operator_name} />
                    ) : (
                      <div className={style.imagePlaceholder}>
                        <FaBus />
                      </div>
                    )}
                  </div>
                  <div className={style.vehicleInfo}>
                    <h3>{vehicle.operator_name}</h3>
                    <div className={style.vehicleDetails}>
                      <span className={style.vehicleTypeBadge}>{vehicle.vehicle_type}</span>
                      <span className={style.serviceClassBadge}>{vehicle.service_class}</span>
                    </div>
                    <div className={style.vehicleMeta}>
                      <div className={style.metaItem}>
                        <FaIdCard />
                        <span>{vehicle.registration_number}</span>
                      </div>
                      <div className={style.metaItem}>
                        <MdPeople />
                        <span>{vehicle.total_seats} seats</span>
                      </div>
                      <div className={style.metaItem}>
                        <FaCalendarAlt />
                        <span>{new Date(vehicle.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {vehicle.trips && vehicle.trips.length > 0 && (
                      <div className={style.tripInfo}>
                        <span className={style.tripCount}>{vehicle.trips.length} trips</span>
                        <span className={style.latestTrip}>
                          Latest: {vehicle.trips[0].departure_location} → {vehicle.trips[0].arrival_location}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={style.vehicleActions}>
                    <button 
                      className={style.actionBtn} 
                      onClick={() => handleEditVehicle(vehicle)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className={`${style.actionBtn} ${style.danger}`} 
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Vehicle Modal */}
      {showCreateModal && (
        <div className={style.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={style.modal} onClick={(e) => e.stopPropagation()}>
            <div className={style.modalHeader}>
              <h2>Add New Vehicle</h2>
              <button onClick={() => setShowCreateModal(false)} className={style.modalClose}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className={style.modalForm}>
              <div className={style.formGroup}>
                <label>Operator Name *</label>
                <input
                  type="text"
                  name="operator_name"
                  value={formData.operator_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Super Metro"
                  required
                />
              </div>
              <div className={style.formGroup}>
                <label>Total Seats *</label>
                <input
                  type="number"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleFormChange}
                  placeholder="e.g. 33"
                  required
                />
              </div>
              <div className={style.formRow}>
                <div className={style.formGroup}>
                  <label>Vehicle Type *</label>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleFormChange}
                    required
                  >
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className={style.formGroup}>
                  <label>Service Class *</label>
                  <select
                    name="service_class"
                    value={formData.service_class}
                    onChange={handleFormChange}
                    required
                  >
                    {serviceClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={style.formGroup}>
                <label>Registration Number *</label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleFormChange}
                  placeholder="e.g. KDE 789Y"
                  required
                />
              </div>
              <div className={style.formGroup}>
                <label>Vehicle Image URL</label>
                <input
                  type="text"
                  name="vehicle_image"
                  value={formData.vehicle_image}
                  onChange={handleFormChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className={style.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={style.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={style.saveBtn} disabled={loading}>
                  {loading ? <FaSpinner className={style.spinner} /> : <FaSave />}
                  {loading ? ' Creating...' : ' Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedVehicle && (
        <div className={style.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={style.modal} onClick={(e) => e.stopPropagation()}>
            <div className={style.modalHeader}>
              <h2>Edit Vehicle</h2>
              <button onClick={() => setShowEditModal(false)} className={style.modalClose}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateVehicle} className={style.modalForm}>
              <div className={style.formGroup}>
                <label>Operator Name *</label>
                <input
                  type="text"
                  name="operator_name"
                  value={formData.operator_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Super Metro"
                  required
                />
              </div>
              <div className={style.formGroup}>
                <label>Total Seats *</label>
                <input
                  type="number"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleFormChange}
                  placeholder="e.g. 33"
                  required
                />
              </div>
              <div className={style.formRow}>
                <div className={style.formGroup}>
                  <label>Vehicle Type *</label>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleFormChange}
                    required
                  >
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className={style.formGroup}>
                  <label>Service Class *</label>
                  <select
                    name="service_class"
                    value={formData.service_class}
                    onChange={handleFormChange}
                    required
                  >
                    {serviceClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={style.formGroup}>
                <label>Registration Number *</label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleFormChange}
                  placeholder="e.g. KDE 789Y"
                  required
                />
              </div>
              <div className={style.formGroup}>
                <label>Vehicle Image URL</label>
                <input
                  type="text"
                  name="vehicle_image"
                  value={formData.vehicle_image}
                  onChange={handleFormChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className={style.modalActions}>
                <button type="button" onClick={() => setShowEditModal(false)} className={style.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={style.saveBtn} disabled={loading}>
                  {loading ? <FaSpinner className={style.spinner} /> : <FaSave />}
                  {loading ? ' Updating...' : ' Update Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VehicleManagement;