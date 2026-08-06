import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaClock, 
  FaArrowLeft,
  FaChair,
  FaPlus,
  FaMinus,
  FaSync,
  FaTh,
  FaChair as FaSeatIcon,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaInfoCircle,
  FaIdCard,
  FaUser,
  FaTimes
} from "react-icons/fa";
import { GiSteeringWheel } from "react-icons/gi";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { PosthData, fetchUserData } from "../../Components/titan.js";

const AddTrip = () => {
  const navigate = useNavigate();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(false);
  const [searchingVehicle, setSearchingVehicle] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [vehicleSearchAttempted, setVehicleSearchAttempted] = useState(false);

  // Trip Form State
  const [tripData, setTripData] = useState({
    departure_location: "Nairobi (CBD - Tea Room)",
    arrival_location: "Nakuru (Main Stage)",
    departure_time: "",
    arrival_time: "",
    base_price: 500,
    vehicle_id: ""
  });

  // Vehicle Search State
  const [searchRegistration, setSearchRegistration] = useState("");

  // Seat Configuration Setup
  const [seatConfig, setSeatConfig] = useState({
    rows: 11,
    columns: ["A", "B", "C"],
    aisleAfterColumn: "B",
    rowOverrides: {
      "1": { price: 600 },
      "11": { price: 450 }
    }
  });

  const [columnInputText, setColumnInputText] = useState("A, B, C");
  const [seats, setSeats] = useState([]);

  const vehicleTypes = ["MATATU", "MINIBUS", "BUS", "COACH"];
  const serviceClasses = ["STANDARD", "AC", "VIP", "LUXURY"];

  // Search for vehicle by registration
  const searchVehicle = async () => {
    if (!searchRegistration.trim()) {
      setError("Please enter a registration number");
      return;
    }

    try {
      setSearchingVehicle(true);
      setError(null);
      setSuccess(null);
      setVehicleSearchAttempted(true);
      
      const token = access_token || localStorage.getItem('access_token');
      const encodedRegistration = encodeURIComponent(searchRegistration.trim());
      const response = await fetchUserData(token, `vehicle/registration/${encodedRegistration}`);
      
      // Check if response is an array (search results) or a single object
      let vehicle = null;
      if (Array.isArray(response)) {
        if (response.length > 0) {
          vehicle = response[0];
        }
      } else if (response && typeof response === 'object') {
        vehicle = response;
      }
      
      if (vehicle) {
        setVehicleData(vehicle);
        setVehicleFound(true);
        setTripData(prev => ({ 
          ...prev, 
          vehicle_id: vehicle.id 
        }));
        
        // Auto-populate seat configuration based on vehicle
        const totalSeats = vehicle.total_seats || 33;
        const rows = Math.ceil(totalSeats / 3);
        setSeatConfig(prev => ({
          ...prev,
          rows: rows
        }));
      } else {
        setVehicleFound(false);
        setVehicleData(null);
        setError("No vehicle found with this registration number");
      }
    } catch (err) {
      setVehicleFound(false);
      setVehicleData(null);
      
      if (err.message && err.message.includes("404")) {
        setError(`Vehicle with registration "${searchRegistration}" not found. Please check the registration number.`);
      } else {
        setError(err.message || "Failed to search vehicle");
      }
    } finally {
      setSearchingVehicle(false);
    }
  };

  // Handle Enter key press for search
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchVehicle();
    }
  };

  const handleColumnTextChange = (e) => {
    const rawVal = e.target.value;
    setColumnInputText(rawVal);

    const parsedCols = rawVal
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (parsedCols.length > 0) {
      setSeatConfig((prev) => ({
        ...prev,
        columns: parsedCols
      }));
    }
  };

  const determineSeatType = (colIndex, totalCols) => {
    if (colIndex === 0 || colIndex === totalCols - 1) {
      return "WINDOW";
    }
    if (totalCols === 3 && colIndex === 1) {
      return "AISLE";
    }
    return "MIDDLE";
  };

  const generateSeats = () => {
    const generated = [];
    const basePrice = Number(tripData.base_price) || 500;
    const { rows, columns, rowOverrides } = seatConfig;

    for (let row = 1; row <= rows; row++) {
      columns.forEach((col, colIdx) => {
        const seatNum = `${row}${col}`;
        const seatType = determineSeatType(colIdx, columns.length);
        
        let seatPrice = basePrice;
        if (rowOverrides[row] && rowOverrides[row].price !== undefined) {
          seatPrice = Number(rowOverrides[row].price);
        }

        generated.push({
          seat_number: seatNum,
          seat_row: row,
          seat_column: col,
          seat_type: seatType,
          price: seatPrice,
          is_available: true
        });
      });
    }
    setSeats(generated);
  };

  const handleTripChange = (e) => {
    const { name, value } = e.target;
    setTripData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowPriceChange = (row, price) => {
    const numericPrice = Number(price);
    setSeatConfig((prev) => ({
      ...prev,
      rowOverrides: {
        ...prev.rowOverrides,
        [row]: { price: numericPrice }
      }
    }));

    setSeats((prev) =>
      prev.map((s) => (s.seat_row === row ? { ...s, price: numericPrice } : s))
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!tripData.vehicle_id) {
        setError("Please search and select a vehicle first");
        setLoading(false);
        return;
      }

      const cleanSeats = seats.map(({ is_available, ...seat }) => ({
        seat_number: seat.seat_number,
        seat_row: seat.seat_row,
        seat_column: seat.seat_column,
        seat_type: seat.seat_type,
        price: parseFloat(seat.price)
      }));

      const payload = {
        vehicle_id: tripData.vehicle_id,
        departure_location: tripData.departure_location,
        arrival_location: tripData.arrival_location,
        departure_time: new Date(tripData.departure_time).toISOString(),
        arrival_time: new Date(tripData.arrival_time).toISOString(),
        base_price: parseFloat(tripData.base_price),
        status: "SCHEDULED",
        seats: cleanSeats
      };

      const response = await PosthData(
        access_token || localStorage.getItem('access_token'),
        "trip",
        payload
      );
      
      setSuccess("Trip created successfully!");
      
      setTimeout(() => {
        navigate("/trips");
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Failed to submit trip configuration");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 1: ROUTE & VEHICLE SEARCH ---
  const renderStepOne = () => (
    <div className={style.tripForm}>
      <h2>Trip & Vehicle Setup</h2>
      <p className={style.subtitle}>Search for a vehicle by registration number and set trip details</p>

      {/* Error Messages */}
      {error && (
        <div className={style.errorMessage}>
          <FaInfoCircle className={style.messageIcon} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className={style.closeMsgBtn}>
            <FaTimes />
          </button>
        </div>
      )}

      <div className={style.formGrid}>
        {/* Vehicle Search Section */}
        <div className={style.formSection}>
          <h3><FaSearch /> Search Vehicle</h3>
          <div className={style.searchVehicleGroup}>
            <div className={style.searchInputGroup}>
              <input
                type="text"
                placeholder="Enter full registration (e.g., KDE 789Y)"
                value={searchRegistration}
                onChange={(e) => setSearchRegistration(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className={style.searchInput}
                disabled={vehicleFound}
              />
              <button 
                onClick={searchVehicle} 
                className={style.searchBtn}
                disabled={searchingVehicle || vehicleFound}
              >
                {searchingVehicle ? <FaSpinner className={style.spinner} /> : <FaSearch />}
              </button>
            </div>
            {vehicleFound && (
              <button 
                onClick={() => {
                  setVehicleFound(false);
                  setVehicleData(null);
                  setSearchRegistration("");
                  setError(null);
                  setVehicleSearchAttempted(false);
                }} 
                className={style.clearVehicleBtn}
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>

          {vehicleFound && vehicleData && (
            <div className={style.vehicleCard}>
              <div className={style.vehicleCardBody}>
                <div className={style.vehicleCardRow}>
                  <span className={style.vehicleCardLabel}>Operator:</span>
                  <span className={style.vehicleCardValue}>{vehicleData.operator_name || "N/A"}</span>
                </div>
                <div className={style.vehicleCardRow}>
                  <span className={style.vehicleCardLabel}>Registration:</span>
                  <span className={style.vehicleCardValue}>{vehicleData.registration_number || "N/A"}</span>
                </div>
                <div className={style.vehicleCardRow}>
                  <span className={style.vehicleCardLabel}>Type:</span>
                  <span className={style.vehicleCardValue}>{vehicleData.vehicle_type || "N/A"}</span>
                </div>
                <div className={style.vehicleCardRow}>
                  <span className={style.vehicleCardLabel}>Service Class:</span>
                  <span className={style.vehicleCardValue}>{vehicleData.service_class || "N/A"}</span>
                </div>
                <div className={style.vehicleCardRow}>
                  <span className={style.vehicleCardLabel}>Total Seats:</span>
                  <span className={style.vehicleCardValue}>{vehicleData.total_seats || "N/A"}</span>
                </div>
              </div>
            </div>
          )}

          {vehicleSearchAttempted && !vehicleFound && !searchingVehicle && (
            <div className={style.noVehicleFound}>
              <FaInfoCircle className={style.noVehicleIcon} />
              <span>No vehicle found. Please check the registration number and try again.</span>
            </div>
          )}
        </div>

        {/* Route Information */}
        <div className={style.formSection}>
          <h3><FaMapMarkerAlt /> Route Information</h3>
          <div className={style.formRow}>
            <div className={style.formGroup}>
              <label>Departure Location</label>
              <input
                type="text"
                name="departure_location"
                value={tripData.departure_location}
                onChange={handleTripChange}
                required
              />
            </div>
            <div className={style.formGroup}>
              <label>Arrival Location</label>
              <input
                type="text"
                name="arrival_location"
                value={tripData.arrival_location}
                onChange={handleTripChange}
                required
              />
            </div>
          </div>
          <div className={style.formRow}>
            <div className={style.formGroup}>
              <label>Base Price (KSh)</label>
              <input
                type="number"
                name="base_price"
                value={tripData.base_price}
                onChange={handleTripChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className={style.formSection}>
          <h3><FaClock /> Schedule</h3>
          <div className={style.formRow}>
            <div className={style.formGroup}>
              <label>Departure Time</label>
              <input
                type="datetime-local"
                name="departure_time"
                value={tripData.departure_time}
                onChange={handleTripChange}
                required
              />
            </div>
            <div className={style.formGroup}>
              <label>Arrival Time</label>
              <input
                type="datetime-local"
                name="arrival_time"
                value={tripData.arrival_time}
                onChange={handleTripChange}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className={style.formActions}>
        <button className={style.cancelBtn} onClick={() => navigate("/trips")}>Cancel</button>
        <button
          className={style.nextBtn}
          disabled={!vehicleFound}
          onClick={() => {
            if (!tripData.departure_location || !tripData.arrival_location || !tripData.departure_time) {
              alert("Please fill in required schedule and route fields.");
              return;
            }
            generateSeats();
            setCurrentStep(2);
          }}
        >
          Next: Layout & Seats
        </button>
      </div>
    </div>
  );

  // --- STEP 2: SEAT LAYOUT & PRICING ---
  const renderStepTwo = () => (
    <div className={style.seatLayoutContainer}>
      <h2>Seat Layout Configuration</h2>
      <p className={style.subtitle}>Configure seat layout and pricing for {vehicleData?.operator_name || 'vehicle'}</p>

      <div className={style.layoutControls}>
        <div className={style.controlGroup}>
          <label>Total Rows</label>
          <div className={style.rowControls}>
            <button
              className={style.miniBtn}
              onClick={() => setSeatConfig((p) => ({ ...p, rows: Math.max(1, p.rows - 1) }))}
            >
              <FaMinus />
            </button>
            <span className={style.rowVal}>{seatConfig.rows}</span>
            <button
              className={style.miniBtn}
              onClick={() => setSeatConfig((p) => ({ ...p, rows: p.rows + 1 }))}
            >
              <FaPlus />
            </button>
          </div>
        </div>

        <div className={style.controlGroup}>
          <label>Columns</label>
          <input
            type="text"
            value={columnInputText}
            onChange={handleColumnTextChange}
            placeholder="e.g. A, B, C"
            className={style.columnInput}
          />
        </div>

        <div className={style.controlGroup}>
          <label>Aisle After</label>
          <select
            value={seatConfig.aisleAfterColumn}
            onChange={(e) => setSeatConfig((p) => ({ ...p, aisleAfterColumn: e.target.value }))}
            className={style.selectInput}
          >
            {seatConfig.columns.map((col) => (
              <option key={col} value={col}>Column {col}</option>
            ))}
            <option value="NONE">None</option>
          </select>
        </div>

        <div className={style.controlActionsGroup}>
          <button className={style.regenerateBtn} onClick={generateSeats}>
            <FaSync /> Apply Layout
          </button>

          <div className={style.totalSeatsBadge}>
            <FaSeatIcon className={style.seatIconBadge} />
            <span>Total: <strong>{seats.length || seatConfig.rows * seatConfig.columns.length}</strong></span>
          </div>
        </div>
      </div>

      <div className={style.builderGrid}>
        {/* Left Column: Visual Bus Representation */}
        <div className={style.busContainer}>
          <div className={style.busHeader}>
            <GiSteeringWheel className={style.steeringWheel} />
            <span>Driver Cabin</span>
          </div>

          <div className={style.busBody}>
            {Array.from({ length: seatConfig.rows }, (_, i) => i + 1).map((row) => {
              const rowSeats = seats.filter((s) => s.seat_row === row);
              return (
                <div key={row} className={style.busRow}>
                  <span className={style.rowTag}>{row}</span>
                  <div className={style.rowSeatsGroup}>
                    {seatConfig.columns.map((col) => {
                      const seat = rowSeats.find((s) => s.seat_column === col);
                      const isAisle = seatConfig.aisleAfterColumn === col;

                      return (
                        <React.Fragment key={col}>
                          <div
                            className={`${style.seatCard} ${
                              seat?.seat_type === "WINDOW" ? style.windowSeat : ""
                            }`}
                          >
                            <FaChair />
                            <span className={style.seatNum}>{seat?.seat_number || `${row}${col}`}</span>
                            <span className={style.seatPriceTag}>KSh {seat?.price || tripData.base_price}</span>
                          </div>
                          {isAisle && <div className={style.aisleGap}>AISLE</div>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Row Price Overrides */}
        <div className={style.pricingPanel}>
          <h3><FaTh /> Row Price Configuration</h3>
          <p className={style.panelHint}>Customize individual row prices (e.g. VIP front seats or discounted rear).</p>

          <div className={style.pricingTable}>
            <div className={style.pricingHeader}>
              <span>Row</span>
              <span>Seats</span>
              <span>Price (KSh)</span>
            </div>
            <div className={style.pricingRowsList}>
              {Array.from({ length: seatConfig.rows }, (_, i) => i + 1).map((row) => {
                const currentPrice =
                  seatConfig.rowOverrides[row]?.price !== undefined
                    ? seatConfig.rowOverrides[row].price
                    : tripData.base_price;

                return (
                  <div key={row} className={style.pricingRowItem}>
                    <span className={style.rowLabel}>Row {row}</span>
                    <span className={style.seatListLabel}>
                      {seatConfig.columns.map((c) => `${row}${c}`).join(", ")}
                    </span>
                    <input
                      type="number"
                      value={currentPrice}
                      onChange={(e) => handleRowPriceChange(row, e.target.value)}
                      className={style.rowPriceInput}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={style.formActions}>
        <button className={style.backBtn} onClick={() => setCurrentStep(1)}>
          Back
        </button>
        <button
          className={style.submitBtn}
          onClick={handleSubmit}
          disabled={loading || seats.length === 0}
        >
          {loading ? <><FaSpinner className={style.spinner} /> Creating...</> : "Create Trip"}
        </button>
      </div>

      {error && <div className={style.errorMessage}>{error}</div>}
      {success && <div className={style.successMessage}>{success}</div>}
    </div>
  );

  return (
    <Layout>
      <div className={style.addTrip}>
        <div className={style.addTripContent}>
          <div className={style.header}>
            <button className={style.backButton} onClick={() => navigate("/trips")}>
              <FaArrowLeft /> Back to Trips
            </button>
            <div className={style.stepIndicator}>
              <span className={`${style.step} ${currentStep >= 1 ? style.active : ""}`}>1. Details</span>
              <span className={style.stepLine}></span>
              <span className={`${style.step} ${currentStep >= 2 ? style.active : ""}`}>2. Layout & Seats</span>
            </div>
          </div>

          <div className={style.addTripBody}>
            {currentStep === 1 && renderStepOne()}
            {currentStep === 2 && renderStepTwo()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddTrip;