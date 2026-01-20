/**
 * I Need Help / I Can Help - Core Logic (Arabic)
 * Now with Supabase Integration Support
 */

// ==========================================
// CONFIGURATION (PASTE YOUR KEYS HERE)
// ==========================================
const SUPABASE_URL = 'https://iyhidbjdlgrxpjfvlzbh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aGlkYmpkbGdyeHBqZnZsemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MzcxNzAsImV4cCI6MjA4NDUxMzE3MH0.WKXsReDmBPMVJfT5CIZuGWSufpg35ahg80QwQHNbpMI';
// ==========================================

const STORAGE_KEY = 'flood_help_data_v1_ar';

// Mock Data (Fallback)
const MOCK_DATA = [
    {
        id: 'req_1',
        type: 'request',
        name: 'سارة خالد',
        location: 'حي النزهة، شارع الفل',
        phone: '555-0123',
        category: 'Evacuation',
        urgency: 'High',
        description: 'المياه ترتفع بسرعة، نحتاج قارب لإجلاء عائلة من 4 أفراد.',
        timestamp: Date.now() - 3600000
    },
    {
        id: 'req_2',
        type: 'request',
        name: 'مركز المجتمع',
        location: 'القطاع الشمالي، ملجأ رقم 3',
        phone: '555-0199',
        category: 'FoodWater',
        urgency: 'Medium',
        description: 'نحتاج 50 جالون مياه نظيفة ومعلبات.',
        timestamp: Date.now() - 7200000
    },
    {
        id: 'off_1',
        type: 'offer',
        name: 'أحمد محمد',
        location: 'المنطقة الآمنة (المرتفعات)',
        phone: '555-0155',
        category: 'Transport',
        description: 'أملك سيارة دفع رباعي ويمكنني نقل الأشخاص أو المؤن.'
    }
];

const LABELS = {
    request: 'طلب مساعدة',
    offer: 'عرض تطوع',
    urgency: {
        High: 'طوارئ قصوى',
        Medium: 'عاجل',
        Low: 'منخفض'
    },
    category: {
        Evacuation: 'إجلاء',
        FoodWater: 'طعام وماء',
        Medical: 'طبي',
        Shelter: 'مأوى',
        Other: 'أخرى',
        Transport: 'نقل',
        Labor: 'جهد بدني'
    }
};

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    return SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;
};

// Initialize Supabase Client
let supabase;
if (typeof createClient !== 'undefined' && isSupabaseConfigured()) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Connected');
} else {
    console.log('⚠️ Supabase Not Configured - Using LocalStorage');
}

// Store Wrapper (Abstracts the backend)
const Store = {
    getData: async () => {
        if (supabase) {
            // Fetch both requests and offers
            const { data: requests, error: reqError } = await supabase
                .from('requests')
                .select('*')
                .order('created_at', { ascending: false });

            const { data: offers, error: offError } = await supabase
                .from('offers')
                .select('*')
                .order('created_at', { ascending: false });

            if (reqError || offError) {
                console.error('Supabase Error:', reqError, offError);
                return [];
            }

            // Normalizing data to match our app structure
            const normalizedRequests = (requests || []).map(r => ({ ...r, type: 'request', timestamp: new Date(r.created_at).getTime() }));
            const normalizedOffers = (offers || []).map(o => ({ ...o, type: 'offer', timestamp: new Date(o.created_at).getTime() }));

            return [...normalizedRequests, ...normalizedOffers].sort((a, b) => b.timestamp - a.timestamp);
        } else {
            // LocalStorage Fallback
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
                return MOCK_DATA;
            }
            return JSON.parse(data);
        }
    },

    addRequest: async (requestData) => {
        if (supabase) {
            const { data, error } = await supabase.from('requests').insert([
                {
                    name: requestData.name,
                    phone: requestData.phone,
                    location: requestData.location,
                    category: requestData.category,
                    urgency: requestData.urgency,
                    description: requestData.description
                }
            ]);
            if (error) throw error;
            return data;
        } else {
            const data = await Store.getData(); // Treat as async even if local
            const newRequest = {
                id: 'req_' + Date.now(),
                type: 'request',
                timestamp: Date.now(),
                ...requestData
            };
            data.unshift(newRequest);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return newRequest;
        }
    },

    addOffer: async (offerData) => {
        if (supabase) {
            const { data, error } = await supabase.from('offers').insert([
                {
                    name: offerData.name,
                    phone: offerData.phone,
                    location: offerData.location,
                    category: offerData.category,
                    description: offerData.description
                }
            ]);
            if (error) throw error;
            return data;
        } else {
            const data = await Store.getData();
            const newOffer = {
                id: 'off_' + Date.now(),
                type: 'offer',
                timestamp: Date.now(),
                ...offerData
            };
            data.unshift(newOffer);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return newOffer;
        }
    }
};

// Application Logic
const App = {
    init: () => {
        // Setup Event Listeners
        if (document.getElementById('requestForm')) {
            App.handleRequestForm();
        }
        if (document.getElementById('offerForm')) {
            App.handleOfferForm();
        }
        if (document.getElementById('dashboardFeed')) {
            App.renderDashboard();
        }
    },

    handleRequestForm: () => {
        const form = document.getElementById('requestForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'جاري الإرسال...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                await Store.addRequest(data);

                alert('تم إرسال طلب المساعدة! تم إشعار المتطوعين في منطقتك.');
                window.location.href = 'dashboard.html';
            } catch (err) {
                console.error(err);
                alert('حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.');
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    },

    handleOfferForm: () => {
        const form = document.getElementById('offerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'جاري التسجيل...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                await Store.addOffer(data);

                alert('شكراً لتطوعك! عرضك ظاهر الآن للمحتاجين.');
                window.location.href = 'dashboard.html';
            } catch (err) {
                console.error(err);
                alert('حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.');
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    },

    renderDashboard: async () => {
        const feed = document.getElementById('dashboardFeed');
        const filterType = document.getElementById('filterType');

        const render = async () => {
            feed.innerHTML = '<div class="text-center p-5">جاري تحميل البيانات...</div>';

            // Artificial delay for local testing visual
            if (!supabase) await new Promise(r => setTimeout(r, 500));

            const data = await Store.getData();
            const filter = filterType ? filterType.value : 'all';

            feed.innerHTML = '';

            const items = data.filter(item => {
                if (filter === 'all') return true;
                if (filter === 'requests') return item.type === 'request';
                if (filter === 'offers') return item.type === 'offer';
                return true;
            });

            if (items.length === 0) {
                feed.innerHTML = '<div class="text-center p-5">لا توجد عناصر نشطة حالياً.</div>';
                return;
            }

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card animate-fade-in';
                card.style.marginBottom = '1rem';

                const isUrgent = item.urgency === 'High';
                const badgeClass = isUrgent ? 'badge-urgent' : 'badge-type';
                const icon = item.type === 'request' ? '🚨 طلب' : '🤝 عرض';

                const categoryLabel = LABELS.category[item.category] || item.category;

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                        <div>
                            <span class="badge ${badgeClass}">${icon}</span>
                            <span class="badge badge-moderate">${categoryLabel}</span>
                        </div>
                        <small class="text-muted" dir="ltr">${new Date(item.timestamp || Date.now()).toLocaleTimeString()}</small>
                    </div>
                    <h3 style="margin-bottom:8px;">${item.name}</h3>
                    <p style="margin-bottom:12px; color:var(--neutral-gray);">
                        <strong>📍 الموقع:</strong> ${item.location}
                    </p>
                    <p style="margin-bottom:16px;">${item.description || ''}</p>
                    <a href="tel:${item.phone}" class="btn btn-outline" style="width:100%;">
                        <span class="ltr">📞 ${item.phone}</span> اتصل
                    </a>
                `;
                feed.appendChild(card);
            });
        };

        if (filterType) {
            filterType.addEventListener('change', render);
        }
        await render();
    }
};

document.addEventListener('DOMContentLoaded', App.init);
