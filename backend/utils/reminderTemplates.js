// Ayurvedic reminder templates based on dosha types and time of day

export const reminderTemplates = {
  vata: [
    {
      time: '06:00',
      title: 'Morning Grounding',
      message: '🌅 Good morning! It\'s 6 AM — ideal time for meditation and gentle yoga. Vata types benefit from warm oil massage (Abhyanga).',
      category: 'meditation'
    },
    {
      time: '07:30',
      title: 'Warm Breakfast',
      message: '🍲 Breakfast time! Vata needs warm, cooked foods. Try oatmeal with ghee, cinnamon, and dates.',
      category: 'diet'
    },
    {
      time: '12:00',
      title: 'Lunch Reminder',
      message: '🥘 Lunchtime! Eat your largest meal now. Include warm, grounding foods with healthy fats and spices.',
      category: 'diet'
    },
    {
      time: '18:00',
      title: 'Evening Calm',
      message: '🧘 Evening wind-down time. Avoid cold drinks. Try warm herbal tea with ginger and cardamom.',
      category: 'diet'
    },
    {
      time: '21:00',
      title: 'Sleep Preparation',
      message: '🌙 Prepare for sleep. Vata benefits from a regular sleep schedule. Try warm milk with nutmeg before bed.',
      category: 'sleep'
    }
  ],
  pitta: [
    {
      time: '06:00',
      title: 'Morning Coolness',
      message: '🌅 Good morning! It\'s 6 AM — perfect for meditation and cooling yoga practices. Pitta types should avoid overheating.',
      category: 'meditation'
    },
    {
      time: '07:30',
      title: 'Cooling Breakfast',
      message: '🥗 Breakfast time! Pitta benefits from cooling foods. Try fresh fruit, coconut, and cooling herbs like coriander.',
      category: 'diet'
    },
    {
      time: '12:00',
      title: 'Balanced Lunch',
      message: '🍽️ Lunchtime! Eat your main meal now. Avoid excessive spicy or salty foods. Include cooling vegetables.',
      category: 'diet'
    },
    {
      time: '18:00',
      title: 'Evening Balance',
      message: '🌿 Evening time. Avoid cold drinks after sunset to balance Pitta. Try cooling herbal teas like mint or fennel.',
      category: 'diet'
    },
    {
      time: '22:00',
      title: 'Cool Down for Sleep',
      message: '🌙 Sleep time approaching. Pitta types need adequate rest to avoid irritability. Keep bedroom cool and dark.',
      category: 'sleep'
    }
  ],
  kapha: [
    {
      time: '05:30',
      title: 'Early Rising',
      message: '🌅 Rise and shine! It\'s 5:30 AM — Kapha types benefit from early rising. Start with vigorous exercise or brisk walking.',
      category: 'exercise'
    },
    {
      time: '07:00',
      title: 'Light Breakfast',
      message: '☕ Light breakfast time! Kapha benefits from stimulating foods. Try warm spices like ginger, black pepper, and turmeric.',
      category: 'diet'
    },
    {
      time: '12:00',
      title: 'Main Meal',
      message: '🍛 Lunchtime! Kapha should eat moderate portions. Include warming spices and avoid heavy, oily foods.',
      category: 'diet'
    },
    {
      time: '18:00',
      title: 'Light Evening',
      message: '🥣 Evening meal should be light. Avoid cold drinks after sunset to balance Kapha. Try warming herbal teas.',
      category: 'diet'
    },
    {
      time: '21:30',
      title: 'Active Evening',
      message: '🚶 Before bed, take a short walk. Kapha types should avoid excessive sleep and stay active throughout the day.',
      category: 'exercise'
    }
  ],
  general: [
    {
      time: '06:00',
      title: 'Morning Routine',
      message: '🌅 Good morning! It\'s 6 AM — ideal time for meditation and light yoga. Start your day mindfully.',
      category: 'meditation'
    },
    {
      time: '08:00',
      title: 'Breakfast Time',
      message: '🍳 Breakfast time! Eat a balanced meal according to your dosha. Stay hydrated throughout the day.',
      category: 'diet'
    },
    {
      time: '12:00',
      title: 'Lunch Reminder',
      message: '🍱 Lunchtime! Eat your main meal now when digestive fire (Agni) is strongest.',
      category: 'diet'
    },
    {
      time: '18:00',
      title: 'Evening Practice',
      message: '🧘 Evening time. Avoid cold drinks after sunset to support digestion and balance.',
      category: 'general'
    },
    {
      time: '22:00',
      title: 'Sleep Time',
      message: '🌙 Prepare for sleep. Maintain a regular sleep schedule for optimal health and balance.',
      category: 'sleep'
    }
  ]
};

// Get reminders for a specific dosha
export const getRemindersForDosha = (doshaType) => {
  return reminderTemplates[doshaType] || reminderTemplates.general;
};

// Generate personalized reminder based on time and dosha
export const generatePersonalizedReminder = (time, doshaType, category = 'general') => {
  const doshaReminders = reminderTemplates[doshaType] || reminderTemplates.general;
  
  // Try to find a matching reminder by time
  const matchingReminder = doshaReminders.find(r => r.time === time);
  if (matchingReminder) {
    return matchingReminder;
  }
  
  // Find closest time reminder
  const [hours, minutes] = time.split(':').map(Number);
  const targetMinutes = hours * 60 + minutes;
  
  let closestReminder = doshaReminders[0];
  let closestDiff = Infinity;
  
  doshaReminders.forEach(reminder => {
    const [rHours, rMinutes] = reminder.time.split(':').map(Number);
    const rTotalMinutes = rHours * 60 + rMinutes;
    const diff = Math.abs(targetMinutes - rTotalMinutes);
    
    if (diff < closestDiff) {
      closestDiff = diff;
      closestReminder = reminder;
    }
  });
  
  return closestReminder;
};
