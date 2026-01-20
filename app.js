/**
 * I Need Help / I Can Help - Core Logic (Arabic)
 */

const STORAGE_KEY = 'flood_help_data_v1_ar';

// Initial Mock Data to populate the platform for demo
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
        timestamp: Date.now() - 3600000 // 1 hour ago
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
        timestamp: Date.now() - 7200000 // 2 hours ago
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

// Translation Maps
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

// Data Store Wrapper
const Store = {
    getData: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
            return MOCK_DATA;
        }
        return JSON.parse(data);
    },

    addRequest: (request) => {
        const data = Store.getData();
        const newRequest = {
            id: 'req_' + Date.now(),
            type: 'request',
            timestamp: Date.now(),
            ...request
        };
        data.unshift(newRequest); // Add to top
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return newRequest;
    },

    addOffer: (offer) => {
        const data = Store.getData();
        const newOffer = {
            id: 'off_' + Date.now(),
            type: 'offer',
            timestamp: Date.now(),
            ...offer
        };
        data.unshift(newOffer);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return newOffer;
    }
};

// Application Logic
const App = {
    init: () => {
        // Initialize mock data if empty
        Store.getData();

        // Setup Event Listeners based on current page
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
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            Store.addRequest(data);

            alert('تم إرسال طلب المساعدة! تم إشعار المتطوعين في منطقتك.');
            window.location.href = 'dashboard.html';
        });
    },

    handleOfferForm: () => {
        const form = document.getElementById('offerForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            Store.addOffer(data);

            alert('شكراً لتطوعك! عرضك ظاهر الآن للمحتاجين.');
            window.location.href = 'dashboard.html';
        });
    },

    renderDashboard: () => {
        const feed = document.getElementById('dashboardFeed');
        const filterType = document.getElementById('filterType');
        const data = Store.getData();

        const render = () => {
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

                // Translation lookups
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
                    <p style="margin-bottom:16px;">${item.description}</p>
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
        render();
    }
};

// Start App
document.addEventListener('DOMContentLoaded', App.init);
