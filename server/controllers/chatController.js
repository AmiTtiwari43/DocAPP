const { GoogleGenerativeAI } = require("@google/generative-ai");
const Doctor = require('../models/Doctor');
const Chat = require('../models/Chat');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY );
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Get chat history for a user
exports.getChatHistory = async (req, res) => {
  try {
    const history = await Chat.find({ userId: req.user.id })
      .sort({ createdAt: 1 }) // Oldest first
      .limit(50); // Limit to last 50 messages
    
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chat history" });
  }
};

// Process new user message
exports.processChat = async (req, res) => {
  try {
    const { symptoms, city } = req.body;
    const userId = req.user.id;

    if (!symptoms) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // --- Persistent MongoDB Rate Limiting ---
    const now = new Date();
    
    // 1. Hourly rate limit check (30 messages per hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyMessagesCount = await Chat.countDocuments({
      userId,
      role: 'user',
      createdAt: { $gte: oneHourAgo }
    });

    if (hourlyMessagesCount >= 30) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded: You can send a maximum of 30 messages per hour. Please wait a while before trying again.'
      });
    }

    // 2. Daily rate limit check (100 messages per day)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dailyMessagesCount = await Chat.countDocuments({
      userId,
      role: 'user',
      createdAt: { $gte: oneDayAgo }
    });

    if (dailyMessagesCount >= 100) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded: You have reached the daily limit of 100 messages. Please try again tomorrow.'
      });
    }
    // ----------------------------------------

    // 1. Fetch user's recent chat history for context (last 10 messages)
    const recentHistory = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    const reversedHistory = recentHistory.reverse();

    // 1b. Format history for the prompt
    const historyText = reversedHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // 2. Save User Message
    const userChat = await Chat.create({
      userId,
      role: 'user',
      content: symptoms,
    });

    // 3. Prompt Gemini to act as a conversational chatbot holding context and analyzing symptoms
    const analysisPrompt = `
      You are a friendly, empathetic, and highly capable general-purpose AI assistant with a strong inclination and expertise in medicine and health.
      You can converse about anything like a normal chatbot—whether it's greetings, general knowledge, math, programming, or coding—but your core helpful persona is always that of a knowledgeable medical companion.

      Here is the conversation history for context:
      ${historyText}

      User's latest message: "${symptoms}"

      Please analyze the input and conversation flow:
      1. If the user asks about out-of-scope topics (such as coding, programming, general knowledge, history, mathematics, jokes, or anything unrelated to health, medicine, and wellness), you must politely decline to answer. In a humble, warm, and friendly way, explain to the user that you are designed specifically as an AI medical assistant to help with health advice and finding doctors, and cannot help with the unrelated topic they asked about (mention the specific topic they asked about to be personal and polite).
      2. If the user is greeting you or asking health-related questions/describing symptoms, provide empathetic, warm, descriptive, and helpful medical guidance.
      3. If the user's symptoms warrant seeing a specialist, identify the correct specialization. Use the following guide for specializations:
         - "Cardiologist" (heart, chest pain, palpitations, pulse, blood pressure, etc.)
         - "Neurologist" (brain, migraine, seizures, vertigo, stroke, nerves, etc.)
         - "Orthopedist" (bones, joints, fractures, knee/back pain, muscles, etc.)
         - "Dermatologist" (skin, rash, acne, hair, eczema, etc.)
         - "Dentist" (teeth, gums, cavities, toothache, etc.)
         - "Ophthalmologist" (eye, vision, blurry sight, etc.)
         - "ENT Specialist" (ear, nose, throat, cold, flu, sinus, etc.)
         - "Nephrologist" (kidneys, urine, renal issues, etc.)
         - "Gastroenterologist" (stomach, digestion, acid reflux, vomiting, diarrhea, etc.)
         - "Oncologist" (cancer, tumors, lumps, etc.)
         - "Pulmonologist" (lungs, asthma, cough, breathing, etc.)
         - "Pediatrician" (children, babies, etc.)
         - "Gynecologist" (pregnancy, periods, female health, etc.)
         - "Psychiatrist" (anxiety, depression, stress, sleep, mental health, etc.)
         
         If the message is general talk, greetings, coding, or doesn't warrant a specific specialist, suggest "none".

      Return your output strictly as a valid JSON object. Do NOT wrap it in markdown code blocks like \`\`\`json. The structure MUST be exactly:
      {
        "chatResponse": "Your detailed, conversational response to the user. (Politely decline and explain your medical scope if their message is out-of-scope, or provide medical guidance/greeting if in-scope).",
        "specialization": "The suggested specialization name, or 'none' if no doctor is needed."
      }
    `;

    let aiData = {
      specialization: "General Physician",
      chatResponse: "I've received your message. Please describe your symptoms or ask a health question so I can assist you."
    };

    try {
      const result = await model.generateContent(analysisPrompt);
      const responseText = result.response.text();
      
      // Robust JSON extraction & parsing
      let cleanJson = responseText.replace(/```json|```/g, '').trim();
      try {
        aiData = JSON.parse(cleanJson);
      } catch (parseErr) {
        // Fallback: try to extract substring between first { and last }
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          aiData = JSON.parse(cleanJson.substring(firstBrace, lastBrace + 1));
        } else {
          throw parseErr;
        }
      }
    } catch (aiError) {
      console.error("AI Generation/Parsing failed. Using enhanced regex fallback:", aiError);
      
      const isOffTopic = /\b(code|coding|program|programming|prime\s*no|prime\s*number|javascript|python|java|c\+\+|html|css|function|loop)\b/i.test(symptoms);
      
      // Enhanced regex fallback keyword matcher
      let detectedSpecialization = getFallbackSpecialization(symptoms);
      
      // Context Recovery: If current message is general talk, doesn't match a specialization,
      // and is NOT an off-topic task, search back through recent conversation history.
      if (detectedSpecialization === 'General Physician' && !isOffTopic) {
        for (let i = reversedHistory.length - 1; i >= 0; i--) {
          const pastMsg = reversedHistory[i];
          if (pastMsg.role === 'ai' && pastMsg.specialization && pastMsg.specialization !== 'General Physician' && pastMsg.specialization !== 'none') {
            detectedSpecialization = pastMsg.specialization;
            break;
          }
        }
      }

      if (isOffTopic) {
        detectedSpecialization = 'none';
      }

      aiData = {
        specialization: detectedSpecialization,
        chatResponse: getFallbackAdvice(detectedSpecialization, symptoms)
      };
    }

    // 4. Query Database for matching verified doctors
    let doctors = [];
    let additionalDoctors = [];
    let relatedDoctorsIds = [];
    let finalContent = `${aiData.chatResponse || "Please consult a doctor."}\n\n`;

    const cleanSpec = aiData.specialization ? aiData.specialization.trim() : null;
    const isSpecialistWarranted = cleanSpec && 
                                  cleanSpec.toLowerCase() !== 'none' && 
                                  cleanSpec.toLowerCase() !== 'null' && 
                                  cleanSpec.toLowerCase() !== 'general physician';

    if (isSpecialistWarranted) {
      let doctorQuery = { 
        specialization: { $regex: cleanSpec, $options: 'i' },
        status: 'verified'
      };
      if (city) {
        doctorQuery.city = { $regex: city, $options: 'i' };
      }

      // Fetch top 3 doctors in the specified city
      doctors = await Doctor.find(doctorQuery).select('name specialization city experience fees').limit(3);
      
      // Fallback: fetch doctors nationwide if none found in this city
      if (doctors.length === 0 && city) {
        additionalDoctors = await Doctor.find({ 
          specialization: { $regex: cleanSpec, $options: 'i' },
          status: 'verified' 
        }).select('name specialization city experience fees').limit(3);
      }

      const formatDocs = (docsList) => docsList.map(d => `- **Dr. ${d.name}** (${d.experience}y exp) in ${d.city}`).join('\n');

      if (doctors.length > 0) {
        finalContent += `Based on what you described, I suggest consulting a **${cleanSpec}**. Here are some verified specialists in **${city}**:\n${formatDocs(doctors)}`;
        relatedDoctorsIds = doctors.map(d => d._id);
      } else if (additionalDoctors.length > 0) {
        finalContent += `Based on what you described, I suggest consulting a **${cleanSpec}**. While I couldn't find any in **${city}**, here are some verified experts elsewhere:\n${formatDocs(additionalDoctors)}`;
        relatedDoctorsIds = additionalDoctors.map(d => d._id);
      } else {
        finalContent += `Based on what you described, I recommend consulting a **${cleanSpec}**. Feel free to search our directory to book an appointment.`;
      }
    } else {
      // General response - remove trailing double newline
      finalContent = finalContent.trim();
    }

    // 5. Save AI Response in DB
    const aiChat = await Chat.create({
      userId,
      role: 'ai',
      content: finalContent,
      specialization: isSpecialistWarranted ? cleanSpec : "General Physician",
      relatedDoctors: relatedDoctorsIds
    });

    res.status(200).json({
      success: true,
      data: { 
        response: finalContent, 
        suggestedSpecialization: isSpecialistWarranted ? cleanSpec : null,
        relatedDoctors: doctors.concat(additionalDoctors),
        history: [userChat, aiChat]
      }
    });

  } catch (error) {
    console.error("Chat Process Error:", error);
    res.status(500).json({ success: false, message: "Failed to process chat" });
  }
};

// Enhanced Regex helper for fallback keyword mapping
function getFallbackSpecialization(text) {
  const t = text.toLowerCase();
  
  const rules = [
    {
      specialization: 'Cardiologist',
      keywords: /\b(heart|chest\s*pain|palpitation|palpitations|pulse|cardiac|angina|bp|blood\s*pressure|hypertension|arrhythmia|electrocardiogram|ecg)\b/i
    },
    {
      specialization: 'Neurologist',
      keywords: /\b(brain|headache|headaches|migraine|migraines|seizure|seizures|dizzy|dizziness|vertigo|stroke|paralysis|nerve|neuropathy|convulsion|tremor|memory\s*loss|epilepsy)\b/i
    },
    {
      specialization: 'Orthopedist',
      keywords: /\b(bone|bones|joint|joints|fracture|fractures|ortho|knee|spine|back|muscle|muscles|ligament|arthritis|sprain|tendon|dislocation|osteoporosis|rheumatism)\b/i
    },
    {
      specialization: 'Dermatologist',
      keywords: /\b(skin|rash|rashes|acne|hair|hairfall|itch|itchy|itching|mole|moles|eczema|psoriasis|dermatitis|hive|hives|blemish|wart|warts|sunburn|melanoma)\b/i
    },
    {
      specialization: 'Dentist',
      keywords: /\b(tooth|teeth|gum|gums|mouth|cavity|cavities|dentist|dental|root\s*canal|braces|crown|toothache)\b/i
    },
    {
      specialization: 'Ophthalmologist',
      keywords: /\b(eye|eyes|vision|blurry|blind|cataract|glaucoma|retina|cornea|astigmatism|optician|dry\s*eye|eyesight)\b/i
    },
    {
      specialization: 'ENT Specialist',
      keywords: /\b(ear|nose|throat|cold|flu|sinus|sinuses|voice|swallow|hearing|tonsil|tonsils|tinnitus|nasal|congestion|strep)\b/i
    },
    {
      specialization: 'Nephrologist',
      keywords: /\b(kidney|kidneys|urine|urinate|urinary|renal|dialysis|proteinuria|hematuria)\b/i
    },
    {
      specialization: 'Gastroenterologist',
      keywords: /\b(stomach|digestion|digestive|abdomen|abdominal|gas|acidity|acid|vomit|vomiting|nausea|diarrhea|bowel|gut|heartburn|bloat|bloating|ulcer|ibs)\b/i
    },
    {
      specialization: 'Oncologist',
      keywords: /\b(cancer|tumor|tumors|chemo|chemotherapy|oncology|biopsy|malignant|benign|lump|lumps)\b/i
    },
    {
      specialization: 'Pulmonologist',
      keywords: /\b(lung|lungs|breath|breathing|shortness\s*of\s*breath|asthma|cough|coughing|wheeze|wheezing|pneumonia|bronchitis|copd|respiratory)\b/i
    },
    {
      specialization: 'Pediatrician',
      keywords: /\b(child|children|baby|babies|pediatric|infant|toddler|newborn)\b/i
    },
    {
      specialization: 'Gynecologist',
      keywords: /\b(women|woman|period|periods|menstruation|pregnancy|pregnant|fertility|infertility|menopause|ovary|ovarian|uterus|vagina|gynecology)\b/i
    },
    {
      specialization: 'Psychiatrist',
      keywords: /\b(mind|mental|depression|depressed|anxiety|anxious|stress|panic|sleep|insomnia|psychiatry|psychologist|bipolar|adhd|ptsd|hallucination)\b/i
    }
  ];

  for (const rule of rules) {
    if (rule.keywords.test(t)) {
      return rule.specialization;
    }
  }

  return 'General Physician';
}

function getFallbackAdvice(specialization, symptoms) {
  const q = symptoms.toLowerCase();
  
  // 1. Check for specific off-topic tasks (like coding, GK, math, etc.)
  if (/\b(code|coding|program|programming|prime\s*no|prime\s*number|javascript|python|java|c\+\+|html|css|function|loop|history|math|mathematics|joke|jokes|general\s*knowledge|gk|science|geography)\b/i.test(q)) {
    let topicName = "general knowledge or coding";
    if (/\b(code|coding|program|programming|javascript|python|java|c\+\+|html|css|function|loop)\b/i.test(q)) {
      topicName = "programming and coding";
    } else if (/\b(math|mathematics|prime\s*no|prime\s*number)\b/i.test(q)) {
      topicName = "mathematics";
    } else if (/\b(history|geography|science|joke|jokes)\b/i.test(q)) {
      topicName = "general topics";
    }
    return `I understand you're asking about ${topicName}, but I am designed specifically as an AI Health Assistant to focus on health concerns, medical advice, and helping you connect with doctors. I am unable to assist with out-of-scope requests. Please let me know if you have any health-related questions or symptoms you'd like to discuss!`;
  }

  // 2. Check for simple greetings
  if (/^(hi|hello|hey|good\s*morning|good\s*afternoon|good\s*evening|greetings)(\s+assistant)?$/i.test(q.trim())) {
    return `Hello! I am your AI Health Assistant. How can I help you today? Please feel free to describe any symptoms you are experiencing.`;
  }

  if (specialization === 'none') {
    return `I am here to assist with your medical questions and finding doctors. Please let me know how I can help with your health today!`;
  }

  // 3. Check for polite closures or gratitude
  if (/\b(thanks|thank\s*you|ok|okay|got\s*it|sure|fine|cool|awesome|great)\b/i.test(q)) {
    return `You're very welcome! Please take care, rest well, and feel free to reach out if you have any other concerns or symptoms to discuss.`;
  }

  const isDietRequest = /\b(food|diet|eat|avoid|meal|meals|drink|drinking|nutrition|consume|recipe)\b/i.test(q);
  const isFollowUpQuestion = /\b(but|why|sure|really|said|told|recomm|cardiologist|dermatologist|dentist|neurologist|orthopedist|gastroenterologist|ophthalmologist|nephrologist|oncologist|pediatrician|gynecologist|psychiatrist|pulmonologist)\b/i.test(q);

  if (specialization === 'General Physician') {
    if (isDietRequest) {
      return `For general health and well-being, it is recommended to maintain a balanced diet containing whole grains, lean proteins, healthy fats, and plenty of vegetables. Try to avoid highly processed foods, excess refined sugars, and trans fats. If you have specific symptoms, please describe them so I can guide you further.`;
    }
    return `Since your symptoms seem general, I suggest speaking with a General Physician first. They can provide an initial evaluation and guide you to standard remedies or refer you further. Make sure to rest, stay hydrated, and monitor your symptoms closely.`;
  }

  // Specialization-specific dietary advice for fallbacks
  const dietaryAdvice = {
    Cardiologist: `For heart health, you should limit foods high in sodium (salt), saturated and trans fats (fried foods, fatty meats), and cholesterol. Focus on heart-healthy options like oats, leafy greens, berries, fish, and nuts.`,
    Neurologist: `To support brain and nerve health, it is helpful to consume omega-3 rich foods (fish, walnuts, flaxseeds) and antioxidants (berries, dark chocolate). Limit processed sugars, artificial sweeteners, and excessive caffeine.`,
    Orthopedist: `To support bone and muscle healing, focus on calcium-rich foods (milk, yogurt, leafy greens) and Vitamin D (eggs, fatty fish). Avoid carbonated beverages and excessive alcohol, which can weaken bone density.`,
    Dermatologist: `For skin health, try to limit dairy products, high-glycemic foods (sugary snacks, white bread), and processed foods, which can trigger acne and inflammation. Focus on water intake, berries, and foods rich in Vitamin E.`,
    Dentist: `To protect your teeth and gums, avoid sticky sweets, hard candy, sugary sodas, and acidic foods (like citrus fruits in excess) which erode enamel. Remember to brush and floss regularly.`,
    Ophthalmologist: `For eye health, eat foods rich in Vitamin A, lutein, and omega-3s, such as carrots, spinach, kale, and fish. Avoid excess sugary foods, which can negatively impact long-term vision.`,
    'ENT Specialist': `For ear, nose, and throat recovery, stay hydrated with warm fluids. Avoid cold drinks, spicy foods, dairy (which can increase mucus production), and throat irritants like smoke or highly acidic beverages.`,
    Nephrologist: `For kidney care, it is vital to limit sodium, potassium, and phosphorus intake. Avoid processed meats, dark sodas, and excessive protein. Always check with your doctor for a specific renal diet plan.`,
    Gastroenterologist: `For digestive health, try to avoid spicy foods, deep-fried items, caffeine, alcohol, and dairy if you are sensitive. Opt for easily digestible foods like bananas, rice, applesauce, and oatmeal.`,
    Oncologist: `During cancer care or prevention, prioritize a nutrient-dense diet with a variety of colorful vegetables, fruits, and clean protein. Limit processed meats, refined sugars, and alcohol.`,
    Pulmonologist: `To support lung health, opt for foods rich in antioxidants and magnesium (seeds, nuts, leafy greens) to help relax bronchial muscles. Avoid heavy meals that cause bloating, as it can press against the diaphragm and make breathing harder.`,
    Pediatrician: `For infants and children, ensure a balanced diet rich in whole foods, avoiding processed snacks, sodas, and excessive sweets. Encourage water and fresh fruits.`,
    Gynecologist: `To support female health, pregnancy, or hormone balance, prioritize iron-rich foods (spinach, lean meat), calcium, and healthy fats (avocados, olive oil). Limit processed foods and excessive sugar.`,
    Psychiatrist: `To support mental wellness, maintain stable blood sugar by eating complex carbs (oats, quinoa) and proteins. Limit caffeine, alcohol, and refined sugars, which can worsen anxiety and mood fluctuations.`
  };

  if (isDietRequest) {
    if (dietaryAdvice[specialization]) {
      return `Regarding your diet in relation to the **${specialization}** recommendation: ${dietaryAdvice[specialization]} Please consult a medical professional for a personalized nutrition plan.`;
    }
  }

  if (isFollowUpQuestion) {
    return `I understand you are asking for guidance in context of the **${specialization}** recommendation we discussed. Since I am in medical assistant mode, I want to make sure you get correct guidance. If you'd like, you can browse verified **${specialization}** specialists listed below to book an appointment for a professional opinion, or tell me more about your symptoms.`;
  }

  // Check if this specialization was inherited (meaning current message didn't contain active symptoms of this type)
  const currentMessageSpec = getFallbackSpecialization(symptoms);
  if (currentMessageSpec === 'General Physician') {
    return `I understand you are continuing our conversation regarding **${specialization}** concerns. If you'd like to book a consultation, you can check the verified specialists listed below. Please let me know if you have any other specific symptoms or health questions!`;
  }

  return `Based on the symptoms you're describing, it would be best to consult a **${specialization}**. They can help diagnose your condition properly and suggest a safe treatment plan. In the meantime, make sure to get plenty of rest and avoid anything that might worsen your discomfort.`;
}
