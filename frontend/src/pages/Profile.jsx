import { useState, useEffect } from 'react';
import { FaUser, FaLeaf, FaHeartbeat, FaSave, FaCalendar, FaStar, FaRobot } from 'react-icons/fa';
import { profileAPI } from '../services/api';
import { getErrorMessage, getDoshaColor, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';
import MLPrakritiAssessment from '../components/MLPrakritiAssessment';
import WellnessCard from '../components/WellnessCard';
import WellnessCardForm from '../components/WellnessCardForm';

export default function Profile({ user, setUser }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
  });
  const [birthDetails, setBirthDetails] = useState({
    date: '',
    time: '',
    place: '',
    latitude: '',
    longitude: ''
  });
  const [wellnessCard, setWellnessCard] = useState(null);
  const [prakriti, setPrakriti] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    
    try {
      const response = await profileAPI.getProfile();
      if (response.data.success) {
        const userData = response.data.data.user;
        
        // Ensure id field exists (map _id to id if needed)
        if (!userData.id && userData._id) {
          userData.id = userData._id;
        }
        
        // Update global user state and localStorage with latest data
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          dob: userData.dob || '',
        });

        // Set birth details
        if (userData.birthDetails) {
          setBirthDetails({
            date: userData.birthDetails.date || userData.dob || '',
            time: userData.birthDetails.time || '',
            place: userData.birthDetails.place || '',
            latitude: userData.birthDetails.latitude || '',
            longitude: userData.birthDetails.longitude || ''
          });
        }

        // Set wellness card
        if (userData.wellnessCard && userData.wellnessCard.generated) {
          setWellnessCard(userData.wellnessCard);
        }
        
        if (userData.prakriti && userData.prakriti.doshaScores) {
          // Extract dosha scores from the nested structure
          setPrakriti({
            vata: userData.prakriti.doshaScores.vata || 0,
            pitta: userData.prakriti.doshaScores.pitta || 0,
            kapha: userData.prakriti.doshaScores.kapha || 0,
            dominantDosha: userData.prakriti.dominantDosha,
            assessed: userData.prakriti.assessed
          });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleBirthDetailsChange = (e) => {
    setBirthDetails({
      ...birthDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await profileAPI.updateProfile(profile);
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        // Ensure id field exists (map _id to id if needed)
        if (!updatedUser.id && updatedUser._id) {
          updatedUser.id = updatedUser._id;
        }
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWellnessCard = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!birthDetails.time || !birthDetails.place || !birthDetails.latitude || !birthDetails.longitude) {
      setMessage({ type: 'error', text: 'Please fill all birth details including latitude and longitude' });
      return;
    }

    if (!profile.dob) {
      setMessage({ type: 'error', text: 'Please set your date of birth first' });
      return;
    }

    setMessage({ type: '', text: '' });
    setGeneratingCard(true);

    try {
      // Format the date properly to YYYY-MM-DD
      const dobDate = new Date(profile.dob);
      const formattedDate = dobDate.toISOString().split('T')[0];

      console.log('Sending wellness card request:', {
        birthDate: formattedDate,
        birthTime: birthDetails.time,
        birthPlace: birthDetails.place,
        latitude: parseFloat(birthDetails.latitude),
        longitude: parseFloat(birthDetails.longitude)
      });

      const response = await profileAPI.generateWellnessCard({
        birthDate: formattedDate,
        birthTime: birthDetails.time,
        birthPlace: birthDetails.place,
        latitude: parseFloat(birthDetails.latitude),
        longitude: parseFloat(birthDetails.longitude)
      });

      if (response.data.success) {
        setWellnessCard(response.data.data.wellnessCard);
        setBirthDetails(response.data.data.birthDetails);
        
        // Update user state
        const updatedUser = { ...user, wellnessCard: response.data.data.wellnessCard, birthDetails: response.data.data.birthDetails };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setMessage({ type: 'success', text: '✨ Wellness Card generated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleRefreshWellnessCard = async (e) => {
    e.preventDefault();
    
    console.log('🔄 Refreshing wellness card...');
    console.log('Current birthDetails:', birthDetails);
    console.log('Current profile.dob:', profile.dob);
    
    // Use existing birth details from the card
    if (!birthDetails.time || !birthDetails.place || !birthDetails.latitude || !birthDetails.longitude) {
      setMessage({ type: 'error', text: 'Birth details are missing. Cannot refresh card.' });
      return;
    }

    // Use date from birthDetails if profile.dob is not available
    const birthDate = profile.dob || birthDetails.date;
    
    if (!birthDate) {
      setMessage({ type: 'error', text: 'Date of birth is missing. Cannot refresh card.' });
      return;
    }

    setMessage({ type: '', text: '' });
    setGeneratingCard(true);

    try {
      // Format the date properly to YYYY-MM-DD
      const dobDate = new Date(birthDate);
      const formattedDate = dobDate.toISOString().split('T')[0];

      console.log('🔄 Sending refresh request with current astrological data:', {
        birthDate: formattedDate,
        birthTime: birthDetails.time,
        birthPlace: birthDetails.place,
        latitude: parseFloat(birthDetails.latitude),
        longitude: parseFloat(birthDetails.longitude)
      });

      const response = await profileAPI.generateWellnessCard({
        birthDate: formattedDate,
        birthTime: birthDetails.time,
        birthPlace: birthDetails.place,
        latitude: parseFloat(birthDetails.latitude),
        longitude: parseFloat(birthDetails.longitude)
      });

      if (response.data.success) {
        console.log('✅ Wellness card refreshed successfully:', response.data.data);
        
        setWellnessCard(response.data.data.wellnessCard);
        setBirthDetails(response.data.data.birthDetails);
        
        // Update user state
        const updatedUser = { ...user, wellnessCard: response.data.data.wellnessCard, birthDetails: response.data.data.birthDetails };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setMessage({ type: 'success', text: '🔄 Wellness Card refreshed with current astrological data!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      console.error('❌ Error refreshing wellness card:', error);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleMLAssessmentComplete = async (mlResults) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log('ML Prakriti prediction complete:', mlResults);
      
      // Update local prakriti state with ML results
      setPrakriti({
        vata: mlResults.doshaScores.vata,
        pitta: mlResults.doshaScores.pitta,
        kapha: mlResults.doshaScores.kapha,
        dominantDosha: mlResults.dominantDosha,
        assessed: true,
        mlPrediction: {
          prediction: mlResults.prediction,
          confidence: mlResults.confidence
        }
      });
      
      // Update global user state
      const updatedUser = { 
        ...user, 
        prakriti: {
          assessed: true,
          doshaScores: mlResults.doshaScores,
          dominantDosha: mlResults.dominantDosha,
          mlPrediction: {
            prediction: mlResults.prediction,
            confidence: mlResults.confidence
          }
        }
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Refresh profile to get latest data
      await fetchProfile();
      
      setShowQuiz(false);
      setMessage({ type: 'success', text: '✅ Prakriti assessment saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Error saving Prakriti assessment:', error);
      console.error('Error response:', error.response?.data);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
      setShowQuiz(false);
    }
  };

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-ayur-light py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <MLPrakritiAssessment
              onComplete={handleMLAssessmentComplete}
              onCancel={() => setShowQuiz(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loading && !profile.name) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-ayur-primary rounded-full flex items-center justify-center">
              <FaUser className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-ayur-dark">{profile.name}</h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FaUser className="text-xl text-ayur-primary" />
              <h2 className="text-xl font-heading font-bold text-ayur-dark">Profile Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayur-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayur-primary focus:border-transparent"
                  required
                  disabled
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayur-primary focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-ayur-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition disabled:opacity-50"
              >
                <FaSave />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          </div>

          {/* Prakriti Display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FaLeaf className="text-xl text-ayur-primary" />
              <h2 className="text-xl font-heading font-bold text-ayur-dark">Your Prakriti</h2>
            </div>

            {prakriti ? (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Your Ayurvedic constitution based on the three doshas:
                </p>

                {/* Vata */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Vata (Air + Ether)</span>
                    <span className="text-sm font-bold text-blue-600">{prakriti.vata}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${prakriti.vata}%` }}
                    ></div>
                  </div>
                </div>

                {/* Pitta */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Pitta (Fire + Water)</span>
                    <span className="text-sm font-bold text-red-600">{prakriti.pitta}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all"
                      style={{ width: `${prakriti.pitta}%` }}
                    ></div>
                  </div>
                </div>

                {/* Kapha */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Kapha (Water + Earth)</span>
                    <span className="text-sm font-bold text-green-600">{prakriti.kapha}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${prakriti.kapha}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <FaRobot className="text-2xl text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-purple-900 mb-1">
                        AI-Powered Analysis
                      </p>
                      <p className="text-sm text-purple-800">
                        {prakriti.mlPrediction ? (
                          <>
                            Your prakriti was determined using a machine learning model trained on 1,200 
                            Ayurvedic profiles with <span className="font-bold">{Math.round(prakriti.mlPrediction.confidence * 100)}% confidence</span>.
                            This helps provide personalized recommendations based on your unique constitution.
                          </>
                        ) : (
                          <>
                            Your prakriti helps provide personalized recommendations based on your unique constitution.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Retake Assessment Button */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-ayur-primary hover:bg-opacity-90 text-white px-4 py-3 rounded-lg font-medium transition shadow-md"
                  >
                    <FaLeaf />
                    <span>Retake AI Assessment</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                    <FaRobot className="text-4xl text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Discover Your Prakriti
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Your Ayurvedic constitution hasn't been assessed yet.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Take our AI-powered assessment (29 questions) to discover your unique dosha balance
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  {/* ML Assessment */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-start space-x-3 mb-3">
                      <FaRobot className="text-2xl text-purple-600 mt-1" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-purple-900">
                          Machine Learning Powered
                        </p>
                        <p className="text-xs text-purple-700">
                          Trained on 1,200 authentic Ayurvedic profiles for accurate results
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-ayur-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-bold transition shadow-md"
                    >
                      <FaLeaf />
                      <span>Take AI Assessment</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-400">
                    ✨ Get personalized Ayurvedic recommendations based on your unique constitution
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wellness Card Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FaStar className="text-xl text-yellow-500" />
              <h2 className="text-xl font-heading font-bold text-ayur-dark">🪔 Astrological Ayurvedic Wellness Card</h2>
            </div>
          </div>

          {wellnessCard && wellnessCard.generated ? (
            <WellnessCard 
              wellnessCard={wellnessCard} 
              profile={profile} 
              birthDetails={birthDetails}
              onRefresh={handleRefreshWellnessCard}
              isRefreshing={generatingCard}
            />
          ) : (
            <WellnessCardForm
              birthDetails={birthDetails}
              profileDob={profile.dob}
              onBirthDetailsChange={handleBirthDetailsChange}
              onProfileDobChange={handleChange}
              onSubmit={handleGenerateWellnessCard}
              generatingCard={generatingCard}
            />
          )}
        </div>
      </div>
    </div>
  );
}
