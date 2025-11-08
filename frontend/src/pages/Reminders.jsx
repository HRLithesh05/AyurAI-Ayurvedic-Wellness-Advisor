import { useState, useEffect } from 'react';
import { FaBell, FaPlus, FaTrash, FaEdit, FaClock, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Time conversion utilities
const convertTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${period}`;
};

const convertTo24Hour = (time12, period) => {
  if (!time12 || !time12.includes(':')) return '';
  const [hours, minutes] = time12.split(':');
  let hour = parseInt(hours);
  const mins = minutes ? String(parseInt(minutes)).padStart(2, '0') : '00';
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return `${String(hour).padStart(2, '0')}:${mins}`;
};

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    time: '',
    timePeriod: 'AM', // AM or PM
    category: 'general',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  });

  const categories = [
    { value: 'meditation', label: '🧘 Meditation', color: 'purple' },
    { value: 'yoga', label: '🤸 Yoga', color: 'blue' },
    { value: 'diet', label: '🍽️ Diet', color: 'green' },
    { value: 'sleep', label: '🌙 Sleep', color: 'indigo' },
    { value: 'exercise', label: '🏃 Exercise', color: 'orange' },
    { value: 'herbs', label: '🌿 Herbs', color: 'emerald' },
    { value: 'general', label: '📌 General', color: 'gray' }
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchReminders();
    checkNotificationPermission();
  }, []);

  // Separate effect for notification scheduler that depends on reminders
  useEffect(() => {
    if (reminders.length === 0) return;

    // Check every minute if it's time to show a reminder
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay();

      console.log('Checking reminders at:', currentTime, 'Day:', currentDay);

      reminders.forEach(reminder => {
        if (
          reminder.isActive &&
          reminder.time === currentTime &&
          reminder.daysOfWeek.includes(currentDay)
        ) {
          console.log('Triggering reminder:', reminder.title);
          showNotification(reminder.title, reminder.message);
        }
      });
    }, 60000); // Check every minute

    // Also check immediately when reminders change
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();

    reminders.forEach(reminder => {
      if (
        reminder.isActive &&
        reminder.time === currentTime &&
        reminder.daysOfWeek.includes(currentDay)
      ) {
        showNotification(reminder.title, reminder.message);
      }
    });

    return () => clearInterval(interval);
  }, [reminders]); // Re-run when reminders change

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      console.log('📱 Notification API check - Permission:', Notification.permission);
      setNotificationPermission(Notification.permission);
    } else {
      console.error('❌ Notification API not available');
    }
  };

  const requestNotificationPermission = async () => {
    console.log('🔔 Requesting notification permission...');
    
    if (!('Notification' in window)) {
      alert('❌ Your browser does not support notifications. Please use Chrome, Firefox, or Edge.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('✅ Permission result:', permission);
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        console.log('🎉 Permission granted! Testing notification...');
        showNotification('Reminders Enabled! 🎉', 'You will now receive daily Ayurvedic wellness reminders.');
      } else if (permission === 'denied') {
        alert('❌ Notification permission denied. Please enable notifications in your browser settings.');
      } else {
        alert('⚠️ Notification permission dismissed. Click "Enable Notifications" to try again.');
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      alert('Error requesting notification permission: ' + error.message);
    }
  };

  const showNotification = (title, body) => {
    console.log('showNotification called with:', { title, body });
    console.log('Notification API available:', 'Notification' in window);
    console.log('Notification permission:', Notification?.permission);

    if (!('Notification' in window)) {
      console.error('❌ Notification API not supported in this browser');
      alert('❌ Your browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted:', Notification.permission);
      alert('⚠️ Please enable notifications first by clicking "Enable Notifications"');
      return;
    }

    try {
      console.log('✅ Creating notification...');
      
      const notification = new Notification(title, {
        body: body,
        icon: '/faviconleaf.png',
        badge: '/faviconleaf.png',
        requireInteraction: false,
        silent: false,
        tag: `reminder-${Date.now()}`,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      });

      notification.onclick = () => {
        console.log('Notification clicked by user');
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('❌ Notification error:', error);
      };

      // Auto-close after 15 seconds
      setTimeout(() => {
        notification.close();
      }, 15000);

    } catch (error) {
      console.error('❌ Error creating notification:', error);
      alert('❌ Error showing notification: ' + error.message);
    }
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reminders');

      if (response.data.success) {
        setReminders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError(err.response?.data?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const initializeReminders = async () => {
    try {
      setLoading(true);
      const response = await api.post('/reminders/initialize', {});

      if (response.data.success) {
        await fetchReminders();
        alert('✅ Default reminders initialized based on your dosha!');
      }
    } catch (err) {
      console.error('Error initializing reminders:', err);
      alert(err.response?.data?.message || 'Failed to initialize reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convert 12-hour time to 24-hour format for backend storage
      const time24 = convertTo24Hour(formData.time, formData.timePeriod);
      const dataToSubmit = {
        ...formData,
        time: time24,
        isCustom: true
      };
      delete dataToSubmit.timePeriod; // Remove timePeriod as it's not needed in backend

      if (editingReminder) {
        // Update existing reminder
        const response = await api.put(
          `/reminders/${editingReminder._id}`,
          dataToSubmit
        );

        if (response.data.success) {
          await fetchReminders();
          setShowAddForm(false);
          setEditingReminder(null);
          resetForm();
        }
      } else {
        // Create new reminder
        const response = await api.post(
          '/reminders',
          dataToSubmit
        );

        if (response.data.success) {
          await fetchReminders();
          setShowAddForm(false);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Error saving reminder:', err);
      alert(err.response?.data?.message || 'Failed to save reminder');
    }
  };

  const toggleReminder = async (id) => {
    try {
      const response = await api.patch(`/reminders/${id}/toggle`, {});

      if (response.data.success) {
        await fetchReminders();
      }
    } catch (err) {
      console.error('Error toggling reminder:', err);
      alert('Failed to toggle reminder');
    }
  };

  const deleteReminder = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await api.delete(`/reminders/${id}`);

      if (response.data.success) {
        await fetchReminders();
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
      alert('Failed to delete reminder');
    }
  };

  const editReminder = (reminder) => {
    setEditingReminder(reminder);
    
    // Convert 24-hour time to 12-hour format for editing
    const [hours, minutes] = reminder.time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const time12 = `${hour12}:${minutes}`;
    
    setFormData({
      title: reminder.title,
      message: reminder.message,
      time: time12,
      timePeriod: period,
      category: reminder.category,
      daysOfWeek: reminder.daysOfWeek
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      time: '',
      timePeriod: 'AM',
      category: 'general',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    });
    setEditingReminder(null);
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  if (loading && reminders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaBell className="text-green-600" />
                Daily Reminders
              </h1>
              <p className="text-gray-600 mt-2">
                Personalized Ayurvedic wellness reminders based on your dosha
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (showAddForm) {
                  resetForm();
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus />
              {showAddForm ? 'Cancel' : 'Add Reminder'}
            </button>
          </div>

          {/* Notification Permission */}
          {notificationPermission !== 'granted' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaBell className="text-yellow-600 text-xl" />
                <p className="text-yellow-800">
                  Enable notifications to receive timely reminders
                </p>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {/* Notifications Status Message */}
          {notificationPermission === 'granted' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <FaBell className="text-green-600 text-xl" />
              <div>
                <p className="text-green-800 font-medium">Notifications Enabled ✅</p>
                <p className="text-green-600 text-sm">Reminders will appear when the scheduled time arrives</p>
              </div>
            </div>
          )}
        </div>

        {/* Initialize Reminders */}
        {reminders.length === 0 && !showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Reminders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Get started with personalized Ayurvedic reminders based on your dosha type
            </p>
            <button
              onClick={initializeReminders}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Initialize Default Reminders
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Morning Meditation"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., It's 6 AM — ideal time for meditation and light yoga"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Time</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => {
                        // Allow only numbers and colon, and format as H:MM or HH:MM
                        let value = e.target.value.replace(/[^\d:]/g, '');
                        
                        // Auto-format: add colon after 1 or 2 digits
                        if (value.length === 2 && !value.includes(':') && formData.time.length < value.length) {
                          value = value + ':';
                        }
                        
                        // Limit to H:MM or HH:MM format (max 5 chars)
                        if (value.length <= 5) {
                          setFormData({ ...formData, time: value });
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="6:00"
                      pattern="(1[0-2]|0?[1-9]):[0-5][0-9]"
                      title="Enter time in 12-hour format (e.g., 6:00 or 12:30)"
                      required
                    />
                    <select
                      value={formData.timePeriod}
                      onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: 6:00, 12:30, etc.</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Repeat on Days</label>
                <div className="flex gap-2 flex-wrap">
                  {daysOfWeek.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.daysOfWeek.includes(index)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reminders List */}
        {reminders.length > 0 && (
          <div className="grid gap-4">
            {reminders.map(reminder => (
              <div
                key={reminder._id}
                className={`bg-white rounded-xl shadow-md p-5 transition-all ${
                  reminder.isActive ? 'border-l-4 border-green-500' : 'opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${getCategoryColor(reminder.category)}-100 text-${getCategoryColor(reminder.category)}-700`}>
                        {categories.find(c => c.value === reminder.category)?.label || reminder.category}
                      </span>
                      <span className="flex items-center gap-2 text-gray-600">
                        <FaClock />
                        {convertTo12Hour(reminder.time)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {reminder.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{reminder.message}</p>
                    <div className="flex gap-2 flex-wrap">
                      {reminder.daysOfWeek.map(day => (
                        <span
                          key={day}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                        >
                          {daysOfWeek[day]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleReminder(reminder._id)}
                      className={`p-3 rounded-lg transition-colors ${
                        reminder.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={reminder.isActive ? 'Disable' : 'Enable'}
                    >
                      {reminder.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                    </button>
                    <button
                      onClick={() => editReminder(reminder)}
                      className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Edit"
                    >
                      <FaEdit size={20} />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder._id)}
                      className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <FaTrash size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reminders;
