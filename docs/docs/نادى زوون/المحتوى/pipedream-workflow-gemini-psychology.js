// ═══════════════════════════════════════════════════════════════════
// 🧠 MOHARRAM BEK - PSYCHOLOGICAL ENGINE (GEMINI + SUPABASE)
// ═══════════════════════════════════════════════════════════════════
// Version: 4.0 (100% FREE + PSYCHOLOGICAL INTELLIGENCE!)
// Cost: $0/month (NO CREDIT CARD NEEDED!)
// AI: Google Gemini 1.5 Flash (1,500 requests/day FREE!)
// Images: Stable Diffusion XL via Hugging Face (FREE)
// Database: Supabase (500MB FREE)
// ═══════════════════════════════════════════════════════════════════
// 🎯 FEATURES:
// - Psychological audience analysis
// - Sentiment detection (positive/negative/neutral)
// - Emotional tone adaptation
// - Cultural awareness (Egyptian/Alexandrian)
// - Psychological triggers (belonging, pride, curiosity, hope)
// - Time-aware content generation
// ═══════════════════════════════════════════════════════════════════

import { axios } from "@pipedream/platform";

export default defineComponent({
  name: "Moharram Bey - Gemini Psychology Engine",
  version: "4.0.0",
  
  props: {
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 28800, // 8 hours
      },
    },
    telegram_bot_api: {
      type: "app",
      app: "telegram_bot_api",
      optional: true
    }
  },

  async run({ steps, $ }) {
    console.log("🧠 Starting Psychological Engine (Gemini + Supabase)...");
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
    const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("❌ Missing SUPABASE_URL or SUPABASE_KEY!");
    }
    
    if (!GEMINI_API_KEY) {
      throw new Error("❌ Missing GEMINI_API_KEY! Get it from: https://aistudio.google.com/app/apikey");
    }
    
    // Get current time for psychological analysis
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('ar-EG', { weekday: 'long' });
    
    // ═══════════════════════════════════════════════════════════════
    // PSYCHOLOGICAL TIME ANALYSIS
    // ═══════════════════════════════════════════════════════════════
    
    let timeContext = "";
    if (currentHour >= 6 && currentHour < 11) {
      timeContext = "صباح (طاقة + تفاؤل + بداية يوم جديد)";
    } else if (currentHour >= 11 && currentHour < 15) {
      timeContext = "ظهر (انشغال + معلومات سريعة + وقت عمل)";
    } else if (currentHour >= 15 && currentHour < 20) {
      timeContext = "عصر/مساء (استرخاء + تفاعل اجتماعي + عودة للبيت)";
    } else {
      timeContext = "ليل (تأمل + نقاش عميق + وقت عائلي)";
    }
    
    console.log(`⏰ الوقت الحالي: ${currentHour}:00 (${timeContext})`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: FETCH NEWS
    // ═══════════════════════════════════════════════════════════════
    
    console.log("📰 Fetching news...");
    
    const [googleNewsResponse, gNewsResponse] = await Promise.all([
      axios({
        method: "GET",
        url: "https://news.google.com/rss/search",
        params: {
          q: "محرم بك الإسكندرية",
          hl: "ar",
          gl: "EG",
          ceid: "EG:ar"
        }
      }).catch(err => ({ data: null })),
      
      axios({
        method: "GET",
        url: "https://gnews.io/api/v4/search",
        params: {
          q: "الإسكندرية محرم بك",
          lang: "ar",
          country: "eg",
          max: 10,
          apikey: GNEWS_API_KEY || "YOUR_GNEWS_API_KEY"
        }
      }).catch(err => ({ data: { articles: [] } }))
    ]);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: MERGE & FILTER NEWS
    // ═══════════════════════════════════════════════════════════════
    
    const allNews = [];
    
    if (gNewsResponse.data && gNewsResponse.data.articles) {
      gNewsResponse.data.articles.forEach(article => {
        allNews.push({
          title: article.title,
          description: article.description || article.title,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          image: article.image || ""
        });
      });
    }
    
    const uniqueNews = allNews.filter((item, index, self) =>
      index === self.findIndex(t => t.title === item.title)
    );
    
    uniqueNews.sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    );
    
    const topNews = uniqueNews.slice(0, 5);
    
    if (topNews.length === 0) {
      console.log("❌ No news found");
      return { success: false, message: "No news found" };
    }
    
    console.log(`✅ Found ${topNews.length} news items`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 3: PSYCHOLOGICAL ANALYSIS WITH GEMINI 1.5 FLASH 🧠
    // ═══════════════════════════════════════════════════════════════
    
    console.log("🧠 Analyzing with Gemini 1.5 Flash (Psychological Engine)...");
    
    const processedNews = await Promise.all(
      topNews.map(async (news, index) => {
        try {
          console.log(`  [${index + 1}/${topNews.length}] Processing: ${news.title}`);
          
          // ═══════════════════════════════════════════════════════════
          // PSYCHOLOGICAL PROMPT - ARABIC + CULTURAL AWARENESS
          // ═══════════════════════════════════════════════════════════
          
          const psychologicalPrompt = `أنت خبير في علم النفس التسويقي وكاتب محتوى متخصص في الجمهور المصري السكندري.

🎯 تحليل نفسي للجمهور المستهدف:
- الموقع: محرم بك، الإسكندرية، مصر
- الخصائص: طبقة متوسطة، عائلات، فخورون بحيهم التاريخي، يهتمون بالتطوير والخدمات
- الاحتياجات النفسية: الانتماء للحي، الفخر المحلي، الأمان، التطوير المستمر، الهوية السكندرية
- المحفزات الفعالة: الأخبار الإيجابية عن الحي، قصص النجاح المحلية، الخدمات الجديدة، التراث

⏰ السياق الزمني:
- الوقت: ${timeContext}
- اليوم: ${dayOfWeek}
- الحالة النفسية المتوقعة للجمهور: ${timeContext}

📰 الخبر المراد تحليله:
العنوان: ${news.title}
التفاصيل: ${news.description}
المصدر: ${news.source}

📋 المطلوب منك (JSON فقط، بدون أي نص إضافي):

1. حلل المشاعر المرتبطة بهذا الخبر (sentiment analysis)
2. حدد المحفزات النفسية الأنسب لهذا الخبر
3. حدد النبرة العاطفية المناسبة
4. اكتب 3 منشورات مختلفة تستهدف النفسية الصحيحة للجمهور:
   - رسمي (Formal): احترافي، معلوماتي، موثوق (150-180 حرف)
   - شبابي (Casual): ودي، لهجة سكندرية، قريب للقلب (120-150 حرف)
   - تفاعلي (Interactive): ينتهي بسؤال يحفز النقاش (130-160 حرف)

5. اقترح 5 هاشتاجات ذكية (تبدأ بـ #محرم_بك)
6. اقترح وصف للصورة بالإنجليزية (لتوليد صورة AI مناسبة)

⚠️ ملاحظات مهمة:
- استخدم اللغة العربية في كل شيء عدا وصف الصورة
- راعي الحساسية الثقافية والدينية المصرية
- لا تستخدم مصطلحات غربية لا تناسب السياق المحلي
- اجعل المحتوى طبيعي وغير مفتعل
- ركز على الجانب النفسي والعاطفي

أعط الرد على شكل JSON فقط (بدون markdown):
{
  "psychological_analysis": {
    "sentiment": "positive/negative/neutral",
    "emotions": ["فرح", "أمل", "فخر"],
    "triggers": ["belonging", "pride", "hope", "safety", "curiosity"],
    "tone": "celebratory/empathetic/motivational/informational/urgent",
    "target_feeling": "الشعور المستهدف في الجمهور"
  },
  "posts": [
    {
      "style": "Formal",
      "text": "المنشور الرسمي هنا",
      "psychological_note": "لماذا هذا الأسلوب نفسياً"
    },
    {
      "style": "Casual", 
      "text": "المنشور الشبابي هنا",
      "psychological_note": "لماذا هذا الأسلوب نفسياً"
    },
    {
      "style": "Interactive",
      "text": "المنشور التفاعلي هنا مع سؤال في النهاية؟",
      "psychological_note": "لماذا هذا الأسلوب نفسياً"
    }
  ],
  "hashtags": ["#محرم_بك", "#الإسكندرية", "#tag3", "#tag4", "#tag5"],
  "image_prompt": "Image description in English, Alexandria Egypt, Moharram Bek neighborhood, realistic, high quality"
}`;

          // ═══════════════════════════════════════════════════════════
          // CALL GEMINI 1.5 FLASH API
          // ═══════════════════════════════════════════════════════════
          
          const geminiResponse = await axios({
            method: "POST",
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            headers: {
              "Content-Type": "application/json"
            },
            data: {
              contents: [{
                parts: [{
                  text: psychologicalPrompt
                }]
              }],
              generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
                responseMimeType: "application/json"
              }
            }
          });
          
          // Parse Gemini response
          let aiAnalysis;
          try {
            const geminiText = geminiResponse.data.candidates[0].content.parts[0].text;
            aiAnalysis = JSON.parse(geminiText);
            
            console.log(`  ✅ Psychological analysis complete`);
            console.log(`     Sentiment: ${aiAnalysis.psychological_analysis.sentiment}`);
            console.log(`     Triggers: ${aiAnalysis.psychological_analysis.triggers.join(', ')}`);
            console.log(`     Tone: ${aiAnalysis.psychological_analysis.tone}`);
            
          } catch (parseError) {
            console.log(`  ⚠️ Parse failed, using fallback`);
            aiAnalysis = {
              psychological_analysis: {
                sentiment: "neutral",
                emotions: ["اهتمام"],
                triggers: ["curiosity"],
                tone: "informational",
                target_feeling: "الإطلاع على الأخبار المحلية"
              },
              posts: [
                { 
                  style: "Formal", 
                  text: `📰 ${news.title}\n\n#محرم_بك #الإسكندرية`,
                  psychological_note: "محايد ومعلوماتي"
                },
                { 
                  style: "Casual", 
                  text: `🔥 ${news.title}\n\n#محرم_بك #الإسكندرية`,
                  psychological_note: "جذاب للشباب"
                },
                { 
                  style: "Interactive", 
                  text: `💭 ${news.title}\n\nإيه رأيكم؟ 👇\n\n#محرم_بك`,
                  psychological_note: "يحفز التفاعل"
                }
              ],
              hashtags: ["#محرم_بك", "#الإسكندرية", "#أخبار"],
              image_prompt: "Egyptian city scene, Alexandria, Moharram Bek, modern, realistic"
            };
          }
          
          // ═══════════════════════════════════════════════════════════
          // GENERATE IMAGE (STABLE DIFFUSION via Hugging Face)
          // ═══════════════════════════════════════════════════════════
          
          let imageUrl = "";
          
          if (HUGGINGFACE_TOKEN) {
            try {
              console.log(`  🎨 Generating image...`);
              
              const imageResponse = await axios({
                method: "POST",
                url: "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
                headers: {
                  "Authorization": `Bearer ${HUGGINGFACE_TOKEN}`,
                },
                data: {
                  inputs: aiAnalysis.image_prompt,
                  options: {
                    wait_for_model: true
                  }
                },
                responseType: 'arraybuffer'
              });
              
              const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
              imageUrl = `data:image/png;base64,${base64Image}`;
              
              console.log(`  ✅ Image generated`);
            } catch (imageError) {
              console.log(`  ⚠️ Image generation failed: ${imageError.message}`);
              imageUrl = "";
            }
          }
          
          return {
            original: news,
            analysis: aiAnalysis,
            imageUrl: imageUrl,
            processedAt: new Date().toISOString()
          };
          
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
          if (error.response) {
            console.log(`     Response data:`, error.response.data);
          }
          return null;
        }
      })
    );
    
    const successfulNews = processedNews.filter(item => item !== null);
    console.log(`✅ Processed ${successfulNews.length}/${topNews.length} with psychological analysis`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 4: PREPARE POSTS WITH PSYCHOLOGICAL METADATA
    // ═══════════════════════════════════════════════════════════════
    
    const allPosts = [];
    successfulNews.forEach(newsItem => {
      newsItem.analysis.posts.forEach(post => {
        allPosts.push({
          title: newsItem.original.title,
          post_text: post.text,
          style: post.style,
          status: 'draft',
          image_url: newsItem.imageUrl || null,
          source_link: newsItem.original.url,
          hashtags: newsItem.analysis.hashtags.join(" "),
          
          // 🧠 PSYCHOLOGICAL METADATA (new fields!)
          sentiment: newsItem.analysis.psychological_analysis.sentiment,
          emotions: newsItem.analysis.psychological_analysis.emotions.join(", "),
          psychological_triggers: newsItem.analysis.psychological_analysis.triggers.join(", "),
          emotional_tone: newsItem.analysis.psychological_analysis.tone,
          target_feeling: newsItem.analysis.psychological_analysis.target_feeling,
          psychological_note: post.psychological_note,
          
          created_at: new Date().toISOString()
        });
      });
    });
    
    console.log(`✅ Prepared ${allPosts.length} posts with psychological intelligence`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: SAVE TO SUPABASE
    // ═══════════════════════════════════════════════════════════════
    
    console.log("💾 Saving to Supabase with psychological metadata...");
    
    const savedPosts = [];
    
    try {
      const supabaseResponse = await axios({
        method: "POST",
        url: `${SUPABASE_URL}/rest/v1/posts`,
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        data: allPosts
      });
      
      savedPosts.push(...supabaseResponse.data);
      console.log(`✅ Saved ${savedPosts.length} posts to Supabase`);
      
    } catch (err) {
      console.log(`⚠️ Batch insert failed: ${err.message}`);
      console.log(`   Trying individual inserts...`);
      
      for (const post of allPosts) {
        try {
          const singleResponse = await axios({
            method: "POST",
            url: `${SUPABASE_URL}/rest/v1/posts`,
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=representation"
            },
            data: post
          });
          
          savedPosts.push(singleResponse.data[0]);
        } catch (singleErr) {
          console.log(`   ⚠️ Failed to save post: ${post.title.substring(0, 50)}...`);
        }
      }
      console.log(`✅ Saved ${savedPosts.length}/${allPosts.length} posts individually`);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 6: PSYCHOLOGICAL SUMMARY FOR TELEGRAM
    // ═══════════════════════════════════════════════════════════════
    
    if (TELEGRAM_CHAT_ID && this.telegram_bot_api?.$auth?.token) {
      // Calculate psychological stats
      const sentimentCounts = {
        positive: allPosts.filter(p => p.sentiment === 'positive').length,
        negative: allPosts.filter(p => p.sentiment === 'negative').length,
        neutral: allPosts.filter(p => p.sentiment === 'neutral').length
      };
      
      const topTriggers = {};
      allPosts.forEach(p => {
        p.psychological_triggers.split(", ").forEach(t => {
          topTriggers[t] = (topTriggers[t] || 0) + 1;
        });
      });
      
      const topTriggersText = Object.entries(topTriggers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([trigger, count]) => `${trigger} (${count})`)
        .join(", ");
      
      const summaryMessage = `🧠 *تحليل نفسي كامل - ${savedPosts.length} بوست جديد!*

📊 *تحليل المشاعر:*
✅ إيجابي: ${sentimentCounts.positive}
❌ سلبي: ${sentimentCounts.negative}
➖ محايد: ${sentimentCounts.neutral}

🎯 *المحفزات النفسية الأكثر استخداماً:*
${topTriggersText}

📰 *الإحصائيات:*
• الأخبار: ${successfulNews.length}
• البوستات: ${savedPosts.length}
• الوقت: ${timeContext}

🤖 *المحرك:*
• AI: Gemini 1.5 Flash (علم نفس تسويقي)
• الصور: Stable Diffusion XL
• قاعدة البيانات: Supabase

💰 *التكلفة: $0 (مجاني 100%!)* 🎊

⏰ ${new Date().toLocaleString('ar-EG')}

👉 راجع في Supabase Dashboard!`;

      try {
        await axios({
          method: "POST",
          url: `https://api.telegram.org/bot${this.telegram_bot_api.$auth.token}/sendMessage`,
          data: {
            chat_id: TELEGRAM_CHAT_ID,
            text: summaryMessage,
            parse_mode: "Markdown"
          }
        });
        console.log("✅ Telegram notification sent with psychological summary");
      } catch (err) {
        console.log("⚠️ Telegram failed (skipping)");
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DONE!
    // ═══════════════════════════════════════════════════════════════
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      psychological_engine: "ENABLED ✅",
      stats: {
        news_fetched: topNews.length,
        news_processed: successfulNews.length,
        posts_created: allPosts.length,
        posts_saved: savedPosts.length,
        sentiment_distribution: {
          positive: allPosts.filter(p => p.sentiment === 'positive').length,
          negative: allPosts.filter(p => p.sentiment === 'negative').length,
          neutral: allPosts.filter(p => p.sentiment === 'neutral').length
        }
      },
      cost: "$0 (100% FREE FOREVER!) 🎉",
      platform: "Gemini 1.5 Flash + Stable Diffusion XL + Supabase",
      features: [
        "Psychological audience analysis",
        "Sentiment detection", 
        "Emotional tone adaptation",
        "Cultural awareness (Egyptian/Alexandrian)",
        "Time-aware content generation"
      ]
    };
  }
});
