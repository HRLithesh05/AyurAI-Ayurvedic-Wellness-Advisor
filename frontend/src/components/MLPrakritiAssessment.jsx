import { useState, useEffect, useRef } from 'react';
import { FaLeaf, FaArrowRight, FaArrowLeft, FaCheck, FaSpinner } from 'react-icons/fa';
import { mlAPI } from '../services/api';

export default function MLPrakritiAssessment({ onComplete, onCancel }) {
  const [questions, setQuestions] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formTopRef = useRef(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Scroll to top when category changes
  useEffect(() => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentCategory]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await mlAPI.getQuestions();
      if (response.data.success) {
        setQuestions(response.data.data.questions);
      }
    } catch (error) {
      setError('Failed to load questions. Please try again.');
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (featureName, value) => {
    setAnswers({
      ...answers,
      [featureName]: value
    });
  };

  const isCurrentCategoryComplete = () => {
    if (!questions[currentCategory]) return false;
    const currentFeatures = questions[currentCategory].features;
    return currentFeatures.every(feature => answers[feature.name]);
  };

  const calculateProgress = () => {
    const totalFeatures = questions.reduce((sum, cat) => sum + cat.features.length, 0);
    const answeredFeatures = Object.keys(answers).length;
    return Math.round((answeredFeatures / totalFeatures) * 100);
  };

  const handleNext = () => {
    if (currentCategory < questions.length - 1) {
      setCurrentCategory(currentCategory + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategory > 0) {
      setCurrentCategory(currentCategory - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      const response = await mlAPI.predictPrakriti({ features: answers });
      
      if (response.data.success) {
        onComplete(response.data.data);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to analyze prakriti. Please try again.');
      console.error('Error predicting prakriti:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load assessment questions.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestions = questions[currentCategory];
  const progress = calculateProgress();
  const isLastCategory = currentCategory === questions.length - 1;
  const allQuestionsAnswered = Object.keys(answers).length === questions.reduce((sum, cat) => sum + cat.features.length, 0);

  return (
    <div className="space-y-6">
      {/* Scroll reference point */}
      <div ref={formTopRef}></div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-heading font-bold text-ayur-dark">
          AI-Powered Prakriti Assessment
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {progress}%
          </span>
          <span className="text-sm text-gray-500">
            {Object.keys(answers).length} / {questions.reduce((sum, cat) => sum + cat.features.length, 0)} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {questions.map((category, index) => {
          const categoryAnswered = category.features.every(f => answers[f.name]);
          return (
            <button
              key={index}
              onClick={() => setCurrentCategory(index)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                currentCategory === index
                  ? 'bg-green-600 text-white'
                  : categoryAnswered
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryAnswered && <FaCheck className="inline mr-2" />}
              {category.category}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-ayur-dark mb-4">
          {currentQuestions.category}
        </h4>

        {currentQuestions.features.map((feature, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <span className="text-green-600 font-bold">
                {index + 1}.
              </span>{' '}
              {feature.name}
              {feature.description && (
                <span className="text-xs text-gray-500 block mt-1">
                  {feature.description}
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {feature.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() => handleAnswer(feature.name, option)}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    answers[feature.name] === option
                      ? 'border-green-600 bg-green-50 text-green-800 font-medium shadow-sm'
                      : 'border-gray-200 bg-white hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          onClick={handlePrevious}
          disabled={currentCategory === 0}
          className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          <FaArrowLeft />
          <span>Previous</span>
        </button>

        {isLastCategory && allQuestionsAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 shadow-md"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <FaCheck />
                <span>Get Results</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isCurrentCategoryComplete() || currentCategory === questions.length - 1}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <FaArrowRight />
          </button>
        )}
      </div>

      {/* Info Note */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-bold">💡 Tip:</span> This assessment uses machine learning trained on 1,200 Ayurvedic profiles 
          to accurately determine your dosha constitution. Answer honestly based on your natural tendencies, not temporary states.
        </p>
      </div>
    </div>
  );
}
