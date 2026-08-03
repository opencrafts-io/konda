import React from "react";
import style from "./BookingDetailsModal.module.css";
import { 
  FaTimes, 
  FaCalendarAlt,
  FaClock,
  FaChair,
  FaBus,
  FaUser,
  FaPhone,
  FaArrowRight,
  FaDollarSign
} from "react-icons/fa";

const BookingDetailsModal = ({ booking, onClose, formatDate, formatTime }) => {
  if (!booking) return null;

  const status = (booking.status || "PENDING").toUpperCase();
  const paymentStatus = (booking.payment_status || "PENDING").toUpperCase();

  const getStatusColor = (s) => {
    switch(s) {
      case 'CONFIRMED': return '#388e3c';
      case 'COMPLETED': return '#1976d2';
      case 'CANCELLED': return '#d32f2f';
      case 'PENDING': return '#f57c00';
      default: return '#718096';
    }
  };

  const getPaymentStatusColor = (s) => {
    switch(s) {
      case 'PAID': return '#388e3c';
      case 'PENDING': return '#f57c00';
      case 'REFUNDED': return '#7b1fa2';
      case 'FAILED': return '#d32f2f';
      default: return '#718096';
    }
  };

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={style.header}>
          <div>
            <span className={style.subHeader}>Booking Reference</span>
            <h2 className={style.refNumber}>
              {booking.id || `BK-${booking.id?.substring(0, 8)}`}
            </h2>
          </div>
          <button className={style.closeBtn} onClick={onClose} aria-label="Close modal">
            <FaTimes />
          </button>
        </div>

        {/* Status Badges */}
        <div className={style.statusRow}>
          <span className={style.badge} style={{ backgroundColor: getStatusColor(status) }}>
            {status}
          </span>
          <span className={style.badge} style={{ backgroundColor: getPaymentStatusColor(paymentStatus) }}>
            {paymentStatus}
          </span>
        </div>

        {/* Route Card */}
        <div className={style.routeCard}>
          <div className={style.routePoint}>
            <span className={style.pointType}>Departure</span>
            <h3 className={style.pointLocation}>{booking.trip?.departure_location || "N/A"}</h3>
            <div className={style.pointTime}>
              <FaClock className={style.iconSm} />
              <span>{formatTime ? formatTime(booking.trip?.departure_time) : "N/A"}</span>
            </div>
          </div>

          <div className={style.routeDivider}>
            <div className={style.line}></div>
            <div className={style.arrowCircle}>
              <FaArrowRight />
            </div>
          </div>

          <div className={style.routePoint}>
            <span className={style.pointType}>Arrival</span>
            <h3 className={style.pointLocation}>{booking.trip?.arrival_location || "N/A"}</h3>
            <div className={style.pointTime}>
              <FaClock className={style.iconSm} />
              <span>{formatTime ? formatTime(booking.trip?.arrival_time) : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Trip Meta Grid */}
        <div className={style.gridContainer}>
          <div className={style.metaCard}>
            <FaCalendarAlt className={style.metaIcon} />
            <div>
              <span className={style.metaLabel}>Departure Date</span>
              <span className={style.metaValue}>{formatDate ? formatDate(booking.trip?.departure_time) : "N/A"}</span>
            </div>
          </div>
          <div className={style.metaCard}>
            <FaBus className={style.metaIcon} />
            <div>
              <span className={style.metaLabel}>Operator / Vehicle</span>
              <span className={style.metaValue}>
                {booking.trip?.vehicle?.operator_name || "N/A"} 
                <small style={{ color: '#718096', marginLeft: '4px' }}>({booking.trip?.vehicle?.registration_number || "N/A"})</small>
              </span>
            </div>
          </div>
        </div>

        {/* Seat Breakdown */}
        <div className={style.section}>
          <h4 className={style.sectionHeader}>
            <FaChair className={style.headerIcon} /> Seat Information
          </h4>
          <div className={style.seatGrid}>
            {(booking.seats || []).map((seat, index) => (
              <div key={seat.id || index} className={style.seatChip}>
                <span className={style.seatNum}>{seat.seat_number || seat.seatNumber || "N/A"}</span>
                <span className={style.seatType}>{seat.seat_type || "Standard"}</span>
                <span className={style.seatPrice}>KSh {parseFloat(seat.price || 0).toFixed(2)}</span>
              </div>
            ))}
            {(!booking.seats || booking.seats.length === 0) && (
              <div className={style.emptyState}>No seat information available</div>
            )}
          </div>
        </div>

        {/* Passenger List */}
        <div className={style.section}>
          <h4 className={style.sectionHeader}>
            <FaUser className={style.headerIcon} /> Passenger Details
          </h4>
          <div className={style.passengerList}>
            {(booking.passengers || []).map((passenger, index) => (
              <div key={passenger.id || index} className={style.passengerCard}>
                <div className={style.passengerSeat}>
                  <FaChair />
                  <span>{passenger.seat_number || "N/A"}</span>
                </div>
                <div className={style.passengerMain}>
                  <span className={style.passengerName}>{passenger.passenger_name || passenger.name || "N/A"}</span>
                  <span className={style.passengerContact}>
                    <FaPhone className={style.iconXs} />
                    {passenger.passenger_contact || passenger.contact || "N/A"}
                  </span>
                </div>
              </div>
            ))}
            {(!booking.passengers || booking.passengers.length === 0) && (
              <div className={style.emptyState}>No passenger details available</div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className={style.section}>
          <h4 className={style.sectionHeader}>
            <FaDollarSign className={style.headerIcon} /> Payment Summary
          </h4>
          <div className={style.summaryCard}>
            <div className={style.summaryRow}>
              <span>Payment Method</span>
              <strong>{booking.payment_method || "N/A"}</strong>
            </div>
            <div className={style.summaryRow}>
              <span>Passenger Count</span>
              <strong>{booking.passenger_count || (booking.passengers?.length) || 0}</strong>
            </div>
            <div className={style.summaryRow}>
              <span>Booking Date</span>
              <strong>{formatDate ? formatDate(booking.booking_date) : "N/A"}</strong>
            </div>
            {booking.special_requests && (
              <div className={style.summaryRow}>
                <span>Special Requests</span>
                <strong>{booking.special_requests}</strong>
              </div>
            )}
            <div className={style.summaryDivider}></div>
            <div className={`${style.summaryRow} ${style.totalRow}`}>
              <span>Total Amount</span>
              <span className={style.totalAmount}>KSh {parseFloat(booking.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={style.footer}>
          <button className={style.closeModalBtn} onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingDetailsModal;