import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaTicketAlt,
  FaBus,
  FaCalendarAlt,
  FaSignOutAlt,
  FaDollarSign,
  FaIdCard,
  FaUserTag,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaGlobe,
  FaCalendarCheck,
  FaStar,
  FaAward,
  FaRocket
} from "react-icons/fa";
import { BsFillStarFill, BsStarHalf } from "react-icons/bs";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import authService from "../../services/auth.service";

const Profile = () => {
  const navigate = useNavigate();
  const loginContext = useContext(LoginContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get user data from context and auth service
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await authService.getUserProfile();
        if (user) {
          setUserData(user);
          loginContext.setUserName(user.name || "");
          loginContext.setEmail(user.email || "");
          loginContext.setUser_id(user.id || "");
          loginContext.setProfile_pic(user.avatar_url || null);
        } else {
          const cachedUser = authService.getCachedUser();
          if (cachedUser) {
            setUserData(cachedUser);
          }
        }
      } catch (error) {
        const cachedUser = authService.getCachedUser();
        if (cachedUser) {
          setUserData(cachedUser);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const user = {
    id: userData?.id || loginContext.user_id || "",
    name: userData?.name || loginContext.userName || "User",
    email: userData?.email || loginContext.email || "user@email.com",
    phone: userData?.phone || "+254 700 123 456",
    username: userData?.username || "user",
    avatar: userData?.avatar_url || loginContext.profile_pic || null,
    bio: userData?.bio || "",
    national_id: userData?.national_id || "",
    vibe_points: userData?.vibe_points || 0,
    created_at: userData?.created_at || new Date().toISOString(),
    onboarded: userData?.onboarded || false,
    terms_accepted: userData?.terms_accepted || false,
  };

  const getInitials = (name) => {
    if (!name || name === "User") return "U";
    const nameParts = name.trim().split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

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

  if (loading) {
    return (
      <Layout>
        <div className={style.loadingContainer}>
          <div className={style.loadingSpinner}></div>
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={style.profile}>
        <div className={style.profileContent}>
          {/* Profile Header - Modern Card */}
          <div className={style.profileHeader}>
            <div className={style.headerBackground}>
              <div className={style.profileAvatar}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{getInitials(user.name)}</span>
                )}
              </div>
              <div className={style.profileInfo}>
                <h1>{user.name}</h1>
                <p className={style.profileUsername}>@{user.username}</p>
                <div className={style.profileMeta}>
                  <span><FaEnvelope /> {user.email}</span>
                  <span><FaPhone /> {user.phone}</span>
                  <span><FaCalendarCheck /> Member since {formatDate(user.created_at)}</span>
                </div>
                {user.bio && (
                  <p className={style.profileBio}>{user.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={style.statsGrid}>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#e3f2fd' }}>
                <FaIdCard className={style.statIcon} style={{ color: '#1976d2' }} />
              </div>
              <div className={style.statInfo}>
                <span className={style.statNumber}>{user.national_id || "N/A"}</span>
                <span className={style.statLabel}>National ID</span>
              </div>
            </div>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#fef3c7' }}>
                <FaStar className={style.statIcon} style={{ color: '#f59e0b' }} />
              </div>
              <div className={style.statInfo}>
                <span className={style.statNumber}>{user.vibe_points || 0}</span>
                <span className={style.statLabel}>Vibe Points</span>
              </div>
            </div>
            <div className={style.statCard}>
              <div className={style.statIconWrapper} style={{ background: '#dbeafe' }}>
                <FaRocket className={style.statIcon} style={{ color: '#3b82f6' }} />
              </div>
              <div className={style.statInfo}>
                <span className={style.statNumber}>
                  {user.onboarded ? 'Active' : 'Pending'}
                </span>
                <span className={style.statLabel}>Account Status</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className={style.sectionCard}>
            <div className={style.sectionHeader}>
              <h4>Personal Information</h4>
              <span className={style.sectionBadge}>Verified</span>
            </div>

            <div className={style.infoGrid}>
              <div className={style.infoItem}>
                <span className={style.infoLabel}>Full Name</span>
                <span className={style.infoValue}>{user.name}</span>
              </div>
              <div className={style.infoItem}>
                <span className={style.infoLabel}>Username</span>
                <span className={style.infoValue}>@{user.username}</span>
              </div>
              <div className={style.infoItem}>
                <span className={style.infoLabel}>Email</span>
                <span className={style.infoValue}>{user.email}</span>
              </div>
              <div className={style.infoItem}>
                <span className={style.infoLabel}>Phone</span>
                <span className={style.infoValue}>{user.phone}</span>
              </div>
              <div className={style.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={style.infoLabel}>Bio</span>
                <span className={style.infoValue}>{user.bio || "No bio yet"}</span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className={style.sectionCard}>
            <h4 className={style.sectionTitle}>Account Status</h4>
            <div className={style.statusGrid}>
              <div className={`${style.statusItem} ${user.onboarded ? style.active : ''}`}>
                <FaCheckCircle className={style.statusIcon} />
                <div>
                  <span className={style.statusLabel}>Onboarding</span>
                  <span className={style.statusValue}>{user.onboarded ? 'Completed' : 'Pending'}</span>
                </div>
              </div>
              <div className={`${style.statusItem} ${user.terms_accepted ? style.active : ''}`}>
                <FaCheckCircle className={style.statusIcon} />
                <div>
                  <span className={style.statusLabel}>Terms & Conditions</span>
                  <span className={style.statusValue}>{user.terms_accepted ? 'Accepted' : 'Not Accepted'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button className={style.logoutBtn} onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;